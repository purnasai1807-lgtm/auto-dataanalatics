from fastapi import APIRouter
from app.api.routes import analytics, auth, chat, datasets, health, ml, reports, storage
api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(datasets.router)
api_router.include_router(analytics.router)
api_router.include_router(ml.router)
api_router.include_router(chat.router)
api_router.include_router(reports.router)
api_router.include_router(storage.router)
