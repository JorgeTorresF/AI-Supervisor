from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime

class UserInfo(BaseModel):
    """User information from authentication"""
    user_id: str
    email: str
    expires_at: datetime
    metadata: Optional[Dict[str, Any]] = None

class TokenInfo(BaseModel):
    """JWT token information"""
    token: str
    user_id: str
    expires_at: datetime
    deployment_mode: str

class AuthRequest(BaseModel):
    """Authentication request"""
    deployment_mode: str
    credentials: Dict[str, Any]

class RefreshTokenRequest(BaseModel):
    """Token refresh request"""
    token: str
