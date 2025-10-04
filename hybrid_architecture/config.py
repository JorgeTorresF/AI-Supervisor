from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    # Server Configuration
    server_host: str = "0.0.0.0"
    server_port: int = 8000
    debug: bool = False
    environment: str = "development"
    
    # Security
    jwt_secret_key: str = "your-super-secret-jwt-key-here"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    
    # Redis Configuration
    redis_url: str = "redis://localhost:6379/0"
    redis_password: Optional[str] = None
    
    # Supabase Configuration
    supabase_url: str = "https://your-project.supabase.co"
    supabase_anon_key: str = "your-anon-key"
    supabase_service_key: str = "your-service-key"
    
    # Database Configuration
    database_url: str = "postgresql://user:password@localhost:5432/hybrid_gateway"
    
    # WebSocket Configuration
    ws_max_connections: int = 1000
    ws_heartbeat_interval: int = 30
    ws_connection_timeout: int = 60
    
    # API Rate Limiting
    rate_limit_per_minute: int = 60
    rate_limit_burst: int = 10
    
    # Logging
    log_level: str = "INFO"
    log_format: str = "json"
    
    # Monitoring
    metrics_enabled: bool = True
    metrics_port: int = 9090
    
    # CORS Settings
    allowed_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "chrome-extension://"
    ]
    allowed_methods: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allowed_headers: List[str] = ["*"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Global settings instance
settings = Settings()
