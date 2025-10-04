from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Optional
from ..models.api_models import APIResponse, SyncRequest
from ..core.data_sync import DataSyncEngine
from ..core.auth_bridge import AuthBridge
from ..middleware.metrics_middleware import record_sync_operation
import structlog

logger = structlog.get_logger()
router = APIRouter()

# These will be injected by the main app
data_sync: DataSyncEngine = None
auth_bridge: AuthBridge = None

def set_dependencies(sync_engine: DataSyncEngine, auth_bridge_instance: AuthBridge):
    """Set the required dependencies"""
    global data_sync, auth_bridge
    data_sync = sync_engine
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

@router.post("/trigger")
async def trigger_sync(
    request: SyncRequest,
    auth_user=Depends(get_authenticated_user)
):
    """Trigger data synchronization"""
    try:
        if not data_sync:
            raise HTTPException(status_code=500, detail="Data sync engine not initialized")
            
        result = await data_sync.trigger_sync(
            user_id=auth_user.user_id,
            sync_type=request.sync_type,
            deployment_mode=request.deployment_mode,
            data=request.data
        )
        
        record_sync_operation(request.sync_type, "triggered")
        
        return APIResponse(
            success=True,
            data=result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Sync trigger error", 
                    sync_type=request.sync_type,
                    user_id=auth_user.user_id,
                    error=str(e))
        record_sync_operation(request.sync_type, "error")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_sync_status(
    auth_user=Depends(get_authenticated_user)
):
    """Get synchronization status for user"""
    try:
        if not data_sync:
            raise HTTPException(status_code=500, detail="Data sync engine not initialized")
            
        status = await data_sync.get_sync_status(auth_user.user_id)
        
        return APIResponse(
            success=True,
            data=status
        )
        
    except Exception as e:
        logger.error("Error getting sync status", 
                    user_id=auth_user.user_id,
                    error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/settings")
async def sync_settings(
    settings_data: dict,
    deployment_mode: str,
    auth_user=Depends(get_authenticated_user)
):
    """Sync user settings"""
    try:
        if not data_sync:
            raise HTTPException(status_code=500, detail="Data sync engine not initialized")
            
        result = await data_sync.trigger_sync(
            user_id=auth_user.user_id,
            sync_type="settings",
            deployment_mode=deployment_mode,
            data=settings_data
        )
        
        record_sync_operation("settings", "completed")
        
        return APIResponse(
            success=True,
            data=result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Settings sync error", 
                    user_id=auth_user.user_id,
                    error=str(e))
        record_sync_operation("settings", "error")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tasks")
async def sync_tasks(
    tasks_data: dict,
    deployment_mode: str,
    auth_user=Depends(get_authenticated_user)
):
    """Sync user tasks"""
    try:
        if not data_sync:
            raise HTTPException(status_code=500, detail="Data sync engine not initialized")
            
        result = await data_sync.trigger_sync(
            user_id=auth_user.user_id,
            sync_type="tasks",
            deployment_mode=deployment_mode,
            data=tasks_data
        )
        
        record_sync_operation("tasks", "completed")
        
        return APIResponse(
            success=True,
            data=result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Tasks sync error", 
                    user_id=auth_user.user_id,
                    error=str(e))
        record_sync_operation("tasks", "error")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/activities")
async def sync_activities(
    activities_data: dict,
    deployment_mode: str,
    auth_user=Depends(get_authenticated_user)
):
    """Sync user activities"""
    try:
        if not data_sync:
            raise HTTPException(status_code=500, detail="Data sync engine not initialized")
            
        result = await data_sync.trigger_sync(
            user_id=auth_user.user_id,
            sync_type="activities",
            deployment_mode=deployment_mode,
            data=activities_data
        )
        
        record_sync_operation("activities", "completed")
        
        return APIResponse(
            success=True,
            data=result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Activities sync error", 
                    user_id=auth_user.user_id,
                    error=str(e))
        record_sync_operation("activities", "error")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/full")
async def full_sync(
    sync_data: dict,
    deployment_mode: str,
    auth_user=Depends(get_authenticated_user)
):
    """Perform full data synchronization"""
    try:
        if not data_sync:
            raise HTTPException(status_code=500, detail="Data sync engine not initialized")
            
        result = await data_sync.trigger_sync(
            user_id=auth_user.user_id,
            sync_type="full_sync",
            deployment_mode=deployment_mode,
            data=sync_data
        )
        
        record_sync_operation("full_sync", "completed")
        
        return APIResponse(
            success=True,
            data=result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Full sync error", 
                    user_id=auth_user.user_id,
                    error=str(e))
        record_sync_operation("full_sync", "error")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_sync_stats():
    """Get synchronization statistics"""
    try:
        if not data_sync:
            raise HTTPException(status_code=500, detail="Data sync engine not initialized")
            
        stats = data_sync.get_sync_stats()
        
        return APIResponse(
            success=True,
            data=stats
        )
        
    except Exception as e:
        logger.error("Error getting sync stats", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
