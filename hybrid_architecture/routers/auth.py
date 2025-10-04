from fastapi import APIRouter, HTTPException, Depends, Request
from ..models.api_models import APIResponse
from ..core.auth_bridge import AuthBridge
from ..models.auth_models import AuthRequest, RefreshTokenRequest
from ..middleware.metrics_middleware import record_auth_operation
import structlog

logger = structlog.get_logger()
router = APIRouter()

# This will be injected by the main app
auth_bridge: AuthBridge = None

def set_auth_bridge(bridge: AuthBridge):
    """Set the auth bridge instance"""
    global auth_bridge
    auth_bridge = bridge

@router.post("/login")
async def login(request: AuthRequest):
    """Authenticate user for specific deployment mode"""
    try:
        if not auth_bridge:
            raise HTTPException(status_code=500, detail="Auth bridge not initialized")
            
        token_info = await auth_bridge.authenticate_deployment(
            deployment_mode=request.deployment_mode,
            credentials=request.credentials
        )
        
        if not token_info:
            record_auth_operation("login", request.deployment_mode, "failed")
            raise HTTPException(status_code=401, detail="Authentication failed")
            
        record_auth_operation("login", request.deployment_mode, "success")
        
        return APIResponse(
            success=True,
            data={
                "token": token_info.token,
                "user_id": token_info.user_id,
                "expires_at": token_info.expires_at.isoformat(),
                "deployment_mode": token_info.deployment_mode
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Login error", 
                    deployment_mode=request.deployment_mode,
                    error=str(e))
        record_auth_operation("login", request.deployment_mode, "error")
        raise HTTPException(status_code=500, detail=str(e))
        
@router.post("/refresh")
async def refresh_token(request: RefreshTokenRequest):
    """Refresh JWT token"""
    try:
        if not auth_bridge:
            raise HTTPException(status_code=500, detail="Auth bridge not initialized")
            
        new_token_info = await auth_bridge.refresh_token(request.token)
        
        if not new_token_info:
            record_auth_operation("refresh", "unknown", "failed")
            raise HTTPException(status_code=401, detail="Token refresh failed")
            
        record_auth_operation("refresh", new_token_info.deployment_mode, "success")
        
        return APIResponse(
            success=True,
            data={
                "token": new_token_info.token,
                "user_id": new_token_info.user_id,
                "expires_at": new_token_info.expires_at.isoformat(),
                "deployment_mode": new_token_info.deployment_mode
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Token refresh error", error=str(e))
        record_auth_operation("refresh", "unknown", "error")
        raise HTTPException(status_code=500, detail=str(e))
        
@router.post("/logout")
async def logout(request: Request):
    """Revoke JWT token"""
    try:
        if not auth_bridge:
            raise HTTPException(status_code=500, detail="Auth bridge not initialized")
            
        # Get token from header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Authorization header required")
            
        token = auth_header[7:]  # Remove "Bearer " prefix
        
        success = await auth_bridge.revoke_token(token)
        
        if success:
            record_auth_operation("logout", "unknown", "success")
            return APIResponse(
                success=True,
                data={"message": "Token revoked successfully"}
            )
        else:
            record_auth_operation("logout", "unknown", "failed")
            raise HTTPException(status_code=400, detail="Token revocation failed")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Logout error", error=str(e))
        record_auth_operation("logout", "unknown", "error")
        raise HTTPException(status_code=500, detail=str(e))
        
@router.get("/validate")
async def validate_token(request: Request):
    """Validate JWT token"""
    try:
        if not auth_bridge:
            raise HTTPException(status_code=500, detail="Auth bridge not initialized")
            
        # Get token from header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Authorization header required")
            
        token = auth_header[7:]  # Remove "Bearer " prefix
        
        user_info = await auth_bridge.validate_token(token)
        
        if not user_info:
            record_auth_operation("validate", "unknown", "failed")
            raise HTTPException(status_code=401, detail="Invalid token")
            
        record_auth_operation("validate", "unknown", "success")
        
        return APIResponse(
            success=True,
            data={
                "valid": True,
                "user_id": user_info.user_id,
                "email": user_info.email,
                "expires_at": user_info.expires_at.isoformat()
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Token validation error", error=str(e))
        record_auth_operation("validate", "unknown", "error")
        raise HTTPException(status_code=500, detail=str(e))
        
@router.get("/stats")
async def get_auth_stats():
    """Get authentication statistics"""
    try:
        if not auth_bridge:
            raise HTTPException(status_code=500, detail="Auth bridge not initialized")
            
        stats = auth_bridge.get_auth_stats()
        
        return APIResponse(
            success=True,
            data=stats
        )
        
    except Exception as e:
        logger.error("Error getting auth stats", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
