from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import structlog
import time
import uuid
from typing import Callable

logger = structlog.get_logger()

class LoggingMiddleware(BaseHTTPMiddleware):
    """Request/response logging middleware"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Log request and response details"""
        # Generate request ID
        request_id = str(uuid.uuid4())
        
        # Start timing
        start_time = time.time()
        
        # Log incoming request
        logger.info("Incoming request",
                   request_id=request_id,
                   method=request.method,
                   url=str(request.url),
                   client=request.client.host if request.client else None,
                   user_agent=request.headers.get("user-agent"),
                   content_type=request.headers.get("content-type"))
        
        # Add request ID to request state
        request.state.request_id = request_id
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Log response
            logger.info("Request completed",
                       request_id=request_id,
                       status_code=response.status_code,
                       duration_ms=round(duration * 1000, 2),
                       response_size=response.headers.get("content-length"))
                       
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as e:
            # Calculate duration for failed request
            duration = time.time() - start_time
            
            # Log error
            logger.error("Request failed",
                        request_id=request_id,
                        error=str(e),
                        error_type=type(e).__name__,
                        duration_ms=round(duration * 1000, 2),
                        exc_info=True)
            
            # Re-raise exception
            raise
