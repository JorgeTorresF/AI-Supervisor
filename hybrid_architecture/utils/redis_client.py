import aioredis
import json
from typing import Any, Optional, Dict, List
import structlog
from ..config import settings

logger = structlog.get_logger()

class RedisClient:
    """Redis client wrapper for connection management and operations"""
    
    def __init__(self):
        self.redis = None
        self._connected = False
        
    async def connect(self):
        """Connect to Redis"""
        try:
            self.redis = aioredis.from_url(
                settings.redis_url,
                password=settings.redis_password,
                decode_responses=True,
                retry_on_timeout=True
            )
            
            # Test connection
            await self.redis.ping()
            self._connected = True
            
            logger.info("Redis connected successfully")
            
        except Exception as e:
            logger.error("Failed to connect to Redis", error=str(e))
            raise
            
    async def disconnect(self):
        """Disconnect from Redis"""
        if self.redis:
            await self.redis.close()
            self._connected = False
            logger.info("Redis disconnected")
            
    async def get(self, key: str) -> Optional[Any]:
        """Get value from Redis"""
        if not self._connected:
            return None
            
        try:
            value = await self.redis.get(key)
            if value:
                return json.loads(value)
            return None
        except json.JSONDecodeError:
            return value
        except Exception as e:
            logger.error("Redis GET error", key=key, error=str(e))
            return None
            
    async def set(self, key: str, value: Any) -> bool:
        """Set value in Redis"""
        if not self._connected:
            return False
            
        try:
            serialized_value = json.dumps(value) if not isinstance(value, str) else value
            await self.redis.set(key, serialized_value)
            return True
        except Exception as e:
            logger.error("Redis SET error", key=key, error=str(e))
            return False
            
    async def setex(self, key: str, seconds: int, value: Any) -> bool:
        """Set value in Redis with expiration"""
        if not self._connected:
            return False
            
        try:
            serialized_value = json.dumps(value) if not isinstance(value, str) else value
            await self.redis.setex(key, seconds, serialized_value)
            return True
        except Exception as e:
            logger.error("Redis SETEX error", key=key, error=str(e))
            return False
            
    async def delete(self, key: str) -> bool:
        """Delete key from Redis"""
        if not self._connected:
            return False
            
        try:
            await self.redis.delete(key)
            return True
        except Exception as e:
            logger.error("Redis DELETE error", key=key, error=str(e))
            return False
            
    async def lpush(self, key: str, value: Any) -> bool:
        """Push to left of list"""
        if not self._connected:
            return False
            
        try:
            serialized_value = json.dumps(value) if not isinstance(value, str) else value
            await self.redis.lpush(key, serialized_value)
            return True
        except Exception as e:
            logger.error("Redis LPUSH error", key=key, error=str(e))
            return False
            
    async def lrange(self, key: str, start: int, end: int) -> List[str]:
        """Get range from list"""
        if not self._connected:
            return []
            
        try:
            return await self.redis.lrange(key, start, end)
        except Exception as e:
            logger.error("Redis LRANGE error", key=key, error=str(e))
            return []
            
    async def ltrim(self, key: str, start: int, end: int) -> bool:
        """Trim list to specified range"""
        if not self._connected:
            return False
            
        try:
            await self.redis.ltrim(key, start, end)
            return True
        except Exception as e:
            logger.error("Redis LTRIM error", key=key, error=str(e))
            return False
            
    async def expire(self, key: str, seconds: int) -> bool:
        """Set key expiration"""
        if not self._connected:
            return False
            
        try:
            await self.redis.expire(key, seconds)
            return True
        except Exception as e:
            logger.error("Redis EXPIRE error", key=key, error=str(e))
            return False
            
    async def sadd(self, key: str, value: str) -> bool:
        """Add to set"""
        if not self._connected:
            return False
            
        try:
            await self.redis.sadd(key, value)
            return True
        except Exception as e:
            logger.error("Redis SADD error", key=key, error=str(e))
            return False
            
    async def smembers(self, key: str) -> set:
        """Get set members"""
        if not self._connected:
            return set()
            
        try:
            return await self.redis.smembers(key)
        except Exception as e:
            logger.error("Redis SMEMBERS error", key=key, error=str(e))
            return set()
            
    async def exists(self, key: str) -> bool:
        """Check if key exists"""
        if not self._connected:
            return False
            
        try:
            return await self.redis.exists(key) > 0
        except Exception as e:
            logger.error("Redis EXISTS error", key=key, error=str(e))
            return False
            
    async def incr(self, key: str) -> int:
        """Increment counter"""
        if not self._connected:
            return 0
            
        try:
            return await self.redis.incr(key)
        except Exception as e:
            logger.error("Redis INCR error", key=key, error=str(e))
            return 0
            
    def is_connected(self) -> bool:
        """Check if connected to Redis"""
        return self._connected
