"""Escalation System for handling critical errors and human intervention."""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, asdict
from pathlib import Path


class EscalationLevel(Enum):
    """Escalation levels for different types of interventions."""
    NONE = "none"
    AUTO_RECOVERY = "auto_recovery"
    SUPERVISOR_REVIEW = "supervisor_review"
    HUMAN_INTERVENTION = "human_intervention"
    CRITICAL_ALERT = "critical_alert"


class EscalationStatus(Enum):
    """Status of an escalation."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class EscalationTicket:
    """Represents an escalation ticket."""
    ticket_id: str
    level: EscalationLevel
    status: EscalationStatus
    created_at: datetime
    error_context: Dict[str, Any]
    recovery_attempts: List[Dict[str, Any]]
    priority: int
    assigned_to: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolution: Optional[str] = None
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['created_at'] = self.created_at.isoformat() if self.created_at else None
        data['resolved_at'] = self.resolved_at.isoformat() if self.resolved_at else None
        data['level'] = self.level.value
        data['status'] = self.status.value
        return data


class EscalationSystem:
    """System for managing error escalations and human interventions."""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or self._default_config()
        self.logger = logging.getLogger(__name__)
        
        # Storage for escalation tickets
        self.tickets: Dict[str, EscalationTicket] = {}
        self.escalation_queue: List[str] = []
        
        # Notification callbacks
        self.notification_callbacks: Dict[EscalationLevel, List[Callable]] = {
            level: [] for level in EscalationLevel
        }
        
        # Statistics
        self.stats = {
            'total_escalations': 0,
            'by_level': {level.value: 0 for level in EscalationLevel},
            'by_status': {status.value: 0 for status in EscalationStatus},
            'average_resolution_time': 0.0,
            'pending_tickets': 0
        }
    
    def _default_config(self) -> Dict[str, Any]:
        """Default configuration for escalation system."""
        return {
            'max_auto_recovery_attempts': 5,
            'escalation_timeout': 300,  # 5 minutes
            'critical_error_types': [
                'infinite_loop',
                'resource_error',
                'agent_failure'
            ],
            'auto_escalate_after_failures': 3,
            'priority_weights': {
                'error_severity': 0.4,
                'agent_importance': 0.3,
                'task_criticality': 0.3
            },
            'notification_channels': {
                'email': True,
                'slack': False,
                'webhook': False
            },
            'escalation_rules': {
                'critical_errors': EscalationLevel.CRITICAL_ALERT.value,
                'repeated_failures': EscalationLevel.HUMAN_INTERVENTION.value,
                'timeout_errors': EscalationLevel.SUPERVISOR_REVIEW.value
            }
        }
    
    async def evaluate_escalation(
        self,
        error_context: 'ErrorContext',
        recovery_attempts: List[Dict[str, Any]]
    ) -> EscalationLevel:
        """Evaluate if an error should be escalated and to what level."""
        
        # Check for critical error types
        if error_context.error_type.value in self.config['critical_error_types']:
            return EscalationLevel.CRITICAL_ALERT
        
        # Check number of recovery attempts
        if len(recovery_attempts) >= self.config['max_auto_recovery_attempts']:
            return EscalationLevel.HUMAN_INTERVENTION
        
        # Check for repeated failures
        failed_attempts = [a for a in recovery_attempts if not a.get('success', False)]
        if len(failed_attempts) >= self.config['auto_escalate_after_failures']:
            return EscalationLevel.SUPERVISOR_REVIEW
        
        # Check error severity
        if error_context.severity.value == 'critical':
            return EscalationLevel.CRITICAL_ALERT
        elif error_context.severity.value == 'high':
            return EscalationLevel.SUPERVISOR_REVIEW
        
        # Default to auto recovery for lower severity issues
        return EscalationLevel.AUTO_RECOVERY
    
    async def create_escalation(
        self,
        error_context: 'ErrorContext',
        recovery_attempts: List[Dict[str, Any]],
        level: Optional[EscalationLevel] = None
    ) -> str:
        """Create an escalation ticket."""
        
        # Determine escalation level if not provided
        if level is None:
            level = await self.evaluate_escalation(error_context, recovery_attempts)
        
        # Generate ticket ID
        ticket_id = self._generate_ticket_id(error_context)
        
        # Calculate priority
        priority = self._calculate_priority(error_context, recovery_attempts)
        
        # Create ticket
        ticket = EscalationTicket(
            ticket_id=ticket_id,
            level=level,
            status=EscalationStatus.PENDING,
            created_at=datetime.utcnow(),
            error_context={
                'error_id': error_context.error_id,
                'error_type': error_context.error_type.value,
                'severity': error_context.severity.value,
                'agent_id': error_context.agent_id,
                'task_id': error_context.task_id,
                'error_message': error_context.error_message,
                'context_data': error_context.context_data
            },
            recovery_attempts=recovery_attempts,
            priority=priority,
            metadata={
                'created_by': 'error_handling_system',
                'auto_generated': True
            }
        )
        
        # Store ticket
        self.tickets[ticket_id] = ticket
        self.escalation_queue.append(ticket_id)
        
        # Update statistics
        self.stats['total_escalations'] += 1
        self.stats['by_level'][level.value] += 1
        self.stats['by_status'][EscalationStatus.PENDING.value] += 1
        self.stats['pending_tickets'] += 1
        
        # Send notifications
        await self._send_notifications(ticket)
        
        self.logger.info(
            f"Created escalation ticket {ticket_id} with level {level.value} "
            f"for error {error_context.error_id}"
        )
        
        return ticket_id
    
    async def process_escalation_queue(self) -> List[Dict[str, Any]]:
        """Process pending escalations in the queue."""
        
        processed = []
        
        # Sort queue by priority
        queue_with_priority = [
            (ticket_id, self.tickets[ticket_id].priority)
            for ticket_id in self.escalation_queue
            if ticket_id in self.tickets
        ]
        queue_with_priority.sort(key=lambda x: x[1], reverse=True)
        
        for ticket_id, _ in queue_with_priority:
            ticket = self.tickets.get(ticket_id)
            if not ticket or ticket.status != EscalationStatus.PENDING:
                continue
            
            # Process based on escalation level
            result = await self._process_escalation_ticket(ticket)
            processed.append(result)
            
            # Remove from queue if processed
            if result.get('processed', False):
                self.escalation_queue.remove(ticket_id)
        
        return processed
    
    async def resolve_escalation(
        self,
        ticket_id: str,
        resolution: str,
        resolved_by: Optional[str] = None
    ) -> bool:
        """Resolve an escalation ticket."""
        
        ticket = self.tickets.get(ticket_id)
        if not ticket:
            self.logger.error(f"Escalation ticket {ticket_id} not found")
            return False
        
        # Update ticket status
        ticket.status = EscalationStatus.RESOLVED
        ticket.resolved_at = datetime.utcnow()
        ticket.resolution = resolution
        ticket.assigned_to = resolved_by
        
        # Update statistics
        self.stats['by_status'][EscalationStatus.PENDING.value] -= 1
        self.stats['by_status'][EscalationStatus.RESOLVED.value] += 1
        self.stats['pending_tickets'] -= 1
        
        # Calculate resolution time
        if ticket.created_at and ticket.resolved_at:
            resolution_time = (ticket.resolved_at - ticket.created_at).total_seconds()
            self._update_average_resolution_time(resolution_time)
        
        # Remove from queue
        if ticket_id in self.escalation_queue:
            self.escalation_queue.remove(ticket_id)
        
        self.logger.info(f"Resolved escalation ticket {ticket_id}: {resolution}")
        
        return True
    
    async def get_escalation_report(
        self,
        ticket_id: str
    ) -> Optional[Dict[str, Any]]:
        """Generate a comprehensive escalation report."""
        
        ticket = self.tickets.get(ticket_id)
        if not ticket:
            return None
        
        report = {
            'ticket_info': ticket.to_dict(),
            'error_analysis': {
                'root_cause': self._analyze_root_cause(ticket),
                'impact_assessment': self._assess_impact(ticket),
                'recovery_timeline': self._build_recovery_timeline(ticket)
            },
            'recommendations': self._generate_recommendations(ticket),
            'system_impact': {
                'affected_agents': self._get_affected_agents(ticket),
                'related_errors': self._find_related_errors(ticket)
            },
            'generated_at': datetime.utcnow().isoformat()
        }
        
        return report
    
    def register_notification_callback(
        self,
        level: EscalationLevel,
        callback: Callable
    ):
        """Register a callback for notifications at a specific escalation level."""
        self.notification_callbacks[level].append(callback)
    
    def _generate_ticket_id(self, error_context: 'ErrorContext') -> str:
        """Generate a unique ticket ID."""
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S_%f')
        return f"ESC_{error_context.agent_id}_{timestamp}"
    
    def _calculate_priority(self, error_context: 'ErrorContext', recovery_attempts: List[Dict[str, Any]]) -> int:
        """Calculate priority score for escalation."""
        weights = self.config['priority_weights']
        
        # Base priority from error severity
        severity_scores = {'low': 1, 'medium': 3, 'high': 7, 'critical': 10}
        severity_score = severity_scores.get(error_context.severity.value, 1)
        
        # Agent importance (would typically come from configuration)
        agent_score = 5  # Default
        
        # Task criticality (would typically come from context)
        task_score = error_context.context_data.get('task_criticality', 3)
        
        # Number of failed recovery attempts
        failed_attempts = len([a for a in recovery_attempts if not a.get('success', False)])
        attempt_penalty = failed_attempts * 2
        
        # Calculate weighted score
        priority = int(
            severity_score * weights['error_severity'] +
            agent_score * weights['agent_importance'] +
            task_score * weights['task_criticality'] +
            attempt_penalty
        )
        
        return min(priority, 100)  # Cap at 100
    
    async def _process_escalation_ticket(self, ticket: EscalationTicket) -> Dict[str, Any]:
        """Process a single escalation ticket based on its level."""
        
        ticket.status = EscalationStatus.IN_PROGRESS
        
        try:
            if ticket.level == EscalationLevel.AUTO_RECOVERY:
                # Attempt additional auto-recovery strategies
                result = await self._attempt_auto_recovery(ticket)
            elif ticket.level == EscalationLevel.SUPERVISOR_REVIEW:
                # Queue for supervisor review
                result = await self._queue_for_supervisor(ticket)
            elif ticket.level == EscalationLevel.HUMAN_INTERVENTION:
                # Request human intervention
                result = await self._request_human_intervention(ticket)
            elif ticket.level == EscalationLevel.CRITICAL_ALERT:
                # Send critical alert
                result = await self._send_critical_alert(ticket)
            else:
                result = {'processed': False, 'reason': 'Unknown escalation level'}
            
            return result
            
        except Exception as e:
            ticket.status = EscalationStatus.FAILED
            self.logger.error(f"Failed to process escalation ticket {ticket.ticket_id}: {str(e)}")
            return {'processed': False, 'error': str(e)}
    
    async def _attempt_auto_recovery(self, ticket: EscalationTicket) -> Dict[str, Any]:
        """Attempt additional auto-recovery strategies."""
        # This would implement advanced recovery strategies
        return {'processed': True, 'action': 'auto_recovery_attempted'}
    
    async def _queue_for_supervisor(self, ticket: EscalationTicket) -> Dict[str, Any]:
        """Queue ticket for supervisor review."""
        # This would queue the ticket for supervisor attention
        return {'processed': True, 'action': 'queued_for_supervisor'}
    
    async def _request_human_intervention(self, ticket: EscalationTicket) -> Dict[str, Any]:
        """Request human intervention."""
        # This would create a request for human intervention
        return {'processed': True, 'action': 'human_intervention_requested'}
    
    async def _send_critical_alert(self, ticket: EscalationTicket) -> Dict[str, Any]:
        """Send critical alert notifications."""
        # This would send urgent notifications
        return {'processed': True, 'action': 'critical_alert_sent'}
    
    async def _send_notifications(self, ticket: EscalationTicket):
        """Send notifications for escalation."""
        callbacks = self.notification_callbacks.get(ticket.level, [])
        
        for callback in callbacks:
            try:
                await callback(ticket)
            except Exception as e:
                self.logger.error(f"Notification callback failed: {str(e)}")
    
    def _analyze_root_cause(self, ticket: EscalationTicket) -> str:
        """Analyze the root cause of the escalation."""
        # This would perform root cause analysis
        return "Root cause analysis pending"
    
    def _assess_impact(self, ticket: EscalationTicket) -> Dict[str, Any]:
        """Assess the impact of the error."""
        # This would assess system impact
        return {'impact_level': 'medium', 'affected_systems': []}
    
    def _build_recovery_timeline(self, ticket: EscalationTicket) -> List[Dict[str, Any]]:
        """Build a timeline of recovery attempts."""
        # This would build a detailed timeline
        return ticket.recovery_attempts
    
    def _generate_recommendations(self, ticket: EscalationTicket) -> List[str]:
        """Generate recommendations for resolving the issue."""
        # This would generate specific recommendations
        return ["Review error logs", "Check system resources", "Verify configuration"]
    
    def _get_affected_agents(self, ticket: EscalationTicket) -> List[str]:
        """Get list of affected agents."""
        # This would identify affected agents
        return [ticket.error_context.get('agent_id', 'unknown')]
    
    def _find_related_errors(self, ticket: EscalationTicket) -> List[str]:
        """Find related errors."""
        # This would find related error patterns
        return []
    
    def _update_average_resolution_time(self, resolution_time: float):
        """Update average resolution time statistics."""
        current_avg = self.stats['average_resolution_time']
        total_resolved = self.stats['by_status'][EscalationStatus.RESOLVED.value]
        
        if total_resolved == 1:
            self.stats['average_resolution_time'] = resolution_time
        else:
            self.stats['average_resolution_time'] = (
                (current_avg * (total_resolved - 1) + resolution_time) / total_resolved
            )
    
    async def get_status(self) -> Dict[str, Any]:
        """Get status of the escalation system."""
        return {
            'active_tickets': len(self.tickets),
            'queue_length': len(self.escalation_queue),
            'stats': self.stats,
            'config': self.config,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    async def shutdown(self):
        """Shutdown the escalation system."""
        self.logger.info("Shutting down escalation system")
        
        # Process any remaining urgent tickets
        urgent_tickets = [
            ticket for ticket in self.tickets.values()
            if ticket.level == EscalationLevel.CRITICAL_ALERT and ticket.status == EscalationStatus.PENDING
        ]
        
        for ticket in urgent_tickets:
            self.logger.warning(f"Urgent ticket {ticket.ticket_id} remains unresolved during shutdown")
        
        self.tickets.clear()
        self.escalation_queue.clear()
        self.notification_callbacks.clear()
        
        self.logger.info("Escalation system shutdown complete")
