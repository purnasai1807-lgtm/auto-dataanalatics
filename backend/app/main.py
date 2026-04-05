from __future__ import annotations
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from sqlalchemy import select
from app.api.router import api_router
from app.core.config import settings
from app.core.database import AsyncSessionLocal, async_engine, init_db
from app.core.security import decode_access_token
from app.core.storage import StorageService
from app.models.dataset import Dataset
from app.models.model_run import ModelRun
from app.models.report import Report
@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db()
    await asyncio.to_thread(StorageService().ensure_bucket)
    yield
    await async_engine.dispose()
app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix=settings.api_v1_prefix)
@app.get("/")
async def root() -> dict[str, str]:
    return {
        "name": settings.app_name,
        "docs": "/docs",
        "api_prefix": settings.api_v1_prefix,
    }
@app.websocket("/ws/datasets/{dataset_id}")
async def dataset_updates(websocket: WebSocket, dataset_id: str, token: str):
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        await websocket.close(code=4401)
        return
    await websocket.accept()
    user_id = payload["sub"]
    try:
        while True:
            async with AsyncSessionLocal() as session:
                dataset = (
                    await session.execute(
                        select(Dataset).where(Dataset.id == dataset_id, Dataset.user_id == user_id)
                    )
                ).scalar_one_or_none()
                if not dataset:
                    await websocket.send_json({"type": "error", "message": "Dataset not found"})
                    break
                latest_run = (
                    await session.execute(
                        select(ModelRun)
                        .where(ModelRun.dataset_id == dataset_id, ModelRun.user_id == user_id)
                        .order_by(ModelRun.created_at.desc())
                    )
                ).scalars().first()
                latest_report = (
                    await session.execute(
                        select(Report)
                        .where(Report.dataset_id == dataset_id, Report.user_id == user_id)
                        .order_by(Report.created_at.desc())
                    )
                ).scalars().first()
                await websocket.send_json(
                    {
                        "type": "dataset_status",
                        "dataset": {
                            "id": dataset.id,
                            "status": dataset.status,
                            "processing_progress": dataset.processing_progress,
                            "updated_at": dataset.updated_at.isoformat(),
                            "error_message": dataset.error_message,
                        },
                        "latest_model_run": {
                            "id": latest_run.id,
                            "status": latest_run.status,
                            "best_model": latest_run.best_model,
                            "error_message": latest_run.error_message,
                        }
                        if latest_run
                        else None,
                        "latest_report": {
                            "id": latest_report.id,
                            "status": latest_report.status,
                            "file_storage_key": latest_report.file_storage_key,
                            "error_message": latest_report.error_message,
                        }
                        if latest_report
                        else None,
                    }
                )
            await asyncio.sleep(settings.websocket_poll_seconds)
    except WebSocketDisconnect:
        return
