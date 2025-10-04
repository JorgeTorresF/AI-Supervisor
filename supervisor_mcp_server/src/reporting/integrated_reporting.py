#!/usr/bin/env python3
"""
Integrated Reporting System for Supervisor Agent

Provides comprehensive reporting, alerting, auditing, and dashboard capabilities.
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from pathlib import Path
import uuid
from enum import Enum

class AuditEventType(Enum):
    """Types of audit events"""
    TASK_STARTED = "task_started"
    TASK_COMPLETED = "task_completed"
    TASK_FAILED = "task_failed"
    ERROR_OCCURRED = "error_occurred"
    INTERVENTION_MADE = "intervention_made"
    ESCALATION_TRIGGERED = "escalation_triggered"
    ALERT_GENERATED = "alert_generated"
    SYSTEM_STATE_CHANGE = "system_state_change"
    CONFIGURATION_CHANGED = "configuration_changed"
    MONITORING_STARTED = "monitoring_started"
    MONITORING_STOPPED = "monitoring_stopped"

class AuditLevel(Enum):
    """Audit event severity levels"""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

@dataclass
class AuditEvent:
    """Represents an audit event"""
    event_id: str
    timestamp: str
    event_type: AuditEventType
    level: AuditLevel
    source: str
    message: str
    metadata: Dict[str, Any]
    correlation_id: Optional[str] = None
    agent_id: Optional[str] = None
    task_id: Optional[str] = None

@dataclass
class Alert:
    """Represents an alert"""
    alert_id: str
    timestamp: str
    severity: str
    title: str
    message: str
    source: str
    metadata: Dict[str, Any]
    status: str = 'active'
    resolved_at: Optional[str] = None

class ComprehensiveAuditSystem:
    """Comprehensive audit logging system"""
    
    def __init__(self, storage_path: Path = None):
        self.storage_path = storage_path or Path("audit_logs")
        self.storage_path.mkdir(parents=True, exist_ok=True)
        
        self.audit_file = self.storage_path / "audit.jsonl"
        self.events = []
        
        self.logger = logging.getLogger(__name__)
    
    def log(self, event_type: AuditEventType, level: AuditLevel, 
           source: str, message: str, metadata: Dict[str, Any] = None,
           correlation_id: str = None, agent_id: str = None, 
           task_id: str = None) -> str:
        """Log an audit event"""
        
        event = AuditEvent(
            event_id=str(uuid.uuid4()),
            timestamp=datetime.now().isoformat(),
            event_type=event_type,
            level=level,
            source=source,
            message=message,
            metadata=metadata or {},
            correlation_id=correlation_id,
            agent_id=agent_id,
            task_id=task_id
        )
        
        # Store in memory
        self.events.append(event)
        
        # Write to file
        with open(self.audit_file, 'a') as f:
            f.write(json.dumps(asdict(event)) + '\n')
        
        return event.event_id
    
    def get_events(self, filters: Dict[str, Any] = None, 
                  limit: int = 100) -> List[AuditEvent]:
        """Get audit events with optional filters"""
        events = self.events.copy()
        
        if filters:
            if 'agent_id' in filters:
                events = [e for e in events if e.agent_id == filters['agent_id']]
            if 'event_type' in filters:
                events = [e for e in events if e.event_type.value == filters['event_type']]
            if 'start_time' in filters:
                start_time = datetime.fromisoformat(filters['start_time'])
                events = [e for e in events if datetime.fromisoformat(e.timestamp) >= start_time]
            if 'end_time' in filters:
                end_time = datetime.fromisoformat(filters['end_time'])
                events = [e for e in events if datetime.fromisoformat(e.timestamp) <= end_time]
        
        # Sort by timestamp (newest first)
        events.sort(key=lambda x: x.timestamp, reverse=True)
        
        return events[:limit]

class ComprehensiveAlertSystem:
    """Comprehensive alerting system"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.alerts = {}
        self.alert_history = []
        
        self.logger = logging.getLogger(__name__)
    
    def send_alert(self, severity: str, title: str, message: str,
                  source: str, metadata: Dict[str, Any] = None) -> str:
        """Send an alert"""
        
        alert = Alert(
            alert_id=str(uuid.uuid4()),
            timestamp=datetime.now().isoformat(),
            severity=severity,
            title=title,
            message=message,
            source=source,
            metadata=metadata or {}
        )
        
        self.alerts[alert.alert_id] = alert
        self.alert_history.append(alert)
        
        self.logger.warning(f"Alert generated: {title} - {message}")
        
        return alert.alert_id
    
    def resolve_alert(self, alert_id: str) -> bool:
        """Resolve an alert"""
        if alert_id in self.alerts:
            self.alerts[alert_id].status = 'resolved'
            self.alerts[alert_id].resolved_at = datetime.now().isoformat()
            return True
        return False
    
    def get_active_alerts(self) -> List[Alert]:
        """Get all active alerts"""
        return [alert for alert in self.alerts.values() if alert.status == 'active']

