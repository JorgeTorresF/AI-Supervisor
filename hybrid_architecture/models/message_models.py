from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime

class Message(BaseModel):
    """Message model for routing"""
    id: str
    user_id: str
    message_type: str
    content: Dict[str, Any]
    timestamp: datetime
    source_deployment: Optional[str] = None
    target_deployment: Optional[str] = None
    target_user: Optional[str] = None

class MessageRoute(BaseModel):
    """Message routing information"""
    message_id: str
    source_connection: str
    target_connections: list[str]
    routing_type: str
    timestamp: datetime

class MessageType:
    """Message type constants for routing"""
    TASK_UPDATE = "task_update"
    SETTINGS_CHANGE = "settings_change"
    USER_ACTIVITY = "user_activity"
    SYNC_REQUEST = "sync_request"
    NOTIFICATION = "notification"
    BROADCAST = "broadcast"
    DIRECT = "direct"
