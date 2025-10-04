# Client Integration Guide

## Web App Integration

### JavaScript WebSocket Client

```javascript
class HybridGatewayClient {
    constructor(gatewayUrl, deploymentMode, clientId) {
        this.gatewayUrl = gatewayUrl;
        this.deploymentMode = deploymentMode;
        this.clientId = clientId;
        this.ws = null;
        this.authenticated = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.eventListeners = new Map();
    }
    
    connect() {
        const wsUrl = `${this.gatewayUrl}/ws/${this.deploymentMode}/${this.clientId}`;
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = (event) => {
            console.log('Connected to Hybrid Gateway');
            this.reconnectAttempts = 0;
            this.emit('connected', event);
        };
        
        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
        };
        
        this.ws.onclose = (event) => {
            console.log('Disconnected from Hybrid Gateway');
            this.authenticated = false;
            this.emit('disconnected', event);
            this.attemptReconnect();
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.emit('error', error);
        };
    }
    
    authenticate(token) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.send({
                type: 'auth',
                token: token
            });
        }
    }
    
    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket not connected, message not sent:', message);
        }
    }
    
    broadcast(content) {
        this.send({
            type: 'broadcast',
            content: content
        });
    }
    
    syncData(syncType, data) {
        this.send({
            type: 'sync_request',
            sync_type: syncType,
            data: data
        });
    }
    
    sendHeartbeat() {
        this.send({ type: 'heartbeat' });
    }
    
    handleMessage(message) {
        switch (message.type) {
            case 'connection_established':
                console.log('Connection established:', message.connection_id);
                break;
                
            case 'auth_success':
                this.authenticated = true;
                console.log('Authentication successful');
                this.emit('authenticated', message);
                // Start heartbeat
                this.startHeartbeat();
                break;
                
            case 'broadcast_message':
                this.emit('broadcast', message);
                break;
                
            case 'sync_completed':
                this.emit('syncCompleted', message);
                break;
                
            case 'error':
                console.error('Gateway error:', message.error_message);
                this.emit('error', message);
                break;
                
            default:
                this.emit('message', message);
        }
    }
    
    startHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        this.heartbeatInterval = setInterval(() => {
            this.sendHeartbeat();
        }, 30000); // 30 seconds
    }
    
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
            
            console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
            
            setTimeout(() => {
                this.connect();
            }, delay);
        } else {
            console.error('Max reconnection attempts reached');
            this.emit('maxReconnectAttemptsReached');
        }
    }
    
    on(event, listener) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(listener);
    }
    
    off(event, listener) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(listener => {
                try {
                    listener(data);
                } catch (error) {
                    console.error('Error in event listener:', error);
                }
            });
        }
    }
    
    disconnect() {
        this.stopHeartbeat();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

// Usage example
const client = new HybridGatewayClient(
    'ws://localhost:8000',
    'web_app',
    'webapp-' + Date.now()
);

// Set up event listeners
client.on('connected', () => {
    console.log('Connected to gateway');
    // Authenticate with Supabase token
    client.authenticate(supabaseToken);
});

client.on('authenticated', () => {
    console.log('Authenticated successfully');
    // Start syncing data
    client.syncData('settings', { theme: 'dark' });
});

client.on('broadcast', (message) => {
    console.log('Received broadcast:', message.content);
    // Handle cross-deployment updates
});

client.on('syncCompleted', (message) => {
    console.log('Sync completed:', message.result);
    // Update local data
});

// Connect to gateway
client.connect();
```

### REST API Client

```javascript
class HybridGatewayAPI {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.token = null;
    }
    
    setToken(token) {
        this.token = token;
    }
    
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        if (this.token) {
            headers.Authorization = `Bearer ${this.token}`;
        }
        
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response.json();
    }
    
    async login(deploymentMode, credentials) {
        const response = await this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                deployment_mode: deploymentMode,
                credentials: credentials
            })
        });
        
        this.setToken(response.data.token);
        return response.data;
    }
    
    async triggerSync(syncType, deploymentMode, data) {
        return this.request('/api/sync/trigger', {
            method: 'POST',
            body: JSON.stringify({
                sync_type: syncType,
                deployment_mode: deploymentMode,
                data: data
            })
        });
    }
    
    async sendMessage(messageType, content, targetDeployment = null) {
        return this.request('/api/messages/send', {
            method: 'POST',
            body: JSON.stringify({
                message_type: messageType,
                content: content,
                target_deployment: targetDeployment
            })
        });
    }
    
    async getMessageHistory(limit = 50, offset = 0) {
        return this.request(
            `/api/messages/history?limit=${limit}&offset=${offset}`
        );
    }
    
    async getAnalytics(timeRange = '24h') {
        return this.request(`/api/analytics/overview?time_range=${timeRange}`);
    }
}

// Usage
const api = new HybridGatewayAPI('http://localhost:8000');

// Login and get token
const authData = await api.login('web_app', {
    supabase_token: 'your-supabase-token'
});

console.log('Authenticated:', authData);

// Trigger sync
const syncResult = await api.triggerSync('settings', 'web_app', {
    theme: 'dark',
    notifications: true
});

console.log('Sync result:', syncResult);
```

