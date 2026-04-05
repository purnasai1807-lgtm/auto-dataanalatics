from __future__ import annotations
from collections.abc import AsyncGenerator
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings
Base = declarative_base()
async_engine = create_async_engine(
    settings.database_url,
    future=True,
    echo=False,
    pool_pre_ping=True,
)
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    expire_on_commit=False,
    class_=AsyncSession,
    autoflush=False,
    autocommit=False,
)
sync_engine = create_engine(
    settings.sync_database_url,
    future=True,
    echo=False,
    pool_pre_ping=True,
)
SyncSessionLocal = sessionmaker(
    bind=sync_engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
def get_sync_db():
    db = SyncSessionLocal()
    try:
        yield db
    finally:
        db.close()
async def init_db() -> None:
    from app.models import dataset, model_run, report, user
    async with async_engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
