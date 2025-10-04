from typing import Dict, Any, List
import structlog
import asyncio
from datetime import datetime, timezone
import psutil
import aiofiles
from ..utils.redis_client import RedisClient
from ..utils.supabase_client import SupabaseClient

logger = structlog.get_logger()

class HealthChecker:
    """System health monitoring and checks"""
    
    def __init__(self):
        self.redis_client = None
        self.supabase_client = None
        self.health_status = {
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc),
            "components": {}
        }
        
    async def initialize(self):
        """Initialize health checker"""
        self.redis_client = RedisClient()
        self.supabase_client = SupabaseClient()
        
        logger.info("Health Checker initialized")
        
    async def cleanup(self):
        """Cleanup health checker"""
        logger.info("Health Checker cleaned up")
        
    async def get_health_status(self) -> Dict[str, Any]:
        """Get comprehensive health status"""
        try:
            # Check all components
            components_health = {
                "redis": await self._check_redis_health(),
                "supabase": await self._check_supabase_health(),
                "system": await self._check_system_health(),
                "application": await self._check_application_health()
            }
            
            # Determine overall status
            overall_status = "healthy"
            critical_failures = []
            
            for component, health in components_health.items():
                if health["status"] == "unhealthy":
                    if component in ["redis", "supabase"]:
                        overall_status = "unhealthy"
                        critical_failures.append(component)
                    else:
                        overall_status = "degraded" if overall_status == "healthy" else overall_status
                        
            health_response = {
                "status": overall_status,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "components": components_health,
                "uptime_seconds": self._get_uptime(),
                "version": "1.0.0"
            }
            
            if critical_failures:
                health_response["critical_failures"] = critical_failures
                
            return health_response
            
        except Exception as e:
            logger.error("Error getting health status", error=str(e))
            return {
                "status": "unhealthy",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "error": str(e)
            }
            
    async def _check_redis_health(self) -> Dict[str, Any]:
        """Check Redis health"""
        try:
            if not self.redis_client:
                self.redis_client = RedisClient()
                
            if not self.redis_client.is_connected():
                await self.redis_client.connect()
                
            # Test Redis connection with a simple operation
            test_key = "health_check"
            await self.redis_client.set(test_key, "test")
            value = await self.redis_client.get(test_key)
            await self.redis_client.delete(test_key)
            
            if value == "test":
                return {
                    "status": "healthy",
                    "response_time_ms": 0,  # Could measure actual response time
                    "connected": True
                }
            else:
                return {
                    "status": "unhealthy",
                    "error": "Redis test operation failed",
                    "connected": False
                }
                
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "connected": False
            }
            
    async def _check_supabase_health(self) -> Dict[str, Any]:
        """Check Supabase health"""
        try:
            if not self.supabase_client:
                self.supabase_client = SupabaseClient()
                await self.supabase_client.initialize()
                
            # Test Supabase connection with a simple query
            # This could be a health check endpoint or simple table query
            response = await self.supabase_client.client.get(
                f"{self.supabase_client.base_url}/rest/v1/",
                headers={"Range": "0-0"}  # Minimal request
            )
            
            if response.status_code in [200, 206, 416]:  # Various acceptable responses
                return {
                    "status": "healthy",
                    "response_time_ms": 0,  # Could measure actual response time
                    "connected": True
                }
            else:
                return {
                    "status": "unhealthy",
                    "error": f"Supabase returned status {response.status_code}",
                    "connected": False
                }
                
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "connected": False
            }
            
    async def _check_system_health(self) -> Dict[str, Any]:
        """Check system resource health"""
        try:
            # Get system metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # Determine health based on thresholds
            status = "healthy"
            issues = []
            
            if cpu_percent > 90:
                status = "degraded"
                issues.append("High CPU usage")
            elif cpu_percent > 95:
                status = "unhealthy"
                issues.append("Critical CPU usage")
                
            if memory.percent > 90:
                status = "degraded"
                issues.append("High memory usage")
            elif memory.percent > 95:
                status = "unhealthy"
                issues.append("Critical memory usage")
                
            if disk.percent > 90:
                status = "degraded"
                issues.append("High disk usage")
            elif disk.percent > 95:
                status = "unhealthy"
                issues.append("Critical disk usage")
                
            return {
                "status": status,
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "disk_percent": disk.percent,
                "memory_available_gb": round(memory.available / (1024**3), 2),
                "disk_free_gb": round(disk.free / (1024**3), 2),
                "issues": issues
            }
            
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e)
            }
            
    async def _check_application_health(self) -> Dict[str, Any]:
        """Check application-specific health"""
        try:
            # Check if log files are writable
            log_writable = await self._check_log_writability()
            
            # Check active connections (this would need to be integrated with WebSocketHub)
            # For now, return basic application health
            
            status = "healthy"
            issues = []
            
            if not log_writable:
                status = "degraded"
                issues.append("Cannot write to log files")
                
            return {
                "status": status,
                "log_writable": log_writable,
                "issues": issues
            }
            
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e)
            }
            
    async def _check_log_writability(self) -> bool:
        """Check if log files are writable"""
        try:
            test_log_path = "logs/health_check.test"
            async with aiofiles.open(test_log_path, "w") as f:
                await f.write("test")
                
            # Clean up test file
            import os
            os.remove(test_log_path)
            return True
            
        except Exception:
            return False
            
    def _get_uptime(self) -> float:
        """Get application uptime in seconds"""
        # This would typically track from application start time
        # For now, return a placeholder
        return 0.0
