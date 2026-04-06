from __future__ import annotations
import asyncio
import json
from pathlib import Path
from typing import Any
from app.core.config import settings
from app.core.storage import StorageService
from app.models.dataset import Dataset
from app.services.cache import CacheService
from app.services.dataset_loader import DatasetLoaderService
from app.services.profiling import ProfilingService
class AnalyticsService:
    def __init__(self) -> None:
        self.storage = StorageService()
        self.loader = DatasetLoaderService()
        self.profiler = ProfilingService()
        self.cache = CacheService()
    def build_stored_dashboard(self, dataset: Dataset) -> dict[str, Any] | None:
        profile = dataset.profile_json or {}
        default_dashboard = profile.get("default_dashboard")
        if not isinstance(default_dashboard, dict):
            return None
        return {
            "dataset_id": dataset.id,
            "filters": {},
            "semantics": profile.get("semantics", {}),
            "kpis": default_dashboard.get("kpis", {}),
            "charts": default_dashboard.get("charts", {}),
            "filter_options": profile.get("filter_options", {}),
            "insights": dataset.ai_insights or default_dashboard.get("insights", []),
            "sample_rows": dataset.sample_rows or [],
        }
    async def load_dataset_frame(self, dataset: Dataset):
        storage_key = dataset.cleaned_storage_key or dataset.original_storage_key
        file_type = "csv" if dataset.cleaned_storage_key else dataset.file_type
        temp_path = (
            Path(settings.local_temp_dir)
            / "downloads"
            / f"{dataset.id}_{'cleaned' if dataset.cleaned_storage_key else 'raw'}.{file_type}"
        )
        await asyncio.to_thread(self.storage.download_file, storage_key, temp_path)
        return await asyncio.to_thread(self.loader.load_dataframe, temp_path, file_type)
    async def build_dashboard(self, dataset: Dataset, filters: dict[str, Any] | None = None) -> dict[str, Any]:
        cache_key = f"dashboard:{dataset.id}:{json.dumps(filters or {}, sort_keys=True)}:{dataset.updated_at.isoformat()}"
        cached = await self.cache.get_json(cache_key)
        if cached:
            return cached
        if not filters:
            stored_dashboard = self.build_stored_dashboard(dataset)
            if stored_dashboard:
                await self.cache.set_json(cache_key, stored_dashboard)
                return stored_dashboard
        frame = await self.load_dataset_frame(dataset)
        dashboard = await asyncio.to_thread(self.profiler.build_dashboard, frame, filters or {})
        payload = {"dataset_id": dataset.id, **dashboard}
        await self.cache.set_json(cache_key, payload)
        return payload
    async def invalidate_dataset_cache(self, dataset_id: str) -> None:
        await self.cache.delete_prefix(f"dashboard:{dataset_id}:")
