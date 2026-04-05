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
    redis_url: str = "redis://redis:6379/0"
    celery_broker_url: str = "redis://redis:6379/1"
    celery_result_backend: str = "redis://redis:6379/2"
    openai_api_key: str | None = None
    openai_model: str = "gpt-5.2"
    aws_access_key_id: str = "minioadmin"
    aws_secret_access_key: str = "minioadmin"
    aws_region: str = "us-east-1"
    s3_bucket: str = "auto-analytics"
    s3_endpoint_url: str | None = "http://minio:9000"
    s3_use_ssl: bool = False
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
@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.local_temp_dir.mkdir(parents=True, exist_ok=True)
    return settings
settings = get_settings()
