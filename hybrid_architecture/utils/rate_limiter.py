import asyncio
from typing import Dict, Optional
from datetime import datetime, timedelta
import structlog
from ..utils.redis_client import RedisClient

logger = structlog.get_logger()

class RateLimiter:
    """Rate limiter for API requests"""
    
    def __init__(self, redis_client: Optional[RedisClient] = None):
        self.redis_client = redis_client or RedisClient()
        self.local_cache: Dict[str, Dict[str, int]] = {}
        self.cleanup_interval = 300  # 5 minutes
        self._cleanup_task = None
        
    async def initialize(self):
        """Initialize rate limiter"""
        if not self.redis_client.is_connected():
            await self.redis_client.connect()
            
        # Start cleanup task for local cache
        self._cleanup_task = asyncio.create_task(self._cleanup_local_cache())
        
        logger.info("Rate limiter initialized")
        
    async def cleanup(self):
        """Cleanup rate limiter"""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            
    async def allow_request(
        self, 
        client_id: str, 
        limit: int = 60, 
        window: int = 60
    ) -> bool:
        """Check if request is allowed based on rate limits"""
        try:
            # Use Redis if available, otherwise fall back to local cache
            if self.redis_client.is_connected():
                return await self._check_redis_rate_limit(client_id, limit, window)
            else:
                return await self._check_local_rate_limit(client_id, limit, window)
                
        except Exception as e:
            logger.error("Error checking rate limit", client_id=client_id, error=str(e))
            # Allow request if rate limiting fails
            return True
            
    async def _check_redis_rate_limit(
        self, 
        client_id: str, 
        limit: int, 
        window: int
    ) -> bool:
        """Check rate limit using Redis"""
        current_time = int(datetime.now().timestamp())
        redis_key = f"rate_limit:{client_id}:{current_time // window}"
        
        # Increment counter
        current_count = await self.redis_client.incr(redis_key)
        
        # Set expiration on first increment
        if current_count == 1:
            await self.redis_client.expire(redis_key, window)
            
        return current_count <= limit
        
    async def _check_local_rate_limit(
        self, 
        client_id: str, 
        limit: int, 
        window: int
    ) -> bool:
        """Check rate limit using local cache"""
        current_time = int(datetime.now().timestamp())
        window_key = current_time // window
        
        if client_id not in self.local_cache:
            self.local_cache[client_id] = {}
            
        client_windows = self.local_cache[client_id]
        
        # Clean up old windows
        expired_windows = [w for w in client_windows.keys() if w < window_key - 1]
        for w in expired_windows:
            del client_windows[w]
            
        # Check current window
        current_count = client_windows.get(window_key, 0)
        
        if current_count >= limit:
            return False
            
        # Increment counter
        client_windows[window_key] = current_count + 1
        return True
        
    async def _cleanup_local_cache(self):
        """Periodically clean up local cache"""
        while True:
            try:
                await asyncio.sleep(self.cleanup_interval)
                
                current_time = int(datetime.now().timestamp())
                cutoff_time = current_time - 3600  # Keep last hour
                
                # Clean up expired entries
                for client_id in list(self.local_cache.keys()):
                    client_windows = self.local_cache[client_id]
                    expired_windows = [w for w in client_windows.keys() if w < cutoff_time // 60]
                    
                    for w in expired_windows:
                        del client_windows[w]
                        
                    # Remove client if no windows left
                    if not client_windows:
                        del self.local_cache[client_id]
                        
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Error in rate limiter cleanup", error=str(e))
                
    def get_remaining_requests(
        self, 
        client_id: str, 
        limit: int = 60, 
        window: int = 60
    ) -> int:
        """Get remaining requests for client"""
        current_time = int(datetime.now().timestamp())
        window_key = current_time // window
        
        if client_id not in self.local_cache:
            return limit
            
        client_windows = self.local_cache[client_id]
        current_count = client_windows.get(window_key, 0)
        
        return max(0, limit - current_count)
