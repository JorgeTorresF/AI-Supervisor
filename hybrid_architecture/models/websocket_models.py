from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime
from fastapi import WebSocket

class ConnectionInfo(BaseModel):
    """Information about a WebSocket connection"""
    id: str
    websocket: Any  # WebSocket object
    deployment_mode: str
    client_id: str
    user_id: Optional[str] = None
    authenticated: bool = False
    connected_at: datetime
    last_heartbeat: datetime
    
    class Config:
        arbitrary_types_allowed = True

class Message(BaseModel):
    """WebSocket message structure"""
    id: str
    user_id: str
    message_type: str
    content: Dict[str, Any]
    timestamp: datetime
    source_deployment: Optional[str] = None
    target_deployment: Optional[str] = None
    target_user: Optional[str] = None

class MessageType:
    """Message type constants"""
    AUTH = "auth"
    HEARTBEAT = "heartbeat"
    BROADCAST = "broadcast"
    DIRECT = "direct"
    SYNC_REQUEST = "sync_request"
    TASK_UPDATE = "task_update"
    SETTINGS_CHANGE = "settings_change"
    USER_ACTIVITY = "user_activity"
    NOTIFICATION = "notification"
    ERROR = "error"
