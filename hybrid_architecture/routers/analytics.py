from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, timezone
from ..models.api_models import APIResponse
from ..core.connection_manager import ConnectionManager
from ..core.websocket_hub import WebSocketHub
from ..core.message_router import MessageRouter
from ..core.data_sync import DataSyncEngine
from ..core.auth_bridge import AuthBridge
from ..utils.redis_client import RedisClient
import structlog

logger = structlog.get_logger()
router = APIRouter()

# These will be injected by the main app
connection_manager: ConnectionManager = None
websocket_hub: WebSocketHub = None
message_router: MessageRouter = None
data_sync: DataSyncEngine = None
auth_bridge: AuthBridge = None
redis_client: RedisClient = None

def set_dependencies(
    manager: ConnectionManager, 
    hub: WebSocketHub,
    router_instance: MessageRouter,
    sync_engine: DataSyncEngine,
    auth_bridge_instance: AuthBridge,
    redis_instance: RedisClient
):
    """Set the required dependencies"""
    global connection_manager, websocket_hub, message_router, data_sync, auth_bridge, redis_client
    connection_manager = manager
    websocket_hub = hub
    message_router = router_instance
    data_sync = sync_engine
    auth_bridge = auth_bridge_instance
    redis_client = redis_instance

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

@router.get("/overview")
async def get_analytics_overview(
    time_range: str = "24h",  # 1h, 24h, 7d, 30d
    auth_user=Depends(get_authenticated_user)
):
    """Get analytics overview for user"""
    try:
        # Parse time range
        hours = {
            "1h": 1,
            "24h": 24,
            "7d": 24 * 7,
            "30d": 24 * 30
        }.get(time_range, 24)
        
        overview = {
            "time_range": time_range,
            "user_id": auth_user.user_id,
            "connections": await _get_connection_analytics(auth_user.user_id, hours),
            "messages": await _get_message_analytics(auth_user.user_id, hours),
            "sync_operations": await _get_sync_analytics(auth_user.user_id, hours),
            "deployment_usage": await _get_deployment_analytics(auth_user.user_id, hours)
        }
        
        return APIResponse(
            success=True,
            data=overview
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error getting analytics overview", 
                    user_id=auth_user.user_id,
                    time_range=time_range,
                    error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/connections")
async def get_connection_analytics(
    deployment_mode: Optional[str] = None,
    time_range: str = "24h",
    auth_user=Depends(get_authenticated_user)
):
    """Get detailed connection analytics"""
    try:
        hours = {
            "1h": 1,
            "24h": 24,
            "7d": 24 * 7,
            "30d": 24 * 30
        }.get(time_range, 24)
        
        analytics = await _get_detailed_connection_analytics(
            auth_user.user_id, 
            deployment_mode, 
            hours
        )
        
        return APIResponse(
            success=True,
            data=analytics
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error getting connection analytics", 
                    user_id=auth_user.user_id,
                    deployment_mode=deployment_mode,
                    error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/messages")
async def get_message_analytics(
    message_type: Optional[str] = None,
    time_range: str = "24h",
    auth_user=Depends(get_authenticated_user)
):
    """Get detailed message analytics"""
    try:
        hours = {
            "1h": 1,
            "24h": 24,
            "7d": 24 * 7,
            "30d": 24 * 30
        }.get(time_range, 24)
        
        analytics = await _get_detailed_message_analytics(
            auth_user.user_id,
            message_type,
            hours
        )
        
        return APIResponse(
            success=True,
            data=analytics
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error getting message analytics", 
                    user_id=auth_user.user_id,
                    message_type=message_type,
                    error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sync")
async def get_sync_analytics(
    sync_type: Optional[str] = None,
    time_range: str = "24h",
    auth_user=Depends(get_authenticated_user)
):
    """Get detailed synchronization analytics"""
    try:
        hours = {
            "1h": 1,
            "24h": 24,
            "7d": 24 * 7,
            "30d": 24 * 30
        }.get(time_range, 24)
        
        analytics = await _get_detailed_sync_analytics(
            auth_user.user_id,
            sync_type,
            hours
        )
        
        return APIResponse(
            success=True,
            data=analytics
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error getting sync analytics", 
                    user_id=auth_user.user_id,
                    sync_type=sync_type,
                    error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/usage")
async def get_usage_analytics(
    time_range: str = "7d",
    auth_user=Depends(get_authenticated_user)
):
    """Get usage analytics across all deployment modes"""
    try:
        hours = {
            "1h": 1,
            "24h": 24,
            "7d": 24 * 7,
            "30d": 24 * 30
        }.get(time_range, 24 * 7)
        
        usage_data = {
            "time_range": time_range,
            "deployment_modes": await _get_deployment_usage_analytics(auth_user.user_id, hours),
            "activity_timeline": await _get_activity_timeline(auth_user.user_id, hours),
            "feature_usage": await _get_feature_usage_analytics(auth_user.user_id, hours)
        }
        
        return APIResponse(
            success=True,
            data=usage_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error getting usage analytics", 
                    user_id=auth_user.user_id,
                    time_range=time_range,
                    error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

# Helper functions for analytics data aggregation

async def _get_connection_analytics(user_id: str, hours: int) -> Dict[str, Any]:
    """Get connection analytics for user"""
    try:
        if not connection_manager:
            return {}
            
        user_connections = await connection_manager.get_user_connections(user_id)
        
        # Aggregate connection data
        total_connections = len(user_connections)
        active_connections = len([c for c in user_connections if c["status"] == "healthy"])
        
        deployment_breakdown = {}
        for connection in user_connections:
            deployment = connection["deployment_mode"]
            if deployment not in deployment_breakdown:
                deployment_breakdown[deployment] = 0
            deployment_breakdown[deployment] += 1
            
        return {
            "total_connections": total_connections,
            "active_connections": active_connections,
            "deployment_breakdown": deployment_breakdown,
            "avg_uptime_hours": sum(c.get("uptime_seconds", 0) for c in user_connections) / 3600 / max(1, total_connections)
        }
        
    except Exception as e:
        logger.error("Error getting connection analytics", user_id=user_id, error=str(e))
        return {}

async def _get_message_analytics(user_id: str, hours: int) -> Dict[str, Any]:
    """Get message analytics for user"""
    try:
        if not message_router:
            return {}
            
        # Get message history
        messages = await message_router.get_user_message_history(user_id, limit=1000)
        
        # Filter by time range
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
        recent_messages = [
            msg for msg in messages
            if datetime.fromisoformat(msg.get("timestamp", "").replace("Z", "+00:00")) > cutoff_time
        ]
        
        # Aggregate message data
        total_messages = len(recent_messages)
        message_types = {}
        
        for message in recent_messages:
            msg_type = message.get("message_type", "unknown")
            if msg_type not in message_types:
                message_types[msg_type] = 0
            message_types[msg_type] += 1
            
        return {
            "total_messages": total_messages,
            "message_types": message_types,
            "avg_messages_per_hour": total_messages / max(1, hours)
        }
        
    except Exception as e:
        logger.error("Error getting message analytics", user_id=user_id, error=str(e))
        return {}

async def _get_sync_analytics(user_id: str, hours: int) -> Dict[str, Any]:
    """Get sync analytics for user"""
    try:
        if not data_sync:
            return {}
            
        sync_status = await data_sync.get_sync_status(user_id)
        sync_statuses = sync_status.get("sync_statuses", {})
        
        # Filter by time range
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
        recent_syncs = []
        
        for sync_id, status in sync_statuses.items():
            created_at = datetime.fromisoformat(status.get("created_at", "").replace("Z", "+00:00"))
            if created_at > cutoff_time:
                recent_syncs.append(status)
                
        # Aggregate sync data
        total_syncs = len(recent_syncs)
        successful_syncs = len([s for s in recent_syncs if s.get("status") == "completed"])
        failed_syncs = len([s for s in recent_syncs if s.get("status") == "failed"])
        
        sync_types = {}
        for sync in recent_syncs:
            sync_type = sync.get("sync_type", "unknown")
            if sync_type not in sync_types:
                sync_types[sync_type] = 0
            sync_types[sync_type] += 1
            
        return {
            "total_syncs": total_syncs,
            "successful_syncs": successful_syncs,
            "failed_syncs": failed_syncs,
            "success_rate": successful_syncs / max(1, total_syncs),
            "sync_types": sync_types
        }
        
    except Exception as e:
        logger.error("Error getting sync analytics", user_id=user_id, error=str(e))
        return {}

async def _get_deployment_analytics(user_id: str, hours: int) -> Dict[str, Any]:
    """Get deployment mode usage analytics"""
    try:
        if not websocket_hub:
            return {}
            
        user_connections = websocket_hub.user_connections.get(user_id, set())
        
        deployment_usage = {
            "web_app": 0,
            "browser_extension": 0,
            "local_installation": 0
        }
        
        for connection_id in user_connections:
            connection = websocket_hub.connections.get(connection_id)
            if connection:
                deployment_usage[connection.deployment_mode] += 1
                
        return deployment_usage
        
    except Exception as e:
        logger.error("Error getting deployment analytics", user_id=user_id, error=str(e))
        return {}

# Additional helper functions would be implemented similarly...

async def _get_detailed_connection_analytics(user_id: str, deployment_mode: Optional[str], hours: int) -> Dict[str, Any]:
    """Get detailed connection analytics"""
    # Implementation would provide detailed connection metrics
    return {"placeholder": "detailed_connection_analytics"}

async def _get_detailed_message_analytics(user_id: str, message_type: Optional[str], hours: int) -> Dict[str, Any]:
    """Get detailed message analytics"""
    # Implementation would provide detailed message metrics
    return {"placeholder": "detailed_message_analytics"}

async def _get_detailed_sync_analytics(user_id: str, sync_type: Optional[str], hours: int) -> Dict[str, Any]:
    """Get detailed sync analytics"""
    # Implementation would provide detailed sync metrics
    return {"placeholder": "detailed_sync_analytics"}

async def _get_deployment_usage_analytics(user_id: str, hours: int) -> Dict[str, Any]:
    """Get deployment usage analytics"""
    # Implementation would provide deployment usage metrics
    return {"placeholder": "deployment_usage_analytics"}

async def _get_activity_timeline(user_id: str, hours: int) -> List[Dict[str, Any]]:
    """Get activity timeline"""
    # Implementation would provide activity timeline
    return [{"placeholder": "activity_timeline"}]

async def _get_feature_usage_analytics(user_id: str, hours: int) -> Dict[str, Any]:
    """Get feature usage analytics"""
    # Implementation would provide feature usage metrics
    return {"placeholder": "feature_usage_analytics"}
