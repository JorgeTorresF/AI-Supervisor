from typing import Dict, List, Optional, Any
import structlog
import asyncio
import json
from datetime import datetime, timezone
import uuid

from ..models.message_models import Message, MessageType, MessageRoute
from ..utils.redis_client import RedisClient

logger = structlog.get_logger()

class MessageRouter:
    """Routes messages between different deployment modes based on user sessions"""
    
    def __init__(self):
        self.redis_client = None
        self.websocket_hub = None
        self.message_history: Dict[str, List[Message]] = {}
        self.routing_rules: Dict[str, Any] = {}
        
    async def initialize(self):
        """Initialize the message router"""
        self.redis_client = RedisClient()
        await self.redis_client.connect()
        
        # Load routing rules
        await self._load_routing_rules()
        
        logger.info("Message Router initialized")
        
    async def cleanup(self):
        """Cleanup resources"""
        if self.redis_client:
            await self.redis_client.disconnect()
            
        logger.info("Message Router cleaned up")
        
    async def _load_routing_rules(self):
        """Load message routing rules"""
        # Default routing rules
        self.routing_rules = {
            "task_update": {
                "priority": "high",
                "broadcast_to_all": True,
                "persist": True
            },
            "settings_change": {
                "priority": "medium",
                "broadcast_to_all": True,
                "persist": True
            },
            "user_activity": {
                "priority": "low",
                "broadcast_to_all": False,
                "persist": False
            },
            "sync_request": {
                "priority": "high",
                "broadcast_to_all": False,
                "persist": True
            },
            "notification": {
                "priority": "medium",
                "broadcast_to_all": True,
                "persist": True
            }
        }
        
    async def route_message(
        self, 
        user_id: str, 
        message_type: str, 
        content: Dict[str, Any],
        target_deployment: Optional[str] = None,
        target_user: Optional[str] = None,
        source_deployment: Optional[str] = None
    ) -> Dict[str, Any]:
        """Route message based on type and target"""
        message_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc)
        
        # Create message object
        message = Message(
            id=message_id,
            user_id=user_id,
            message_type=message_type,
            content=content,
            timestamp=timestamp,
            source_deployment=source_deployment,
            target_deployment=target_deployment,
            target_user=target_user
        )
        
        # Get routing rules for message type
        rules = self.routing_rules.get(message_type, {
            "priority": "medium",
            "broadcast_to_all": False,
            "persist": True
        })
        
        # Store message if persistence is enabled
        if rules.get("persist", True):
            await self._persist_message(message)
            
        # Route message based on rules
        routing_result = {
            "message_id": message_id,
            "routed_to": [],
            "timestamp": timestamp.isoformat()
        }
        
        if target_user and target_user != user_id:
            # Cross-user message
            await self._route_cross_user_message(message)
            routing_result["routed_to"].append(f"user:{target_user}")
            
        elif rules.get("broadcast_to_all", False):
            # Broadcast to all user's connections
            await self._broadcast_to_user_connections(message)
            routing_result["routed_to"].append(f"user:{user_id}:all")
            
        elif target_deployment:
            # Route to specific deployment mode
            await self._route_to_deployment(message, target_deployment)
            routing_result["routed_to"].append(f"deployment:{target_deployment}")
            
        else:
            # Default: broadcast to all user connections except source
            await self._broadcast_to_user_connections(message, exclude_deployment=source_deployment)
            routing_result["routed_to"].append(f"user:{user_id}:others")
            
        logger.info("Message routed", 
                   message_id=message_id,
                   message_type=message_type,
                   user_id=user_id,
                   routing_result=routing_result)
                   
        return routing_result
        
    async def _persist_message(self, message: Message):
        """Persist message to storage"""
        try:
            # Store in Redis for short-term access
            redis_key = f"message_history:{message.user_id}"
            message_data = {
                "id": message.id,
                "message_type": message.message_type,
                "content": message.content,
                "timestamp": message.timestamp.isoformat(),
                "source_deployment": message.source_deployment,
                "target_deployment": message.target_deployment,
                "target_user": message.target_user
            }
            
            await self.redis_client.lpush(redis_key, json.dumps(message_data))
            await self.redis_client.ltrim(redis_key, 0, 999)  # Keep last 1000 messages
            await self.redis_client.expire(redis_key, 86400 * 7)  # Expire after 7 days
            
            # Also store in memory for quick access
            if message.user_id not in self.message_history:
                self.message_history[message.user_id] = []
                
            self.message_history[message.user_id].insert(0, message)
            
            # Keep only last 100 messages in memory
            if len(self.message_history[message.user_id]) > 100:
                self.message_history[message.user_id] = self.message_history[message.user_id][:100]
                
        except Exception as e:
            logger.error("Error persisting message", 
                        message_id=message.id,
                        error=str(e))
                        
    async def _route_cross_user_message(self, message: Message):
        """Route message to different user"""
        target_user_id = message.target_user
        
        # Create message for target user
        cross_user_message = {
            "type": "cross_user_message",
            "message_id": message.id,
            "from_user": message.user_id,
            "message_type": message.message_type,
            "content": message.content,
            "timestamp": message.timestamp.isoformat()
        }
        
        # Broadcast to target user's connections if websocket_hub is available
        if self.websocket_hub:
            await self.websocket_hub.broadcast_to_user(target_user_id, cross_user_message)
        else:
            # Store for later delivery
            await self._store_pending_message(target_user_id, cross_user_message)
            
    async def _broadcast_to_user_connections(self, message: Message, exclude_deployment: Optional[str] = None):
        """Broadcast message to all user's connections"""
        broadcast_message = {
            "type": "routed_message",
            "message_id": message.id,
            "message_type": message.message_type,
            "content": message.content,
            "source_deployment": message.source_deployment,
            "timestamp": message.timestamp.isoformat()
        }
        
        if self.websocket_hub:
            # Get user connections
            user_connections = self.websocket_hub.user_connections.get(message.user_id, set())
            
            for connection_id in user_connections:
                connection = self.websocket_hub.connections.get(connection_id)
                if connection and connection.deployment_mode != exclude_deployment:
                    await self.websocket_hub._send_to_connection(connection_id, broadcast_message)
        else:
            # Store for later delivery
            await self._store_pending_message(message.user_id, broadcast_message)
            
    async def _route_to_deployment(self, message: Message, deployment_mode: str):
        """Route message to specific deployment mode"""
        deployment_message = {
            "type": "deployment_message",
            "message_id": message.id,
            "message_type": message.message_type,
            "content": message.content,
            "source_deployment": message.source_deployment,
            "timestamp": message.timestamp.isoformat()
        }
        
        if self.websocket_hub:
            # Get user connections for specific deployment mode
            user_connections = self.websocket_hub.user_connections.get(message.user_id, set())
            
            for connection_id in user_connections:
                connection = self.websocket_hub.connections.get(connection_id)
                if connection and connection.deployment_mode == deployment_mode:
                    await self.websocket_hub._send_to_connection(connection_id, deployment_message)
        else:
            # Store for later delivery
            await self._store_pending_message(message.user_id, deployment_message)
            
    async def _store_pending_message(self, user_id: str, message: Dict[str, Any]):
        """Store message for later delivery when user connects"""
        try:
            redis_key = f"pending_messages:{user_id}"
            await self.redis_client.lpush(redis_key, json.dumps(message))
            await self.redis_client.ltrim(redis_key, 0, 99)  # Keep last 100 pending messages
            await self.redis_client.expire(redis_key, 86400)  # Expire after 24 hours
            
        except Exception as e:
            logger.error("Error storing pending message", 
                        user_id=user_id,
                        error=str(e))
                        
    async def get_pending_messages(self, user_id: str) -> List[Dict[str, Any]]:
        """Get pending messages for user"""
        try:
            redis_key = f"pending_messages:{user_id}"
            messages_data = await self.redis_client.lrange(redis_key, 0, -1)
            
            messages = []
            for message_data in messages_data:
                try:
                    message = json.loads(message_data)
                    messages.append(message)
                except json.JSONDecodeError:
                    continue
                    
            # Clear pending messages after retrieval
            await self.redis_client.delete(redis_key)
            
            return messages
            
        except Exception as e:
            logger.error("Error getting pending messages", 
                        user_id=user_id,
                        error=str(e))
            return []
            
    async def get_user_message_history(
        self, 
        user_id: str, 
        limit: int = 50, 
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get message history for user"""
        try:
            # First try memory cache
            if user_id in self.message_history:
                messages = self.message_history[user_id][offset:offset+limit]
                return [{
                    "id": msg.id,
                    "message_type": msg.message_type,
                    "content": msg.content,
                    "timestamp": msg.timestamp.isoformat(),
                    "source_deployment": msg.source_deployment,
                    "target_deployment": msg.target_deployment,
                    "target_user": msg.target_user
                } for msg in messages]
                
            # Fall back to Redis
            redis_key = f"message_history:{user_id}"
            messages_data = await self.redis_client.lrange(redis_key, offset, offset+limit-1)
            
            messages = []
            for message_data in messages_data:
                try:
                    message = json.loads(message_data)
                    messages.append(message)
                except json.JSONDecodeError:
                    continue
                    
            return messages
            
        except Exception as e:
            logger.error("Error getting message history", 
                        user_id=user_id,
                        error=str(e))
            return []
            
    async def broadcast_to_user(
        self, 
        user_id: str, 
        message: Dict[str, Any], 
        deployment_mode: Optional[str] = None
    ) -> Dict[str, Any]:
        """Broadcast message to user's connections"""
        result = {
            "broadcast_id": str(uuid.uuid4()),
            "user_id": user_id,
            "deployment_mode": deployment_mode,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "delivered_to": []
        }
        
        if self.websocket_hub:
            if deployment_mode:
                await self.websocket_hub.broadcast_to_deployment_mode(deployment_mode, message)
                result["delivered_to"].append(f"deployment:{deployment_mode}")
            else:
                await self.websocket_hub.broadcast_to_user(user_id, message)
                result["delivered_to"].append(f"user:{user_id}")
        else:
            # Store for later delivery
            await self._store_pending_message(user_id, message)
            result["delivered_to"].append("pending")
            
        return result
        
    def set_websocket_hub(self, websocket_hub):
        """Set reference to WebSocket hub for message delivery"""
        self.websocket_hub = websocket_hub
        
    def get_routing_stats(self) -> Dict[str, Any]:
        """Get message routing statistics"""
        stats = {
            "total_users_with_history": len(self.message_history),
            "routing_rules_count": len(self.routing_rules),
            "message_types_seen": list(self.routing_rules.keys())
        }
        
        return stats