## Browser Extension Integration

### Manifest.json

```json
{
  "manifest_version": 3,
  "name": "Hybrid Gateway Extension",
  "version": "1.0.0",
  "description": "Browser extension integrated with Hybrid Gateway",
  "permissions": [
    "storage",
    "activeTab",
    "background"
  ],
  "host_permissions": [
    "http://localhost:8000/*",
    "https://your-gateway-domain.com/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"]
  }],
  "action": {
    "default_popup": "popup.html"
  }
}
```

### Background Script

```javascript
// background.js
class ExtensionGatewayClient {
    constructor() {
        this.ws = null;
        this.gatewayUrl = 'ws://localhost:8000';
        this.extensionId = 'ext-' + chrome.runtime.id;
        this.authenticated = false;
    }
    
    async connect() {
        try {
            const wsUrl = `${this.gatewayUrl}/ws/browser_extension/${this.extensionId}`;
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('Extension connected to Hybrid Gateway');
                this.authenticate();
            };
            
            this.ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            };
            
            this.ws.onclose = () => {
                console.log('Extension disconnected from gateway');
                this.authenticated = false;
                // Attempt reconnection
                setTimeout(() => this.connect(), 5000);
            };
            
        } catch (error) {
            console.error('Extension connection error:', error);
        }
    }
    
    async authenticate() {
        // Get stored auth token or use extension-specific authentication
        const result = await chrome.storage.local.get(['authToken']);
        const token = result.authToken;
        
        if (token && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'auth',
                token: token
            }));
        }
    }
    
    handleMessage(message) {
        switch (message.type) {
            case 'auth_success':
                this.authenticated = true;
                console.log('Extension authenticated');
                break;
                
            case 'broadcast_message':
                // Handle cross-deployment messages
                this.notifyContentScripts(message);
                break;
                
            case 'sync_completed':
                // Handle sync notifications
                this.handleSyncCompleted(message);
                break;
        }
    }
    
    async notifyContentScripts(message) {
        const tabs = await chrome.tabs.query({ active: true });
        for (const tab of tabs) {
            chrome.tabs.sendMessage(tab.id, {
                type: 'gatewayMessage',
                data: message
            });
        }
    }
    
    async handleSyncCompleted(message) {
        // Update extension storage with synced data
        const syncData = message.result;
        await chrome.storage.local.set({ syncData });
        
        // Notify popup if open
        chrome.runtime.sendMessage({
            type: 'syncCompleted',
            data: syncData
        });
    }
    
    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }
}

const gatewayClient = new ExtensionGatewayClient();

// Initialize connection on extension startup
chrome.runtime.onStartup.addListener(() => {
    gatewayClient.connect();
});

chrome.runtime.onInstalled.addListener(() => {
    gatewayClient.connect();
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'sendToGateway') {
        gatewayClient.send(message.data);
    }
    
    if (message.type === 'getConnectionStatus') {
        sendResponse({ 
            connected: gatewayClient.ws?.readyState === WebSocket.OPEN,
            authenticated: gatewayClient.authenticated
        });
    }
});
```

## Local Installation Integration

### Python Client

