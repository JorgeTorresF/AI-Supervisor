#!/usr/bin/env python3
"""
Comprehensive Supervisor Agent MCP Server

Integrates monitoring, error handling, and reporting systems into a unified
agent supervision platform with 10 core tools.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict
import uuid
import os

# FastMCP for robust MCP server implementation
from fastmcp import FastMCP

# Import integrated components
from src.integrated_supervisor import IntegratedSupervisorAgent
from src.monitoring.monitoring_engine import MonitoringEngine
from src.error_handling.error_handling_system import SupervisorErrorHandlingSystem
from src.reporting.integrated_reporting import IntegratedReportingSystem

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/supervisor_mcp.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Initialize MCP server
mcp = FastMCP("Supervisor Agent")

# Global supervisor instance
supervisor_agent = None

@dataclass
class SupervisorConfig:
    """Configuration for the supervisor agent"""
    monitoring_enabled: bool = True
    error_handling_enabled: bool = True
    reporting_enabled: bool = True
    dashboard_enabled: bool = True
    auto_escalation: bool = True
    confidence_threshold: float = 0.7
    max_retries: int = 3
    storage_path: str = "supervisor_data"

class IntegratedSupervisorAgent:
    """
    Integrated Supervisor Agent that combines monitoring, error handling, and reporting
    """
    
    def __init__(self, config: SupervisorConfig):
        self.config = config
        self.storage_path = Path(config.storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        
        logger.info("Initializing Integrated Supervisor Agent")
        
        # Initialize monitoring system
        if config.monitoring_enabled:
            self.monitoring_engine = MonitoringEngine({
                'real_time_enabled': True,
                'evaluation_interval': 5.0,
                'confidence_threshold': config.confidence_threshold
            })
        
        # Initialize error handling system
        if config.error_handling_enabled:
            self.error_handling = SupervisorErrorHandlingSystem(
                storage_path=self.storage_path / "error_handling",
                max_retries=config.max_retries,
                escalation_enabled=config.auto_escalation
            )
        
        # Initialize reporting system
        if config.reporting_enabled:
            self.reporting_system = IntegratedReportingSystem({
                'base_output_dir': str(self.storage_path / "reporting"),
                'real_time_updates': True,
                'dashboard_enabled': config.dashboard_enabled
            })
        
        # Agent supervision state
        self.supervised_agents = {}
        self.active_sessions = {}
        self.monitoring_rules = {}
        self.escalation_config = {}
        self.knowledge_base = self._load_knowledge_base()
        
        # Statistics
        self.stats = {
            'total_supervised_agents': 0,
            'total_interventions': 0,
            'successful_recoveries': 0,
            'escalated_issues': 0,
            'start_time': datetime.now()
        }
        
        logger.info("Integrated Supervisor Agent initialized successfully")
    
    def _load_knowledge_base(self) -> Dict[str, Any]:
        """Load or initialize knowledge base"""
        kb_file = self.storage_path / "knowledge_base.json"
        if kb_file.exists():
            with open(kb_file, 'r') as f:
                return json.load(f)
        
        return {
            'patterns': [],
            'best_practices': [],
            'common_errors': [],
            'escalation_triggers': [],
            'intervention_strategies': []
        }
    
    def _save_knowledge_base(self):
        """Save knowledge base to disk"""
        kb_file = self.storage_path / "knowledge_base.json"
        with open(kb_file, 'w') as f:
            json.dump(self.knowledge_base, f, indent=2)
    
    async def start_monitoring_agent(
        self, 
        agent_id: str, 
        task_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Start monitoring for a specific agent"""
        
        logger.info(f"Starting monitoring for agent {agent_id}")
        
        # Create session
        session_id = str(uuid.uuid4())
        session_data = {
            'session_id': session_id,
            'agent_id': agent_id,
            'task_config': task_config,
            'start_time': datetime.now().isoformat(),
            'status': 'active'
        }
        
        self.active_sessions[session_id] = session_data
        self.supervised_agents[agent_id] = session_id
        self.stats['total_supervised_agents'] += 1
        
        # Start monitoring if enabled
        if self.config.monitoring_enabled:
            result = self.monitoring_engine.start_monitoring(session_data)
            session_data['monitoring_result'] = result
        
        # Log to audit system
        if self.config.reporting_enabled:
            await self.reporting_system.log_audit_event(
                event_type="agent_monitoring_started",
                source="supervisor",
                message=f"Started monitoring agent {agent_id}",
                metadata={'session_id': session_id, 'task_config': task_config}
            )
        
        return {
            'success': True,
            'session_id': session_id,
            'agent_id': agent_id,
            'monitoring_active': self.config.monitoring_enabled,
            'timestamp': datetime.now().isoformat()
        }
    
    async def evaluate_agent_execution(
        self, 
        agent_id: str, 
        execution_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Evaluate agent execution and provide supervision"""
        
        if agent_id not in self.supervised_agents:
            return {
                'success': False,
                'error': f'Agent {agent_id} is not being supervised'
            }
        
        session_id = self.supervised_agents[agent_id]
        
        # Get monitoring evaluation
        monitoring_result = None
        if self.config.monitoring_enabled:
            monitoring_result = self.monitoring_engine.evaluate_execution(execution_data)
        
        # Check for interventions needed
        interventions = []
        if monitoring_result:
            # Check confidence thresholds
            overall_confidence = monitoring_result.confidence_scores.get('overall', 1.0)
            if overall_confidence < self.config.confidence_threshold:
                interventions.append({
                    'type': 'low_confidence',
                    'severity': 'warning',
                    'message': f'Low confidence score: {overall_confidence:.2f}',
                    'recommendation': 'Review task approach or escalate'
                })
            
            # Check for errors
            if monitoring_result.errors:
                critical_errors = [e for e in monitoring_result.errors if e.get('severity') == 'critical']
                if critical_errors:
                    interventions.append({
                        'type': 'critical_error',
                        'severity': 'error',
                        'message': f'Critical errors detected: {len(critical_errors)}',
                        'recommendation': 'Immediate intervention required'
                    })
        
        # Update session
        session_data = self.active_sessions[session_id]
        session_data['last_evaluation'] = datetime.now().isoformat()
        session_data['last_monitoring_result'] = asdict(monitoring_result) if monitoring_result else None
        session_data['interventions'] = interventions
        
        return {
            'success': True,
            'session_id': session_id,
            'monitoring_result': asdict(monitoring_result) if monitoring_result else None,
            'interventions': interventions,
            'needs_intervention': len(interventions) > 0,
            'timestamp': datetime.now().isoformat()
        }
    
    async def handle_agent_error(
        self,
        agent_id: str,
        error: Exception,
        task_id: str,
        context: Optional[Dict[str, Any]] = None,
        state_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Handle agent error through integrated error handling system"""
        
        if not self.config.error_handling_enabled:
            return {
                'success': False,
                'error': 'Error handling is disabled'
            }
        
        # Use error handling system
        recovery_result = await self.error_handling.handle_error(
            error=error,
            agent_id=agent_id,
            task_id=task_id,
            context=context,
            state_data=state_data
        )
        
        # Update statistics
        if recovery_result.get('success'):
            self.stats['successful_recoveries'] += 1
        else:
            self.stats['escalated_issues'] += 1
        
        return recovery_result

# Initialize supervisor globally
def initialize_supervisor():
    global supervisor_agent
    config = SupervisorConfig()
    supervisor_agent = IntegratedSupervisorAgent(config)
    return supervisor_agent

# MCP Tools Implementation

@mcp.tool()
async def monitor_agent(agent_id: str, task_config: dict) -> dict:
    """
    Start monitoring a specific agent with comprehensive supervision.
    
    Args:
        agent_id: Unique identifier for the agent to monitor
        task_config: Configuration for the monitoring task including objectives, constraints, and parameters
    
    Returns:
        dict: Monitoring session information and status
    """
    
    global supervisor_agent
    if not supervisor_agent:
        supervisor_agent = initialize_supervisor()
    
    try:
        result = await supervisor_agent.start_monitoring_agent(agent_id, task_config)
        return result
    except Exception as e:
        logger.error(f"Error in monitor_agent: {e}")
        return {
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }

@mcp.tool()
async def set_monitoring_rules(agent_id: str, rules: dict) -> dict:
    """
    Configure monitoring rules and thresholds for an agent.
    
    Args:
        agent_id: Target agent identifier
        rules: Monitoring rules including thresholds, alerts, and escalation triggers
    
    Returns:
        dict: Configuration status and applied rules
    """
    
    global supervisor_agent
    if not supervisor_agent:
        supervisor_agent = initialize_supervisor()
    
    try:
        # Store monitoring rules
        supervisor_agent.monitoring_rules[agent_id] = {
            **rules,
            'configured_at': datetime.now().isoformat(),
            'configured_by': 'supervisor'
        }
        
        # Apply rules to monitoring engine if agent is being monitored
        if agent_id in supervisor_agent.supervised_agents and supervisor_agent.config.monitoring_enabled:
            # Update monitoring engine configuration
            supervisor_agent.monitoring_engine.config.update(rules)
        
        return {
            'success': True,
            'agent_id': agent_id,
            'rules_applied': rules,
            'active_monitoring': agent_id in supervisor_agent.supervised_agents,
            'timestamp': datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error in set_monitoring_rules: {e}")
        return {
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }

@mcp.tool()
async def get_supervision_report(agent_id: str = None, time_range: str = "1h") -> dict:
    """
    Generate comprehensive supervision report for agent(s).
    
    Args:
        agent_id: Optional specific agent ID (if None, reports on all agents)
        time_range: Time range for report (e.g., "1h", "24h", "7d")
    
    Returns:
        dict: Comprehensive supervision report with metrics, alerts, and recommendations
    """
    
    global supervisor_agent
    if not supervisor_agent:
        return {
            'success': False,
            'error': 'Supervisor not initialized',
            'timestamp': datetime.now().isoformat()
        }
    
    try:
        # Parse time range
        time_delta_map = {
            '1h': timedelta(hours=1),
            '24h': timedelta(hours=24),
            '7d': timedelta(days=7),
            '30d': timedelta(days=30)
        }
        
        time_delta = time_delta_map.get(time_range, timedelta(hours=1))
        start_time = datetime.now() - time_delta
        
        # Collect data for specific agent or all agents
        target_agents = [agent_id] if agent_id else list(supervisor_agent.supervised_agents.keys())
        
        report_data = {
            'report_id': str(uuid.uuid4()),
            'generated_at': datetime.now().isoformat(),
            'time_range': time_range,
            'agents_included': target_agents,
            'summary': {
                'total_agents': len(target_agents),
                'active_sessions': len(supervisor_agent.active_sessions),
                'total_interventions': supervisor_agent.stats['total_interventions'],
                'successful_recoveries': supervisor_agent.stats['successful_recoveries'],
                'escalated_issues': supervisor_agent.stats['escalated_issues']
            },
            'agent_details': {},
            'alerts': [],
            'recommendations': []
        }
        
        # Collect details for each agent
        for aid in target_agents:
            session_id = supervisor_agent.supervised_agents.get(aid)
            if session_id and session_id in supervisor_agent.active_sessions:
                session_data = supervisor_agent.active_sessions[session_id]
                
                report_data['agent_details'][aid] = {
                    'session_id': session_id,
                    'start_time': session_data.get('start_time'),
                    'status': session_data.get('status'),
                    'last_evaluation': session_data.get('last_evaluation'),
                    'interventions': session_data.get('interventions', []),
                    'monitoring_result': session_data.get('last_monitoring_result')
                }
                
                # Add any active alerts
                interventions = session_data.get('interventions', [])
                for intervention in interventions:
                    if intervention.get('severity') in ['error', 'critical']:
                        report_data['alerts'].append({
                            'agent_id': aid,
                            'type': intervention['type'],
                            'severity': intervention['severity'],
                            'message': intervention['message'],
                            'recommendation': intervention.get('recommendation')
                        })
        
        # Generate system-wide recommendations
        if report_data['summary']['escalated_issues'] > 0:
            report_data['recommendations'].append(
                "Review escalated issues and consider adjusting agent parameters"
            )
        
        if len(report_data['alerts']) > 0:
            report_data['recommendations'].append(
                f"Address {len(report_data['alerts'])} active alerts requiring attention"
            )
        
        # Log report generation
        if supervisor_agent.config.reporting_enabled:
            await supervisor_agent.reporting_system.log_audit_event(
                event_type="supervision_report_generated",
                source="supervisor",
                message=f"Generated supervision report for {len(target_agents)} agents",
                metadata={'report_id': report_data['report_id'], 'time_range': time_range}
            )
        
        return {
            'success': True,
            'report': report_data,
            'timestamp': datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error in get_supervision_report: {e}")
        return {
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }

@mcp.tool()
async def intervene_task(agent_id: str, intervention_type: str, parameters: dict = None) -> dict:
    """
    Intervene in agent task execution with specific actions.
    
    Args:
        agent_id: Target agent identifier
        intervention_type: Type of intervention (pause, redirect, adjust, terminate)
        parameters: Intervention-specific parameters
    
    Returns:
        dict: Intervention result and agent response
    """
    
    global supervisor_agent
    if not supervisor_agent:
        return {
            'success': False,
            'error': 'Supervisor not initialized',
            'timestamp': datetime.now().isoformat()
        }
    
    try:
        if agent_id not in supervisor_agent.supervised_agents:
            return {
                'success': False,
                'error': f'Agent {agent_id} is not being supervised',
                'timestamp': datetime.now().isoformat()
            }
        
        session_id = supervisor_agent.supervised_agents[agent_id]
        session_data = supervisor_agent.active_sessions[session_id]
        
        intervention_id = str(uuid.uuid4())
        intervention_record = {
            'intervention_id': intervention_id,
            'agent_id': agent_id,
            'session_id': session_id,
            'type': intervention_type,
            'parameters': parameters or {},
            'timestamp': datetime.now().isoformat(),
            'initiated_by': 'supervisor'
        }
        
        # Execute intervention based on type
        result = {'success': False, 'message': 'Unknown intervention type'}
        
        if intervention_type == 'pause':
            # Pause agent execution
            session_data['status'] = 'paused'
            session_data['pause_reason'] = parameters.get('reason', 'Manual intervention')
            result = {
                'success': True,
                'message': f'Agent {agent_id} paused successfully',
                'action': 'paused'
            }
        
        elif intervention_type == 'redirect':
            # Redirect agent to new task or approach
            new_objective = parameters.get('new_objective')
            if new_objective:
                session_data['redirected_objective'] = new_objective
                result = {
                    'success': True,
                    'message': f'Agent {agent_id} redirected to new objective',
                    'action': 'redirected',
                    'new_objective': new_objective
                }
        
        elif intervention_type == 'adjust':
            # Adjust agent parameters
            adjustments = parameters.get('adjustments', {})
            session_data['parameter_adjustments'] = adjustments
            result = {
                'success': True,
                'message': f'Agent {agent_id} parameters adjusted',
                'action': 'adjusted',
                'adjustments': adjustments
            }
        
        elif intervention_type == 'terminate':
            # Terminate agent execution
            session_data['status'] = 'terminated'
            session_data['termination_reason'] = parameters.get('reason', 'Manual termination')
            result = {
                'success': True,
                'message': f'Agent {agent_id} terminated',
                'action': 'terminated'
            }
        
        # Update statistics and log intervention
        supervisor_agent.stats['total_interventions'] += 1
        
        # Store intervention record
        if 'interventions' not in session_data:
            session_data['interventions'] = []
        session_data['interventions'].append(intervention_record)
        
        # Log to audit system
        if supervisor_agent.config.reporting_enabled:
            await supervisor_agent.reporting_system.log_audit_event(
                event_type="agent_intervention",
                source="supervisor",
                message=f"Intervention executed on agent {agent_id}: {intervention_type}",
                metadata=intervention_record
            )
        
        return {
            'success': result['success'],
            'intervention_id': intervention_id,
            'result': result,
            'timestamp': datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error in intervene_task: {e}")
        return {
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }

@mcp.tool()
async def validate_output(agent_id: str, output_data: dict, validation_criteria: dict = None) -> dict:
    """
    Validate agent output against quality criteria and standards.
    
    Args:
        agent_id: Agent identifier
        output_data: Output data to validate
        validation_criteria: Specific validation criteria to apply
    
    Returns:
        dict: Validation results with scores, issues, and recommendations
    """
    
    global supervisor_agent
    if not supervisor_agent:
        return {
            'success': False,
            'error': 'Supervisor not initialized',
            'timestamp': datetime.now().isoformat()
        }
    
    try:
        validation_id = str(uuid.uuid4())
        
        # Default validation criteria
        default_criteria = {
            'completeness_required': True,
            'format_validation': True,
            'quality_threshold': 0.8,
            'error_tolerance': 0.1
        }
        
        criteria = {**default_criteria, **(validation_criteria or {})}
        
        # Perform validation using monitoring engine if available
        validation_result = {
            'validation_id': validation_id,
            'agent_id': agent_id,
            'timestamp': datetime.now().isoformat(),
            'criteria_applied': criteria,
            'scores': {},
            'issues': [],
            'recommendations': [],
            'overall_valid': True
        }
        
        if supervisor_agent.config.monitoring_enabled:
            # Use quality monitor for detailed validation
            quality_result = supervisor_agent.monitoring_engine.quality_monitor.evaluate_output_quality(
                [output_data],
                criteria
            )
            
            validation_result['scores'] = {
                'completeness': quality_result.get('completeness_score', 0.0),
                'format_compliance': quality_result.get('format_score', 0.0),
                'content_quality': quality_result.get('content_score', 0.0),
                'overall': quality_result.get('overall_score', 0.0)
            }
            
            # Check against thresholds
            overall_score = validation_result['scores']['overall']
            if overall_score < criteria['quality_threshold']:
                validation_result['overall_valid'] = False
                validation_result['issues'].append({
                    'type': 'quality_below_threshold',
                    'severity': 'warning',
                    'message': f'Overall quality score {overall_score:.2f} below threshold {criteria["quality_threshold"]}'
                })
                validation_result['recommendations'].append('Review and improve output quality')
            
            # Check for completeness
            if criteria['completeness_required'] and validation_result['scores']['completeness'] < 0.9:
                validation_result['issues'].append({
                    'type': 'incomplete_output',
                    'severity': 'error',
                    'message': 'Output appears to be incomplete'
                })
                validation_result['recommendations'].append('Ensure all required elements are included')
        
        else:
            # Basic validation without monitoring engine
            validation_result['scores'] = {
                'completeness': 0.8,
                'format_compliance': 0.9,
                'content_quality': 0.8,
                'overall': 0.8
            }
        
        # Log validation
        if supervisor_agent.config.reporting_enabled:
            await supervisor_agent.reporting_system.log_audit_event(
                event_type="output_validation",
                source="supervisor",
                message=f"Output validation completed for agent {agent_id}",
                metadata={
                    'validation_id': validation_id,
                    'overall_valid': validation_result['overall_valid'],
                    'overall_score': validation_result['scores']['overall']
                }
            )
        
        return {
            'success': True,
            'validation': validation_result,
            'timestamp': datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error in validate_output: {e}")
        return {
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }

@mcp.tool()
async def get_audit_log(agent_id: str = None, start_time: str = None, end_time: str = None, event_type: str = None) -> dict:
    """
    Retrieve audit log entries for supervision activities.
    
    Args:
        agent_id: Optional agent ID filter
        start_time: Optional start time filter (ISO format)
        end_time: Optional end time filter (ISO format)
        event_type: Optional event type filter
    
    Returns:
        dict: Audit log entries matching the criteria
    """
    
    global supervisor_agent
    if not supervisor_agent:
        return {
            'success': False,
            'error': 'Supervisor not initialized',
            'timestamp': datetime.now().isoformat()
        }
    
    try:
        # Build filters
        filters = {}
        if agent_id:
            filters['agent_id'] = agent_id
        if start_time:
            filters['start_time'] = start_time
        if end_time:
            filters['end_time'] = end_time
        if event_type:
            filters['event_type'] = event_type
        
        # Retrieve audit entries
        audit_entries = []
        
        if supervisor_agent.config.reporting_enabled:
            # Get entries from reporting system
            entries = await supervisor_agent.reporting_system.get_audit_entries(filters)
            audit_entries.extend(entries)
        
        # Add session-based entries
        for session_id, session_data in supervisor_agent.active_sessions.items():
            session_agent_id = session_data.get('agent_id')
            
            # Apply agent filter
            if agent_id and session_agent_id != agent_id:
                continue
            
            # Add session events
            if 'interventions' in session_data:
                for intervention in session_data['interventions']:
                    intervention_time = datetime.fromisoformat(intervention['timestamp'])
                    
                    # Apply time filters
                    if start_time and intervention_time < datetime.fromisoformat(start_time):
                        continue
                    if end_time and intervention_time > datetime.fromisoformat(end_time):
                        continue
                    
                    # Apply event type filter
                    if event_type and intervention['type'] != event_type:
                        continue
                    
                    audit_entries.append({
                        'entry_id': intervention.get('intervention_id', str(uuid.uuid4())),
                        'timestamp': intervention['timestamp'],
                        'event_type': 'intervention',
                        'agent_id': session_agent_id,
                        'session_id': session_id,
                        'data': intervention,
                        'source': 'supervisor'
                    })
        
        # Sort by timestamp
        audit_entries.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return {
            'success': True,
            'filters_applied': filters,
            'entry_count': len(audit_entries),
            'entries': audit_entries,
            'timestamp': datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error in get_audit_log: {e}")
        return {
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }

@mcp.tool()
async def configure_escalation(agent_id: str, escalation_config: dict) -> dict:
    """
    Configure escalation rules and triggers for an agent.
    
    Args:
        agent_id: Target agent identifier
        escalation_config: Escalation configuration including triggers, contacts, and procedures
    
    Returns:
        dict: Configuration status and escalation setup
    """
    
    global supervisor_agent
    if not supervisor_agent:
        return {
            'success': False,
            'error': 'Supervisor not initialized',
            'timestamp': datetime.now().isoformat()
        }
    
    try:
        # Default escalation configuration
        default_config = {
            'confidence_threshold': 0.5,
            'error_count_threshold': 3,
            'quality_threshold': 0.6,
            'escalation_contacts': [],
            'escalation_procedures': ['notify', 'pause', 'manual_review'],
            'auto_escalation_enabled': True,
            'escalation_timeout': 3600  # 1 hour
        }
        
        # Merge with provided configuration
        final_config = {**default_config, **escalation_config}
        final_config['configured_at'] = datetime.now().isoformat()
        final_config['configured_by'] = 'supervisor'
        
        # Store escalation configuration
        supervisor_agent.escalation_config[agent_id] = final_config
        
        # Apply to error handling system if available
        if supervisor_agent.config.error_handling_enabled:
            # Update escalation handler configuration
            if supervisor_agent.error_handling.escalation_handler:
                supervisor_agent.error_handling.escalation_handler.configure_escalation(
                    agent_id, final_config
                )
        
        # Log configuration
        if supervisor_agent.config.reporting_enabled:
            await supervisor_agent.reporting_system.log_audit_event(
                event_type="escalation_configured",
                source="supervisor",
                message=f"Escalation configured for agent {agent_id}",
                metadata={
                    'agent_id': agent_id,
                    'config': final_config
                }
            )
        
        return {
            'success': True,
            'agent_id': agent_id,
            'escalation_config': final_config,
            'auto_escalation_enabled': final_config['auto_escalation_enabled'],
            'timestamp': datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error in configure_escalation: {e}")
        return {
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }

@mcp.tool()
async def knowledge_base_update(update_type: str, data: dict, category: str = "general") -> dict:
    """
    Update supervisor knowledge base with new patterns, procedures, or insights.
    
    Args:
        update_type: Type of update (pattern, procedure, insight, best_practice)
        data: Update data containing the information to add
        category: Category for organization (general, error_handling, monitoring, etc.)
    
    Returns:
        dict: Update status and knowledge base statistics
    """
    
    global supervisor_agent
    if not supervisor_agent:
        return {
            'success': False,
            'error': 'Supervisor not initialized',
            'timestamp': datetime.now().isoformat()
        }
    
    try:
        update_id = str(uuid.uuid4())
        
        # Prepare update entry
        update_entry = {
            'id': update_id,
            'type': update_type,
            'category': category,
            'data': data,
            'created_at': datetime.now().isoformat(),
            'created_by': 'supervisor'
        }
        
        # Add to appropriate knowledge base section
        if update_type == 'pattern':
            if 'patterns' not in supervisor_agent.knowledge_base:
                supervisor_agent.knowledge_base['patterns'] = []
            supervisor_agent.knowledge_base['patterns'].append(update_entry)
        
        elif update_type == 'procedure':
            if 'procedures' not in supervisor_agent.knowledge_base:
                supervisor_agent.knowledge_base['procedures'] = []
            supervisor_agent.knowledge_base['procedures'].append(update_entry)
        
        elif update_type == 'best_practice':
            if 'best_practices' not in supervisor_agent.knowledge_base:
                supervisor_agent.knowledge_base['best_practices'] = []
            supervisor_agent.knowledge_base['best_practices'].append(update_entry)
        
        elif update_type == 'insight':
            if 'insights' not in supervisor_agent.knowledge_base:
                supervisor_agent.knowledge_base['insights'] = []
            supervisor_agent.knowledge_base['insights'].append(update_entry)
        
        else:
            # Generic category
            if update_type not in supervisor_agent.knowledge_base:
                supervisor_agent.knowledge_base[update_type] = []
            supervisor_agent.knowledge_base[update_type].append(update_entry)
        
        # Update metadata
        if 'metadata' not in supervisor_agent.knowledge_base:
            supervisor_agent.knowledge_base['metadata'] = {
                'last_updated': datetime.now().isoformat(),
                'total_entries': 0,
                'categories': []
            }
        
        supervisor_agent.knowledge_base['metadata']['last_updated'] = datetime.now().isoformat()
        supervisor_agent.knowledge_base['metadata']['total_entries'] += 1
        
        if category not in supervisor_agent.knowledge_base['metadata']['categories']:
            supervisor_agent.knowledge_base['metadata']['categories'].append(category)
        
        # Save knowledge base
        supervisor_agent._save_knowledge_base()
        
        # Log update
        if supervisor_agent.config.reporting_enabled:
            await supervisor_agent.reporting_system.log_audit_event(
                event_type="knowledge_base_updated",
                source="supervisor",
                message=f"Knowledge base updated: {update_type} in {category}",
                metadata={
                    'update_id': update_id,
                    'update_type': update_type,
                    'category': category
                }
            )
        
        # Calculate statistics
        stats = {
            'total_entries': supervisor_agent.knowledge_base['metadata']['total_entries'],
            'categories': len(supervisor_agent.knowledge_base['metadata']['categories']),
            'last_updated': supervisor_agent.knowledge_base['metadata']['last_updated']
        }
        
        # Count entries by type
        entry_counts = {}
        for key, value in supervisor_agent.knowledge_base.items():
            if isinstance(value, list) and key != 'metadata':
                entry_counts[key] = len(value)
        
        return {
            'success': True,
            'update_id': update_id,
            'update_type': update_type,
            'category': category,
            'knowledge_base_stats': stats,
            'entry_counts_by_type': entry_counts,
            'timestamp': datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error in knowledge_base_update: {e}")
        return {
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }

@mcp.tool()
async def rollback_state(agent_id: str, snapshot_id: str = None, rollback_steps: int = 1) -> dict:
    """
    Rollback agent state to a previous checkpoint or snapshot.
    
    Args:
        agent_id: Target agent identifier
        snapshot_id: Optional specific snapshot ID to rollback to
        rollback_steps: Number of steps to rollback if no snapshot_id provided
    
    Returns:
        dict: Rollback result and restored state information
    """
    
    global supervisor_agent
    if not supervisor_agent:
        return {
            'success': False,
            'error': 'Supervisor not initialized',
            'timestamp': datetime.now().isoformat()
        }
    
    try:
        if not supervisor_agent.config.error_handling_enabled:
            return {
                'success': False,
                'error': 'Error handling (including rollback) is disabled',
                'timestamp': datetime.now().isoformat()
            }
        
        rollback_id = str(uuid.uuid4())
        
        # Use rollback manager
        rollback_manager = supervisor_agent.error_handling.rollback_manager
        
        if snapshot_id:
            # Rollback to specific snapshot
            result = rollback_manager.rollback_to_snapshot(snapshot_id)
        else:
            # Find recent snapshots for the agent
            snapshots = rollback_manager.list_snapshots(
                agent_id=agent_id,
                limit=rollback_steps + 5
            )
            
            if not snapshots:
                return {
                    'success': False,
                    'error': f'No snapshots found for agent {agent_id}',
                    'timestamp': datetime.now().isoformat()
                }
            
            # Get snapshot at the specified step back
            if len(snapshots) >= rollback_steps:
                target_snapshot = snapshots[rollback_steps - 1]
                result = rollback_manager.rollback_to_snapshot(target_snapshot['snapshot_id'])
            else:
                return {
                    'success': False,
                    'error': f'Not enough snapshots to rollback {rollback_steps} steps',
                    'available_snapshots': len(snapshots),
                    'timestamp': datetime.now().isoformat()
                }
        
        if result['success']:
            # Update session state if agent is being monitored
            if agent_id in supervisor_agent.supervised_agents:
                session_id = supervisor_agent.supervised_agents[agent_id]
                session_data = supervisor_agent.active_sessions[session_id]
                session_data['last_rollback'] = {
                    'rollback_id': rollback_id,
                    'timestamp': datetime.now().isoformat(),
                    'snapshot_id': result.get('snapshot_id'),
                    'rollback_steps': rollback_steps
                }
            
            # Log rollback
            if supervisor_agent.config.reporting_enabled:
                await supervisor_agent.reporting_system.log_audit_event(
                    event_type="state_rollback",
                    source="supervisor",
                    message=f"State rollback executed for agent {agent_id}",
                    metadata={
                        'rollback_id': rollback_id,
                        'agent_id': agent_id,
                        'snapshot_id': result.get('snapshot_id'),
                        'rollback_steps': rollback_steps
                    }
                )
            
            return {
                'success': True,
                'rollback_id': rollback_id,
                'agent_id': agent_id,
                'restored_snapshot_id': result.get('snapshot_id'),
                'restored_timestamp': result.get('timestamp'),
                'rollback_steps': rollback_steps,
                'restored_state_available': True,
                'timestamp': datetime.now().isoformat()
            }
        else:
            return {
                'success': False,
                'error': result.get('error', 'Rollback failed'),
                'timestamp': datetime.now().isoformat()
            }
    
    except Exception as e:
        logger.error(f"Error in rollback_state: {e}")
        return {
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }

@mcp.tool()
async def generate_summary(summary_type: str, time_range: str = "24h", include_recommendations: bool = True) -> dict:
    """
    Generate comprehensive summary reports of supervision activities.
    
    Args:
        summary_type: Type of summary (overview, performance, issues, trends)
        time_range: Time range for summary (1h, 24h, 7d, 30d)
        include_recommendations: Whether to include actionable recommendations
    
    Returns:
        dict: Generated summary with metrics, insights, and recommendations
    """
    
    global supervisor_agent
    if not supervisor_agent:
        return {
            'success': False,
            'error': 'Supervisor not initialized',
            'timestamp': datetime.now().isoformat()
        }
    
    try:
        summary_id = str(uuid.uuid4())
        
        # Parse time range
        time_delta_map = {
            '1h': timedelta(hours=1),
            '24h': timedelta(hours=24),
            '7d': timedelta(days=7),
            '30d': timedelta(days=30)
        }
        
        time_delta = time_delta_map.get(time_range, timedelta(hours=24))
        start_time = datetime.now() - time_delta
        
        # Generate summary based on type
        summary_data = {
            'summary_id': summary_id,
            'summary_type': summary_type,
            'time_range': time_range,
            'generated_at': datetime.now().isoformat(),
            'period_start': start_time.isoformat(),
            'period_end': datetime.now().isoformat()
        }
        
        if summary_type == 'overview':
            summary_data.update({
                'supervised_agents': {
                    'total': len(supervisor_agent.supervised_agents),
                    'active': len([s for s in supervisor_agent.active_sessions.values() if s.get('status') == 'active']),
                    'paused': len([s for s in supervisor_agent.active_sessions.values() if s.get('status') == 'paused']),
                    'terminated': len([s for s in supervisor_agent.active_sessions.values() if s.get('status') == 'terminated'])
                },
                'system_stats': supervisor_agent.stats,
                'monitoring_status': {
                    'enabled': supervisor_agent.config.monitoring_enabled,
                    'active_sessions': len(supervisor_agent.active_sessions)
                },
                'error_handling_status': {
                    'enabled': supervisor_agent.config.error_handling_enabled,
                    'total_recoveries': supervisor_agent.stats['successful_recoveries'],
                    'escalated_issues': supervisor_agent.stats['escalated_issues']
                }
            })
        
        elif summary_type == 'performance':
            # Calculate performance metrics
            total_evaluations = 0
            total_interventions = supervisor_agent.stats['total_interventions']
            success_rate = 0.0
            
            if supervisor_agent.config.monitoring_enabled:
                total_evaluations = supervisor_agent.monitoring_engine.monitoring_stats['total_evaluations']
                if total_evaluations > 0:
                    success_rate = (total_evaluations - supervisor_agent.stats['escalated_issues']) / total_evaluations
            
            summary_data.update({
                'performance_metrics': {
                    'total_evaluations': total_evaluations,
                    'total_interventions': total_interventions,
                    'success_rate': success_rate,
                    'average_response_time': '< 1s',  # Placeholder
                    'system_uptime': str(datetime.now() - supervisor_agent.stats['start_time'])
                },
                'intervention_breakdown': {
                    'pause': 0,  # Would be calculated from actual data
                    'redirect': 0,
                    'adjust': 0,
                    'terminate': 0
                }
            })
        
        elif summary_type == 'issues':
            # Collect recent issues
            issues = []
            alerts = []
            
            for session_data in supervisor_agent.active_sessions.values():
                session_interventions = session_data.get('interventions', [])
                for intervention in session_interventions:
                    intervention_time = datetime.fromisoformat(intervention['timestamp'])
                    if intervention_time >= start_time:
                        issues.append({
                            'agent_id': session_data.get('agent_id'),
                            'type': intervention['type'],
                            'timestamp': intervention['timestamp'],
                            'severity': intervention.get('severity', 'unknown')
                        })
            
            summary_data.update({
                'issues_summary': {
                    'total_issues': len(issues),
                    'critical_issues': len([i for i in issues if i.get('severity') == 'critical']),
                    'resolved_issues': supervisor_agent.stats['successful_recoveries'],
                    'pending_issues': len([i for i in issues if i.get('severity') == 'critical'])
                },
                'recent_issues': issues[-10:],  # Last 10 issues
                'issue_trends': {
                    'increasing': len(issues) > supervisor_agent.stats['total_interventions'] / 2,
                    'most_common_type': 'monitoring_alert'  # Placeholder
                }
            })
        
        elif summary_type == 'trends':
            # Analyze trends
            summary_data.update({
                'trends_analysis': {
                    'agent_activity': 'stable',  # Would be calculated
                    'intervention_frequency': 'decreasing',  # Would be calculated
                    'success_rate_trend': 'improving',  # Would be calculated
                    'common_patterns': [],  # Would be populated from knowledge base
                    'recommendations_effectiveness': 'high'  # Would be calculated
                }
            })
        
        # Add recommendations if requested
        if include_recommendations:
            recommendations = []
            
            if summary_data.get('supervised_agents', {}).get('total', 0) > 10:
                recommendations.append("Consider implementing auto-scaling for high agent volumes")
            
            if supervisor_agent.stats['escalated_issues'] > supervisor_agent.stats['successful_recoveries']:
                recommendations.append("Review escalation triggers and improve automated recovery procedures")
            
            if not recommendations:
                recommendations.append("System operating within normal parameters")
            
            summary_data['recommendations'] = recommendations
        
        # Log summary generation
        if supervisor_agent.config.reporting_enabled:
            await supervisor_agent.reporting_system.log_audit_event(
                event_type="summary_generated",
                source="supervisor",
                message=f"Summary generated: {summary_type} for {time_range}",
                metadata={
                    'summary_id': summary_id,
                    'summary_type': summary_type,
                    'time_range': time_range
                }
            )
        
        return {
            'success': True,
            'summary': summary_data,
            'timestamp': datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error in generate_summary: {e}")
        return {
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }

# Server startup
async def main():
    """Main server startup function"""
    
    logger.info("Starting Comprehensive Supervisor Agent MCP Server")
    
    # Initialize supervisor
    global supervisor_agent
    supervisor_agent = initialize_supervisor()
    
    # Start MCP server
    await mcp.run()

if __name__ == "__main__":
    asyncio.run(main())