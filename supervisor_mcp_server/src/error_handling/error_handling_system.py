#!/usr/bin/env python3
"""
Comprehensive Error Handling System for Supervisor Agent

Provides auto-retry, rollback, escalation, and recovery capabilities.
"""

import asyncio
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List, Callable
from enum import Enum
import json
import uuid

class ErrorType(Enum):
    """Types of errors that can occur"""
    TASK_ERROR = "task_error"
    SYSTEM_ERROR = "system_error"
    VALIDATION_ERROR = "validation_error"
    TIMEOUT_ERROR = "timeout_error"
    RESOURCE_ERROR = "resource_error"
    UNKNOWN_ERROR = "unknown_error"

class RecoveryResult(Enum):
    """Results of recovery operations"""
    SUCCESS = "success"
    FAILED = "failed"
    REQUIRES_ESCALATION = "requires_escalation"
    AGENT_PAUSED = "agent_paused"

class SupervisorError(Exception):
    """Enhanced error class for supervisor operations"""
    
    def __init__(self, message: str, error_type: ErrorType = ErrorType.UNKNOWN_ERROR, 
                 context: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.error_id = str(uuid.uuid4())
        self.message = message
        self.error_type = error_type
        self.context = context or {}
        self.timestamp = datetime.now().isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary"""
        return {
            'error_id': self.error_id,
            'message': self.message,
            'error_type': self.error_type.value,
            'context': self.context,
            'timestamp': self.timestamp
        }

class ErrorClassifier:
    """Classifies exceptions into error types"""
    
    @staticmethod
    def classify_exception(exception: Exception) -> ErrorType:
        """Classify an exception into an error type"""
        if isinstance(exception, TimeoutError):
            return ErrorType.TIMEOUT_ERROR
        elif isinstance(exception, ValueError):
            return ErrorType.VALIDATION_ERROR
        elif isinstance(exception, RuntimeError):
            return ErrorType.SYSTEM_ERROR
        else:
            return ErrorType.UNKNOWN_ERROR

class RetrySystem:
    """Handles automatic retries with progressive strategies"""
    
    def __init__(self, max_retries: int = 3):
        self.max_retries = max_retries
        self.retry_delays = [1, 2, 4]  # Progressive backoff
    
    async def execute_with_retry(self, operation: Callable, 
                               context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute operation with retry logic"""
        last_error = None
        
        for attempt in range(self.max_retries):
            try:
                result = await operation()
                return {
                    'success': True,
                    'result': result,
                    'attempts': attempt + 1
                }
            except Exception as e:
                last_error = e
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(self.retry_delays[attempt])
        
        return {
            'success': False,
            'error': str(last_error),
            'attempts': self.max_retries
        }

class RollbackManager:
    """Manages state snapshots and rollback operations"""
    
    def __init__(self, storage_path: Path = None, max_snapshots: int = 50):
        self.storage_path = storage_path or Path("snapshots")
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.max_snapshots = max_snapshots
        self.snapshots = {}  # snapshot_id -> snapshot_data
    
    def create_snapshot(self, state_data: Dict[str, Any], 
                       tags: List[str] = None, 
                       metadata: Dict[str, Any] = None,
                       agent_id: str = None,
                       task_id: str = None) -> str:
        """Create a state snapshot"""
        snapshot_id = str(uuid.uuid4())
        
        snapshot = {
            'snapshot_id': snapshot_id,
            'timestamp': datetime.now().isoformat(),
            'state_data': state_data,
            'tags': tags or [],
            'metadata': metadata or {},
            'agent_id': agent_id,
            'task_id': task_id
        }
        
        self.snapshots[snapshot_id] = snapshot
        
        # Save to disk
        snapshot_file = self.storage_path / f"{snapshot_id}.json"
        with open(snapshot_file, 'w') as f:
            json.dump(snapshot, f, indent=2)
        
        # Cleanup old snapshots if needed
        if len(self.snapshots) > self.max_snapshots:
            oldest_id = min(self.snapshots.keys(), 
                           key=lambda k: self.snapshots[k]['timestamp'])
            self._remove_snapshot(oldest_id)
        
        return snapshot_id
    
    def rollback_to_snapshot(self, snapshot_id: str) -> Dict[str, Any]:
        """Rollback to a specific snapshot"""
        if snapshot_id not in self.snapshots:
            return {
                'success': False,
                'error': f'Snapshot {snapshot_id} not found'
            }
        
        snapshot = self.snapshots[snapshot_id]
        
        return {
            'success': True,
            'snapshot_id': snapshot_id,
            'state_data': snapshot['state_data'],
            'timestamp': snapshot['timestamp']
        }
    
    def list_snapshots(self, agent_id: str = None, 
                      task_id: str = None, 
                      limit: int = 10) -> List[Dict[str, Any]]:
        """List available snapshots"""
        snapshots = list(self.snapshots.values())
        
        # Filter by agent_id if provided
        if agent_id:
            snapshots = [s for s in snapshots if s.get('agent_id') == agent_id]
        
        # Filter by task_id if provided  
        if task_id:
            snapshots = [s for s in snapshots if s.get('task_id') == task_id]
        
        # Sort by timestamp (newest first)
        snapshots.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return snapshots[:limit]
    
    def _remove_snapshot(self, snapshot_id: str):
        """Remove a snapshot"""
        if snapshot_id in self.snapshots:
            del self.snapshots[snapshot_id]
            
        # Remove file
        snapshot_file = self.storage_path / f"{snapshot_id}.json"
        if snapshot_file.exists():
            snapshot_file.unlink()

class EscalationHandler:
    """Handles escalation to human oversight"""
    
    def __init__(self, storage_path: Path = None):
        self.storage_path = storage_path or Path("escalations")
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.escalations = {}
    
    def escalate_error(self, error: SupervisorError, 
                      context: Dict[str, Any]) -> str:
        """Escalate an error for human intervention"""
        ticket_id = str(uuid.uuid4())
        
        escalation = {
            'ticket_id': ticket_id,
            'timestamp': datetime.now().isoformat(),
            'error': error.to_dict(),
            'context': context,
            'status': 'open',
            'priority': self._determine_priority(error, context)
        }
        
        self.escalations[ticket_id] = escalation
        
        # Save to disk
        escalation_file = self.storage_path / f"{ticket_id}.json"
        with open(escalation_file, 'w') as f:
            json.dump(escalation, f, indent=2)
        
        return ticket_id
    
    def _determine_priority(self, error: SupervisorError, 
                          context: Dict[str, Any]) -> str:
        """Determine escalation priority"""
        if error.error_type == ErrorType.SYSTEM_ERROR:
            return 'high'
        elif error.error_type == ErrorType.TIMEOUT_ERROR:
            return 'medium'
        else:
            return 'low'
    
    def configure_escalation(self, agent_id: str, config: Dict[str, Any]):
        """Configure escalation settings for an agent"""
        # Store escalation configuration
        pass

class LoopDetector:
    """Detects execution loops and infinite patterns"""
    
    def __init__(self):
        self.execution_history = []
        self.paused_agents = {}
    
    def record_execution_point(self, agent_id: str, task_id: str, 
                             state: Dict[str, Any], output: str, 
                             context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Record execution point and check for loops"""
        execution_point = {
            'agent_id': agent_id,
            'task_id': task_id,
            'state_hash': hash(str(state)),
            'output_hash': hash(output),
            'timestamp': datetime.now().isoformat()
        }
        
        self.execution_history.append(execution_point)
        
        # Simple loop detection - check for repeated states
        recent_points = self.execution_history[-10:]  # Last 10 points
        state_counts = {}
        
        for point in recent_points:
            if point['agent_id'] == agent_id:
                state_hash = point['state_hash']
                state_counts[state_hash] = state_counts.get(state_hash, 0) + 1
        
        # If same state appears 3+ times, it's likely a loop
        max_count = max(state_counts.values()) if state_counts else 0
        if max_count >= 3:
            return {
                'loop_detected': True,
                'agent_id': agent_id,
                'loop_type': 'state_loop',
                'severity': 'high',
                'repetitions': max_count
            }
        
        return None
    
    def pause_agent(self, agent_id: str, reason: str):
        """Pause an agent due to loop detection"""
        self.paused_agents[agent_id] = {
            'reason': reason,
            'timestamp': datetime.now().isoformat()
        }

class HistoryManager:
    """Manages execution history and versioning"""
    
    def __init__(self, storage_path: Path = None):
        self.storage_path = storage_path or Path("history")
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.histories = {}  # history_id -> history_data
    
    def create_history(self, agent_id: str, task_id: str, 
                      initial_data: Dict[str, Any]) -> str:
        """Create a new execution history"""
        history_id = str(uuid.uuid4())
        
        history = {
            'history_id': history_id,
            'agent_id': agent_id,
            'task_id': task_id,
            'created_at': datetime.now().isoformat(),
            'initial_data': initial_data,
            'entries': []
        }
        
        self.histories[history_id] = history
        return history_id
    
    def add_entry(self, history_id: str, event_type: str, 
                 data: Dict[str, Any], metadata: Dict[str, Any] = None,
                 agent_id: str = None, task_id: str = None):
        """Add entry to execution history"""
        if history_id not in self.histories:
            return
        
        entry = {
            'timestamp': datetime.now().isoformat(),
            'event_type': event_type,
            'data': data,
            'metadata': metadata or {}
        }
        
        self.histories[history_id]['entries'].append(entry)

class RecoveryOrchestrator:
    """Orchestrates comprehensive error recovery"""
    
    def __init__(self, retry_system: RetrySystem, 
                 rollback_manager: RollbackManager,
                 escalation_handler: EscalationHandler,
                 loop_detector: LoopDetector,
                 history_manager: HistoryManager):
        self.retry_system = retry_system
        self.rollback_manager = rollback_manager
        self.escalation_handler = escalation_handler
        self.loop_detector = loop_detector
        self.history_manager = history_manager
        self.logger = logging.getLogger(__name__)
    
    async def recover_from_error(self, error: SupervisorError, 
                               context: Dict[str, Any],
                               agent_id: str, task_id: str,
                               recovery_callback: Optional[Callable] = None) -> RecoveryResult:
        """Orchestrate comprehensive error recovery"""
        
        self.logger.info(f"Starting recovery for error: {error.error_type.value}")
        
        # Step 1: Try auto-retry if appropriate
        if error.error_type in [ErrorType.TIMEOUT_ERROR, ErrorType.RESOURCE_ERROR]:
            if recovery_callback:
                retry_result = await self.retry_system.execute_with_retry(
                    recovery_callback, context
                )
                
                if retry_result['success']:
                    return RecoveryResult.SUCCESS
        
        # Step 2: Try rollback if available
        snapshots = self.rollback_manager.list_snapshots(agent_id=agent_id, limit=3)
        if snapshots:
            rollback_result = self.rollback_manager.rollback_to_snapshot(
                snapshots[0]['snapshot_id']
            )
            
            if rollback_result['success']:
                # Try recovery with rolled back state
                if recovery_callback:
                    try:
                        await recovery_callback()
                        return RecoveryResult.SUCCESS
                    except Exception:
                        pass  # Continue to escalation
        
        # Step 3: Escalate if other methods failed
        if self.escalation_handler:
            ticket_id = self.escalation_handler.escalate_error(error, context)
            self.logger.info(f"Error escalated with ticket ID: {ticket_id}")
            return RecoveryResult.REQUIRES_ESCALATION
        
        return RecoveryResult.FAILED

class SupervisorErrorHandlingSystem:
    """Main error handling system that integrates all components"""
    
    def __init__(self, storage_path: Optional[Path] = None, 
                 max_retries: int = 3, max_snapshots: int = 50,
                 escalation_enabled: bool = True):
        
        self.storage_path = storage_path or Path("supervisor_data/error_handling")
        self.storage_path.mkdir(parents=True, exist_ok=True)
        
        self.logger = logging.getLogger(__name__)
        
        # Initialize subsystems
        self.retry_system = RetrySystem(max_retries=max_retries)
        self.rollback_manager = RollbackManager(
            storage_path=self.storage_path / "snapshots",
            max_snapshots=max_snapshots
        )
        self.escalation_handler = EscalationHandler(
            storage_path=self.storage_path / "escalations"
        ) if escalation_enabled else None
        
        self.loop_detector = LoopDetector()
        self.history_manager = HistoryManager(
            storage_path=self.storage_path / "history"
        )
        
        # Initialize recovery orchestrator
        self.recovery_orchestrator = RecoveryOrchestrator(
            retry_system=self.retry_system,
            rollback_manager=self.rollback_manager,
            escalation_handler=self.escalation_handler,
            loop_detector=self.loop_detector,
            history_manager=self.history_manager
        )
        
        self.logger.info("Error handling system initialized")
    
    async def handle_error(self, error: Exception, agent_id: str, 
                          task_id: str, context: Optional[Dict[str, Any]] = None,
                          state_data: Optional[Dict[str, Any]] = None,
                          recovery_callback: Optional[Callable] = None) -> Dict[str, Any]:
        """Main error handling entry point"""
        
        # Convert to SupervisorError if needed
        if isinstance(error, SupervisorError):
            supervisor_error = error
        else:
            error_type = ErrorClassifier.classify_exception(error)
            supervisor_error = SupervisorError(
                message=str(error),
                error_type=error_type,
                context={"agent_id": agent_id, "task_id": task_id, **(context or {})}
            )
        
        # Create history
        history_id = self.history_manager.create_history(
            agent_id=agent_id,
            task_id=task_id,
            initial_data=state_data or {}
        )
        
        # Create snapshot if state data provided
        snapshot_id = None
        if state_data:
            snapshot_id = self.rollback_manager.create_snapshot(
                state_data=state_data,
                tags=["error_handling", "pre_recovery"],
                agent_id=agent_id,
                task_id=task_id
            )
        
        # Execute recovery
        recovery_context = (context or {}).copy()
        recovery_context.update({
            "agent_id": agent_id,
            "task_id": task_id,
            "history_id": history_id,
            "snapshot_id": snapshot_id
        })
        
        recovery_result = await self.recovery_orchestrator.recover_from_error(
            error=supervisor_error,
            context=recovery_context,
            agent_id=agent_id,
            task_id=task_id,
            recovery_callback=recovery_callback
        )
        
        return {
            'success': recovery_result == RecoveryResult.SUCCESS,
            'recovery_result': recovery_result.value,
            'error_handled': True,
            'history_id': history_id,
            'snapshot_id': snapshot_id,
            'timestamp': datetime.now().isoformat(),
            'error_id': supervisor_error.error_id
        }
