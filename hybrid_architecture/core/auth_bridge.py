from typing import Dict, List, Optional, Any
import structlog
import jwt
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import httpx

from ..config import settings
from ..models.auth_models import UserInfo, TokenInfo
from ..utils.redis_client import RedisClient
from ..utils.supabase_client import SupabaseClient

logger = structlog.get_logger()

class AuthBridge:
    """Handles authentication across different deployment modes"""
    
    def __init__(self):
        self.redis_client = None
        self.supabase_client = None
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.token_cache: Dict[str, UserInfo] = {}
        
    async def initialize(self):
        """Initialize the authentication bridge"""
        self.redis_client = RedisClient()
        await self.redis_client.connect()
        
        self.supabase_client = SupabaseClient()
        await self.supabase_client.initialize()
        
        logger.info("Auth Bridge initialized")
        
    async def cleanup(self):
        """Cleanup resources"""
        if self.redis_client:
            await self.redis_client.disconnect()
            
        if self.supabase_client:
            await self.supabase_client.cleanup()
            
        logger.info("Auth Bridge cleaned up")
        
    async def validate_token(self, token: str) -> Optional[UserInfo]:
        """Validate JWT token and return user information"""
        try:
            # Check token cache first
            if token in self.token_cache:
                user_info = self.token_cache[token]
                if user_info.expires_at > datetime.now(timezone.utc):
                    return user_info
                else:
                    # Remove expired token from cache
                    del self.token_cache[token]
                    
            # Decode JWT token
            payload = jwt.decode(
                token, 
                settings.jwt_secret_key, 
                algorithms=[settings.jwt_algorithm]
            )
            
            user_id = payload.get("user_id")
            email = payload.get("email")
            expires_at = datetime.fromtimestamp(payload.get("exp", 0), tz=timezone.utc)
            
            if not user_id or expires_at <= datetime.now(timezone.utc):
                return None
                
            # Verify user exists in Supabase
            user_data = await self._verify_user_in_supabase(user_id)
            if not user_data:
                return None
                
            # Create user info
            user_info = UserInfo(
                user_id=user_id,
                email=email,
                expires_at=expires_at,
                metadata=user_data
            )
            
            # Cache the user info
            self.token_cache[token] = user_info
            
            # Also cache in Redis for cross-instance sharing
            await self._cache_user_session(user_id, user_info)
            
            return user_info
            
        except jwt.InvalidTokenError as e:
            logger.warning("Invalid JWT token", error=str(e))
            return None
        except Exception as e:
            logger.error("Error validating token", error=str(e))
            return None
            
    async def _verify_user_in_supabase(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Verify user exists in Supabase and get user data"""
        try:
            # Query Supabase for user
            response = await self.supabase_client.get_user(user_id)
            return response
            
        except Exception as e:
            logger.error("Error verifying user in Supabase", user_id=user_id, error=str(e))
            return None
            
    async def _cache_user_session(self, user_id: str, user_info: UserInfo):
        """Cache user session information"""
        try:
            session_data = {
                "user_id": user_info.user_id,
                "email": user_info.email,
                "expires_at": user_info.expires_at.isoformat(),
                "metadata": user_info.metadata
            }
            
            # Cache in Redis with expiration
            redis_key = f"user_session:{user_id}"
            await self.redis_client.setex(
                redis_key,
                86400,  # 24 hours
                session_data
            )
            
        except Exception as e:
            logger.error("Error caching user session", user_id=user_id, error=str(e))
            
    async def create_token(
        self, 
        user_id: str, 
        email: str, 
        deployment_mode: str,
        expires_in_hours: Optional[int] = None
    ) -> TokenInfo:
        """Create JWT token for user"""
        try:
            expires_in = expires_in_hours or settings.jwt_expiration_hours
            expires_at = datetime.now(timezone.utc) + timedelta(hours=expires_in)
            
            payload = {
                "user_id": user_id,
                "email": email,
                "deployment_mode": deployment_mode,
                "exp": expires_at.timestamp(),
                "iat": datetime.now(timezone.utc).timestamp(),
                "iss": "hybrid-gateway"
            }
            
            token = jwt.encode(
                payload,
                settings.jwt_secret_key,
                algorithm=settings.jwt_algorithm
            )
            
            token_info = TokenInfo(
                token=token,
                user_id=user_id,
                expires_at=expires_at,
                deployment_mode=deployment_mode
            )
            
            # Cache token info
            await self._cache_token_info(token, token_info)
            
            logger.info("Token created", 
                       user_id=user_id,
                       deployment_mode=deployment_mode,
                       expires_at=expires_at.isoformat())
                       
            return token_info
            
        except Exception as e:
            logger.error("Error creating token", user_id=user_id, error=str(e))
            raise
            
    async def _cache_token_info(self, token: str, token_info: TokenInfo):
        """Cache token information"""
        try:
            token_data = {
                "user_id": token_info.user_id,
                "expires_at": token_info.expires_at.isoformat(),
                "deployment_mode": token_info.deployment_mode
            }
            
            # Cache in Redis
            redis_key = f"token_info:{token[-8:]}"  # Use last 8 chars as key
            await self.redis_client.setex(
                redis_key,
                86400,  # 24 hours
                token_data
            )
            
        except Exception as e:
            logger.error("Error caching token info", error=str(e))
            
    async def refresh_token(self, token: str) -> Optional[TokenInfo]:
        """Refresh JWT token"""
        try:
            # Validate current token
            user_info = await self.validate_token(token)
            if not user_info:
                return None
                
            # Create new token with extended expiration
            new_token = await self.create_token(
                user_id=user_info.user_id,
                email=user_info.email,
                deployment_mode="refresh"  # Mark as refreshed token
            )
            
            return new_token
            
        except Exception as e:
            logger.error("Error refreshing token", error=str(e))
            return None
            
    async def revoke_token(self, token: str) -> bool:
        """Revoke JWT token"""
        try:
            # Add token to revocation list in Redis
            redis_key = f"revoked_tokens:{token[-8:]}"
            await self.redis_client.setex(
                redis_key,
                86400 * 7,  # Keep for 7 days
                {"revoked_at": datetime.now(timezone.utc).isoformat()}
            )
            
            # Remove from cache
            self.token_cache.pop(token, None)
            
            logger.info("Token revoked", token_suffix=token[-8:])
            return True
            
        except Exception as e:
            logger.error("Error revoking token", error=str(e))
            return False
            
    async def is_token_revoked(self, token: str) -> bool:
        """Check if token is revoked"""
        try:
            redis_key = f"revoked_tokens:{token[-8:]}"
            revoked_data = await self.redis_client.get(redis_key)
            return revoked_data is not None
            
        except Exception as e:
            logger.error("Error checking token revocation", error=str(e))
            return False
            
    async def authenticate_deployment(
        self, 
        deployment_mode: str, 
        credentials: Dict[str, Any]
    ) -> Optional[TokenInfo]:
        """Authenticate user for specific deployment mode"""
        try:
            if deployment_mode == "web_app":
                return await self._authenticate_web_app(credentials)
            elif deployment_mode == "browser_extension":
                return await self._authenticate_browser_extension(credentials)
            elif deployment_mode == "local_installation":
                return await self._authenticate_local_installation(credentials)
            else:
                logger.warning("Unknown deployment mode", deployment_mode=deployment_mode)
                return None
                
        except Exception as e:
            logger.error("Error authenticating deployment", 
                        deployment_mode=deployment_mode,
                        error=str(e))
            return None
            
    async def _authenticate_web_app(self, credentials: Dict[str, Any]) -> Optional[TokenInfo]:
        """Authenticate web app user"""
        # This would typically validate against Supabase
        token = credentials.get("supabase_token")
        if not token:
            return None
            
        # Validate Supabase token
        user_data = await self.supabase_client.validate_token(token)
        if not user_data:
            return None
            
        # Create gateway token
        return await self.create_token(
            user_id=user_data["id"],
            email=user_data["email"],
            deployment_mode="web_app"
        )
        
    async def _authenticate_browser_extension(self, credentials: Dict[str, Any]) -> Optional[TokenInfo]:
        """Authenticate browser extension user"""
        # Browser extension can use web app token or separate auth
        return await self._authenticate_web_app(credentials)
        
    async def _authenticate_local_installation(self, credentials: Dict[str, Any]) -> Optional[TokenInfo]:
        """Authenticate local installation user"""
        # Local installation might use API key or separate auth
        api_key = credentials.get("api_key")
        if not api_key:
            return None
            
        # Validate API key (this would be implemented based on requirements)
        user_data = await self._validate_api_key(api_key)
        if not user_data:
            return None
            
        return await self.create_token(
            user_id=user_data["user_id"],
            email=user_data["email"],
            deployment_mode="local_installation"
        )
        
    async def _validate_api_key(self, api_key: str) -> Optional[Dict[str, Any]]:
        """Validate API key for local installation"""
        # This would be implemented based on requirements
        # For now, return mock data
        return {
            "user_id": "local_user",
            "email": "local@example.com"
        }
        
    def get_auth_stats(self) -> Dict[str, Any]:
        """Get authentication statistics"""
        stats = {
            "cached_tokens": len(self.token_cache),
            "active_sessions": len([u for u in self.token_cache.values() 
                                  if u.expires_at > datetime.now(timezone.utc)])
        }
        
        return stats
