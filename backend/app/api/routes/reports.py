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
from app.models.report import Report
from app.models.user import User
from app.schemas.report import ReportRead
from app.tasks.dataset_tasks import generate_report_task
router = APIRouter(prefix="/reports", tags=["reports"])
@router.get("", response_model=list[ReportRead])
async def list_reports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ReportRead]:
    result = await db.execute(
        select(Report).where(Report.user_id == current_user.id).order_by(Report.created_at.desc())
    )
    return list(result.scalars().all())
@router.post("/{dataset_id}/generate", response_model=ReportRead, status_code=status.HTTP_202_ACCEPTED)
async def generate_report(
    dataset_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportRead:
    result = await db.execute(
        select(Dataset).where(Dataset.id == dataset_id, Dataset.user_id == current_user.id)
    )
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")
    if dataset.status != "ready":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Dataset is still processing")
    report = Report(
        user_id=current_user.id,
        dataset_id=dataset.id,
        title=f"{dataset.name} Executive Report",
        report_type="pdf",
        status="queued",
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    dispatch_task(background_tasks, generate_report_task, report.id)
    return report
@router.get("/{report_id}/download")
async def download_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    result = await db.execute(
        select(Report).where(Report.id == report_id, Report.user_id == current_user.id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    if not report.file_storage_key:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Report is not ready yet")
    storage = StorageService()
    url = await asyncio.to_thread(storage.generate_presigned_url, report.file_storage_key)
    return {"url": url}
