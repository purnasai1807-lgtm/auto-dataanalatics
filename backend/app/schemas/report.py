from __future__ import annotations
from datetime import datetime
from typing import Any
from pydantic import BaseModel
class ReportRead(BaseModel):
    id: str
    dataset_id: str | None
    title: str
    report_type: str
    status: str
    file_storage_key: str | None
    snapshot_json: dict[str, Any]
    error_message: str | None
    created_at: datetime
    model_config = {"from_attributes": True}