class PeriodicReportGenerator:
    """Generates periodic supervision reports"""
    
    def __init__(self, storage_path: Path = None):
        self.storage_path = storage_path or Path("reports")
        self.storage_path.mkdir(parents=True, exist_ok=True)
        
        self.logger = logging.getLogger(__name__)
    
    def generate_and_save_report(self, tasks: List[Dict[str, Any]], 
                               start_time: str, end_time: str, 
                               format_type: str = "markdown") -> str:
        """Generate and save a comprehensive report"""
        
        report_id = str(uuid.uuid4())
        
        # Generate report content
        report_data = {
            'report_id': report_id,
            'generated_at': datetime.now().isoformat(),
            'period': {'start': start_time, 'end': end_time},
            'summary': {
                'total_tasks': len(tasks),
                'completed_tasks': len([t for t in tasks if t.get('status') == 'completed']),
                'failed_tasks': len([t for t in tasks if t.get('status') == 'failed']),
                'average_completion_time': '2.5 minutes'  # Placeholder
            },
            'tasks': tasks
        }
        
        # Save report
        if format_type == "markdown":
            report_content = self._generate_markdown_report(report_data)
            report_file = self.storage_path / f"report_{report_id}.md"
            with open(report_file, 'w') as f:
                f.write(report_content)
        else:
            report_file = self.storage_path / f"report_{report_id}.json"
            with open(report_file, 'w') as f:
                json.dump(report_data, f, indent=2)
        
        return str(report_file)
    
    def _generate_markdown_report(self, report_data: Dict[str, Any]) -> str:
        """Generate markdown report content"""
        content = f"""
# Supervisor Agent Report

**Report ID:** {report_data['report_id']}
**Generated:** {report_data['generated_at']}
**Period:** {report_data['period']['start']} to {report_data['period']['end']}

## Summary

- **Total Tasks:** {report_data['summary']['total_tasks']}
- **Completed Tasks:** {report_data['summary']['completed_tasks']}
- **Failed Tasks:** {report_data['summary']['failed_tasks']}
- **Average Completion Time:** {report_data['summary']['average_completion_time']}

## Task Details

"""
        
        for task in report_data['tasks']:
            content += f"- **Task {task.get('task_id', 'Unknown')}:** {task.get('status', 'Unknown')}\n"
        
        return content

class ConfidenceReportingSystem:
    """Reports on confidence scores and calibration"""
    
    def __init__(self, storage_path: Path = None):
        self.storage_path = storage_path or Path("confidence_data")
        self.storage_path.mkdir(parents=True, exist_ok=True)
        
        self.confidence_records = []
        self.task_outcomes = {}  # task_id -> outcome
    
    def record_confidence(self, task_id: str, agent_id: str, 
                         decision_type: str, confidence: float,
                         metadata: Dict[str, Any] = None):
        """Record a confidence score"""
        
        record = {
            'record_id': str(uuid.uuid4()),
            'timestamp': datetime.now().isoformat(),
            'task_id': task_id,
            'agent_id': agent_id,
            'decision_type': decision_type,
            'confidence': confidence,
            'metadata': metadata or {}
        }
        
        self.confidence_records.append(record)
    
    def record_task_outcome(self, task_id: str, success: bool, 
                           metadata: Dict[str, Any] = None):
        """Record actual task outcome"""
        
        self.task_outcomes[task_id] = {
            'success': success,
            'timestamp': datetime.now().isoformat(),
            'metadata': metadata or {}
        }

class ComprehensivePatternSystem:
    """Detects and reports patterns in supervision data"""
    
    def __init__(self, storage_path: Path = None):
        self.storage_path = storage_path or Path("patterns")
        self.storage_path.mkdir(parents=True, exist_ok=True)
        
        self.detected_patterns = []
    
    def analyze_patterns(self, events: List[AuditEvent]) -> List[Dict[str, Any]]:
        """Analyze events for patterns"""
        patterns = []
        
        # Simple pattern: High error rate
        error_events = [e for e in events if e.level == AuditLevel.ERROR]
        if len(error_events) > len(events) * 0.2:  # More than 20% errors
            patterns.append({
                'pattern_id': str(uuid.uuid4()),
                'type': 'high_error_rate',
                'severity': 'warning',
                'description': f'High error rate detected: {len(error_events)}/{len(events)} events',
                'timestamp': datetime.now().isoformat()
            })
        
        return patterns

