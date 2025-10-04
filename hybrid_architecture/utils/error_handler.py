from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import structlog
from datetime import datetime, timezone
from typing import Any, Dict

logger = structlog.get_logger()

def setup_error_handlers(app: FastAPI):
    """Setup global error handlers for the FastAPI app"""
    
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        """Handle HTTP exceptions"""
        logger.warning("HTTP exception occurred", 
                      status_code=exc.status_code,
                      detail=exc.detail,
                      path=request.url.path)
                      
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": exc.detail,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )
        
    @app.exception_handler(StarletteHTTPException)
    async def starlette_http_exception_handler(request: Request, exc: StarletteHTTPException):
        """Handle Starlette HTTP exceptions"""
        logger.warning("Starlette HTTP exception occurred", 
                      status_code=exc.status_code,
                      detail=exc.detail,
                      path=request.url.path)
                      
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": exc.detail or "Internal server error",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )
        
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Handle request validation errors"""
        logger.warning("Request validation error", 
                      errors=exc.errors(),
                      path=request.url.path)
                      
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "error": "Validation error",
                "details": exc.errors(),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )
        
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """Handle all other exceptions"""
        logger.error("Unhandled exception occurred", 
                    error=str(exc),
                    error_type=type(exc).__name__,
                    path=request.url.path,
                    exc_info=True)
                    
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "Internal server error",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )
        
    logger.info("Error handlers setup complete")

class ErrorHandler:
    """Centralized error handling utilities"""
    
    @staticmethod
    def create_error_response(
        error_code: str,
        message: str,
        details: Any = None,
        status_code: int = 500
    ) -> Dict[str, Any]:
        """Create standardized error response"""
        response = {
            "success": False,
            "error_code": error_code,
            "error": message,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        if details:
            response["details"] = details
            
        return response
        
    @staticmethod
    def log_error(
        error: Exception,
        context: Dict[str, Any] = None,
        level: str = "error"
    ):
        """Log error with context"""
        log_data = {
            "error": str(error),
            "error_type": type(error).__name__,
        }
        
        if context:
            log_data.update(context)
            
        if level == "error":
            logger.error("Error occurred", **log_data, exc_info=True)
        elif level == "warning":
            logger.warning("Warning occurred", **log_data)
        else:
            logger.info("Info event", **log_data)
