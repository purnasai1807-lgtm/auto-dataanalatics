from __future__ import annotations
import asyncio
from pathlib import Path
from uuid import uuid4
import aiofiles
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.storage import StorageService
from app.models.dataset import Dataset
from app.models.user import User
from app.schemas.dataset import DatasetRead, DatasetSummary, UploadResponse
from app.services.dataset_loader import DatasetLoaderService
from app.tasks.dataset_tasks import process_dataset_task
router = APIRouter(prefix="/datasets", tags=["datasets"])
@router.get("", response_model=list[DatasetSummary])
async def list_datasets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[DatasetSummary]:
    result = await db.execute(
        select(Dataset)
        .where(Dataset.user_id == current_user.id)
        .order_by(Dataset.created_at.desc())
    )
    return list(result.scalars().all())
@router.get("/{dataset_id}", response_model=DatasetRead)
async def get_dataset(
    dataset_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DatasetRead:
    result = await db.execute(
        select(Dataset).where(Dataset.id == dataset_id, Dataset.user_id == current_user.id)
    )
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")
    return dataset
@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_dataset(
    file: UploadFile = File(...),
    name: str | None = Form(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UploadResponse:
    loader = DatasetLoaderService()
    storage = StorageService()
    try:
        file_type = loader.detect_file_type(file.filename or "upload.csv")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    dataset_id = str(uuid4())
    local_path = Path(settings.local_temp_dir) / "uploads" / f"{dataset_id}.{file_type}"
    local_path.parent.mkdir(parents=True, exist_ok=True)
    chunk_size = 1024 * 1024 * settings.upload_chunk_size_mb
    total_size = 0
    async with aiofiles.open(local_path, "wb") as buffer:
        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            total_size += len(chunk)
            await buffer.write(chunk)
    await file.close()
    storage_key = f"{settings.storage_prefix_uploads}/{current_user.id}/{dataset_id}.{file_type}"
    await asyncio.to_thread(storage.ensure_bucket)
    await asyncio.to_thread(
        storage.upload_file,
        local_path,
        storage_key,
        loader.content_type_for(file_type),
    )
    dataset = Dataset(
        id=dataset_id,
        user_id=current_user.id,
        name=name or Path(file.filename or f"dataset.{file_type}").stem,
        original_filename=file.filename or f"{dataset_id}.{file_type}",
        original_storage_key=storage_key,
        file_type=file_type,
        size_bytes=total_size,
        status="queued",
        processing_progress=5,
    )
    db.add(dataset)
    await db.commit()
    await db.refresh(dataset)
    process_dataset_task.delay(dataset.id)
    return UploadResponse(
        dataset=DatasetSummary.model_validate(dataset),
        message="Upload complete. Background processing has started.",
    )
@router.get("/{dataset_id}/download-cleaned")
async def download_cleaned_dataset(
    dataset_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    result = await db.execute(
        select(Dataset).where(Dataset.id == dataset_id, Dataset.user_id == current_user.id)
    )
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")
    if not dataset.cleaned_storage_key:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cleaned file is not ready yet")
    storage = StorageService()
    url = await asyncio.to_thread(storage.generate_presigned_url, dataset.cleaned_storage_key)
    return {"url": url}
