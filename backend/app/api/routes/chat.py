from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.dataset import Dataset
from app.models.user import User
from app.schemas.chat import ChatQueryRequest, ChatResponse
from app.services.analytics import AnalyticsService
from app.services.chat import ChatService
router = APIRouter(prefix="/chat", tags=["chat"])
@router.post("/{dataset_id}/ask", response_model=ChatResponse)
async def ask_dataset_question(
    dataset_id: str,
    payload: ChatQueryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChatResponse:
    result = await db.execute(
        select(Dataset).where(Dataset.id == dataset_id, Dataset.user_id == current_user.id)
    )
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")
    if dataset.status != "ready":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Dataset is still processing")
    analytics_service = AnalyticsService()
    frame = await analytics_service.load_dataset_frame(dataset)
    chat_service = ChatService()
    context = {
        "profile": dataset.profile_json,
        "ai_insights": dataset.ai_insights,
        "sample_rows": dataset.sample_rows,
    }
    answer = await chat_service.answer(frame, payload.question, context)
    return ChatResponse(**answer)
