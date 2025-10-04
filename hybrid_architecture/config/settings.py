"""Configuration settings for the Hybrid Architecture System."""

import os
from typing import Dict, Any
from pydantic import BaseSettings

class Settings(BaseSettings):
    """Application settings."""
    
    # Server configuration
    host: str = "0.0.0.0"
    port: int = 8888
    debug: bool = False
    
    # WebSocket configuration
    websocket_heartbeat_interval: int = 30
    websocket_timeout: int = 300
    max_connections_per_user: int = 5
    
    # Authentication
    jwt_secret: str = "your-jwt-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration: int = 86400  # 24 hours
    
    # Supabase integration
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_key: str = os.getenv("SUPABASE_ANON_KEY", "")
    supabase_service_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # Redis configuration (optional, fallback to memory)
    redis_url: str = "redis://localhost:6379/0"
    use_redis: bool = False
    
    # CORS settings
    allowed_origins: list = [
        "https://*.space.minimax.io",
        "http://localhost:3000",
        "http://localhost:5173",
        "chrome-extension://*",
        "moz-extension://*"
    ]
    
    # Deployment modes
    deployment_modes: Dict[str, Dict[str, Any]] = {
        "web": {
            "name": "Web Application",
            "url": "https://ncczq77atgsg.space.minimax.io",
            "websocket_endpoint": "/ws",
            "api_endpoint": "/api/v1"
        },
        "extension": {
            "name": "Browser Extension",
            "manifest_version": 3,
            "supported_browsers": ["chrome", "firefox", "edge"]
        },
        "local": {
            "name": "Local Installation",
            "default_port": 8889,
            "electron_app": True
        },
        "hybrid": {
            "name": "Hybrid Mode",
            "description": "All modes working together",
            "sync_interval": 30
        }
    }
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()