from __future__ import annotations
import json
from functools import lru_cache
from pathlib import Path
from typing import Any
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
BASE_DIR = Path(__file__).resolve().parents[2]
def normalize_async_database_url(value: str) -> str:
    if value.startswith("postgres://"):
        return value.replace("postgres://", "postgresql+asyncpg://", 1)
    if value.startswith("postgresql://"):
        return value.replace("postgresql://", "postgresql+asyncpg://", 1)
    return value
def normalize_sync_database_url(value: str) -> str:
    if value.startswith("postgres://"):
        return value.replace("postgres://", "postgresql+psycopg://", 1)
    if value.startswith("postgresql://"):
        return value.replace("postgresql://", "postgresql+psycopg://", 1)
    if value.startswith("postgresql+asyncpg://"):
        return value.replace("postgresql+asyncpg://", "postgresql+psycopg://", 1)
    if value.startswith("sqlite+aiosqlite:///"):
        return value.replace("sqlite+aiosqlite:///", "sqlite:///", 1)
    return value
class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )
    app_name: str = "Auto Data Analytics Platform"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    secret_key: str = "change-this-secret"
    access_token_expire_minutes: int = 60 * 24
    algorithm: str = "HS256"
    allowed_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"]
    )
    frontend_url: str = "http://localhost:5173"
    database_url: str = "postgresql+asyncpg://postgres:postgres@db:5432/auto_analytics"
    redis_url: str = ""
    celery_broker_url: str = ""
    celery_result_backend: str = ""
    task_backend: str = "auto"
    openai_api_key: str | None = None
    openai_model: str = "gpt-5.2"
    storage_backend: str = "auto"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    s3_bucket: str = ""
    s3_endpoint_url: str | None = None
    s3_use_ssl: bool = True
    upload_chunk_size_mb: int = 8
    large_file_threshold_mb: int = 150
    websocket_poll_seconds: int = 3
    cache_ttl_seconds: int = 300
    max_chat_rows: int = 50
    storage_prefix_uploads: str = "uploads"
    storage_prefix_cleaned: str = "cleaned"
    storage_prefix_exports: str = "exports"
    local_temp_dir: Path = BASE_DIR / "runtime"
    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value: Any) -> list[str]:
        if isinstance(value, str):
            stripped = value.strip()
            if stripped.startswith("["):
                parsed = json.loads(stripped)
                return [str(origin).strip() for origin in parsed if str(origin).strip()]
            return [origin.strip() for origin in stripped.split(",") if origin.strip()]
        return value
    @field_validator("database_url", mode="before")
    @classmethod
    def parse_database_url(cls, value: Any) -> Any:
        if isinstance(value, str):
            return normalize_async_database_url(value.strip())
        return value
    @field_validator("s3_endpoint_url", mode="before")
    @classmethod
    def parse_s3_endpoint_url(cls, value: Any) -> Any:
        if isinstance(value, str):
            stripped = value.strip()
            if stripped.lower() in {"", "none", "null"}:
                return None
            return stripped
        return value
    @property
    def sync_database_url(self) -> str:
        return normalize_sync_database_url(self.database_url)
    @property
    def active_task_backend(self) -> str:
        return "celery" if self.use_celery else "inline"
    @property
    def active_storage_backend(self) -> str:
        return "s3" if self.use_s3_storage else "local"
    @property
    def use_celery(self) -> bool:
        if self.task_backend == "celery":
            return True
        if self.task_backend == "inline":
            return False
        return bool(self.celery_broker_url and self.celery_result_backend)
    @property
    def use_s3_storage(self) -> bool:
        if self.storage_backend == "s3":
            return True
        if self.storage_backend == "local":
            return False
        has_bucket = bool(self.s3_bucket)
        has_local_s3 = bool(self.s3_endpoint_url)
        has_cloud_s3 = bool(self.aws_access_key_id and self.aws_secret_access_key)
        return has_bucket and (has_local_s3 or has_cloud_s3)
    @property
    def runtime_warnings(self) -> list[str]:
        warnings: list[str] = []
        if self.environment.lower() == "production":
            if self.active_storage_backend == "local":
                warnings.append("Local container storage is active; uploads and exports are not durable across redeploys.")
            if self.active_task_backend == "inline":
                warnings.append("Inline background tasks are active; long-running jobs are not queue-backed.")
        return warnings
    @property
    def runtime_summary(self) -> dict[str, Any]:
        return {
            "environment": self.environment,
            "task_backend": self.active_task_backend,
            "storage_backend": self.active_storage_backend,
            "degraded": bool(self.runtime_warnings),
            "warnings": self.runtime_warnings,
        }
@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.local_temp_dir.mkdir(parents=True, exist_ok=True)
    return settings
settings = get_settings()
