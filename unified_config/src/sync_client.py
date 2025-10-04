"""Configuration Synchronization System.

Handles real-time synchronization of configuration data across all deployment modes
through the hybrid architecture gateway.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass
from enum import Enum

import websockets
import requests
from .config_manager import UnifiedConfigManager, ConfigValue, DeploymentMode

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SyncEvent(Enum):
    """Configuration sync events."""
    CONFIG_CHANGED = "config_changed"
    SYNC_REQUEST = "sync_request"
    SYNC_RESPONSE = "sync_response"
    CONFLICT_DETECTED = "conflict_detected"
    SYNC_COMPLETE = "sync_complete"

@dataclass
class SyncMessage:
    """Synchronization message structure."""
    event: SyncEvent
    deployment_mode: DeploymentMode
    user_id: str
    config_data: Dict[str, Any]
    timestamp: datetime
    sync_id: str
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'event': self.event.value,
            'deployment_mode': self.deployment_mode.value,
            'user_id': self.user_id,
            'config_data': self.config_data,
            'timestamp': self.timestamp.isoformat(),
            'sync_id': self.sync_id
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SyncMessage':
        return cls(
            event=SyncEvent(data['event']),
            deployment_mode=DeploymentMode(data['deployment_mode']),
            user_id=data['user_id'],
            config_data=data['config_data'],
            timestamp=datetime.fromisoformat(data['timestamp']),
            sync_id=data['sync_id']
        )

class ConfigSyncClient:
    """Configuration synchronization client."""
    
    def __init__(self, config_manager: UnifiedConfigManager, 
                 gateway_url: str = "ws://localhost:8888/ws",
                 user_id: str = "default_user"):
        self.config_manager = config_manager
        self.gateway_url = gateway_url
        self.user_id = user_id
        
        # Connection state
        self.websocket: Optional[websockets.WebSocketServerProtocol] = None
        self.is_connected = False
        self.reconnect_attempts = 0
        self.max_reconnect_attempts = 5
        
        # Sync configuration
        self.sync_enabled = True
        self.auto_sync = True
        self.sync_interval = 30  # seconds
        self.last_sync_time: Optional[datetime] = None
        
        # Event handlers
        self.event_handlers: Dict[SyncEvent, List[Callable]] = {
            event: [] for event in SyncEvent
        }
        
        # Sync queue and conflicts
        self.pending_syncs: List[SyncMessage] = []
        self.sync_conflicts: Dict[str, List[ConfigValue]] = {}
        
        # Background tasks
        self.sync_task: Optional[asyncio.Task] = None
        self.heartbeat_task: Optional[asyncio.Task] = None
    
    async def connect(self) -> bool:
        """Connect to the hybrid gateway."""
        try:
            # Build WebSocket URL with authentication
            url = f"{self.gateway_url}?user_id={self.user_id}&deployment_mode={self.config_manager.deployment_mode.value}&auth_token=temp_token"
            
            self.websocket = await websockets.connect(url)
            self.is_connected = True
            self.reconnect_attempts = 0
            
            logger.info(f"Connected to hybrid gateway: {self.gateway_url}")
            
            # Start background tasks
            if self.auto_sync:
                self.sync_task = asyncio.create_task(self._sync_loop())
            
            self.heartbeat_task = asyncio.create_task(self._heartbeat_loop())
            
            # Listen for messages
            asyncio.create_task(self._listen_loop())
            
            # Send initial sync request
            await self.request_sync()
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to hybrid gateway: {e}")
            self.is_connected = False
            return False
    
    async def disconnect(self):
        """Disconnect from the hybrid gateway."""
        self.is_connected = False
        
        # Cancel background tasks
        if self.sync_task:
            self.sync_task.cancel()
        
        if self.heartbeat_task:
            self.heartbeat_task.cancel()
        
        # Close WebSocket connection
        if self.websocket:
            await self.websocket.close()
            self.websocket = None
        
        logger.info("Disconnected from hybrid gateway")
    
    async def _listen_loop(self):
        """Listen for incoming WebSocket messages."""
        try:
            while self.is_connected and self.websocket:
                message = await self.websocket.recv()
                data = json.loads(message)
                
                # Handle different message types
                if data.get('type') == 'sync_config':
                    await self._handle_sync_message(data)
                elif data.get('type') == 'config_update':
                    await self._handle_config_update(data)
                elif data.get('type') == 'sync_conflict':
                    await self._handle_sync_conflict(data)
                
        except websockets.exceptions.ConnectionClosed:
            logger.info("WebSocket connection closed")
            self.is_connected = False
            await self._attempt_reconnect()
        except Exception as e:
            logger.error(f"WebSocket listen error: {e}")
            await self._attempt_reconnect()
    
    async def _sync_loop(self):
        """Background sync loop."""
        while self.is_connected:
            try:
                if self.last_sync_time is None or \
                   (datetime.now() - self.last_sync_time).seconds >= self.sync_interval:
                    await self.sync_configuration()
                
                await asyncio.sleep(5)  # Check every 5 seconds
                
            except Exception as e:
                logger.error(f"Sync loop error: {e}")
                await asyncio.sleep(10)
    
    async def _heartbeat_loop(self):
        """Send periodic heartbeat messages."""
        while self.is_connected:
            try:
                if self.websocket:
                    await self.websocket.send(json.dumps({
                        'type': 'ping',
                        'timestamp': datetime.now().isoformat()
                    }))
                
                await asyncio.sleep(30)  # Heartbeat every 30 seconds
                
            except Exception as e:
                logger.error(f"Heartbeat error: {e}")
                break
    
    async def _attempt_reconnect(self):
        """Attempt to reconnect to the gateway."""
        if self.reconnect_attempts >= self.max_reconnect_attempts:
            logger.error("Max reconnection attempts reached")
            return
        
        self.reconnect_attempts += 1
        wait_time = min(60, 2 ** self.reconnect_attempts)  # Exponential backoff
        
        logger.info(f"Attempting to reconnect in {wait_time} seconds (attempt {self.reconnect_attempts})")
        await asyncio.sleep(wait_time)
        
        await self.connect()
    
    async def sync_configuration(self) -> bool:
        """Sync configuration with other deployment modes."""
        if not self.is_connected or not self.websocket:
            return False
        
        try:
            # Get syncable configuration
            sync_config = self.config_manager.get_sync_config()
            
            sync_message = SyncMessage(
                event=SyncEvent.SYNC_REQUEST,
                deployment_mode=self.config_manager.deployment_mode,
                user_id=self.user_id,
                config_data=sync_config,
                timestamp=datetime.now(),
                sync_id=f"sync_{datetime.now().timestamp()}"
            )
            
            await self.websocket.send(json.dumps({
                'type': 'sync_config',
                'payload': sync_message.to_dict()
            }))
            
            self.last_sync_time = datetime.now()
            logger.info(f"Configuration sync sent ({len(sync_config)} items)")
            
            return True
            
        except Exception as e:
            logger.error(f"Configuration sync failed: {e}")
            return False
    
    async def request_sync(self) -> bool:
        """Request configuration sync from other deployment modes."""
        if not self.is_connected or not self.websocket:
            return False
        
        try:
            await self.websocket.send(json.dumps({
                'type': 'request_sync',
                'user_id': self.user_id,
                'deployment_mode': self.config_manager.deployment_mode.value,
                'timestamp': datetime.now().isoformat()
            }))
            
            logger.info("Sync request sent")
            return True
            
        except Exception as e:
            logger.error(f"Sync request failed: {e}")
            return False
    
    async def _handle_sync_message(self, data: Dict[str, Any]):
        """Handle incoming sync message."""
        try:
            payload = data.get('payload', {})
            sync_message = SyncMessage.from_dict(payload)
            
            if sync_message.event == SyncEvent.SYNC_REQUEST:
                # Another deployment mode is requesting sync
                await self.sync_configuration()
            
            elif sync_message.event == SyncEvent.SYNC_RESPONSE:
                # Apply received configuration
                conflicts = self.config_manager.apply_sync_config(sync_message.config_data)
                
                if conflicts:
                    # Handle conflicts
                    await self._handle_sync_conflicts(conflicts, sync_message)
                else:
                    # Sync successful
                    await self._trigger_event(SyncEvent.SYNC_COMPLETE, {
                        'sync_id': sync_message.sync_id,
                        'items_synced': len(sync_message.config_data)
                    })
            
        except Exception as e:
            logger.error(f"Failed to handle sync message: {e}")
    
    async def _handle_config_update(self, data: Dict[str, Any]):
        """Handle real-time configuration update."""
        try:
            key = data.get('key')
            value = data.get('value')
            source_mode = data.get('source_mode')
            
            if source_mode != self.config_manager.deployment_mode.value:
                # Update from another deployment mode
                self.config_manager.set(key, value, sync=False)
                
                await self._trigger_event(SyncEvent.CONFIG_CHANGED, {
                    'key': key,
                    'value': value,
                    'source_mode': source_mode
                })
            
        except Exception as e:
            logger.error(f"Failed to handle config update: {e}")
    
    async def _handle_sync_conflict(self, data: Dict[str, Any]):
        """Handle synchronization conflicts."""
        try:
            conflicts = data.get('conflicts', [])
            
            for conflict in conflicts:
                key = conflict.get('key')
                versions = conflict.get('versions', [])
                
                self.sync_conflicts[key] = [ConfigValue.from_dict(v) for v in versions]
            
            await self._trigger_event(SyncEvent.CONFLICT_DETECTED, {
                'conflicts': list(self.sync_conflicts.keys())
            })
            
        except Exception as e:
            logger.error(f"Failed to handle sync conflict: {e}")
    
    async def _handle_sync_conflicts(self, conflicts: List[str], sync_message: SyncMessage):
        """Handle synchronization conflicts."""
        # Store conflicts for user resolution
        for key in conflicts:
            if key in sync_message.config_data:
                remote_config = ConfigValue.from_dict(sync_message.config_data[key])
                local_config = self.config_manager.config_values.get(key)
                
                if key not in self.sync_conflicts:
                    self.sync_conflicts[key] = []
                
                self.sync_conflicts[key].extend([local_config, remote_config])
        
        # Notify about conflicts
        await self._trigger_event(SyncEvent.CONFLICT_DETECTED, {
            'conflicts': conflicts,
            'sync_id': sync_message.sync_id
        })
    
    async def resolve_conflict(self, key: str, chosen_version: ConfigValue) -> bool:
        """Resolve a synchronization conflict."""
        try:
            if key in self.sync_conflicts:
                # Apply chosen version
                self.config_manager.config_values[key] = chosen_version
                self.config_manager.save_config()
                
                # Remove from conflicts
                del self.sync_conflicts[key]
                
                # Notify other deployment modes
                if self.is_connected and self.websocket:
                    await self.websocket.send(json.dumps({
                        'type': 'conflict_resolved',
                        'key': key,
                        'chosen_version': chosen_version.to_dict(),
                        'deployment_mode': self.config_manager.deployment_mode.value
                    }))
                
                logger.info(f"Conflict resolved for key: {key}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to resolve conflict for {key}: {e}")
            return False
    
    def add_event_handler(self, event: SyncEvent, handler: Callable):
        """Add event handler for sync events."""
        self.event_handlers[event].append(handler)
    
    def remove_event_handler(self, event: SyncEvent, handler: Callable):
        """Remove event handler."""
        if handler in self.event_handlers[event]:
            self.event_handlers[event].remove(handler)
    
    async def _trigger_event(self, event: SyncEvent, data: Dict[str, Any]):
        """Trigger event handlers."""
        for handler in self.event_handlers[event]:
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler(event, data)
                else:
                    handler(event, data)
            except Exception as e:
                logger.error(f"Event handler error for {event}: {e}")
    
    def get_sync_stats(self) -> Dict[str, Any]:
        """Get synchronization statistics."""
        return {
            'is_connected': self.is_connected,
            'last_sync_time': self.last_sync_time.isoformat() if self.last_sync_time else None,
            'pending_syncs': len(self.pending_syncs),
            'conflicts': len(self.sync_conflicts),
            'reconnect_attempts': self.reconnect_attempts,
            'sync_enabled': self.sync_enabled,
            'auto_sync': self.auto_sync
        }