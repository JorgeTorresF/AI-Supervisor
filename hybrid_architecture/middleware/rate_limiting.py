from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import time
from typing import Callable

from ..utils.rate_limiter import RateLimiter
from ..config import settings

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.rate_limiter = RateLimiter()
        
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Apply rate limiting to requests"""
        # Skip rate limiting for health checks and internal endpoints
        if request.url.path in ["/health", "/metrics", "/docs", "/openapi.json"]:
            return await call_next(request)
            
        # Get client identifier
        client_id = self._get_client_id(request)
        
        # Check rate limit
        allowed = await self.rate_limiter.allow_request(
            client_id,
            limit=settings.rate_limit_per_minute,
            window=60
        )
        
        if not allowed:
            return Response(
                content='{"error": "Rate limit exceeded", "retry_after": 60}',
                status_code=429,
                headers={
                    "Content-Type": "application/json",
                    "Retry-After": "60"
                }
            )
            
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers
        remaining = self.rate_limiter.get_remaining_requests(
            client_id,
            limit=settings.rate_limit_per_minute,
            window=60
        )
        
        response.headers["X-RateLimit-Limit"] = str(settings.rate_limit_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(time.time()) + 60)
        
        return response
        
    def _get_client_id(self, request: Request) -> str:
        """Get client identifier for rate limiting"""
        # Try to get authenticated user ID first
        auth_header = request.headers.get("Authorization")
        if auth_header:
            # In a real implementation, you'd decode the token to get user ID
            # For now, use a hash of the token
            import hashlib
            return hashlib.md5(auth_header.encode()).hexdigest()
            
        # Fall back to IP address
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
            
        return request.client.host if request.client else "unknown"
