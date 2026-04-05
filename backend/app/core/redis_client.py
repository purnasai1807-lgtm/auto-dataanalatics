from __future__ import annotations
from redis import Redis
from redis.asyncio import Redis as AsyncRedis
from app.core.config import settings
def get_async_redis() -> AsyncRedis | None:
    if not settings.redis_url:
        return None
    return AsyncRedis.from_url(settings.redis_url, decode_responses=True)
def get_sync_redis() -> Redis | None:
    if not settings.redis_url:
        return None
    return Redis.from_url(settings.redis_url, decode_responses=True)
