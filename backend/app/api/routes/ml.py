from __future__ import annotations
import asyncio
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.storage import StorageService
from app.core.task_runner import dispatch_task
from app.models.dataset import Dataset
from app.models.model_run import ModelRun
from app.models.user import User
from app.schemas.ml import MLTrainRequest, ModelRunRead
from app.tasks.dataset_tasks import train_model_task
router = APIRouter(prefix="/ml", tags=["machine-learning"])
@router.get("/datasets/{dataset_id}/runs", response_model=list[ModelRunRead])
async def list_model_runs(
    dataset_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ModelRunRead]:
    result = await db.execute(
        select(ModelRun)
        .where(ModelRun.dataset_id == dataset_id, ModelRun.user_id == current_user.id)
        .order_by(ModelRun.created_at.desc())
    )
    return list(result.scalars().all())
@router.post("/{dataset_id}/train", response_model=ModelRunRead, status_code=status.HTTP_202_ACCEPTED)
async def train_model(
    dataset_id: str,
    payload: MLTrainRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ModelRunRead:
    result = await db.execute(
        select(Dataset).where(Dataset.id == dataset_id, Dataset.user_id == current_user.id)
    )
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")
    if dataset.status != "ready":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Dataset is still processing")
    model_run = ModelRun(
        user_id=current_user.id,
        dataset_id=dataset.id,
        target_column=payload.target_column,
        problem_type=payload.problem_type,
        status="queued",
    )
    db.add(model_run)
    await db.commit()
    await db.refresh(model_run)
    dispatch_task(background_tasks, train_model_task, model_run.id)
    return model_run
@router.get("/runs/{run_id}", response_model=ModelRunRead)
async def get_model_run(
    run_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ModelRunRead:
    result = await db.execute(
        select(ModelRun).where(ModelRun.id == run_id, ModelRun.user_id == current_user.id)
    )
    model_run = result.scalar_one_or_none()
    if not model_run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Model run not found")
    return model_run
@router.get("/runs/{run_id}/predictions")
async def download_predictions(
    run_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    result = await db.execute(
        select(ModelRun).where(ModelRun.id == run_id, ModelRun.user_id == current_user.id)
    )
    model_run = result.scalar_one_or_none()
    if not model_run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Model run not found")
    if not model_run.predictions_storage_key:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Predictions are not ready yet")
    storage = StorageService()
    url = await asyncio.to_thread(storage.generate_presigned_url, model_run.predictions_storage_key)
    return {"url": url}