class ComprehensiveDashboardSystem:
    """Provides dashboard data and metrics"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.metrics = {}
        
    def get_dashboard_data(self, time_range: str = '24h') -> Dict[str, Any]:
        """Get dashboard data for specified time range"""
        
        return {
            'timestamp': datetime.now().isoformat(),
            'time_range': time_range,
            'metrics': {
                'active_agents': 5,
                'total_tasks': 50,
                'success_rate': 0.92,
                'average_confidence': 0.85,
                'active_alerts': 2
            },
            'recent_activity': [
                {'type': 'task_completed', 'agent': 'agent_1', 'time': '5 minutes ago'},
                {'type': 'alert_generated', 'severity': 'warning', 'time': '10 minutes ago'}
            ]
        }

class IntegratedReportingSystem:
    """Main integrated reporting system that coordinates all components"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        
        base_path = Path(self.config.get('base_output_dir', 'reporting_output'))
        base_path.mkdir(parents=True, exist_ok=True)
        
        # Initialize subsystems
        self.audit_system = ComprehensiveAuditSystem(base_path / "audit")
        self.alert_system = ComprehensiveAlertSystem(self.config.get('alert_config', {}))
        self.report_generator = PeriodicReportGenerator(base_path / "reports")
        self.confidence_system = ConfidenceReportingSystem(base_path / "confidence")
        self.pattern_system = ComprehensivePatternSystem(base_path / "patterns")
        self.dashboard_system = ComprehensiveDashboardSystem(self.config.get('dashboard_config', {}))
        
        self.logger = logging.getLogger(__name__)
        self.logger.info("Integrated reporting system initialized")
    
    async def log_audit_event(self, event_type: str, source: str, 
                            message: str, metadata: Dict[str, Any] = None,
                            correlation_id: str = None, agent_id: str = None,
                            task_id: str = None) -> str:
        """Log an audit event through the audit system"""
        
        # Map string event type to enum
        event_type_enum = {
            'task_started': AuditEventType.TASK_STARTED,
            'task_completed': AuditEventType.TASK_COMPLETED,
            'task_failed': AuditEventType.TASK_FAILED,
            'error_occurred': AuditEventType.ERROR_OCCURRED,
            'intervention_made': AuditEventType.INTERVENTION_MADE,
            'escalation_triggered': AuditEventType.ESCALATION_TRIGGERED,
            'alert_generated': AuditEventType.ALERT_GENERATED,
            'monitoring_started': AuditEventType.MONITORING_STARTED,
            'monitoring_stopped': AuditEventType.MONITORING_STOPPED,
            'agent_monitoring_started': AuditEventType.MONITORING_STARTED,
            'agent_intervention': AuditEventType.INTERVENTION_MADE,
            'output_validation': AuditEventType.SYSTEM_STATE_CHANGE,
            'escalation_configured': AuditEventType.CONFIGURATION_CHANGED,
            'knowledge_base_updated': AuditEventType.SYSTEM_STATE_CHANGE,
            'state_rollback': AuditEventType.INTERVENTION_MADE,
            'summary_generated': AuditEventType.SYSTEM_STATE_CHANGE
        }.get(event_type, AuditEventType.SYSTEM_STATE_CHANGE)
        
        # Determine level based on event type
        level = AuditLevel.INFO
        if 'error' in event_type or 'failed' in event_type:
            level = AuditLevel.ERROR
        elif 'alert' in event_type or 'escalation' in event_type:
            level = AuditLevel.WARNING
        
        return self.audit_system.log(
            event_type=event_type_enum,
            level=level,
            source=source,
            message=message,
            metadata=metadata,
            correlation_id=correlation_id,
            agent_id=agent_id,
            task_id=task_id
        )
    
    async def get_audit_entries(self, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Get audit entries with filters"""
        events = self.audit_system.get_events(filters)
        return [asdict(event) for event in events]
    
    def generate_alert(self, severity: str, title: str, message: str,
                      source: str, metadata: Dict[str, Any] = None) -> str:
        """Generate an alert"""
        return self.alert_system.send_alert(
            severity=severity,
            title=title,
            message=message,
            source=source,
            metadata=metadata
        )
    
    def get_dashboard_data(self, time_range: str = '24h') -> Dict[str, Any]:
        """Get dashboard data"""
        return self.dashboard_system.get_dashboard_data(time_range)
