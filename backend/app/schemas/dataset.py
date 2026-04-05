from __future__ import annotations
from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field
class DatasetRead(BaseModel):
    id: str
    user_id: str
    name: str
    original_filename: str
    file_type: str
    status: str
    size_bytes: int
    row_count: int | None
    column_count: int | None
    processing_progress: float
    dataset_schema: dict[str, Any] = Field(
        validation_alias="schema_json",
        serialization_alias="schema_json",
    )
    profile_json: dict[str, Any]
    cleaning_summary: dict[str, Any]
    ai_insights: list[Any]
    sample_rows: list[dict[str, Any]]
    error_message: str | None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
class DatasetSummary(BaseModel):
    id: str
    name: str
    original_filename: str
    status: str
    size_bytes: int
    row_count: int | None
    column_count: int | None
    processing_progress: float
    created_at: datetime
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
class UploadResponse(BaseModel):
    dataset: DatasetSummary
    message: str
