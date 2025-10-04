from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime

class SyncRequest(BaseModel):
    """Data synchronization request"""
    sync_id: str
    user_id: str
    sync_type: str
    deployment_mode: str
    data: Optional[Dict[str, Any]] = None
    timestamp: datetime

class SyncStatus(BaseModel):
    """Synchronization status"""
    sync_id: str
    user_id: str
    status: str  # queued, processing, completed, failed
    sync_type: str
    created_at: datetime
    updated_at: datetime
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class SyncData(BaseModel):
    """Data structure for synchronization"""
    data_type: str
    data: Dict[str, Any]
    version: str
    last_modified: datetime
    user_id: str

class SyncTypes:
    """Synchronization type constants"""
    SETTINGS = "settings"
    TASKS = "tasks"
    ACTIVITIES = "activities"
    CONFIGURATIONS = "configurations"
    USER_PREFERENCES = "user_preferences"
    FULL_SYNC = "full_sync"
