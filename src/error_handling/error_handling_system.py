"""Main Error Handling System - Orchestrates all error handling components."""

import asyncio
import logging
import traceback
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any, Callable, Union
from dataclasses import dataclass, asdict
import json

from .auto_retry_system import AutoRetrySystem
from .rollback_system import RollbackSystem
from .escalation_system import EscalationSystem
from .loop_detector import LoopDetector
from .history_manager import HistoryManager
from .recovery_orchestrator import RecoveryOrchestrator


class ErrorSeverity(Enum):
    """Error severity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ErrorType(Enum):
    """Types of errors the system can handle."""
    AGENT_FAILURE = "agent_failure"
    TOOL_FAILURE = "tool_failure"
    COMMUNICATION_ERROR = "communication_error"
    TIMEOUT_ERROR = "timeout_error"
    VALIDATION_ERROR = "validation_error"
    INFINITE_LOOP = "infinite_loop"
    RESOURCE_ERROR = "resource_error"
    CONFIGURATION_ERROR = "configuration_error"
    UNKNOWN_ERROR = "unknown_error"


@dataclass
class ErrorContext:
    """Context information for an error."""
    error_id: str
    error_type: ErrorType
    severity: ErrorSeverity
    timestamp: datetime
    agent_id: str
    task_id: str
    error_message: str
    stack_trace: str
    context_data: Dict[str, Any]
    retry_count: int = 0
    recovery_attempts: List[str] = None
    
    def __post_init__(self):
        if self.recovery_attempts is None:
            self.recovery_attempts = []


class ErrorHandlingSystem:
    """Main error handling system that orchestrates all recovery mechanisms."""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or self._default_config()
        self.logger = logging.getLogger(__name__)
        
        # Initialize subsystems
        self.auto_retry = AutoRetrySystem(self.config.get('retry', {}))
        self.rollback_system = RollbackSystem(self.config.get('rollback', {}))
        self.escalation_system = EscalationSystem(self.config.get('escalation', {}))
        self.loop_detector = LoopDetector(self.config.get('loop_detection', {}))
        self.history_manager = HistoryManager(self.config.get('history', {}))
        self.recovery_orchestrator = RecoveryOrchestrator({
            'auto_retry': self.auto_retry,
            'rollback_system': self.rollback_system,
            'escalation_system': self.escalation_system,
            'loop_detector': self.loop_detector,
            'history_manager': self.history_manager
        })
        
        # Active error contexts
        self.active_errors: Dict[str, ErrorContext] = {}
        
        # Error handling statistics
        self.stats = {
            'total_errors': 0,
            'successful_recoveries': 0,
            'failed_recoveries': 0,
            'escalations': 0
        }
    
    def _default_config(self) -> Dict[str, Any]:
        """Default configuration for the error handling system."""
        return {
            'retry': {
                'max_retries': 3,
                'base_delay': 1.0,
                'backoff_multiplier': 2.0,
                'max_delay': 30.0
            },
            'rollback': {
                'max_snapshots': 10,
                'cleanup_after_hours': 24
            },
            'escalation': {
                'max_auto_recovery_attempts': 5,
                'escalation_timeout': 300,
                'notify_on_critical': True
            },
            'loop_detection': {
                'max_iterations': 50,
                'similarity_threshold': 0.8,
                'time_window': 300
            },
            'history': {
                'max_versions': 100,
                'retention_days': 30
            }
        }
    
    async def handle_error(
        self,
        error: Exception,
        context: Dict[str, Any],
        recovery_callback: Optional[Callable] = None
    ) -> Dict[str, Any]:
        """Main entry point for error handling."""
        
        # Create error context
        error_context = self._create_error_context(error, context)
        self.active_errors[error_context.error_id] = error_context
        
        self.logger.error(
            f"Handling error {error_context.error_id}: {error_context.error_message}"
        )
        
        # Record in history
        await self.history_manager.record_error(error_context)
        
        # Check for infinite loops
        if await self.loop_detector.check_for_loop(error_context):
            error_context.error_type = ErrorType.INFINITE_LOOP
            error_context.severity = ErrorSeverity.HIGH
            self.logger.warning(f"Infinite loop detected for error {error_context.error_id}")
        
        # Attempt recovery
        recovery_result = await self.recovery_orchestrator.orchestrate_recovery(
            error_context, recovery_callback
        )
        
        # Update statistics
        self._update_stats(recovery_result)
        
        # Clean up if recovery successful
        if recovery_result.get('success', False):
            self.active_errors.pop(error_context.error_id, None)
        
        return recovery_result
    
    def _create_error_context(self, error: Exception, context: Dict[str, Any]) -> ErrorContext:
        """Create an error context from an exception and context data."""
        import uuid
        
        error_id = str(uuid.uuid4())
        error_type = self._classify_error(error)
        severity = self._determine_severity(error, error_type)
        
        return ErrorContext(
            error_id=error_id,
            error_type=error_type,
            severity=severity,
            timestamp=datetime.utcnow(),
            agent_id=context.get('agent_id', 'unknown'),
            task_id=context.get('task_id', 'unknown'),
            error_message=str(error),
            stack_trace=traceback.format_exc(),
            context_data=context
        )
    
    def _classify_error(self, error: Exception) -> ErrorType:
        """Classify error type based on exception."""
        error_type_map = {
            TimeoutError: ErrorType.TIMEOUT_ERROR,
            ConnectionError: ErrorType.COMMUNICATION_ERROR,
            ValueError: ErrorType.VALIDATION_ERROR,
            KeyError: ErrorType.CONFIGURATION_ERROR,
            MemoryError: ErrorType.RESOURCE_ERROR,
            PermissionError: ErrorType.RESOURCE_ERROR
        }
        
        for exc_type, error_type in error_type_map.items():
            if isinstance(error, exc_type):
                return error_type
        
        return ErrorType.UNKNOWN_ERROR
    
    def _determine_severity(self, error: Exception, error_type: ErrorType) -> ErrorSeverity:
        """Determine error severity based on error type and context."""
        severity_map = {
            ErrorType.INFINITE_LOOP: ErrorSeverity.CRITICAL,
            ErrorType.RESOURCE_ERROR: ErrorSeverity.HIGH,
            ErrorType.AGENT_FAILURE: ErrorSeverity.HIGH,
            ErrorType.TIMEOUT_ERROR: ErrorSeverity.MEDIUM,
            ErrorType.COMMUNICATION_ERROR: ErrorSeverity.MEDIUM,
            ErrorType.VALIDATION_ERROR: ErrorSeverity.LOW,
            ErrorType.CONFIGURATION_ERROR: ErrorSeverity.MEDIUM
        }
        
        return severity_map.get(error_type, ErrorSeverity.LOW)
    
    def _update_stats(self, recovery_result: Dict[str, Any]):
        """Update error handling statistics."""
        self.stats['total_errors'] += 1
        
        if recovery_result.get('success', False):
            self.stats['successful_recoveries'] += 1
        else:
            self.stats['failed_recoveries'] += 1
        
        if recovery_result.get('escalated', False):
            self.stats['escalations'] += 1
    
    async def get_system_health(self) -> Dict[str, Any]:
        """Get current system health status."""
        return {
            'active_errors': len(self.active_errors),
            'stats': self.stats,
            'subsystem_status': {
                'auto_retry': await self.auto_retry.get_status(),
                'rollback_system': await self.rollback_system.get_status(),
                'escalation_system': await self.escalation_system.get_status(),
                'loop_detector': await self.loop_detector.get_status(),
                'history_manager': await self.history_manager.get_status()
            },
            'timestamp': datetime.utcnow().isoformat()
        }
    
    async def shutdown(self):
        """Gracefully shutdown the error handling system."""
        self.logger.info("Shutting down error handling system")
        
        # Shutdown all subsystems
        await self.auto_retry.shutdown()
        await self.rollback_system.shutdown()
        await self.escalation_system.shutdown()
        await self.loop_detector.shutdown()
        await self.history_manager.shutdown()
        await self.recovery_orchestrator.shutdown()
        
        # Clear active errors
        self.active_errors.clear()
        
        self.logger.info("Error handling system shutdown complete")
