from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from typing import Dict, List, Any, Optional
import structlog
import asyncio
from datetime import datetime, timezone

from ..models.api_models import APIResponse, MessageRequest, SyncRequest
from ..core.auth_bridge import AuthBridge
from ..core.message_router import MessageRouter
from ..core.data_sync import DataSyncEngine
from ..utils.rate_limiter import RateLimiter

logger = structlog.get_logger()

class APIGateway:
    """REST API endpoints for cross-deployment communication"""
    
    def __init__(self):
        self.router = APIRouter()
        self.auth_bridge = None
        self.message_router = None
        self.data_sync = None
        self.rate_limiter = RateLimiter()
        self._setup_routes()
        
    async def initialize(self):
        """Initialize the API Gateway"""
        self.auth_bridge = AuthBridge()
        await self.auth_bridge.initialize()
        
        self.message_router = MessageRouter()
        await self.message_router.initialize()
        
        self.data_sync = DataSyncEngine()
        await self.data_sync.initialize()
        
        logger.info("API Gateway initialized")
        
    async def cleanup(self):
        """Cleanup resources"""
        if self.auth_bridge:
            await self.auth_bridge.cleanup()
        if self.message_router:
            await self.message_router.cleanup()
        if self.data_sync:
            await self.data_sync.cleanup()
            
        logger.info("API Gateway cleaned up")
        
    def _setup_routes(self):
        """Setup API routes"""
        
        @self.router.get("/status")
        async def get_api_status():
            """Get API Gateway status"""
            return APIResponse(
                success=True,
                data={
                    "status": "healthy",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "version": "1.0.0"
                }
            )
            
        @self.router.post("/messages/send")
        async def send_message(
            request: MessageRequest,
            auth_user=Depends(self._get_authenticated_user)
        ):
            """Send message through the gateway"""
            try:
                result = await self.message_router.route_message(
                    user_id=auth_user["user_id"],
                    message_type=request.message_type,
                    content=request.content,
                    target_deployment=request.target_deployment,
                    target_user=request.target_user
                )
                
                return APIResponse(
                    success=True,
                    data=result
                )
                
            except Exception as e:
                logger.error("Error sending message", error=str(e))
                raise HTTPException(status_code=500, detail=str(e))
                
        @self.router.get("/messages/history")
        async def get_message_history(
            limit: int = 50,
            offset: int = 0,
            auth_user=Depends(self._get_authenticated_user)
        ):
            """Get message history for authenticated user"""
            try:
                history = await self.message_router.get_user_message_history(
                    user_id=auth_user["user_id"],
                    limit=limit,
                    offset=offset
                )
                
                return APIResponse(
                    success=True,
                    data={
                        "messages": history,
                        "total": len(history)
                    }
                )
                
            except Exception as e:
                logger.error("Error getting message history", error=str(e))
                raise HTTPException(status_code=500, detail=str(e))
                
        @self.router.post("/sync/trigger")
        async def trigger_sync(
            request: SyncRequest,
            auth_user=Depends(self._get_authenticated_user)
        ):
            """Trigger data synchronization"""
            try:
                result = await self.data_sync.trigger_sync(
                    user_id=auth_user["user_id"],
                    sync_type=request.sync_type,
                    deployment_mode=request.deployment_mode,
                    data=request.data
                )
                
                return APIResponse(
                    success=True,
                    data=result
                )
                
            except Exception as e:
                logger.error("Error triggering sync", error=str(e))
                raise HTTPException(status_code=500, detail=str(e))
                
        @self.router.get("/sync/status")
        async def get_sync_status(
            auth_user=Depends(self._get_authenticated_user)
        ):
            """Get synchronization status for user"""
            try:
                status = await self.data_sync.get_sync_status(
                    user_id=auth_user["user_id"]
                )
                
                return APIResponse(
                    success=True,
                    data=status
                )
                
            except Exception as e:
                logger.error("Error getting sync status", error=str(e))
                raise HTTPException(status_code=500, detail=str(e))
                
        @self.router.get("/deployments")
        async def get_user_deployments(
            auth_user=Depends(self._get_authenticated_user)
        ):
            """Get user's active deployments"""
            try:
                # This would typically come from the WebSocket hub
                # For now, return a mock response
                deployments = {
                    "web_app": True,
                    "browser_extension": False,
                    "local_installation": False
                }
                
                return APIResponse(
                    success=True,
                    data=deployments
                )
                
            except Exception as e:
                logger.error("Error getting deployments", error=str(e))
                raise HTTPException(status_code=500, detail=str(e))
                
        @self.router.post("/broadcast")
        async def broadcast_message(
            message: dict,
            deployment_mode: Optional[str] = None,
            auth_user=Depends(self._get_authenticated_user)
        ):
            """Broadcast message to all user's connections or specific deployment mode"""
            try:
                result = await self.message_router.broadcast_to_user(
                    user_id=auth_user["user_id"],
                    message=message,
                    deployment_mode=deployment_mode
                )
                
                return APIResponse(
                    success=True,
                    data=result
                )
                
            except Exception as e:
                logger.error("Error broadcasting message", error=str(e))
                raise HTTPException(status_code=500, detail=str(e))
                
    async def _get_authenticated_user(self, request: Request):
        """Dependency to get authenticated user from request"""
        # Check rate limiting
        client_id = request.client.host
        if not await self.rate_limiter.allow_request(client_id):
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
            
        # Get auth token from header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Authorization header required")
            
        token = auth_header[7:]  # Remove "Bearer " prefix
        
        # Validate token
        user_info = await self.auth_bridge.validate_token(token)
        if not user_info:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        return user_info
        
    def get_router(self) -> APIRouter:
        """Get the FastAPI router"""
        return self.router
