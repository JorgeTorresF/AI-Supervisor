from typing import Dict, List, Optional, Any, Set
import structlog
import asyncio
from datetime import datetime, timezone, timedelta
import json

from ..models.connection_models import ConnectionMetrics, ConnectionHealth, ReconnectAttempt
from ..utils.redis_client import RedisClient
from ..config import settings

logger = structlog.get_logger()

class ConnectionManager:
    """Manages persistent connections and handles reconnection logic"""
    
    def __init__(self):
        self.redis_client = None
        self.connection_metrics: Dict[str, ConnectionMetrics] = {}
        self.connection_health: Dict[str, ConnectionHealth] = {}
        self.reconnect_attempts: Dict[str, List[ReconnectAttempt]] = {}
        self.websocket_hub = None
        self._monitoring_task = None
        self._cleanup_task = None
        
    async def initialize(self):
        """Initialize the connection manager"""
        self.redis_client = RedisClient()
        await self.redis_client.connect()
        
        # Start monitoring tasks
        self._monitoring_task = asyncio.create_task(self._connection_monitoring_loop())
        self._cleanup_task = asyncio.create_task(self._cleanup_loop())
        
        logger.info("Connection Manager initialized")
        
    async def cleanup(self):
        """Cleanup resources"""
        if self._monitoring_task:
            self._monitoring_task.cancel()
            
        if self._cleanup_task:
            self._cleanup_task.cancel()
            
        if self.redis_client:
            await self.redis_client.disconnect()
            
        logger.info("Connection Manager cleaned up")
        
    async def register_connection(self, connection_id: str, deployment_mode: str, user_id: str):
        """Register a new connection for monitoring"""
        timestamp = datetime.now(timezone.utc)
        
        # Initialize connection metrics
        self.connection_metrics[connection_id] = ConnectionMetrics(
            connection_id=connection_id,
            deployment_mode=deployment_mode,
            user_id=user_id,
            connected_at=timestamp,
            last_activity=timestamp,
            messages_sent=0,
            messages_received=0,
            reconnect_count=0
        )
        
        # Initialize connection health
        self.connection_health[connection_id] = ConnectionHealth(
            connection_id=connection_id,
            status="healthy",
            last_heartbeat=timestamp,
            latency_ms=0,
            error_count=0,
            last_error=None
        )
        
        # Store in Redis for persistence
        await self._persist_connection_data(connection_id)
        
        logger.info("Connection registered", 
                   connection_id=connection_id,
                   deployment_mode=deployment_mode,
                   user_id=user_id)
                   
    async def unregister_connection(self, connection_id: str):
        """Unregister a connection"""
        # Update metrics with disconnect time
        if connection_id in self.connection_metrics:
            self.connection_metrics[connection_id].disconnected_at = datetime.now(timezone.utc)
            
        # Archive connection data before removing
        await self._archive_connection_data(connection_id)
        
        # Remove from active tracking
        self.connection_metrics.pop(connection_id, None)
        self.connection_health.pop(connection_id, None)
        self.reconnect_attempts.pop(connection_id, None)
        
        logger.info("Connection unregistered", connection_id=connection_id)
        
    async def update_connection_activity(self, connection_id: str, activity_type: str):
        """Update connection activity"""
        if connection_id not in self.connection_metrics:
            return
            
        metrics = self.connection_metrics[connection_id]
        health = self.connection_health[connection_id]
        
        # Update last activity
        metrics.last_activity = datetime.now(timezone.utc)
        health.last_heartbeat = datetime.now(timezone.utc)
        
        # Update message counts
        if activity_type == "message_sent":
            metrics.messages_sent += 1
        elif activity_type == "message_received":
            metrics.messages_received += 1
            
        # Update health status
        if health.status != "healthy":
            health.status = "healthy"
            health.error_count = 0
            health.last_error = None
            
        # Persist updates
        await self._persist_connection_data(connection_id)
        
    async def record_connection_error(self, connection_id: str, error: str):
        """Record connection error"""
        if connection_id not in self.connection_health:
            return
            
        health = self.connection_health[connection_id]
        health.error_count += 1
        health.last_error = error
        health.status = "unhealthy" if health.error_count >= 3 else "degraded"
        
        logger.warning("Connection error recorded", 
                      connection_id=connection_id,
                      error=error,
                      error_count=health.error_count)
                      
        await self._persist_connection_data(connection_id)
        
    async def handle_reconnection(self, old_connection_id: str, new_connection_id: str):
        """Handle connection reconnection"""
        if old_connection_id not in self.connection_metrics:
            return
            
        old_metrics = self.connection_metrics[old_connection_id]
        
        # Record reconnection attempt
        attempt = ReconnectAttempt(
            connection_id=old_connection_id,
            attempt_time=datetime.now(timezone.utc),
            success=True,
            new_connection_id=new_connection_id
        )
        
        if old_connection_id not in self.reconnect_attempts:
            self.reconnect_attempts[old_connection_id] = []
            
        self.reconnect_attempts[old_connection_id].append(attempt)
        
        # Update metrics
        old_metrics.reconnect_count += 1
        
        # Transfer metrics to new connection
        if new_connection_id in self.connection_metrics:
            new_metrics = self.connection_metrics[new_connection_id]
            new_metrics.messages_sent += old_metrics.messages_sent
            new_metrics.messages_received += old_metrics.messages_received
            new_metrics.reconnect_count = old_metrics.reconnect_count
            
        logger.info("Reconnection handled", 
                   old_connection_id=old_connection_id,
                   new_connection_id=new_connection_id,
                   reconnect_count=old_metrics.reconnect_count)
                   
        await self._persist_connection_data(new_connection_id)
        
    async def get_connection_health(self, connection_id: str) -> Optional[Dict[str, Any]]:
        """Get health status for a connection"""
        if connection_id not in self.connection_health:
            return None
            
        health = self.connection_health[connection_id]
        metrics = self.connection_metrics.get(connection_id)
        
        return {
            "connection_id": connection_id,
            "status": health.status,
            "last_heartbeat": health.last_heartbeat.isoformat(),
            "latency_ms": health.latency_ms,
            "error_count": health.error_count,
            "last_error": health.last_error,
            "uptime_seconds": (datetime.now(timezone.utc) - metrics.connected_at).total_seconds() if metrics else 0,
            "messages_sent": metrics.messages_sent if metrics else 0,
            "messages_received": metrics.messages_received if metrics else 0,
            "reconnect_count": metrics.reconnect_count if metrics else 0
        }
        
    async def get_user_connections(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all connections for a user"""
        user_connections = []
        
        for connection_id, metrics in self.connection_metrics.items():
            if metrics.user_id == user_id:
                health_data = await self.get_connection_health(connection_id)
                if health_data:
                    user_connections.append({
                        **health_data,
                        "deployment_mode": metrics.deployment_mode,
                        "connected_at": metrics.connected_at.isoformat(),
                        "last_activity": metrics.last_activity.isoformat()
                    })
                    
        return user_connections
        
    async def get_deployment_connections(self, deployment_mode: str) -> List[Dict[str, Any]]:
        """Get all connections for a deployment mode"""
        deployment_connections = []
        
        for connection_id, metrics in self.connection_metrics.items():
            if metrics.deployment_mode == deployment_mode:
                health_data = await self.get_connection_health(connection_id)
                if health_data:
                    deployment_connections.append({
                        **health_data,
                        "user_id": metrics.user_id,
                        "connected_at": metrics.connected_at.isoformat(),
                        "last_activity": metrics.last_activity.isoformat()
                    })
                    
        return deployment_connections
        
    async def _connection_monitoring_loop(self):
        """Monitor connection health and trigger alerts"""
        while True:
            try:
                await asyncio.sleep(30)  # Check every 30 seconds
                
                now = datetime.now(timezone.utc)
                
                for connection_id, health in self.connection_health.items():
                    metrics = self.connection_metrics.get(connection_id)
                    if not metrics:
                        continue
                        
                    # Check for stale connections
                    time_since_activity = now - metrics.last_activity
                    if time_since_activity > timedelta(seconds=settings.ws_connection_timeout):
                        health.status = "stale"
                        logger.warning("Stale connection detected", 
                                     connection_id=connection_id,
                                     last_activity=metrics.last_activity.isoformat())
                        
                    # Check for high error rates
                    if health.error_count > 10:
                        health.status = "unhealthy"
                        logger.error("Unhealthy connection detected", 
                                   connection_id=connection_id,
                                   error_count=health.error_count)
                        
                    # Update latency (this would typically be measured during heartbeat)
                    # For now, simulate based on activity
                    if time_since_activity < timedelta(seconds=60):
                        health.latency_ms = min(health.latency_ms + 1, 1000)
                    else:
                        health.latency_ms = max(health.latency_ms - 1, 0)
                        
                # Clean up old reconnection attempts
                cutoff_time = now - timedelta(hours=1)
                for connection_id, attempts in self.reconnect_attempts.items():
                    self.reconnect_attempts[connection_id] = [
                        attempt for attempt in attempts 
                        if attempt.attempt_time > cutoff_time
                    ]
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Error in connection monitoring loop", error=str(e))
                
    async def _cleanup_loop(self):
        """Clean up old connection data"""
        while True:
            try:
                await asyncio.sleep(3600)  # Run every hour
                
                now = datetime.now(timezone.utc)
                cutoff_time = now - timedelta(hours=24)
                
                # Remove old metrics for disconnected connections
                expired_connections = []
                for connection_id, metrics in self.connection_metrics.items():
                    if metrics.disconnected_at and metrics.disconnected_at < cutoff_time:
                        expired_connections.append(connection_id)
                        
                for connection_id in expired_connections:
                    await self.unregister_connection(connection_id)
                    
                logger.info("Connection cleanup completed", 
                           cleaned_connections=len(expired_connections))
                           
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Error in cleanup loop", error=str(e))
                
    async def _persist_connection_data(self, connection_id: str):
        """Persist connection data to Redis"""
        try:
            metrics = self.connection_metrics.get(connection_id)
            health = self.connection_health.get(connection_id)
            
            if metrics and health:
                data = {
                    "metrics": {
                        "connection_id": metrics.connection_id,
                        "deployment_mode": metrics.deployment_mode,
                        "user_id": metrics.user_id,
                        "connected_at": metrics.connected_at.isoformat(),
                        "last_activity": metrics.last_activity.isoformat(),
                        "messages_sent": metrics.messages_sent,
                        "messages_received": metrics.messages_received,
                        "reconnect_count": metrics.reconnect_count,
                        "disconnected_at": metrics.disconnected_at.isoformat() if metrics.disconnected_at else None
                    },
                    "health": {
                        "connection_id": health.connection_id,
                        "status": health.status,
                        "last_heartbeat": health.last_heartbeat.isoformat(),
                        "latency_ms": health.latency_ms,
                        "error_count": health.error_count,
                        "last_error": health.last_error
                    }
                }
                
                redis_key = f"connection_data:{connection_id}"
                await self.redis_client.setex(redis_key, 86400, data)  # 24 hour expiration
                
        except Exception as e:
            logger.error("Error persisting connection data", 
                        connection_id=connection_id,
                        error=str(e))
                        
    async def _archive_connection_data(self, connection_id: str):
        """Archive connection data before removal"""
        try:
            metrics = self.connection_metrics.get(connection_id)
            health = self.connection_health.get(connection_id)
            attempts = self.reconnect_attempts.get(connection_id, [])
            
            if metrics:
                archive_data = {
                    "connection_id": connection_id,
                    "metrics": {
                        "deployment_mode": metrics.deployment_mode,
                        "user_id": metrics.user_id,
                        "connected_at": metrics.connected_at.isoformat(),
                        "disconnected_at": metrics.disconnected_at.isoformat() if metrics.disconnected_at else datetime.now(timezone.utc).isoformat(),
                        "last_activity": metrics.last_activity.isoformat(),
                        "messages_sent": metrics.messages_sent,
                        "messages_received": metrics.messages_received,
                        "reconnect_count": metrics.reconnect_count
                    },
                    "final_health": {
                        "status": health.status if health else "unknown",
                        "error_count": health.error_count if health else 0,
                        "last_error": health.last_error if health else None
                    },
                    "reconnect_attempts": len(attempts),
                    "archived_at": datetime.now(timezone.utc).isoformat()
                }
                
                # Store in Redis archive
                redis_key = f"connection_archive:{connection_id}"
                await self.redis_client.setex(redis_key, 86400 * 7, archive_data)  # Keep for 7 days
                
                # Also add to daily archive list
                daily_key = f"daily_connections:{datetime.now(timezone.utc).strftime('%Y-%m-%d')}"
                await self.redis_client.sadd(daily_key, connection_id)
                await self.redis_client.expire(daily_key, 86400 * 30)  # Keep for 30 days
                
        except Exception as e:
            logger.error("Error archiving connection data", 
                        connection_id=connection_id,
                        error=str(e))
                        
    def set_websocket_hub(self, websocket_hub):
        """Set reference to WebSocket hub"""
        self.websocket_hub = websocket_hub
        
    def get_connection_stats(self) -> Dict[str, Any]:
        """Get overall connection statistics"""
        total_connections = len(self.connection_metrics)
        healthy_connections = len([h for h in self.connection_health.values() if h.status == "healthy"])
        unhealthy_connections = len([h for h in self.connection_health.values() if h.status == "unhealthy"])
        
        # Group by deployment mode
        deployment_stats = {}
        for metrics in self.connection_metrics.values():
            mode = metrics.deployment_mode
            if mode not in deployment_stats:
                deployment_stats[mode] = 0
            deployment_stats[mode] += 1
            
        # Calculate average metrics
        total_messages = sum(m.messages_sent + m.messages_received for m in self.connection_metrics.values())
        total_reconnects = sum(m.reconnect_count for m in self.connection_metrics.values())
        average_latency = sum(h.latency_ms for h in self.connection_health.values()) / len(self.connection_health) if self.connection_health else 0
        
        stats = {
            "total_connections": total_connections,
            "healthy_connections": healthy_connections,
            "unhealthy_connections": unhealthy_connections,
            "health_percentage": (healthy_connections / total_connections * 100) if total_connections > 0 else 0,
            "deployment_mode_breakdown": deployment_stats,
            "total_messages_processed": total_messages,
            "total_reconnections": total_reconnects,
            "average_latency_ms": round(average_latency, 2),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        return stats
