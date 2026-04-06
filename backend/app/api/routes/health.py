from typing import Any
from fastapi import APIRouter
from app.core.config import settings
router = APIRouter(tags=["health"])
@router.get("/healthz")
async def health_check() -> dict[str, Any]:
    return {"status": "ok", **settings.runtime_summary}
@router.get("/ready")
async def readiness_check() -> dict[str, Any]:
    return {"status": "ready", **settings.runtime_summary}
