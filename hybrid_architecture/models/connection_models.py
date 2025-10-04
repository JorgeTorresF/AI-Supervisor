from pydantic import BaseModel
from typing import Optional, Any, Dict, List
from datetime import datetime

class ConnectionMetrics(BaseModel):
    """Connection metrics tracking"""
    connection_id: str
    deployment_mode: str
    user_id: str
    connected_at: datetime
    last_activity: datetime
    messages_sent: int
    messages_received: int
    reconnect_count: int
    disconnected_at: Optional[datetime] = None

class ConnectionHealth(BaseModel):
    """Connection health status"""
    connection_id: str
    status: str  # healthy, degraded, unhealthy, stale
    last_heartbeat: datetime
    latency_ms: float
    error_count: int
    last_error: Optional[str] = None

class ReconnectAttempt(BaseModel):
    """Reconnection attempt record"""
    connection_id: str
    attempt_time: datetime
    success: bool
    error: Optional[str] = None
    new_connection_id: Optional[str] = None
