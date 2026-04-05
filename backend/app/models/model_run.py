from __future__ import annotations
from uuid import uuid4
from sqlalchemy import ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.mixins import TimestampMixin
class ModelRun(Base, TimestampMixin):
    __tablename__ = "model_runs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    dataset_id: Mapped[str] = mapped_column(ForeignKey("datasets.id", ondelete="CASCADE"), index=True)
    target_column: Mapped[str | None] = mapped_column(String(255), nullable=True)
    problem_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    best_model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="queued", index=True)
    metrics_json: Mapped[dict] = mapped_column(JSON, default=dict)
    comparison_json: Mapped[list] = mapped_column(JSON, default=list)
    feature_importance_json: Mapped[list] = mapped_column(JSON, default=list)
    predictions_storage_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    model_storage_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    user = relationship("User", back_populates="model_runs")
    dataset = relationship("Dataset", back_populates="model_runs")
