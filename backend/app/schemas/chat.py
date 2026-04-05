from __future__ import annotations
from typing import Any
from pydantic import BaseModel, Field
class ChatQueryRequest(BaseModel):
    question: str = Field(min_length=3, max_length=1000)
class ChatResponse(BaseModel):
    answer: str
    query_plan: dict[str, Any]
    visualization_hint: dict[str, Any] | None = None
    tabular_result: list[dict[str, Any]] | None = None
