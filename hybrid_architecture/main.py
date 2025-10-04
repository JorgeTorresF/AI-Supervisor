"""Main FastAPI application for the Hybrid Architecture System."""

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from .config.settings import settings
from .src.websocket_hub import hub
from .src.api_gateway import router as api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management."""
    logger.info("Starting Hybrid Architecture System...")
    yield
    logger.info("Shutting down Hybrid Architecture System...")

# Create FastAPI app
app = FastAPI(
    title="AI Agent Supervisor - Hybrid Architecture",
    description="Communication gateway for multi-deployment AI agent supervision",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "AI Agent Supervisor - Hybrid Architecture",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "websocket": "/ws",
            "api": "/api/v1",
            "docs": "/docs"
        },
        "deployment_modes": settings.deployment_modes
    }

@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str = Query(...),
    deployment_mode: str = Query(...),
    auth_token: str = Query(...)
):
    """WebSocket endpoint for real-time communication."""
    
    connection_id = None
    
    try:
        # Connect to hub
        connection_id = await hub.connect(websocket, user_id, deployment_mode, auth_token)
        
        # Handle messages
        while True:
            try:
                # Receive message
                data = await websocket.receive_text()
                message = eval(data) if isinstance(data, str) else data
                
                # Handle message through hub
                await hub.handle_message(connection_id, user_id, message)
                
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"WebSocket error for {connection_id}: {e}")
                await websocket.send_text(f"Error: {e}")
                
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
        
    finally:
        # Clean up connection
        if connection_id:
            await hub.disconnect(connection_id, user_id)

@app.get("/stats")
async def get_stats():
    """Get system statistics."""
    return hub.get_connection_stats()

@app.exception_handler(500)
async def internal_server_error(request, exc):
    """Handle internal server errors."""
    logger.error(f"Internal server error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error occurred"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info"
    )