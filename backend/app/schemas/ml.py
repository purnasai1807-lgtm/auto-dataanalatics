from __future__ import annotations
from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field
class MLTrainRequest(BaseModel):
    target_column: str | None = None
    problem_type: str | None = Field(default=None, pattern="^(regression|classification)?$")
class ModelRunRead(BaseModel):
    id: str
    dataset_id: str
    target_column: str | None
    problem_type: str | None
    best_model: str | None
    status: str
    metrics_json: dict[str, Any]
    comparison_json: list[dict[str, Any]]
    feature_importance_json: list[dict[str, Any]]
    predictions_storage_key: str | None
    model_storage_key: str | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}
