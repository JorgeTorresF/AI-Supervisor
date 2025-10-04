from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Optional
from ..models.api_models import APIResponse, MessageRequest
from ..core.message_router import MessageRouter
from ..core.auth_bridge import AuthBridge
from ..middleware.metrics_middleware import record_message_routing
import structlog

logger = structlog.get_logger()
router = APIRouter()

# These will be injected by the main app
message_router: MessageRouter = None
auth_bridge: AuthBridge = None

def set_dependencies(router_instance: MessageRouter, auth_bridge_instance: AuthBridge):
    """Set the required dependencies"""
    global message_router, auth_bridge
    message_router = router_instance
    auth_bridge = auth_bridge_instance

async def get_authenticated_user(request: Request):
    """Get authenticated user from request"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header required")
        
    token = auth_header[7:]  # Remove "Bearer " prefix
    
    user_info = await auth_bridge.validate_token(token)
    if not user_info:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    return user_info

@router.post("/send")
async def send_message(
    request: MessageRequest,
    auth_user=Depends(get_authenticated_user)
):
    """Send message through the gateway"""
    try:
        if not message_router:
            raise HTTPException(status_code=500, detail="Message router not initialized")
            
        result = await message_router.route_message(
            user_id=auth_user.user_id,
            message_type=request.message_type,
            content=request.content,
            target_deployment=request.target_deployment,
            target_user=request.target_user
        )
        
        record_message_routing(request.message_type, "api_send")
        
        return APIResponse(
            success=True,
            data=result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Message send error", 
                    message_type=request.message_type,
                    user_id=auth_user.user_id,
                    error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_message_history(
    limit: int = 50,
    offset: int = 0,
    auth_user=Depends(get_authenticated_user)
):
    """Get message history for authenticated user"""
    try:
        if not message_router:
            raise HTTPException(status_code=500, detail="Message router not initialized")
            
        history = await message_router.get_user_message_history(
            user_id=auth_user.user_id,
            limit=limit,
            offset=offset
        )
        
        return APIResponse(
            success=True,
            data={
                "messages": history,
                "total": len(history),
                "limit": limit,
                "offset": offset
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error getting message history", 
                    user_id=auth_user.user_id,
                    error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pending")
async def get_pending_messages(
    auth_user=Depends(get_authenticated_user)
):
    """Get pending messages for authenticated user"""
    try:
        if not message_router:
            raise HTTPException(status_code=500, detail="Message router not initialized")
            
        pending = await message_router.get_pending_messages(auth_user.user_id)
        
        return APIResponse(
            success=True,
            data={
                "messages": pending,
                "count": len(pending)
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error getting pending messages", 
                    user_id=auth_user.user_id,
                    error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/broadcast")
async def broadcast_message(
    message: dict,
    deployment_mode: Optional[str] = None,
    auth_user=Depends(get_authenticated_user)
):
    """Broadcast message to all user's connections or specific deployment mode"""
    try:
        if not message_router:
            raise HTTPException(status_code=500, detail="Message router not initialized")
            
        result = await message_router.broadcast_to_user(
            user_id=auth_user.user_id,
            message=message,
            deployment_mode=deployment_mode
        )
        
        record_message_routing("broadcast", "api_broadcast")
        
        return APIResponse(
            success=True,
            data=result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Broadcast error", 
                    user_id=auth_user.user_id,
                    deployment_mode=deployment_mode,
                    error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/notify")
async def send_notification(
    notification: dict,
    target_deployment: Optional[str] = None,
    auth_user=Depends(get_authenticated_user)
):
    """Send notification to user's devices"""
    try:
        if not message_router:
            raise HTTPException(status_code=500, detail="Message router not initialized")
            
        result = await message_router.route_message(
            user_id=auth_user.user_id,
            message_type="notification",
            content=notification,
            target_deployment=target_deployment
        )
        
        record_message_routing("notification", "api_notify")
        
        return APIResponse(
            success=True,
            data=result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Notification error", 
                    user_id=auth_user.user_id,
                    target_deployment=target_deployment,
                    error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_messaging_stats():
    """Get messaging statistics"""
    try:
        if not message_router:
            raise HTTPException(status_code=500, detail="Message router not initialized")
            
        stats = message_router.get_routing_stats()
        
        return APIResponse(
            success=True,
            data=stats
        )
        
    except Exception as e:
        logger.error("Error getting messaging stats", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
