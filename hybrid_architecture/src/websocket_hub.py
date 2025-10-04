"""WebSocket Hub for managing connections across all deployment modes."""

import json
import uuid
import asyncio
import logging
from typing import Dict, Set, List, Optional, Any
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect
from dataclasses import dataclass, asdict
import jwt

from ..config.settings import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class Connection:
    """WebSocket connection information."""
    websocket: WebSocket
    connection_id: str
    user_id: str
    deployment_mode: str  # web, extension, local, hybrid
    connected_at: datetime
    last_ping: datetime
    
@dataclass
class Message:
    """Standard message format for cross-deployment communication."""
    message_id: str
    type: str  # sync, intervention, task_update, idea_validation, etc.
    source_mode: str
    target_mode: Optional[str]  # None for broadcast
    user_id: str
    payload: Dict[str, Any]
    timestamp: datetime
    
class WebSocketHub:
    """Manages WebSocket connections and message routing."""
    
    def __init__(self):
        # Active connections grouped by user
        self.connections: Dict[str, Dict[str, Connection]] = {}
        
        # Message history for sync purposes
        self.message_history: Dict[str, List[Message]] = {}
        
        # User session management
        self.user_sessions: Dict[str, Dict[str, Any]] = {}
        
    async def connect(self, websocket: WebSocket, user_id: str, 
                     deployment_mode: str, auth_token: str) -> str:
        """Accept a WebSocket connection."""
        
        # Validate authentication token
        if not self._validate_token(auth_token, user_id):
            await websocket.close(code=4001, reason="Invalid authentication")
            raise Exception("Authentication failed")
        
        # Generate connection ID
        connection_id = str(uuid.uuid4())
        
        # Accept WebSocket
        await websocket.accept()
        
        # Create connection record
        connection = Connection(
            websocket=websocket,
            connection_id=connection_id,
            user_id=user_id,
            deployment_mode=deployment_mode,
            connected_at=datetime.now(),
            last_ping=datetime.now()
        )
        
        # Store connection
        if user_id not in self.connections:
            self.connections[user_id] = {}
            
        self.connections[user_id][connection_id] = connection
        
        # Initialize user session if not exists
        if user_id not in self.user_sessions:
            self.user_sessions[user_id] = {
                'active_task': None,
                'settings': {},
                'last_activity': datetime.now().isoformat()
            }
        
        logger.info(f"New connection: {deployment_mode} for user {user_id}")
        
        # Send connection acknowledgment
        await self._send_to_connection(connection_id, user_id, {
            'type': 'connection_ack',
            'connection_id': connection_id,
            'deployment_mode': deployment_mode,
            'connected_deployments': list(self.connections[user_id].keys())
        })
        
        # Send sync data to newly connected client
        await self._send_sync_data(connection_id, user_id)
        
        return connection_id
    
    async def disconnect(self, connection_id: str, user_id: str):
        """Handle WebSocket disconnect."""
        if (user_id in self.connections and 
            connection_id in self.connections[user_id]):
            
            deployment_mode = self.connections[user_id][connection_id].deployment_mode
            del self.connections[user_id][connection_id]
            
            # Clean up empty user connections
            if not self.connections[user_id]:
                del self.connections[user_id]
                
            logger.info(f"Disconnected: {deployment_mode} for user {user_id}")
    
    async def handle_message(self, connection_id: str, user_id: str, data: dict):
        """Handle incoming WebSocket message."""
        try:
            message = Message(
                message_id=str(uuid.uuid4()),
                type=data.get('type', 'unknown'),
                source_mode=data.get('source_mode', 'unknown'),
                target_mode=data.get('target_mode'),
                user_id=user_id,
                payload=data.get('payload', {}),
                timestamp=datetime.now()
            )
            
            # Store message in history
            if user_id not in self.message_history:
                self.message_history[user_id] = []
            self.message_history[user_id].append(message)
            
            # Keep only last 100 messages per user
            if len(self.message_history[user_id]) > 100:
                self.message_history[user_id] = self.message_history[user_id][-100:]
            
            # Route message based on type
            await self._route_message(message)
            
        except Exception as e:
            logger.error(f"Error handling message: {e}")
            await self._send_error(connection_id, user_id, str(e))
    
    async def _route_message(self, message: Message):
        """Route message to appropriate destination(s)."""
        if message.target_mode:
            # Send to specific deployment mode
            await self._send_to_deployment_mode(message.user_id, message.target_mode, message)
        else:
            # Broadcast to all user's connections except source
            await self._broadcast_to_user(message.user_id, message, exclude_source=True)
        
        # Handle specific message types
        if message.type == 'sync_request':
            await self._handle_sync_request(message)
        elif message.type == 'task_update':
            await self._handle_task_update(message)
        elif message.type == 'intervention':
            await self._handle_intervention(message)
        elif message.type == 'settings_update':
            await self._handle_settings_update(message)
    
    async def _send_to_connection(self, connection_id: str, user_id: str, data: dict):
        """Send data to specific connection."""
        if (user_id in self.connections and 
            connection_id in self.connections[user_id]):
            
            connection = self.connections[user_id][connection_id]
            try:
                await connection.websocket.send_text(json.dumps(data))
            except Exception as e:
                logger.error(f"Failed to send to {connection_id}: {e}")
                await self.disconnect(connection_id, user_id)
    
    async def _send_to_deployment_mode(self, user_id: str, mode: str, message: Message):
        """Send message to all connections of a specific deployment mode."""
        if user_id not in self.connections:
            return
            
        for connection_id, connection in self.connections[user_id].items():
            if connection.deployment_mode == mode:
                await self._send_to_connection(connection_id, user_id, asdict(message))
    
    async def _broadcast_to_user(self, user_id: str, message: Message, exclude_source: bool = False):
        """Broadcast message to all user's connections."""
        if user_id not in self.connections:
            return
            
        for connection_id, connection in self.connections[user_id].items():
            if exclude_source and connection.deployment_mode == message.source_mode:
                continue
            await self._send_to_connection(connection_id, user_id, asdict(message))
    
    async def _send_sync_data(self, connection_id: str, user_id: str):
        """Send sync data to newly connected client."""
        sync_data = {
            'type': 'sync_data',
            'user_session': self.user_sessions.get(user_id, {}),
            'recent_messages': [asdict(msg) for msg in self.message_history.get(user_id, [])[-10:]],
            'connected_modes': [conn.deployment_mode for conn in self.connections[user_id].values()]
        }
        
        await self._send_to_connection(connection_id, user_id, sync_data)
    
    async def _send_error(self, connection_id: str, user_id: str, error_message: str):
        """Send error message to connection."""
        await self._send_to_connection(connection_id, user_id, {
            'type': 'error',
            'message': error_message,
            'timestamp': datetime.now().isoformat()
        })
    
    def _validate_token(self, token: str, user_id: str) -> bool:
        """Validate JWT token."""
        try:
            payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
            return payload.get('sub') == user_id
        except jwt.InvalidTokenError:
            return False
    
    async def _handle_sync_request(self, message: Message):
        """Handle synchronization request."""
        # Implementation for sync logic
        pass
    
    async def _handle_task_update(self, message: Message):
        """Handle task update message."""
        user_id = message.user_id
        if user_id in self.user_sessions:
            self.user_sessions[user_id]['active_task'] = message.payload.get('task')
            self.user_sessions[user_id]['last_activity'] = datetime.now().isoformat()
    
    async def _handle_intervention(self, message: Message):
        """Handle intervention message."""
        # Broadcast intervention to all deployment modes
        await self._broadcast_to_user(message.user_id, message)
    
    async def _handle_settings_update(self, message: Message):
        """Handle settings update."""
        user_id = message.user_id
        if user_id in self.user_sessions:
            self.user_sessions[user_id]['settings'].update(message.payload.get('settings', {}))
    
    def get_connection_stats(self) -> Dict[str, Any]:
        """Get current connection statistics."""
        total_connections = sum(len(conns) for conns in self.connections.values())
        
        mode_counts = {}
        for user_conns in self.connections.values():
            for conn in user_conns.values():
                mode = conn.deployment_mode
                mode_counts[mode] = mode_counts.get(mode, 0) + 1
        
        return {
            'total_users': len(self.connections),
            'total_connections': total_connections,
            'connections_by_mode': mode_counts,
            'active_sessions': len(self.user_sessions)
        }

# Global hub instance
hub = WebSocketHub()