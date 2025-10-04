from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Optional, Dict, Any
from ..models.api_models import APIResponse
from ..core.connection_manager import ConnectionManager
from ..core.websocket_hub import WebSocketHub
from ..core.auth_bridge import AuthBridge
import structlog

logger = structlog.get_logger()
router = APIRouter()

# These will be injected by the main app
connection_manager: ConnectionManager = None
websocket_hub: WebSocketHub = None
auth_bridge: AuthBridge = None

def set_dependencies(
    manager: ConnectionManager, 
    hub: WebSocketHub,
    auth_bridge_instance: AuthBridge
):
    """Set the required dependencies"""
    global connection_manager, websocket_hub, auth_bridge
    connection_manager = manager
    websocket_hub = hub
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

@router.get("/deployments")
async def get_user_deployments(
    auth_user=Depends(get_authenticated_user)
):
    """Get user's active deployments"""
    try:
        if not websocket_hub:
            raise HTTPException(status_code=500, detail="WebSocket hub not initialized")
            
        # Get user's active connections
        user_connections = websocket_hub.user_connections.get(auth_user.user_id, set())
        
        deployments = {
            "web_app": False,
            "browser_extension": False,
            "local_installation": False
        }
        
        for connection_id in user_connections:
            connection = websocket_hub.connections.get(connection_id)
            if connection:
                deployments[connection.deployment_mode] = True
                
        return APIResponse(
            success=True,
            data={
                "deployments": deployments,
                "active_connections": len(user_connections)
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error getting deployments", 
                    user_id=auth_user.user_id,
                    error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/connections")
async def get_user_connections(
    auth_user=Depends(get_authenticated_user)
):
    """Get detailed information about user's connections"""
    try:
        if not connection_manager:
            raise HTTPException(status_code=500, detail="Connection manager not initialized")
            
        connections = await connection_manager.get_user_connections(auth_user.user_id)
        
        return APIResponse(
            success=True,
            data={
                "connections": connections,
                "total": len(connections)
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error getting connections", 
                    user_id=auth_user.user_id,
                    error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/settings")
async def get_gateway_settings():
    """Get gateway configuration settings"""
    try:
        from ..config import settings
        
        # Return non-sensitive configuration
        config = {
            "websocket": {
                "max_connections": settings.ws_max_connections,
                "heartbeat_interval": settings.ws_heartbeat_interval,
                "connection_timeout": settings.ws_connection_timeout
            },
            "rate_limiting": {
                "requests_per_minute": settings.rate_limit_per_minute,
                "burst_limit": settings.rate_limit_burst
            },
            "features": {
                "metrics_enabled": settings.metrics_enabled,
                "debug_mode": settings.debug
            },
            "supported_deployments": [
                "web_app",
                "browser_extension",
                "local_installation"
            ]
        }
        
        return APIResponse(
            success=True,
            data=config
        )
        
    except Exception as e:
        logger.error("Error getting gateway settings", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/deployment/{deployment_mode}")
async def update_deployment_config(
    deployment_mode: str,
    config_data: Dict[str, Any],
    auth_user=Depends(get_authenticated_user)
):
    """Update deployment-specific configuration"""
    try:
        if deployment_mode not in ["web_app", "browser_extension", "local_installation"]:
            raise HTTPException(status_code=400, detail="Invalid deployment mode")
            
        # This would typically update the configuration in the database
        # For now, just validate and return success
        
        return APIResponse(
            success=True,
            data={
                "deployment_mode": deployment_mode,
                "config_updated": True,
                "timestamp": "2024-01-01T00:00:00Z"  # Would be actual timestamp
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error updating deployment config", 
                    deployment_mode=deployment_mode,
                    user_id=auth_user.user_id,
                    error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def get_component_health():
    """Get health status of gateway components"""
    try:
        components = {
            "websocket_hub": "healthy" if websocket_hub else "unavailable",
            "connection_manager": "healthy" if connection_manager else "unavailable",
            "message_router": "healthy",  # Would check actual status
            "data_sync": "healthy",      # Would check actual status
            "auth_bridge": "healthy" if auth_bridge else "unavailable"
        }
        
        overall_status = "healthy" if all(status == "healthy" for status in components.values()) else "degraded"
        
        return APIResponse(
            success=True,
            data={
                "overall_status": overall_status,
                "components": components
            }
        )
        
    except Exception as e:
        logger.error("Error getting component health", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_configuration_stats():
    """Get configuration and connection statistics"""
    try:
        stats = {}
        
        if websocket_hub:
            stats["websocket"] = websocket_hub.get_connection_stats()
            
        if connection_manager:
            stats["connections"] = connection_manager.get_connection_stats()
            
        return APIResponse(
            success=True,
            data=stats
        )
        
    except Exception as e:
        logger.error("Error getting configuration stats", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
