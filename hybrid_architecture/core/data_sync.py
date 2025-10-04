from typing import Dict, List, Optional, Any
import structlog
import asyncio
import json
from datetime import datetime, timezone
import uuid

from ..models.sync_models import SyncRequest, SyncStatus, SyncData
from ..utils.redis_client import RedisClient
from ..utils.supabase_client import SupabaseClient

logger = structlog.get_logger()

class DataSyncEngine:
    """Synchronizes settings, tasks, and activities across all deployment modes"""
    
    def __init__(self):
        self.redis_client = None
        self.supabase_client = None
        self.websocket_hub = None
        self.sync_queue: Dict[str, List[SyncRequest]] = {}
        self.sync_status: Dict[str, SyncStatus] = {}
        self.sync_handlers = {}
        self._sync_task = None
        
    async def initialize(self):
        """Initialize the data sync engine"""
        self.redis_client = RedisClient()
        await self.redis_client.connect()
        
        self.supabase_client = SupabaseClient()
        await self.supabase_client.initialize()
        
        # Register sync handlers
        self._register_sync_handlers()
        
        # Start sync processing task
        self._sync_task = asyncio.create_task(self._sync_processing_loop())
        
        logger.info("Data Sync Engine initialized")
        
    async def cleanup(self):
        """Cleanup resources"""
        if self._sync_task:
            self._sync_task.cancel()
            
        if self.redis_client:
            await self.redis_client.disconnect()
            
        if self.supabase_client:
            await self.supabase_client.cleanup()
            
        logger.info("Data Sync Engine cleaned up")
        
    def _register_sync_handlers(self):
        """Register handlers for different sync types"""
        self.sync_handlers = {
            "settings": self._sync_settings,
            "tasks": self._sync_tasks,
            "activities": self._sync_activities,
            "configurations": self._sync_configurations,
            "user_preferences": self._sync_user_preferences,
            "full_sync": self._full_sync
        }
        
    async def trigger_sync(
        self, 
        user_id: str, 
        sync_type: str, 
        deployment_mode: str,
        data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Trigger data synchronization"""
        sync_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc)
        
        # Create sync request
        sync_request = SyncRequest(
            sync_id=sync_id,
            user_id=user_id,
            sync_type=sync_type,
            deployment_mode=deployment_mode,
            data=data or {},
            timestamp=timestamp
        )
        
        # Add to sync queue
        if user_id not in self.sync_queue:
            self.sync_queue[user_id] = []
            
        self.sync_queue[user_id].append(sync_request)
        
        # Update sync status
        self.sync_status[sync_id] = SyncStatus(
            sync_id=sync_id,
            user_id=user_id,
            status="queued",
            sync_type=sync_type,
            created_at=timestamp,
            updated_at=timestamp
        )
        
        logger.info("Sync triggered", 
                   sync_id=sync_id,
                   user_id=user_id,
                   sync_type=sync_type,
                   deployment_mode=deployment_mode)
                   
        return {
            "sync_id": sync_id,
            "status": "queued",
            "timestamp": timestamp.isoformat()
        }
        
    async def _sync_processing_loop(self):
        """Process sync requests from queue"""
        while True:
            try:
                await asyncio.sleep(1)  # Process every second
                
                # Process sync queue for each user
                for user_id in list(self.sync_queue.keys()):
                    user_queue = self.sync_queue[user_id]
                    if user_queue:
                        sync_request = user_queue.pop(0)
                        await self._process_sync_request(sync_request)
                        
                        # Remove empty queues
                        if not user_queue:
                            del self.sync_queue[user_id]
                            
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Error in sync processing loop", error=str(e))
                await asyncio.sleep(5)  # Wait before retrying
                
    async def _process_sync_request(self, sync_request: SyncRequest):
        """Process individual sync request"""
        sync_id = sync_request.sync_id
        
        try:
            # Update status to processing
            if sync_id in self.sync_status:
                self.sync_status[sync_id].status = "processing"
                self.sync_status[sync_id].updated_at = datetime.now(timezone.utc)
                
            # Get sync handler
            handler = self.sync_handlers.get(sync_request.sync_type)
            if not handler:
                raise Exception(f"No handler found for sync type: {sync_request.sync_type}")
                
            # Execute sync
            result = await handler(sync_request)
            
            # Update status to completed
            if sync_id in self.sync_status:
                self.sync_status[sync_id].status = "completed"
                self.sync_status[sync_id].result = result
                self.sync_status[sync_id].updated_at = datetime.now(timezone.utc)
                
            # Notify other deployment modes
            await self._notify_sync_completion(sync_request, result)
            
            logger.info("Sync completed", 
                       sync_id=sync_id,
                       sync_type=sync_request.sync_type,
                       user_id=sync_request.user_id)
                       
        except Exception as e:
            logger.error("Error processing sync request", 
                        sync_id=sync_id,
                        error=str(e))
                        
            # Update status to failed
            if sync_id in self.sync_status:
                self.sync_status[sync_id].status = "failed"
                self.sync_status[sync_id].error = str(e)
                self.sync_status[sync_id].updated_at = datetime.now(timezone.utc)
                
    async def _sync_settings(self, sync_request: SyncRequest) -> Dict[str, Any]:
        """Sync user settings across deployments"""
        user_id = sync_request.user_id
        
        try:
            if sync_request.data:
                # Update settings
                await self.supabase_client.update_user_settings(
                    user_id, 
                    sync_request.data
                )
                
            # Get latest settings from database
            settings = await self.supabase_client.get_user_settings(user_id)
            
            # Cache in Redis for quick access
            redis_key = f"user_settings:{user_id}"
            await self.redis_client.setex(redis_key, 3600, settings)  # 1 hour cache
            
            return {
                "type": "settings",
                "settings": settings,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error("Error syncing settings", user_id=user_id, error=str(e))
            raise
            
    async def _sync_tasks(self, sync_request: SyncRequest) -> Dict[str, Any]:
        """Sync user tasks across deployments"""
        user_id = sync_request.user_id
        
        try:
            if sync_request.data:
                # Update or create tasks
                tasks_data = sync_request.data.get("tasks", [])
                for task_data in tasks_data:
                    await self.supabase_client.upsert_task(user_id, task_data)
                    
            # Get latest tasks from database
            tasks = await self.supabase_client.get_user_tasks(user_id)
            
            # Cache in Redis
            redis_key = f"user_tasks:{user_id}"
            await self.redis_client.setex(redis_key, 1800, tasks)  # 30 minute cache
            
            return {
                "type": "tasks",
                "tasks": tasks,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error("Error syncing tasks", user_id=user_id, error=str(e))
            raise
            
    async def _sync_activities(self, sync_request: SyncRequest) -> Dict[str, Any]:
        """Sync user activities across deployments"""
        user_id = sync_request.user_id
        
        try:
            if sync_request.data:
                # Add new activities
                activities_data = sync_request.data.get("activities", [])
                for activity_data in activities_data:
                    await self.supabase_client.insert_activity(user_id, activity_data)
                    
            # Get recent activities from database
            activities = await self.supabase_client.get_user_activities(
                user_id, 
                limit=100
            )
            
            # Cache in Redis
            redis_key = f"user_activities:{user_id}"
            await self.redis_client.setex(redis_key, 900, activities)  # 15 minute cache
            
            return {
                "type": "activities",
                "activities": activities,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error("Error syncing activities", user_id=user_id, error=str(e))
            raise
            
    async def _sync_configurations(self, sync_request: SyncRequest) -> Dict[str, Any]:
        """Sync deployment-specific configurations"""
        user_id = sync_request.user_id
        deployment_mode = sync_request.deployment_mode
        
        try:
            if sync_request.data:
                # Update configuration for specific deployment
                await self.supabase_client.update_deployment_config(
                    user_id,
                    deployment_mode,
                    sync_request.data
                )
                
            # Get all deployment configurations
            configs = await self.supabase_client.get_deployment_configs(user_id)
            
            # Cache in Redis
            redis_key = f"deployment_configs:{user_id}"
            await self.redis_client.setex(redis_key, 3600, configs)  # 1 hour cache
            
            return {
                "type": "configurations",
                "configurations": configs,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error("Error syncing configurations", 
                        user_id=user_id,
                        deployment_mode=deployment_mode,
                        error=str(e))
            raise
            
    async def _sync_user_preferences(self, sync_request: SyncRequest) -> Dict[str, Any]:
        """Sync user preferences across deployments"""
        user_id = sync_request.user_id
        
        try:
            if sync_request.data:
                # Update preferences
                await self.supabase_client.update_user_preferences(
                    user_id,
                    sync_request.data
                )
                
            # Get latest preferences
            preferences = await self.supabase_client.get_user_preferences(user_id)
            
            # Cache in Redis
            redis_key = f"user_preferences:{user_id}"
            await self.redis_client.setex(redis_key, 3600, preferences)  # 1 hour cache
            
            return {
                "type": "user_preferences",
                "preferences": preferences,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error("Error syncing user preferences", user_id=user_id, error=str(e))
            raise
            
    async def _full_sync(self, sync_request: SyncRequest) -> Dict[str, Any]:
        """Perform full synchronization of all user data"""
        user_id = sync_request.user_id
        
        try:
            # Sync all data types
            results = {}
            
            # Settings
            settings_request = SyncRequest(
                sync_id=f"{sync_request.sync_id}_settings",
                user_id=user_id,
                sync_type="settings",
                deployment_mode=sync_request.deployment_mode,
                data=sync_request.data.get("settings"),
                timestamp=sync_request.timestamp
            )
            results["settings"] = await self._sync_settings(settings_request)
            
            # Tasks
            tasks_request = SyncRequest(
                sync_id=f"{sync_request.sync_id}_tasks",
                user_id=user_id,
                sync_type="tasks",
                deployment_mode=sync_request.deployment_mode,
                data=sync_request.data.get("tasks"),
                timestamp=sync_request.timestamp
            )
            results["tasks"] = await self._sync_tasks(tasks_request)
            
            # Activities
            activities_request = SyncRequest(
                sync_id=f"{sync_request.sync_id}_activities",
                user_id=user_id,
                sync_type="activities",
                deployment_mode=sync_request.deployment_mode,
                data=sync_request.data.get("activities"),
                timestamp=sync_request.timestamp
            )
            results["activities"] = await self._sync_activities(activities_request)
            
            # Configurations
            configs_request = SyncRequest(
                sync_id=f"{sync_request.sync_id}_configurations",
                user_id=user_id,
                sync_type="configurations",
                deployment_mode=sync_request.deployment_mode,
                data=sync_request.data.get("configurations"),
                timestamp=sync_request.timestamp
            )
            results["configurations"] = await self._sync_configurations(configs_request)
            
            # User preferences
            prefs_request = SyncRequest(
                sync_id=f"{sync_request.sync_id}_preferences",
                user_id=user_id,
                sync_type="user_preferences",
                deployment_mode=sync_request.deployment_mode,
                data=sync_request.data.get("preferences"),
                timestamp=sync_request.timestamp
            )
            results["preferences"] = await self._sync_user_preferences(prefs_request)
            
            return {
                "type": "full_sync",
                "results": results,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error("Error performing full sync", user_id=user_id, error=str(e))
            raise
            
    async def _notify_sync_completion(self, sync_request: SyncRequest, result: Dict[str, Any]):
        """Notify other deployment modes of sync completion"""
        if not self.websocket_hub:
            return
            
        notification = {
            "type": "sync_completed",
            "sync_id": sync_request.sync_id,
            "sync_type": sync_request.sync_type,
            "source_deployment": sync_request.deployment_mode,
            "result": result,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Broadcast to all user's connections except the source deployment
        user_connections = self.websocket_hub.user_connections.get(sync_request.user_id, set())
        for connection_id in user_connections:
            connection = self.websocket_hub.connections.get(connection_id)
            if connection and connection.deployment_mode != sync_request.deployment_mode:
                await self.websocket_hub._send_to_connection(connection_id, notification)
                
    async def get_sync_status(self, user_id: str) -> Dict[str, Any]:
        """Get synchronization status for user"""
        user_statuses = {
            sync_id: {
                "sync_id": status.sync_id,
                "status": status.status,
                "sync_type": status.sync_type,
                "created_at": status.created_at.isoformat(),
                "updated_at": status.updated_at.isoformat(),
                "error": status.error
            }
            for sync_id, status in self.sync_status.items()
            if status.user_id == user_id
        }
        
        return {
            "user_id": user_id,
            "sync_statuses": user_statuses,
            "queued_syncs": len(self.sync_queue.get(user_id, [])),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    def set_websocket_hub(self, websocket_hub):
        """Set reference to WebSocket hub for notifications"""
        self.websocket_hub = websocket_hub
        
    def get_sync_stats(self) -> Dict[str, Any]:
        """Get synchronization statistics"""
        total_syncs = len(self.sync_status)
        completed_syncs = len([s for s in self.sync_status.values() if s.status == "completed"])
        failed_syncs = len([s for s in self.sync_status.values() if s.status == "failed"])
        queued_syncs = sum(len(queue) for queue in self.sync_queue.values())
        
        stats = {
            "total_syncs": total_syncs,
            "completed_syncs": completed_syncs,
            "failed_syncs": failed_syncs,
            "success_rate": completed_syncs / total_syncs if total_syncs > 0 else 0,
            "queued_syncs": queued_syncs,
            "sync_types_supported": list(self.sync_handlers.keys())
        }
        
        return stats
