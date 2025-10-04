import httpx
import json
from typing import Dict, List, Optional, Any
import structlog
from ..config import settings

logger = structlog.get_logger()

class SupabaseClient:
    """Supabase client for database operations"""
    
    def __init__(self):
        self.base_url = settings.supabase_url
        self.anon_key = settings.supabase_anon_key
        self.service_key = settings.supabase_service_key
        self.client = None
        
    async def initialize(self):
        """Initialize Supabase client"""
        self.client = httpx.AsyncClient(
            headers={
                "apikey": self.service_key,
                "Authorization": f"Bearer {self.service_key}",
                "Content-Type": "application/json"
            },
            timeout=30.0
        )
        
        logger.info("Supabase client initialized")
        
    async def cleanup(self):
        """Cleanup client"""
        if self.client:
            await self.client.aclose()
            
    async def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user from Supabase auth"""
        try:
            response = await self.client.get(
                f"{self.base_url}/auth/v1/admin/users/{user_id}"
            )
            
            if response.status_code == 200:
                return response.json()
            return None
            
        except Exception as e:
            logger.error("Error getting user from Supabase", user_id=user_id, error=str(e))
            return None
            
    async def validate_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Validate Supabase token"""
        try:
            response = await self.client.get(
                f"{self.base_url}/auth/v1/user",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code == 200:
                return response.json()
            return None
            
        except Exception as e:
            logger.error("Error validating token", error=str(e))
            return None
            
    async def get_user_settings(self, user_id: str) -> Dict[str, Any]:
        """Get user settings from database"""
        try:
            response = await self.client.get(
                f"{self.base_url}/rest/v1/configuration_settings",
                params={"user_id": f"eq.{user_id}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                return data[0] if data else {}
            return {}
            
        except Exception as e:
            logger.error("Error getting user settings", user_id=user_id, error=str(e))
            return {}
            
    async def update_user_settings(self, user_id: str, settings: Dict[str, Any]) -> bool:
        """Update user settings in database"""
        try:
            # Try to update existing settings
            response = await self.client.patch(
                f"{self.base_url}/rest/v1/configuration_settings",
                params={"user_id": f"eq.{user_id}"},
                json=settings
            )
            
            if response.status_code == 204:
                return True
                
            # If no existing settings, create new ones
            if response.status_code == 404:
                create_response = await self.client.post(
                    f"{self.base_url}/rest/v1/configuration_settings",
                    json={"user_id": user_id, **settings}
                )
                return create_response.status_code == 201
                
            return False
            
        except Exception as e:
            logger.error("Error updating user settings", user_id=user_id, error=str(e))
            return False
            
    async def get_user_tasks(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user tasks from database"""
        try:
            response = await self.client.get(
                f"{self.base_url}/rest/v1/agent_tasks",
                params={
                    "user_id": f"eq.{user_id}",
                    "order": "created_at.desc"
                }
            )
            
            if response.status_code == 200:
                return response.json()
            return []
            
        except Exception as e:
            logger.error("Error getting user tasks", user_id=user_id, error=str(e))
            return []
            
    async def upsert_task(self, user_id: str, task_data: Dict[str, Any]) -> bool:
        """Create or update a task"""
        try:
            task_data["user_id"] = user_id
            
            response = await self.client.post(
                f"{self.base_url}/rest/v1/agent_tasks",
                json=task_data,
                headers={"Prefer": "resolution=merge-duplicates"}
            )
            
            return response.status_code in [200, 201, 204]
            
        except Exception as e:
            logger.error("Error upserting task", user_id=user_id, error=str(e))
            return False
            
    async def get_user_activities(self, user_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get user activities from database"""
        try:
            response = await self.client.get(
                f"{self.base_url}/rest/v1/agent_activities",
                params={
                    "user_id": f"eq.{user_id}",
                    "order": "created_at.desc",
                    "limit": limit
                }
            )
            
            if response.status_code == 200:
                return response.json()
            return []
            
        except Exception as e:
            logger.error("Error getting user activities", user_id=user_id, error=str(e))
            return []
            
    async def insert_activity(self, user_id: str, activity_data: Dict[str, Any]) -> bool:
        """Insert new activity record"""
        try:
            activity_data["user_id"] = user_id
            
            response = await self.client.post(
                f"{self.base_url}/rest/v1/agent_activities",
                json=activity_data
            )
            
            return response.status_code == 201
            
        except Exception as e:
            logger.error("Error inserting activity", user_id=user_id, error=str(e))
            return False
            
    async def get_deployment_configs(self, user_id: str) -> Dict[str, Any]:
        """Get deployment-specific configurations"""
        try:
            # This could be stored in a separate table or as JSON in configuration_settings
            response = await self.client.get(
                f"{self.base_url}/rest/v1/configuration_settings",
                params={
                    "user_id": f"eq.{user_id}",
                    "select": "deployment_configs"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return data[0].get("deployment_configs", {}) if data else {}
            return {}
            
        except Exception as e:
            logger.error("Error getting deployment configs", user_id=user_id, error=str(e))
            return {}
            
    async def update_deployment_config(
        self, 
        user_id: str, 
        deployment_mode: str, 
        config: Dict[str, Any]
    ) -> bool:
        """Update deployment-specific configuration"""
        try:
            # Get current configs
            current_configs = await self.get_deployment_configs(user_id)
            current_configs[deployment_mode] = config
            
            # Update the deployment_configs field
            response = await self.client.patch(
                f"{self.base_url}/rest/v1/configuration_settings",
                params={"user_id": f"eq.{user_id}"},
                json={"deployment_configs": current_configs}
            )
            
            return response.status_code == 204
            
        except Exception as e:
            logger.error("Error updating deployment config", 
                        user_id=user_id,
                        deployment_mode=deployment_mode,
                        error=str(e))
            return False
            
    async def get_user_preferences(self, user_id: str) -> Dict[str, Any]:
        """Get user preferences"""
        try:
            response = await self.client.get(
                f"{self.base_url}/rest/v1/configuration_settings",
                params={
                    "user_id": f"eq.{user_id}",
                    "select": "user_preferences"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return data[0].get("user_preferences", {}) if data else {}
            return {}
            
        except Exception as e:
            logger.error("Error getting user preferences", user_id=user_id, error=str(e))
            return {}
            
    async def update_user_preferences(self, user_id: str, preferences: Dict[str, Any]) -> bool:
        """Update user preferences"""
        try:
            response = await self.client.patch(
                f"{self.base_url}/rest/v1/configuration_settings",
                params={"user_id": f"eq.{user_id}"},
                json={"user_preferences": preferences}
            )
            
            return response.status_code == 204
            
        except Exception as e:
            logger.error("Error updating user preferences", user_id=user_id, error=str(e))
            return False
