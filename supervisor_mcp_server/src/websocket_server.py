# Real-time WebSocket Communication Infrastructure
# Handles secure communication between browser extension and supervisor server

import asyncio
import json
import logging
import uuid
import time
from typing import Dict, List, Optional, Callable, Any
from datetime import datetime, timedelta
import websockets
from websockets.server import WebSocketServerProtocol
from dataclasses import dataclass, asdict
import hashlib
import hmac
import base64

from .browser_coherence_integrator import BrowserCoherenceIntegrator

class SupervisorWebSocketServer:
    """
    WebSocket server for real-time communication with browser extensions.
    Handles authentication, message routing, and connection management.
    """
    
    def __init__(self, host: str = 'localhost', port: int = 8765, secret_key: str = None):
        self.host = host
        self.port = port
        self.secret_key = secret_key or self._generate_secret_key()
        
        # Connection management
        self.connections: Dict[str, WebSocketConnection] = {}
        self.extension_connections: Dict[str, WebSocketConnection] = {}
        
        # Message routing
        self.message_handlers: Dict[str, Callable] = {}
        self.setup_message_handlers()
        
        # Integration components
        self.coherence_integrator = BrowserCoherenceIntegrator(
            websocket_handler=self,
            storage_handler=None  # Will be set during integration
        )
        
        # Server state
        self.server = None
        self.is_running = False
        
        # Logging
        self.logger = logging.getLogger(__name__)
        
        # Security
        self.auth_tokens: Dict[str, AuthToken] = {}
        self.rate_limits: Dict[str, RateLimit] = {}
    
    def _generate_secret_key(self) -> str:
        """Generate a secure secret key for authentication."""
        return base64.b64encode(uuid.uuid4().bytes + uuid.uuid4().bytes).decode('utf-8')
    
    def setup_message_handlers(self):
        """Setup message type handlers."""
        self.message_handlers = {
            'AUTH_REQUEST': self._handle_auth_request,
            'EXTENSION_REGISTER': self._handle_extension_register,
            'USER_INPUT_ANALYSIS': self._handle_user_input_analysis,
            'AGENT_MESSAGE_ANALYSIS': self._handle_agent_message_analysis,
            'SESSION_START': self._handle_session_start,
            'SESSION_END': self._handle_session_end,
            'MANUAL_TASK_CONTEXT': self._handle_manual_task_context,
            'PING': self._handle_ping,
            'GET_STATS': self._handle_get_stats,
            'UPDATE_CONFIG': self._handle_update_config
        }
    
    async def start_server(self):
        """Start the WebSocket server."""
        try:
            self.logger.info(f"Starting WebSocket server on {self.host}:{self.port}")
            
            self.server = await websockets.serve(
                self._handle_client_connection,
                self.host,
                self.port,
                ping_interval=30,
                ping_timeout=10,
                close_timeout=10
            )
            
            self.is_running = True
            self.logger.info(f"WebSocket server started successfully")
            
            # Start cleanup task
            asyncio.create_task(self._cleanup_connections())
            
        except Exception as e:
            self.logger.error(f"Failed to start WebSocket server: {e}")
            raise
    
    async def stop_server(self):
        """Stop the WebSocket server."""
        if self.server:
            self.logger.info("Stopping WebSocket server...")
            self.server.close()
            await self.server.wait_closed()
            self.is_running = False
            self.logger.info("WebSocket server stopped")
    
    async def _handle_client_connection(self, websocket: WebSocketServerProtocol, path: str):
        """
        Handle new client connection.
        """
        connection_id = str(uuid.uuid4())
        client_ip = websocket.remote_address[0] if websocket.remote_address else 'unknown'
        
        self.logger.info(f"New connection: {connection_id} from {client_ip}")
        
        connection = WebSocketConnection(
            id=connection_id,
            websocket=websocket,
            client_ip=client_ip,
            connected_at=datetime.now()
        )
        
        self.connections[connection_id] = connection
        
        try:
            await self._handle_connection_lifecycle(connection)
        except websockets.exceptions.ConnectionClosed:
            self.logger.info(f"Connection {connection_id} closed normally")
        except Exception as e:
            self.logger.error(f"Error in connection {connection_id}: {e}")
        finally:
            await self._cleanup_connection(connection_id)
    
    async def _handle_connection_lifecycle(self, connection: 'WebSocketConnection'):
        """
        Handle the lifecycle of a connection.
        """
        async for message in connection.websocket:
            try:
                # Parse message
                data = json.loads(message)
                message_type = data.get('type')
                message_id = data.get('id', str(uuid.uuid4()))
                
                # Rate limiting
                if not await self._check_rate_limit(connection.client_ip):
                    await self._send_error(connection, message_id, 'Rate limit exceeded')
                    continue
                
                # Route message
                response = await self._route_message(connection, data)
                
                # Send response
                if response:
                    response['id'] = message_id
                    await connection.websocket.send(json.dumps(response))
                
                # Update connection activity
                connection.last_activity = datetime.now()
                connection.message_count += 1
                
            except json.JSONDecodeError:
                await self._send_error(connection, None, 'Invalid JSON')
            except Exception as e:
                self.logger.error(f"Error processing message: {e}")
                await self._send_error(connection, None, f'Internal error: {str(e)}')
    
    async def _route_message(self, connection: 'WebSocketConnection', data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Route message to appropriate handler.
        """
        message_type = data.get('type')
        
        if message_type not in self.message_handlers:
            return {'status': 'error', 'message': f'Unknown message type: {message_type}'}
        
        # Check authentication for protected endpoints
        if message_type not in ['AUTH_REQUEST', 'PING'] and not connection.is_authenticated:
            return {'status': 'error', 'message': 'Authentication required'}
        
        try:
            handler = self.message_handlers[message_type]
            return await handler(connection, data)
        except Exception as e:
            self.logger.error(f"Error in handler for {message_type}: {e}")
            return {'status': 'error', 'message': f'Handler error: {str(e)}'}
    
    async def _handle_auth_request(self, connection: 'WebSocketConnection', data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle authentication request.
        """
        extension_id = data.get('extension_id')
        challenge = data.get('challenge')
        signature = data.get('signature')
        
        if not all([extension_id, challenge, signature]):
            return {'status': 'error', 'message': 'Missing authentication parameters'}
        
        # Verify signature
        expected_signature = hmac.new(
            self.secret_key.encode(),
            f"{extension_id}:{challenge}".encode(),
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(signature, expected_signature):
            return {'status': 'error', 'message': 'Invalid signature'}
        
        # Generate auth token
        auth_token = AuthToken(
            token=str(uuid.uuid4()),
            extension_id=extension_id,
            expires_at=datetime.now() + timedelta(hours=24)
        )
        
        self.auth_tokens[auth_token.token] = auth_token
        connection.is_authenticated = True
        connection.extension_id = extension_id
        connection.auth_token = auth_token.token
        
        self.logger.info(f"Extension {extension_id} authenticated successfully")
        
        return {
            'status': 'success',
            'auth_token': auth_token.token,
            'expires_at': auth_token.expires_at.isoformat()
        }
    
    async def _handle_extension_register(self, connection: 'WebSocketConnection', data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle extension registration.
        """
        if not connection.is_authenticated:
            return {'status': 'error', 'message': 'Authentication required'}
        
        extension_info = data.get('extension_info', {})
        
        # Store extension connection
        self.extension_connections[connection.extension_id] = connection
        connection.extension_info = extension_info
        
        self.logger.info(f"Extension {connection.extension_id} registered with capabilities: {extension_info.get('capabilities', [])}")
        
        return {
            'status': 'success',
            'server_info': {
                'version': '1.0.0',
                'capabilities': ['task-coherence-protection', 'real-time-monitoring', 'intervention'],
                'config': self.coherence_integrator.config.to_dict()
            }
        }
    
    async def _handle_user_input_analysis(self, connection: 'WebSocketConnection', data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle user input analysis request.
        """
        tab_id = data.get('tab_id')
        if not tab_id:
            return {'status': 'error', 'message': 'tab_id is required'}
        
        # Forward to coherence integrator
        return await self.coherence_integrator.handle_browser_message({
            'type': 'USER_INPUT_ANALYSIS',
            'data': data.get('data', {})
        }, tab_id)
    
    async def _handle_agent_message_analysis(self, connection: 'WebSocketConnection', data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle agent message analysis request.
        """
        tab_id = data.get('tab_id')
        if not tab_id:
            return {'status': 'error', 'message': 'tab_id is required'}
        
        # Forward to coherence integrator
        return await self.coherence_integrator.handle_browser_message({
            'type': 'AGENT_MESSAGE_ANALYSIS',
            'data': data.get('data', {})
        }, tab_id)
    
    async def _handle_session_start(self, connection: 'WebSocketConnection', data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle session start.
        """
        tab_id = data.get('tab_id')
        if not tab_id:
            return {'status': 'error', 'message': 'tab_id is required'}
        
        return await self.coherence_integrator.handle_browser_message({
            'type': 'SESSION_START',
            'data': data.get('data', {})
        }, tab_id)
    
    async def _handle_session_end(self, connection: 'WebSocketConnection', data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle session end.
        """
        tab_id = data.get('tab_id')
        if not tab_id:
            return {'status': 'error', 'message': 'tab_id is required'}
        
        return await self.coherence_integrator.handle_browser_message({
            'type': 'SESSION_END',
            'data': data.get('data', {})
        }, tab_id)
    
    async def _handle_manual_task_context(self, connection: 'WebSocketConnection', data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle manual task context setting.
        """
        tab_id = data.get('tab_id')
        if not tab_id:
            return {'status': 'error', 'message': 'tab_id is required'}
        
        return await self.coherence_integrator.handle_browser_message({
            'type': 'MANUAL_TASK_CONTEXT',
            'data': data.get('data', {})
        }, tab_id)
    
    async def _handle_ping(self, connection: 'WebSocketConnection', data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle ping request.
        """
        return {
            'status': 'success',
            'type': 'pong',
            'timestamp': datetime.now().isoformat(),
            'server_time': time.time()
        }
    
    async def _handle_get_stats(self, connection: 'WebSocketConnection', data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle statistics request.
        """
        tab_id = data.get('tab_id')
        
        stats = self.coherence_integrator.get_session_stats(tab_id)
        
        # Add server stats
        stats.update({
            'server_stats': {
                'active_connections': len(self.connections),
                'active_extensions': len(self.extension_connections),
                'uptime_seconds': (datetime.now() - self._server_start_time).total_seconds() if hasattr(self, '_server_start_time') else 0
            }
        })
        
        return {'status': 'success', 'stats': stats}
    
    async def _handle_update_config(self, connection: 'WebSocketConnection', data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle configuration update.
        """
        config_updates = data.get('config', {})
        
        try:
            self.coherence_integrator.config.update_from_dict(config_updates)
            return {'status': 'success', 'message': 'Configuration updated'}
        except Exception as e:
            return {'status': 'error', 'message': f'Failed to update configuration: {str(e)}'}
    
    async def send_to_tab(self, tab_id: str, message: Dict[str, Any]):
        """
        Send message to specific browser tab via extension.
        """
        # Find connection associated with the tab
        target_connection = None
        for connection in self.extension_connections.values():
            if connection.is_authenticated:
                target_connection = connection
                break
        
        if target_connection:
            try:
                full_message = {
                    'type': 'TAB_MESSAGE',
                    'tab_id': tab_id,
                    'data': message,
                    'timestamp': datetime.now().isoformat()
                }
                
                await target_connection.websocket.send(json.dumps(full_message))
                self.logger.debug(f"Sent message to tab {tab_id}: {message.get('type')}")
            except Exception as e:
                self.logger.error(f"Failed to send message to tab {tab_id}: {e}")
        else:
            self.logger.warning(f"No connection available to send message to tab {tab_id}")
    
    async def broadcast_to_extensions(self, message: Dict[str, Any], filter_func: Callable = None):
        """
        Broadcast message to all connected extensions.
        """
        full_message = {
            'type': 'BROADCAST',
            'data': message,
            'timestamp': datetime.now().isoformat()
        }
        
        for connection in self.extension_connections.values():
            if connection.is_authenticated and (not filter_func or filter_func(connection)):
                try:
                    await connection.websocket.send(json.dumps(full_message))
                except Exception as e:
                    self.logger.error(f"Failed to broadcast to extension {connection.extension_id}: {e}")
    
    async def _check_rate_limit(self, client_ip: str) -> bool:
        """
        Check if client is within rate limits.
        """
        now = datetime.now()
        
        if client_ip not in self.rate_limits:
            self.rate_limits[client_ip] = RateLimit()
        
        rate_limit = self.rate_limits[client_ip]
        
        # Reset counter if window expired
        if now - rate_limit.window_start > timedelta(minutes=1):
            rate_limit.request_count = 0
            rate_limit.window_start = now
        
        rate_limit.request_count += 1
        
        # Check limits (100 requests per minute)
        return rate_limit.request_count <= 100
    
    async def _send_error(self, connection: 'WebSocketConnection', message_id: Optional[str], error_message: str):
        """
        Send error response to client.
        """
        error_response = {
            'status': 'error',
            'message': error_message,
            'timestamp': datetime.now().isoformat()
        }
        
        if message_id:
            error_response['id'] = message_id
        
        try:
            await connection.websocket.send(json.dumps(error_response))
        except Exception as e:
            self.logger.error(f"Failed to send error response: {e}")
    
    async def _cleanup_connection(self, connection_id: str):
        """
        Clean up connection resources.
        """
        if connection_id in self.connections:
            connection = self.connections[connection_id]
            
            # Remove from extension connections if applicable
            if connection.extension_id and connection.extension_id in self.extension_connections:
                del self.extension_connections[connection.extension_id]
            
            # Remove auth token
            if connection.auth_token and connection.auth_token in self.auth_tokens:
                del self.auth_tokens[connection.auth_token]
            
            # Remove from main connections
            del self.connections[connection_id]
            
            self.logger.info(f"Cleaned up connection {connection_id}")
    
    async def _cleanup_connections(self):
        """
        Periodic cleanup of stale connections and tokens.
        """
        while self.is_running:
            try:
                now = datetime.now()
                
                # Clean up expired auth tokens
                expired_tokens = [token for token, auth in self.auth_tokens.items() if auth.expires_at < now]
                for token in expired_tokens:
                    del self.auth_tokens[token]
                
                # Clean up stale rate limits (older than 1 hour)
                stale_ips = [ip for ip, rate_limit in self.rate_limits.items() 
                           if now - rate_limit.window_start > timedelta(hours=1)]
                for ip in stale_ips:
                    del self.rate_limits[ip]
                
                # Clean up inactive connections (no activity for 30 minutes)
                inactive_connections = []
                for conn_id, connection in self.connections.items():
                    if connection.last_activity and now - connection.last_activity > timedelta(minutes=30):
                        inactive_connections.append(conn_id)
                
                for conn_id in inactive_connections:
                    await self._cleanup_connection(conn_id)
                
                await asyncio.sleep(60)  # Run cleanup every minute
                
            except Exception as e:
                self.logger.error(f"Error in connection cleanup: {e}")
                await asyncio.sleep(60)


@dataclass
class WebSocketConnection:
    """Represents a WebSocket connection."""
    id: str
    websocket: WebSocketServerProtocol
    client_ip: str
    connected_at: datetime
    last_activity: Optional[datetime] = None
    is_authenticated: bool = False
    extension_id: Optional[str] = None
    auth_token: Optional[str] = None
    extension_info: Optional[Dict[str, Any]] = None
    message_count: int = 0


@dataclass
class AuthToken:
    """Represents an authentication token."""
    token: str
    extension_id: str
    expires_at: datetime


@dataclass
class RateLimit:
    """Represents rate limiting state."""
    request_count: int = 0
    window_start: datetime = None
    
    def __post_init__(self):
        if self.window_start is None:
            self.window_start = datetime.now()


if __name__ == "__main__":
    # Example usage
    import asyncio
    
    async def run_server():
        server = SupervisorWebSocketServer()
        server._server_start_time = datetime.now()
        
        await server.start_server()
        print(f"Server running on ws://{server.host}:{server.port}")
        print(f"Secret key: {server.secret_key}")
        
        try:
            # Keep server running
            while server.is_running:
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            print("\nShutting down server...")
        finally:
            await server.stop_server()
    
    asyncio.run(run_server())
