from fastapi import APIRouter
router = APIRouter(tags=["health"])
@router.get("/healthz")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
@router.get("/ready")
async def readiness_check() -> dict[str, str]:
    return {"status": "ready"}
