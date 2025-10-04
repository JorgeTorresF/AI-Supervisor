from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Set, Optional, Any
import json
import asyncio
import structlog
from datetime import datetime, timezone
import uuid

from ..models.websocket_models import ConnectionInfo, Message, MessageType
from ..utils.redis_client import RedisClient
from ..core.auth_bridge import AuthBridge

logger = structlog.get_logger()

class WebSocketHub:
    """Central WebSocket server that manages connections from all deployment modes"""
    
    def __init__(self):
        self.connections: Dict[str, ConnectionInfo] = {}
        self.deployment_connections: Dict[str, Set[str]] = {
            "web_app": set(),
            "browser_extension": set(),
            "local_installation": set()
        }
        self.user_connections: Dict[str, Set[str]] = {}
        self.redis_client = None
        self.auth_bridge = None
        self._heartbeat_task = None
        
    async def initialize(self):
        """Initialize the WebSocket hub"""
        self.redis_client = RedisClient()
        await self.redis_client.connect()
        
        self.auth_bridge = AuthBridge()
        await self.auth_bridge.initialize()
        
        # Start heartbeat task
        self._heartbeat_task = asyncio.create_task(self._heartbeat_loop())
        
        logger.info("WebSocket Hub initialized")
        
    async def cleanup(self):
        """Cleanup resources"""
        if self._heartbeat_task:
            self._heartbeat_task.cancel()
            
        # Close all connections
        for connection_id in list(self.connections.keys()):
            await self._disconnect_client(connection_id)
            
        if self.redis_client:
            await self.redis_client.disconnect()
            
        logger.info("WebSocket Hub cleaned up")
        
    async def handle_connection(self, websocket: WebSocket, deployment_mode: str, client_id: str):
        """Handle new WebSocket connection"""
        connection_id = f"{deployment_mode}_{client_id}_{uuid.uuid4().hex[:8]}"
        
        try:
            await websocket.accept()
            
            # Create connection info
            connection_info = ConnectionInfo(
                id=connection_id,
                websocket=websocket,
                deployment_mode=deployment_mode,
                client_id=client_id,
                connected_at=datetime.now(timezone.utc),
                last_heartbeat=datetime.now(timezone.utc)
            )
            
            # Store connection
            self.connections[connection_id] = connection_info
            self.deployment_connections[deployment_mode].add(connection_id)
            
            logger.info("WebSocket connection established", 
                       connection_id=connection_id,
                       deployment_mode=deployment_mode,
                       client_id=client_id)
            
            # Send welcome message
            await self._send_to_connection(connection_id, {
                "type": "connection_established",
                "connection_id": connection_id,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            
            # Listen for messages
            await self._listen_for_messages(connection_id)
            
        except WebSocketDisconnect:
            await self._disconnect_client(connection_id)
        except Exception as e:
            logger.error("Error handling WebSocket connection", 
                        connection_id=connection_id, error=str(e))
            await self._disconnect_client(connection_id)
            
    async def _listen_for_messages(self, connection_id: str):
        """Listen for messages from a WebSocket connection"""
        connection = self.connections.get(connection_id)
        if not connection:
            return
            
        try:
            while True:
                data = await connection.websocket.receive_text()
                message_data = json.loads(data)
                
                # Update last heartbeat
                connection.last_heartbeat = datetime.now(timezone.utc)
                
                # Handle message
                await self._handle_message(connection_id, message_data)
                
        except WebSocketDisconnect:
            await self._disconnect_client(connection_id)
        except json.JSONDecodeError as e:
            logger.warning("Invalid JSON received", connection_id=connection_id, error=str(e))
            await self._send_error(connection_id, "invalid_json", "Invalid JSON format")
        except Exception as e:
            logger.error("Error listening for messages", connection_id=connection_id, error=str(e))
            await self._disconnect_client(connection_id)
            
    async def _handle_message(self, connection_id: str, message_data: dict):
        """Handle incoming message from WebSocket"""
        try:
            message_type = message_data.get("type")
            
            if message_type == "auth":
                await self._handle_auth_message(connection_id, message_data)
            elif message_type == "heartbeat":
                await self._handle_heartbeat(connection_id)
            elif message_type == "broadcast":
                await self._handle_broadcast_message(connection_id, message_data)
            elif message_type == "direct":
                await self._handle_direct_message(connection_id, message_data)
            elif message_type == "sync_request":
                await self._handle_sync_request(connection_id, message_data)
            else:
                logger.warning("Unknown message type", 
                              connection_id=connection_id, 
                              message_type=message_type)
                await self._send_error(connection_id, "unknown_message_type", 
                                     f"Unknown message type: {message_type}")
                                     
        except Exception as e:
            logger.error("Error handling message", 
                        connection_id=connection_id, 
                        error=str(e))
            await self._send_error(connection_id, "message_handling_error", str(e))
            
    async def _handle_auth_message(self, connection_id: str, message_data: dict):
        """Handle authentication message"""
        token = message_data.get("token")
        if not token:
            await self._send_error(connection_id, "missing_token", "Authentication token required")
            return
            
        # Validate token
        user_info = await self.auth_bridge.validate_token(token)
        if not user_info:
            await self._send_error(connection_id, "invalid_token", "Invalid authentication token")
            return
            
        # Update connection with user info
        connection = self.connections[connection_id]
        connection.user_id = user_info.get("user_id")
        connection.authenticated = True
        
        # Add to user connections
        user_id = connection.user_id
        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(connection_id)
        
        # Send authentication success
        await self._send_to_connection(connection_id, {
            "type": "auth_success",
            "user_id": user_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        logger.info("WebSocket authentication successful", 
                   connection_id=connection_id,
                   user_id=user_id)
                   
    async def _handle_heartbeat(self, connection_id: str):
        """Handle heartbeat message"""
        connection = self.connections.get(connection_id)
        if connection:
            connection.last_heartbeat = datetime.now(timezone.utc)
            await self._send_to_connection(connection_id, {
                "type": "heartbeat_ack",
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            
    async def _handle_broadcast_message(self, connection_id: str, message_data: dict):
        """Handle broadcast message to all connections of a user"""
        connection = self.connections.get(connection_id)
        if not connection or not connection.authenticated:
            await self._send_error(connection_id, "not_authenticated", 
                                 "Must be authenticated to broadcast messages")
            return
            
        user_id = connection.user_id
        message_content = message_data.get("content", {})
        
        # Broadcast to all user's connections
        user_connections = self.user_connections.get(user_id, set())
        for target_connection_id in user_connections:
            if target_connection_id != connection_id:  # Don't send back to sender
                await self._send_to_connection(target_connection_id, {
                    "type": "broadcast_message",
                    "from_connection": connection_id,
                    "from_deployment": connection.deployment_mode,
                    "content": message_content,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
                
    async def _handle_direct_message(self, connection_id: str, message_data: dict):
        """Handle direct message to specific connection"""
        connection = self.connections.get(connection_id)
        if not connection or not connection.authenticated:
            await self._send_error(connection_id, "not_authenticated", 
                                 "Must be authenticated to send direct messages")
            return
            
        target_connection_id = message_data.get("target_connection")
        message_content = message_data.get("content", {})
        
        if target_connection_id in self.connections:
            await self._send_to_connection(target_connection_id, {
                "type": "direct_message",
                "from_connection": connection_id,
                "from_deployment": connection.deployment_mode,
                "content": message_content,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
        else:
            await self._send_error(connection_id, "target_not_found", 
                                 "Target connection not found")
                                 
    async def _handle_sync_request(self, connection_id: str, message_data: dict):
        """Handle data sync request"""
        connection = self.connections.get(connection_id)
        if not connection or not connection.authenticated:
            await self._send_error(connection_id, "not_authenticated", 
                                 "Must be authenticated to request sync")
            return
            
        # This will be handled by the DataSyncEngine
        sync_type = message_data.get("sync_type")
        await self._send_to_connection(connection_id, {
            "type": "sync_initiated",
            "sync_type": sync_type,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
    async def _send_to_connection(self, connection_id: str, message: dict):
        """Send message to specific connection"""
        connection = self.connections.get(connection_id)
        if not connection:
            return
            
        try:
            await connection.websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error("Error sending message to connection", 
                        connection_id=connection_id, 
                        error=str(e))
            await self._disconnect_client(connection_id)
            
    async def _send_error(self, connection_id: str, error_code: str, error_message: str):
        """Send error message to connection"""
        await self._send_to_connection(connection_id, {
            "type": "error",
            "error_code": error_code,
            "error_message": error_message,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
    async def _disconnect_client(self, connection_id: str):
        """Disconnect and cleanup client connection"""
        connection = self.connections.get(connection_id)
        if not connection:
            return
            
        # Remove from all tracking structures
        self.connections.pop(connection_id, None)
        
        for deployment_mode, connection_set in self.deployment_connections.items():
            connection_set.discard(connection_id)
            
        if connection.user_id:
            user_connections = self.user_connections.get(connection.user_id, set())
            user_connections.discard(connection_id)
            if not user_connections:
                self.user_connections.pop(connection.user_id, None)
                
        # Close WebSocket connection
        try:
            await connection.websocket.close()
        except Exception:
            pass  # Connection might already be closed
            
        logger.info("WebSocket connection closed", 
                   connection_id=connection_id,
                   deployment_mode=connection.deployment_mode)
                   
    async def _heartbeat_loop(self):
        """Periodic heartbeat check to remove stale connections"""
        while True:
            try:
                await asyncio.sleep(30)  # Check every 30 seconds
                
                now = datetime.now(timezone.utc)
                stale_connections = []
                
                for connection_id, connection in self.connections.items():
                    if (now - connection.last_heartbeat).total_seconds() > 90:  # 90 second timeout
                        stale_connections.append(connection_id)
                        
                # Remove stale connections
                for connection_id in stale_connections:
                    logger.info("Removing stale connection", connection_id=connection_id)
                    await self._disconnect_client(connection_id)
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Error in heartbeat loop", error=str(e))
                
    async def broadcast_to_user(self, user_id: str, message: dict):
        """Broadcast message to all connections of a specific user"""
        user_connections = self.user_connections.get(user_id, set())
        for connection_id in user_connections:
            await self._send_to_connection(connection_id, message)
            
    async def broadcast_to_deployment_mode(self, deployment_mode: str, message: dict):
        """Broadcast message to all connections of a specific deployment mode"""
        deployment_connections = self.deployment_connections.get(deployment_mode, set())
        for connection_id in deployment_connections:
            await self._send_to_connection(connection_id, message)
            
    def get_connection_stats(self) -> dict:
        """Get current connection statistics"""
        stats = {
            "total_connections": len(self.connections),
            "authenticated_connections": sum(1 for c in self.connections.values() if c.authenticated),
            "deployment_mode_breakdown": {
                mode: len(connections) 
                for mode, connections in self.deployment_connections.items()
            },
            "unique_users": len(self.user_connections)
        }
        return stats
