from pydantic import BaseModel
from typing import Optional, Any, Dict, List
from datetime import datetime

class APIResponse(BaseModel):
    """Standard API response structure"""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    message: Optional[str] = None
    timestamp: datetime = datetime.utcnow()

class MessageRequest(BaseModel):
    """Request to send a message through the API gateway"""
    message_type: str
    content: Dict[str, Any]
    target_deployment: Optional[str] = None
    target_user: Optional[str] = None

class SyncRequest(BaseModel):
    """Request to trigger data synchronization"""
    sync_type: str
    deployment_mode: str
    data: Optional[Dict[str, Any]] = None

class BroadcastRequest(BaseModel):
    """Request to broadcast a message"""
    message: Dict[str, Any]
    deployment_mode: Optional[str] = None

class ConnectionStatusResponse(BaseModel):
    """Response with connection status information"""
    connection_id: str
    status: str
    deployment_mode: str
    user_id: Optional[str] = None
    connected_at: datetime
    last_activity: datetime
    messages_sent: int
    messages_received: int