```python
import asyncio
import websockets
import json
import requests
from typing import Dict, Any, Optional, Callable

class HybridGatewayClient:
    def __init__(self, gateway_url: str, api_key: str):
        self.gateway_url = gateway_url
        self.api_key = api_key
        self.ws_url = gateway_url.replace('http', 'ws')
        self.client_id = f"local-{int(time.time())}"
        self.ws = None
        self.authenticated = False
        self.event_handlers: Dict[str, list] = {}
        
    async def connect(self):
        """Connect to the WebSocket gateway"""
        uri = f"{self.ws_url}/ws/local_installation/{self.client_id}"
        
        try:
            self.ws = await websockets.connect(uri)
            print("Connected to Hybrid Gateway")
            
            # Authenticate
            await self.authenticate()
            
            # Start message handling
            await self._handle_messages()
            
        except Exception as e:
            print(f"Connection error: {e}")
            
    async def authenticate(self):
        """Authenticate with API key"""
        # First get JWT token via API
        response = requests.post(f"{self.gateway_url}/api/auth/login", json={
            "deployment_mode": "local_installation",
            "credentials": {"api_key": self.api_key}
        })
        
        if response.status_code == 200:
            token = response.json()["data"]["token"]
            
            # Send auth message via WebSocket
            await self.send({
                "type": "auth",
                "token": token
            })
        else:
            raise Exception("Authentication failed")
            
    async def send(self, message: Dict[str, Any]):
        """Send message to gateway"""
        if self.ws:
            await self.ws.send(json.dumps(message))
            
    async def sync_data(self, sync_type: str, data: Dict[str, Any]):
        """Trigger data synchronization"""
        await self.send({
            "type": "sync_request",
            "sync_type": sync_type,
            "data": data
        })
        
    async def broadcast(self, content: Dict[str, Any]):
        """Broadcast message to all deployments"""
        await self.send({
            "type": "broadcast",
            "content": content
        })
        
    async def _handle_messages(self):
        """Handle incoming messages"""
        async for message in self.ws:
            try:
                data = json.loads(message)
                await self._process_message(data)
            except Exception as e:
                print(f"Error processing message: {e}")
                
    async def _process_message(self, message: Dict[str, Any]):
        """Process incoming message"""
        message_type = message.get("type")
        
        if message_type == "auth_success":
            self.authenticated = True
            print("Authentication successful")
            await self._emit("authenticated", message)
            
        elif message_type == "broadcast_message":
            await self._emit("broadcast", message)
            
        elif message_type == "sync_completed":
            await self._emit("sync_completed", message)
            
        elif message_type == "error":
            print(f"Gateway error: {message.get('error_message')}")
            await self._emit("error", message)
            
        await self._emit("message", message)
        
    def on(self, event: str, handler: Callable):
        """Register event handler"""
        if event not in self.event_handlers:
            self.event_handlers[event] = []
        self.event_handlers[event].append(handler)
        
    async def _emit(self, event: str, data: Any):
        """Emit event to handlers"""
        if event in self.event_handlers:
            for handler in self.event_handlers[event]:
                try:
                    await handler(data)
                except Exception as e:
                    print(f"Error in event handler: {e}")

# Usage example
async def main():
    client = HybridGatewayClient(
        "http://localhost:8000",
        "your-api-key"
    )
    
    # Register event handlers
    async def on_broadcast(message):
        print(f"Received broadcast: {message['content']}")
        
    async def on_sync_completed(message):
        print(f"Sync completed: {message['result']}")
        
    client.on("broadcast", on_broadcast)
    client.on("sync_completed", on_sync_completed)
    
    # Connect and keep running
    await client.connect()
    
if __name__ == "__main__":
    asyncio.run(main())
```

## Testing and Debugging

### WebSocket Testing Tool

```html
<!DOCTYPE html>
<html>
<head>
    <title>Hybrid Gateway WebSocket Tester</title>
</head>
<body>
    <div id="status">Disconnected</div>
    <button onclick="connect()">Connect</button>
    <button onclick="disconnect()">Disconnect</button>
    <button onclick="authenticate()">Authenticate</button>
    
    <div>
        <input type="text" id="messageInput" placeholder="Enter message">
        <button onclick="sendMessage()">Send</button>
    </div>
    
    <div id="messages"></div>
    
    <script>
        let ws = null;
        const status = document.getElementById('status');
        const messages = document.getElementById('messages');
        
        function connect() {
            ws = new WebSocket('ws://localhost:8000/ws/web_app/test-client');
            
            ws.onopen = () => {
                status.textContent = 'Connected';
                status.style.color = 'green';
            };
            
            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                const div = document.createElement('div');
                div.textContent = `Received: ${JSON.stringify(message, null, 2)}`;
                messages.appendChild(div);
            };
            
            ws.onclose = () => {
                status.textContent = 'Disconnected';
                status.style.color = 'red';
            };
        }
        
        function disconnect() {
            if (ws) {
                ws.close();
            }
        }
        
        function authenticate() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'auth',
                    token: 'test-token'
                }));
            }
        }
        
        function sendMessage() {
            const input = document.getElementById('messageInput');
            if (ws && ws.readyState === WebSocket.OPEN && input.value) {
                ws.send(JSON.stringify({
                    type: 'broadcast',
                    content: { message: input.value }
                }));
                input.value = '';
            }
        }
    </script>
</body>
</html>
```
