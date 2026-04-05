from __future__ import annotations
from typing import Any
from pydantic import BaseModel
class DashboardResponse(BaseModel):
    dataset_id: str
    filters: dict[str, Any]
    semantics: dict[str, Any]
    kpis: dict[str, Any]
    charts: dict[str, Any]
    filter_options: dict[str, Any]
    insights: list[dict[str, Any]]
    sample_rows: list[dict[str, Any]]
