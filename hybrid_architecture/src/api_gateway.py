"""API Gateway for cross-deployment communication."""

import uuid
from typing import Dict, List, Optional, Any
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
import jwt

from ..config.settings import settings
from .websocket_hub import hub

router = APIRouter(prefix="/api/v1")

class DeploymentStatus(BaseModel):
    """Deployment mode status."""
    mode: str
    active: bool
    connections: int
    last_activity: Optional[str]
    version: str = "1.0.0"

class SyncRequest(BaseModel):
    """Data synchronization request."""
    source_mode: str
    target_modes: List[str]
    data_types: List[str]  # settings, tasks, activities, interventions
    
class MessageRequest(BaseModel):
    """Cross-deployment message."""
    type: str
    target_mode: Optional[str]
    payload: Dict[str, Any]

class AuthResponse(BaseModel):
    """Authentication response."""
    token: str
    expires_at: str
    user_id: str

def verify_token(authorization: str = Header(...)):
    """Verify JWT token from header."""
    try:
        # Extract token from "Bearer <token>" format
        token = authorization.split(" ")[1] if " " in authorization else authorization
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return payload.get('sub')
    except (jwt.InvalidTokenError, IndexError):
        raise HTTPException(status_code=401, detail="Invalid authentication token")

@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "Hybrid Architecture Gateway",
        "version": "1.0.0"
    }

@router.get("/status")
async def get_system_status(user_id: str = Depends(verify_token)):
    """Get overall system status across all deployment modes."""
    
    # Get connection stats from WebSocket hub
    connection_stats = hub.get_connection_stats()
    
    # Check which deployment modes are active for this user
    user_connections = hub.connections.get(user_id, {})
    active_modes = [conn.deployment_mode for conn in user_connections.values()]
    
    deployment_statuses = []
    
    # Web application status
    web_active = "web" in active_modes
    deployment_statuses.append(DeploymentStatus(
        mode="web",
        active=web_active,
        connections=len([c for c in user_connections.values() if c.deployment_mode == "web"]),
        last_activity=datetime.now().isoformat() if web_active else None
    ))
    
    # Browser extension status
    extension_active = "extension" in active_modes
    deployment_statuses.append(DeploymentStatus(
        mode="extension",
        active=extension_active,
        connections=len([c for c in user_connections.values() if c.deployment_mode == "extension"]),
        last_activity=datetime.now().isoformat() if extension_active else None
    ))
    
    # Local installation status
    local_active = "local" in active_modes
    deployment_statuses.append(DeploymentStatus(
        mode="local",
        active=local_active,
        connections=len([c for c in user_connections.values() if c.deployment_mode == "local"]),
        last_activity=datetime.now().isoformat() if local_active else None
    ))
    
    # Hybrid mode (active when multiple modes are connected)
    hybrid_active = len(active_modes) > 1
    deployment_statuses.append(DeploymentStatus(
        mode="hybrid",
        active=hybrid_active,
        connections=len(active_modes),
        last_activity=datetime.now().isoformat() if hybrid_active else None
    ))
    
    return {
        "user_id": user_id,
        "deployments": deployment_statuses,
        "total_connections": len(user_connections),
        "connection_stats": connection_stats,
        "hybrid_mode_enabled": hybrid_active
    }

@router.post("/sync")
async def sync_data(request: SyncRequest, user_id: str = Depends(verify_token)):
    """Synchronize data between deployment modes."""
    
    sync_message = {
        "type": "sync_request",
        "source_mode": request.source_mode,
        "payload": {
            "target_modes": request.target_modes,
            "data_types": request.data_types,
            "sync_id": str(uuid.uuid4())
        }
    }
    
    # Send sync request to target modes
    for target_mode in request.target_modes:
        await hub._send_to_deployment_mode(user_id, target_mode, sync_message)
    
    return {
        "sync_id": sync_message["payload"]["sync_id"],
        "status": "sync_initiated",
        "target_modes": request.target_modes
    }

@router.post("/message")
async def send_message(request: MessageRequest, user_id: str = Depends(verify_token)):
    """Send message across deployment modes."""
    
    message = {
        "type": request.type,
        "source_mode": "api",
        "target_mode": request.target_mode,
        "payload": request.payload,
        "user_id": user_id,
        "message_id": str(uuid.uuid4()),
        "timestamp": datetime.now().isoformat()
    }
    
    if request.target_mode:
        await hub._send_to_deployment_mode(user_id, request.target_mode, message)
    else:
        await hub._broadcast_to_user(user_id, message)
    
    return {
        "message_id": message["message_id"],
        "status": "sent",
        "target_mode": request.target_mode or "all"
    }

@router.get("/connections")
async def get_user_connections(user_id: str = Depends(verify_token)):
    """Get user's active connections."""
    
    user_connections = hub.connections.get(user_id, {})
    
    connections = []
    for connection_id, connection in user_connections.items():
        connections.append({
            "connection_id": connection_id,
            "deployment_mode": connection.deployment_mode,
            "connected_at": connection.connected_at.isoformat(),
            "last_ping": connection.last_ping.isoformat()
        })
    
    return {
        "user_id": user_id,
        "total_connections": len(connections),
        "connections": connections
    }

@router.get("/history")
async def get_message_history(user_id: str = Depends(verify_token), limit: int = 50):
    """Get user's message history."""
    
    history = hub.message_history.get(user_id, [])
    recent_history = history[-limit:] if limit > 0 else history
    
    return {
        "user_id": user_id,
        "total_messages": len(history),
        "messages": [{
            "message_id": msg.message_id,
            "type": msg.type,
            "source_mode": msg.source_mode,
            "target_mode": msg.target_mode,
            "timestamp": msg.timestamp.isoformat(),
            "payload": msg.payload
        } for msg in recent_history]
    }

@router.post("/auth/token")
async def create_auth_token(user_id: str):
    """Create JWT token for cross-deployment authentication."""
    
    # In production, this would validate user credentials
    # For now, we'll create a token for any user_id
    
    payload = {
        "sub": user_id,
        "iat": datetime.now(),
        "exp": datetime.now().timestamp() + settings.jwt_expiration
    }
    
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    
    return AuthResponse(
        token=token,
        expires_at=datetime.fromtimestamp(payload["exp"]).isoformat(),
        user_id=user_id
    )