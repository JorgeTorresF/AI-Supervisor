from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
import time
from typing import Callable

# Prometheus metrics
request_count = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code']
)

request_duration = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)

active_connections = Gauge(
    'websocket_connections_active',
    'Number of active WebSocket connections',
    ['deployment_mode']
)

data_sync_operations = Counter(
    'data_sync_operations_total',
    'Total data synchronization operations',
    ['sync_type', 'status']
)

auth_operations = Counter(
    'auth_operations_total',
    'Total authentication operations',
    ['operation', 'deployment_mode', 'status']
)

message_routing = Counter(
    'message_routing_total',
    'Total message routing operations',
    ['message_type', 'routing_type']
)

class MetricsMiddleware(BaseHTTPMiddleware):
    """Prometheus metrics collection middleware"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Collect metrics for requests"""
        # Skip metrics collection for the metrics endpoint itself
        if request.url.path == "/metrics":
            return await call_next(request)
            
        # Start timing
        start_time = time.time()
        
        # Get endpoint pattern (simplified)
        endpoint = self._get_endpoint_pattern(request.url.path)
        method = request.method
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Record metrics
            request_count.labels(
                method=method,
                endpoint=endpoint,
                status_code=response.status_code
            ).inc()
            
            request_duration.labels(
                method=method,
                endpoint=endpoint
            ).observe(duration)
            
            return response
            
        except Exception as e:
            # Calculate duration for failed request
            duration = time.time() - start_time
            
            # Record error metrics
            request_count.labels(
                method=method,
                endpoint=endpoint,
                status_code=500
            ).inc()
            
            request_duration.labels(
                method=method,
                endpoint=endpoint
            ).observe(duration)
            
            # Re-raise exception
            raise
            
    def _get_endpoint_pattern(self, path: str) -> str:
        """Get endpoint pattern for metrics grouping"""
        # Simplify path patterns for better metrics grouping
        if path.startswith("/api/auth"):
            return "/api/auth"
        elif path.startswith("/api/sync"):
            return "/api/sync"
        elif path.startswith("/api/messages"):
            return "/api/messages"
        elif path.startswith("/api/config"):
            return "/api/config"
        elif path.startswith("/api/analytics"):
            return "/api/analytics"
        elif path.startswith("/ws/"):
            return "/ws"
        else:
            return path
            
# Metrics collection functions for other components
def record_websocket_connection(deployment_mode: str, connected: bool):
    """Record WebSocket connection metrics"""
    if connected:
        active_connections.labels(deployment_mode=deployment_mode).inc()
    else:
        active_connections.labels(deployment_mode=deployment_mode).dec()
        
def record_sync_operation(sync_type: str, status: str):
    """Record data sync operation metrics"""
    data_sync_operations.labels(sync_type=sync_type, status=status).inc()
    
def record_auth_operation(operation: str, deployment_mode: str, status: str):
    """Record authentication operation metrics"""
    auth_operations.labels(
        operation=operation,
        deployment_mode=deployment_mode,
        status=status
    ).inc()
    
def record_message_routing(message_type: str, routing_type: str):
    """Record message routing metrics"""
    message_routing.labels(
        message_type=message_type,
        routing_type=routing_type
    ).inc()
    
# Metrics endpoint handler
async def metrics_handler():
    """Return Prometheus metrics"""
    return Response(
        generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )
