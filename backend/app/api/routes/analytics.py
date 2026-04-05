from __future__ import annotations
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.dataset import Dataset
from app.models.user import User
from app.schemas.analytics import DashboardResponse
from app.services.analytics import AnalyticsService
router = APIRouter(prefix="/analytics", tags=["analytics"])
@router.get("/{dataset_id}/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    dataset_id: str,
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    country: str | None = Query(default=None),
    category: str | None = Query(default=None),
    product_line: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardResponse:
    result = await db.execute(
        select(Dataset).where(Dataset.id == dataset_id, Dataset.user_id == current_user.id)
    )
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")
    if dataset.status != "ready":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Dataset is still processing")
    filters: dict[str, Any] = {
        "date_from": date_from,
        "date_to": date_to,
        "country": country,
        "category": category,
        "product_line": product_line,
    }
    service = AnalyticsService()
    payload = await service.build_dashboard(
        dataset,
        {key: value for key, value in filters.items() if value},
    )
    if dataset.ai_insights:
        payload["insights"] = dataset.ai_insights
    return DashboardResponse(**payload)
