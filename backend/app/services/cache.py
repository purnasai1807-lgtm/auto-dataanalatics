from __future__ import annotations
import json
import logging
from typing import Any
from app.core.config import settings
from app.core.redis_client import get_async_redis
logger = logging.getLogger(__name__)
class CacheService:
    async def get_json(self, key: str) -> Any | None:
        redis = get_async_redis()
        try:
            value = await redis.get(key)
            return json.loads(value) if value else None
        except Exception as exc:
            logger.warning("Redis get failed for %s: %s", key, exc)
            return None
        finally:
            await redis.aclose()
    async def set_json(self, key: str, value: Any, ttl: int | None = None) -> None:
        redis = get_async_redis()
        try:
            await redis.set(key, json.dumps(value, default=str), ex=ttl or settings.cache_ttl_seconds)
        except Exception as exc:
            logger.warning("Redis set failed for %s: %s", key, exc)
        finally:
            await redis.aclose()
    async def delete_prefix(self, prefix: str) -> None:
        redis = get_async_redis()
        try:
            keys = await redis.keys(f"{prefix}*")
            if keys:
                await redis.delete(*keys)
        except Exception as exc:
            logger.warning("Redis delete failed for %s: %s", prefix, exc)
        finally:
            await redis.aclose()
