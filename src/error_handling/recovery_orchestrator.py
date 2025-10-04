"""Recovery Orchestrator - Coordinates all recovery mechanisms and strategies."""

import asyncio
import logging
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass


class RecoveryStrategy(Enum):
    """Available recovery strategies."""
    AUTO_RETRY = "auto_retry"
    ROLLBACK = "rollback"
    ESCALATION = "escalation"
    CIRCUIT_BREAKER = "circuit_breaker"
    HYBRID = "hybrid"
    MANUAL = "manual"


class RecoveryPhase(Enum):
    """Phases of recovery process."""
    ASSESSMENT = "assessment"
    STRATEGY_SELECTION = "strategy_selection"
    EXECUTION = "execution"
    VALIDATION = "validation"
    COMPLETION = "completion"
    FAILURE = "failure"


@dataclass
class RecoveryPlan:
    """Represents a recovery plan."""
    plan_id: str
    error_context: Dict[str, Any]
    strategies: List[RecoveryStrategy]
    priority: int
    estimated_duration: float
    success_probability: float
    fallback_plan: Optional[str] = None
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class RecoveryOrchestrator:
    """Orchestrates recovery operations using all available systems."""
    
    def __init__(self, systems: Dict[str, Any]):
        self.auto_retry = systems.get('auto_retry')
        self.rollback_system = systems.get('rollback_system')
        self.escalation_system = systems.get('escalation_system')
        self.loop_detector = systems.get('loop_detector')
        self.history_manager = systems.get('history_manager')
        
        self.logger = logging.getLogger(__name__)
        
        # Active recovery operations
        self.active_recoveries: Dict[str, Dict[str, Any]] = {}
        
        # Recovery statistics
        self.stats = {
            'total_recoveries': 0,
            'successful_recoveries': 0,
            'failed_recoveries': 0,
            'by_strategy': {strategy.value: 0 for strategy in RecoveryStrategy},
            'average_recovery_time': 0.0
        }
    
    async def orchestrate_recovery(
        self,
        error_context: 'ErrorContext',
        recovery_callback: Optional[Callable] = None
    ) -> Dict[str, Any]:
        """Main orchestration method for error recovery."""
        
        recovery_id = f"recovery_{error_context.error_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        start_time = datetime.utcnow()
        
        self.logger.info(f"Starting recovery orchestration {recovery_id} for error {error_context.error_id}")
        
        try:
            # Record start of recovery
            await self.history_manager.record_recovery(
                agent_id=error_context.agent_id,
                task_id=error_context.task_id,
                recovery_data={
                    'recovery_id': recovery_id,
                    'phase': RecoveryPhase.ASSESSMENT.value,
                    'error_context': error_context.error_id,
                    'start_time': start_time.isoformat()
                },
                metadata={'orchestrator': 'error_handling_system'}
            )
            
            # Phase 1: Assessment
            assessment = await self._assess_situation(error_context)
            
            # Phase 2: Strategy Selection
            recovery_plan = await self._select_recovery_strategy(error_context, assessment)
            
            # Phase 3: Execution
            recovery_result = await self._execute_recovery_plan(
                recovery_plan, error_context, recovery_callback
            )
            
            # Phase 4: Validation
            validation_result = await self._validate_recovery(recovery_result, error_context)
            
            # Phase 5: Completion or Failure
            final_result = await self._complete_recovery(
                recovery_id, recovery_result, validation_result, start_time
            )
            
            return final_result
            
        except Exception as e:
            self.logger.error(f"Recovery orchestration {recovery_id} failed: {str(e)}")
            
            return await self._handle_orchestration_failure(
                recovery_id, error_context, str(e), start_time
            )
    
    async def _assess_situation(
        self,
        error_context: 'ErrorContext'
    ) -> Dict[str, Any]:
        """Assess the current situation and gather context."""
        
        assessment = {
            'error_analysis': {
                'type': error_context.error_type.value,
                'severity': error_context.severity.value,
                'retry_count': error_context.retry_count,
                'is_recurring': len(error_context.recovery_attempts) > 0
            },
            'agent_status': {
                'agent_id': error_context.agent_id,
                'is_paused': await self.loop_detector.is_agent_paused(error_context.agent_id),
                'loop_detected': False
            },
            'system_state': {
                'available_snapshots': 0,
                'recent_interventions': 0,
                'escalation_history': 0
            },
            'recovery_context': {
                'previous_attempts': error_context.recovery_attempts,
                'can_retry': False,
                'can_rollback': False,
                'should_escalate': False
            }
        }
        
        # Check for loop detection
        loop_detected = await self.loop_detector.check_for_loop(error_context)
        assessment['agent_status']['loop_detected'] = loop_detected
        
        # Check retry eligibility
        can_retry = await self.auto_retry.should_retry(error_context, error_context.retry_count)
        assessment['recovery_context']['can_retry'] = can_retry
        
        # Check available snapshots
        snapshots = await self.rollback_system.get_snapshots(
            agent_id=error_context.agent_id,
            task_id=error_context.task_id,
            limit=5
        )
        assessment['system_state']['available_snapshots'] = len(snapshots)
        assessment['recovery_context']['can_rollback'] = len(snapshots) > 0
        
        # Check escalation necessity
        escalation_level = await self.escalation_system.evaluate_escalation(
            error_context, error_context.recovery_attempts
        )
        assessment['recovery_context']['should_escalate'] = escalation_level.value != 'auto_recovery'
        
        # Get recent history
        recent_history = await self.history_manager.get_history(
            agent_id=error_context.agent_id,
            task_id=error_context.task_id,
            limit=10
        )
        assessment['system_state']['recent_interventions'] = len([
            h for h in recent_history if h['entry_type'] == 'intervention'
        ])
        
        return assessment
    
    async def _select_recovery_strategy(
        self,
        error_context: 'ErrorContext',
        assessment: Dict[str, Any]
    ) -> RecoveryPlan:
        """Select the best recovery strategy based on assessment."""
        
        import uuid
        plan_id = str(uuid.uuid4())
        
        # Determine strategy based on assessment
        strategies = []
        priority = 1
        success_probability = 0.5
        
        # If loop detected, use circuit breaker first
        if assessment['agent_status']['loop_detected']:
            strategies.append(RecoveryStrategy.CIRCUIT_BREAKER)
            priority = 10
            success_probability = 0.9
        
        # If critical error or too many attempts, escalate
        elif (
            assessment['recovery_context']['should_escalate'] or
            error_context.severity.value == 'critical' or
            len(error_context.recovery_attempts) >= 3
        ):
            strategies.append(RecoveryStrategy.ESCALATION)
            priority = 8
            success_probability = 0.7
        
        # If snapshots available and retry failed multiple times, try rollback
        elif (
            assessment['recovery_context']['can_rollback'] and
            error_context.retry_count >= 2
        ):
            strategies.append(RecoveryStrategy.ROLLBACK)
            strategies.append(RecoveryStrategy.AUTO_RETRY)  # Fallback
            priority = 6
            success_probability = 0.8
        
        # If can retry, try that first
        elif assessment['recovery_context']['can_retry']:
            strategies.append(RecoveryStrategy.AUTO_RETRY)
            priority = 3
            success_probability = 0.6
        
        # Hybrid approach for complex situations
        elif len(error_context.recovery_attempts) > 0:
            strategies.append(RecoveryStrategy.HYBRID)
            priority = 5
            success_probability = 0.65
        
        # Default to escalation if no clear strategy
        else:
            strategies.append(RecoveryStrategy.ESCALATION)
            priority = 2
            success_probability = 0.5
        
        # Estimate duration based on strategies
        duration_map = {
            RecoveryStrategy.AUTO_RETRY: 30.0,
            RecoveryStrategy.ROLLBACK: 60.0,
            RecoveryStrategy.ESCALATION: 300.0,
            RecoveryStrategy.CIRCUIT_BREAKER: 10.0,
            RecoveryStrategy.HYBRID: 120.0,
            RecoveryStrategy.MANUAL: 1800.0
        }
        
        estimated_duration = sum(duration_map.get(s, 60.0) for s in strategies)
        
        plan = RecoveryPlan(
            plan_id=plan_id,
            error_context={
                'error_id': error_context.error_id,
                'agent_id': error_context.agent_id,
                'task_id': error_context.task_id
            },
            strategies=strategies,
            priority=priority,
            estimated_duration=estimated_duration,
            success_probability=success_probability,
            metadata={
                'assessment_summary': assessment,
                'created_at': datetime.utcnow().isoformat()
            }
        )
        
        self.logger.info(
            f"Selected recovery strategy: {[s.value for s in strategies]} "
            f"with priority {priority} and success probability {success_probability}"
        )
        
        return plan
    
    async def _execute_recovery_plan(
        self,
        plan: RecoveryPlan,
        error_context: 'ErrorContext',
        recovery_callback: Optional[Callable]
    ) -> Dict[str, Any]:
        """Execute the recovery plan."""
        
        results = []
        overall_success = False
        
        for strategy in plan.strategies:
            self.logger.info(f"Executing recovery strategy: {strategy.value}")
            
            try:
                result = await self._execute_strategy(
                    strategy, error_context, recovery_callback, plan
                )
                
                results.append({
                    'strategy': strategy.value,
                    'result': result,
                    'timestamp': datetime.utcnow().isoformat()
                })
                
                # Update statistics
                self.stats['by_strategy'][strategy.value] += 1
                
                # If this strategy succeeded, we can stop
                if result.get('success', False):
                    overall_success = True
                    break
                    
            except Exception as e:
                self.logger.error(f"Strategy {strategy.value} failed: {str(e)}")
                
                results.append({
                    'strategy': strategy.value,
                    'result': {'success': False, 'error': str(e)},
                    'timestamp': datetime.utcnow().isoformat()
                })
        
        return {
            'success': overall_success,
            'plan_id': plan.plan_id,
            'executed_strategies': results,
            'execution_time': datetime.utcnow().isoformat()
        }
    
    async def _execute_strategy(
        self,
        strategy: RecoveryStrategy,
        error_context: 'ErrorContext',
        recovery_callback: Optional[Callable],
        plan: RecoveryPlan
    ) -> Dict[str, Any]:
        """Execute a specific recovery strategy."""
        
        if strategy == RecoveryStrategy.AUTO_RETRY:
            return await self._execute_auto_retry(error_context, recovery_callback)
        
        elif strategy == RecoveryStrategy.ROLLBACK:
            return await self._execute_rollback(error_context)
        
        elif strategy == RecoveryStrategy.ESCALATION:
            return await self._execute_escalation(error_context)
        
        elif strategy == RecoveryStrategy.CIRCUIT_BREAKER:
            return await self._execute_circuit_breaker(error_context)
        
        elif strategy == RecoveryStrategy.HYBRID:
            return await self._execute_hybrid_recovery(error_context, recovery_callback, plan)
        
        elif strategy == RecoveryStrategy.MANUAL:
            return await self._execute_manual_recovery(error_context)
        
        else:
            return {'success': False, 'error': f'Unknown strategy: {strategy.value}'}
    
    async def _execute_auto_retry(
        self,
        error_context: 'ErrorContext',
        recovery_callback: Optional[Callable]
    ) -> Dict[str, Any]:
        """Execute auto-retry strategy."""
        
        if not recovery_callback:
            return {'success': False, 'error': 'No recovery callback provided for retry'}
        
        return await self.auto_retry.execute_retry(
            error_context, recovery_callback
        )
    
    async def _execute_rollback(
        self,
        error_context: 'ErrorContext'
    ) -> Dict[str, Any]:
        """Execute rollback strategy."""
        
        # Get most recent snapshot
        snapshots = await self.rollback_system.get_snapshots(
            agent_id=error_context.agent_id,
            task_id=error_context.task_id,
            limit=1
        )
        
        if not snapshots:
            return {'success': False, 'error': 'No snapshots available for rollback'}
        
        snapshot_id = snapshots[0]['snapshot_id']
        
        return await self.rollback_system.rollback_to_snapshot(snapshot_id)
    
    async def _execute_escalation(
        self,
        error_context: 'ErrorContext'
    ) -> Dict[str, Any]:
        """Execute escalation strategy."""
        
        ticket_id = await self.escalation_system.create_escalation(
            error_context, error_context.recovery_attempts
        )
        
        return {
            'success': True,
            'escalation_ticket': ticket_id,
            'action': 'escalated_to_human_intervention'
        }
    
    async def _execute_circuit_breaker(
        self,
        error_context: 'ErrorContext'
    ) -> Dict[str, Any]:
        """Execute circuit breaker strategy."""
        
        # Reset the agent to break the loop
        reset_success = await self.loop_detector.reset_agent(error_context.agent_id)
        
        return {
            'success': reset_success,
            'action': 'agent_reset',
            'agent_id': error_context.agent_id
        }
    
    async def _execute_hybrid_recovery(
        self,
        error_context: 'ErrorContext',
        recovery_callback: Optional[Callable],
        plan: RecoveryPlan
    ) -> Dict[str, Any]:
        """Execute hybrid recovery combining multiple approaches."""
        
        steps = []
        
        # Step 1: Try rollback if available
        snapshots = await self.rollback_system.get_snapshots(
            agent_id=error_context.agent_id,
            task_id=error_context.task_id,
            limit=1
        )
        
        if snapshots:
            rollback_result = await self._execute_rollback(error_context)
            steps.append({'step': 'rollback', 'result': rollback_result})
            
            if rollback_result.get('success', False):
                return {
                    'success': True,
                    'strategy': 'hybrid',
                    'successful_step': 'rollback',
                    'steps': steps
                }
        
        # Step 2: Try retry with adjusted approach
        if recovery_callback:
            retry_result = await self._execute_auto_retry(error_context, recovery_callback)
            steps.append({'step': 'retry', 'result': retry_result})
            
            if retry_result.get('success', False):
                return {
                    'success': True,
                    'strategy': 'hybrid',
                    'successful_step': 'retry',
                    'steps': steps
                }
        
        # Step 3: Escalate if all else fails
        escalation_result = await self._execute_escalation(error_context)
        steps.append({'step': 'escalation', 'result': escalation_result})
        
        return {
            'success': escalation_result.get('success', False),
            'strategy': 'hybrid',
            'final_step': 'escalation',
            'steps': steps
        }
    
    async def _execute_manual_recovery(
        self,
        error_context: 'ErrorContext'
    ) -> Dict[str, Any]:
        """Execute manual recovery (placeholder for human intervention)."""
        
        # This would typically queue for manual intervention
        return {
            'success': True,
            'action': 'queued_for_manual_intervention',
            'requires_human_action': True
        }
    
    async def _validate_recovery(
        self,
        recovery_result: Dict[str, Any],
        error_context: 'ErrorContext'
    ) -> Dict[str, Any]:
        """Validate the recovery operation."""
        
        validation_result = {
            'is_valid': recovery_result.get('success', False),
            'validation_timestamp': datetime.utcnow().isoformat(),
            'checks_performed': []
        }
        
        # Basic success check
        success_check = {
            'check': 'recovery_success',
            'passed': recovery_result.get('success', False),
            'details': 'Basic recovery success validation'
        }
        validation_result['checks_performed'].append(success_check)
        
        # Agent state check
        agent_paused = await self.loop_detector.is_agent_paused(error_context.agent_id)
        agent_check = {
            'check': 'agent_state',
            'passed': not agent_paused or recovery_result.get('action') == 'escalated_to_human_intervention',
            'details': f'Agent paused: {agent_paused}'
        }
        validation_result['checks_performed'].append(agent_check)
        
        # Update overall validation status
        validation_result['is_valid'] = all(
            check['passed'] for check in validation_result['checks_performed']
        )
        
        return validation_result
    
    async def _complete_recovery(
        self,
        recovery_id: str,
        recovery_result: Dict[str, Any],
        validation_result: Dict[str, Any],
        start_time: datetime
    ) -> Dict[str, Any]:
        """Complete the recovery process."""
        
        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()
        
        # Update statistics
        self.stats['total_recoveries'] += 1
        
        if recovery_result.get('success', False) and validation_result.get('is_valid', False):
            self.stats['successful_recoveries'] += 1
            phase = RecoveryPhase.COMPLETION
        else:
            self.stats['failed_recoveries'] += 1
            phase = RecoveryPhase.FAILURE
        
        # Update average recovery time
        total_recoveries = self.stats['total_recoveries']
        current_avg = self.stats['average_recovery_time']
        self.stats['average_recovery_time'] = (
            (current_avg * (total_recoveries - 1) + duration) / total_recoveries
        )
        
        # Remove from active recoveries
        self.active_recoveries.pop(recovery_id, None)
        
        final_result = {
            'recovery_id': recovery_id,
            'success': recovery_result.get('success', False) and validation_result.get('is_valid', False),
            'phase': phase.value,
            'duration_seconds': duration,
            'recovery_result': recovery_result,
            'validation_result': validation_result,
            'completion_time': end_time.isoformat()
        }
        
        self.logger.info(
            f"Recovery {recovery_id} completed with phase {phase.value} in {duration:.2f} seconds"
        )
        
        return final_result
    
    async def _handle_orchestration_failure(
        self,
        recovery_id: str,
        error_context: 'ErrorContext',
        error_message: str,
        start_time: datetime
    ) -> Dict[str, Any]:
        """Handle orchestration failure."""
        
        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()
        
        # Update statistics
        self.stats['total_recoveries'] += 1
        self.stats['failed_recoveries'] += 1
        
        # Try to escalate as last resort
        try:
            ticket_id = await self.escalation_system.create_escalation(
                error_context, error_context.recovery_attempts
            )
            
            escalation_info = {
                'escalated': True,
                'escalation_ticket': ticket_id
            }
        except Exception as e:
            self.logger.error(f"Failed to escalate after orchestration failure: {str(e)}")
            escalation_info = {
                'escalated': False,
                'escalation_error': str(e)
            }
        
        return {
            'recovery_id': recovery_id,
            'success': False,
            'phase': RecoveryPhase.FAILURE.value,
            'error': error_message,
            'duration_seconds': duration,
            'escalation': escalation_info,
            'completion_time': end_time.isoformat()
        }
    
    async def get_recovery_status(self, recovery_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a specific recovery operation."""
        return self.active_recoveries.get(recovery_id)
    
    async def get_active_recoveries(self) -> List[Dict[str, Any]]:
        """Get all active recovery operations."""
        return list(self.active_recoveries.values())
    
    async def get_status(self) -> Dict[str, Any]:
        """Get status of the recovery orchestrator."""
        return {
            'active_recoveries': len(self.active_recoveries),
            'stats': self.stats,
            'system_availability': {
                'auto_retry': self.auto_retry is not None,
                'rollback_system': self.rollback_system is not None,
                'escalation_system': self.escalation_system is not None,
                'loop_detector': self.loop_detector is not None,
                'history_manager': self.history_manager is not None
            },
            'timestamp': datetime.utcnow().isoformat()
        }
    
    async def shutdown(self):
        """Shutdown the recovery orchestrator."""
        self.logger.info("Shutting down recovery orchestrator")
        
        # Complete any active recoveries
        for recovery_id in list(self.active_recoveries.keys()):
            self.logger.warning(f"Active recovery {recovery_id} terminated during shutdown")
        
        self.active_recoveries.clear()
        self.logger.info("Recovery orchestrator shutdown complete")
