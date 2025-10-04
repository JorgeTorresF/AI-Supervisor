# Enhanced Supervisor Agent with Browser Integration
# Integrates browser monitoring capabilities with the existing MCP supervisor system

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict
import os
import sys

# Import existing supervisor components
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from src.integrated_supervisor import SupervisorAgent as BaseSupervisorAgent
from src.monitoring.monitor_engine import MonitoringEngine
from src.reporting.integrated_reporting import ReportingSystem
from src.error_handling.error_handling_system import ErrorHandlingSystem

# Import new browser components
from .task_coherence_engine import TaskCoherenceEngine
from .browser_coherence_integrator import BrowserCoherenceIntegrator
from .websocket_server import SupervisorWebSocketServer

class EnhancedSupervisorAgent(BaseSupervisorAgent):
    """
    Enhanced Supervisor Agent with browser monitoring and task coherence protection.
    Extends the existing MCP supervisor to handle browser-based AI agents.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        # Initialize base supervisor
        super().__init__(config)
        
        # Browser-specific components
        self.task_coherence_engine = TaskCoherenceEngine()
        self.browser_integrator = BrowserCoherenceIntegrator()
        self.websocket_server = None
        
        # Enhanced monitoring for browser agents
        self.browser_monitoring = BrowserAgentMonitoring()
        
        # Unified session management
        self.unified_sessions = UnifiedSessionManager()
        
        # Enhanced reporting
        self.enhanced_reporting = EnhancedReportingSystem(
            base_reporting=self.reporting_system,
            browser_integrator=self.browser_integrator
        )
        
        # Configuration
        self.browser_config = self._setup_browser_config(config)
        
        # Logging
        self.logger = logging.getLogger(__name__)
        
    def _setup_browser_config(self, config: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Setup browser-specific configuration."""
        browser_config = {
            'websocket_host': 'localhost',
            'websocket_port': 8765,
            'enable_browser_monitoring': True,
            'task_coherence_threshold': 0.6,
            'auto_intervention': True,
            'max_interventions_per_session': 10,
            'enable_user_notifications': True,
            'enable_proactive_suggestions': True
        }
        
        if config and 'browser' in config:
            browser_config.update(config['browser'])
        
        return browser_config
    
    async def start_browser_monitoring(self):
        """Start browser monitoring capabilities."""
        if not self.browser_config['enable_browser_monitoring']:
            self.logger.info("Browser monitoring is disabled")
            return
        
        try:
            # Start WebSocket server
            self.websocket_server = SupervisorWebSocketServer(
                host=self.browser_config['websocket_host'],
                port=self.browser_config['websocket_port']
            )
            
            # Connect components
            self.browser_integrator.websocket_handler = self.websocket_server
            self.browser_integrator.storage_handler = self.enhanced_reporting
            self.websocket_server.coherence_integrator = self.browser_integrator
            
            # Start server
            await self.websocket_server.start_server()
            
            self.logger.info(f"Browser monitoring started on ws://{self.browser_config['websocket_host']}:{self.browser_config['websocket_port']}")
            
        except Exception as e:
            self.logger.error(f"Failed to start browser monitoring: {e}")
            raise
    
    async def stop_browser_monitoring(self):
        """Stop browser monitoring capabilities."""
        if self.websocket_server:
            await self.websocket_server.stop_server()
            self.logger.info("Browser monitoring stopped")
    
    async def supervise_agent(self, agent_id: str, agent_type: str = 'mcp', **kwargs) -> Dict[str, Any]:
        """
        Enhanced agent supervision that handles both MCP and browser agents.
        """
        if agent_type == 'browser':
            return await self._supervise_browser_agent(agent_id, **kwargs)
        else:
            # Use existing MCP agent supervision
            return await super().supervise_agent(agent_id, **kwargs)
    
    async def _supervise_browser_agent(self, tab_id: str, **kwargs) -> Dict[str, Any]:
        """
        Supervise a browser-based AI agent.
        """
        try:
            # Get session info
            session_stats = self.browser_integrator.get_session_stats(tab_id)
            
            if session_stats.get('error'):
                return {
                    'status': 'error',
                    'message': 'No active browser session found',
                    'tab_id': tab_id
                }
            
            # Create unified supervision report
            supervision_report = {
                'agent_id': tab_id,
                'agent_type': 'browser',
                'platform': session_stats.get('platform', 'unknown'),
                'status': 'active' if session_stats else 'inactive',
                'task_context': session_stats.get('task_context'),
                'metrics': {
                    'message_count': session_stats.get('message_count', 0),
                    'intervention_count': session_stats.get('intervention_count', 0),
                    'session_duration_minutes': session_stats.get('duration_minutes', 0),
                    'coherence_protection_enabled': True
                },
                'last_activity': session_stats.get('last_activity'),
                'supervision_timestamp': datetime.now().isoformat()
            }
            
            # Add to unified session tracking
            self.unified_sessions.update_session(tab_id, supervision_report)
            
            return supervision_report
            
        except Exception as e:
            self.logger.error(f"Error supervising browser agent {tab_id}: {e}")
            return {
                'status': 'error',
                'message': str(e),
                'tab_id': tab_id
            }
    
    async def get_comprehensive_report(self, include_browser_sessions: bool = True) -> Dict[str, Any]:
        """
        Generate comprehensive report including both MCP and browser agent activities.
        """
        # Get base MCP report
        base_report = await super().generate_supervision_report()
        
        # Add browser-specific data
        if include_browser_sessions and self.browser_config['enable_browser_monitoring']:
            browser_stats = self.browser_integrator.get_session_stats()
            
            enhanced_report = {
                **base_report,
                'browser_monitoring': {
                    'enabled': True,
                    'active_sessions': browser_stats.get('active_sessions', 0),
                    'sessions': browser_stats.get('sessions', []),
                    'websocket_server': {
                        'host': self.browser_config['websocket_host'],
                        'port': self.browser_config['websocket_port'],
                        'status': 'running' if self.websocket_server and self.websocket_server.is_running else 'stopped'
                    }
                },
                'unified_sessions': self.unified_sessions.get_all_sessions(),
                'task_coherence_stats': self._get_coherence_stats()
            }
        else:
            enhanced_report = {
                **base_report,
                'browser_monitoring': {'enabled': False}
            }
        
        return enhanced_report
    
    def _get_coherence_stats(self) -> Dict[str, Any]:
        """Get task coherence protection statistics."""
        # This would typically aggregate stats from all browser sessions
        return {
            'total_interventions': 0,  # Would be calculated from actual data
            'coherence_scores': [],
            'common_drift_patterns': [],
            'protection_effectiveness': 0.0
        }
    
    async def handle_task_coherence_alert(self, tab_id: str, coherence_analysis: Dict[str, Any]):
        """Handle task coherence alerts from browser monitoring."""
        try:
            # Log the coherence issue
            await self.enhanced_reporting.log_coherence_event({
                'tab_id': tab_id,
                'type': 'coherence_alert',
                'analysis': coherence_analysis,
                'timestamp': datetime.now().isoformat()
            })
            
            # If severe, trigger additional monitoring
            if coherence_analysis.get('severity') == 'CRITICAL':
                await self._escalate_coherence_issue(tab_id, coherence_analysis)
            
        except Exception as e:
            self.logger.error(f"Error handling coherence alert for {tab_id}: {e}")
    
    async def _escalate_coherence_issue(self, tab_id: str, analysis: Dict[str, Any]):
        """Escalate critical coherence issues."""
        # Could notify administrators, increase monitoring frequency, etc.
        self.logger.warning(f"Critical coherence issue escalated for tab {tab_id}: {analysis}")
        
        # Send alert through existing alerting system
        if hasattr(self, 'alert_system'):
            await self.alert_system.send_alert({
                'type': 'critical_task_coherence_failure',
                'tab_id': tab_id,
                'analysis': analysis,
                'timestamp': datetime.now().isoformat()
            })
    
    def get_browser_extension_config(self) -> Dict[str, Any]:
        """Get configuration for browser extension."""
        return {
            'websocket_url': f"ws://{self.browser_config['websocket_host']}:{self.browser_config['websocket_port']}",
            'task_coherence_threshold': self.browser_config['task_coherence_threshold'],
            'auto_intervention': self.browser_config['auto_intervention'],
            'enable_notifications': self.browser_config['enable_user_notifications'],
            'max_interventions_per_session': self.browser_config['max_interventions_per_session']
        }
    
    async def shutdown(self):
        """Enhanced shutdown that includes browser monitoring cleanup."""
        # Stop browser monitoring
        await self.stop_browser_monitoring()
        
        # Call parent shutdown
        if hasattr(super(), 'shutdown'):
            await super().shutdown()
        
        self.logger.info("Enhanced Supervisor Agent shutdown complete")


class BrowserAgentMonitoring:
    """Enhanced monitoring specifically for browser-based agents."""
    
    def __init__(self):
        self.active_monitors = {}
        self.monitoring_rules = {}
        
    def start_monitoring(self, tab_id: str, monitoring_config: Dict[str, Any]):
        """Start monitoring a browser agent."""
        self.active_monitors[tab_id] = {
            'start_time': datetime.now(),
            'config': monitoring_config,
            'status': 'active'
        }
    
    def stop_monitoring(self, tab_id: str):
        """Stop monitoring a browser agent."""
        if tab_id in self.active_monitors:
            self.active_monitors[tab_id]['status'] = 'stopped'
            self.active_monitors[tab_id]['end_time'] = datetime.now()
    
    def get_monitoring_status(self, tab_id: str) -> Dict[str, Any]:
        """Get monitoring status for a specific tab."""
        return self.active_monitors.get(tab_id, {'status': 'not_found'})


class UnifiedSessionManager:
    """Manages both MCP and browser agent sessions in a unified way."""
    
    def __init__(self):
        self.sessions = {}
    
    def update_session(self, session_id: str, session_data: Dict[str, Any]):
        """Update session information."""
        self.sessions[session_id] = {
            **self.sessions.get(session_id, {}),
            **session_data,
            'last_updated': datetime.now().isoformat()
        }
    
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session information."""
        return self.sessions.get(session_id)
    
    def get_all_sessions(self) -> Dict[str, Any]:
        """Get all session information."""
        return {
            'total_sessions': len(self.sessions),
            'sessions': self.sessions
        }
    
    def remove_session(self, session_id: str):
        """Remove a session."""
        if session_id in self.sessions:
            del self.sessions[session_id]


class EnhancedReportingSystem:
    """Enhanced reporting that combines MCP and browser agent data."""
    
    def __init__(self, base_reporting, browser_integrator):
        self.base_reporting = base_reporting
        self.browser_integrator = browser_integrator
        self.coherence_events = []
        
    async def log_coherence_event(self, event: Dict[str, Any]):
        """Log task coherence related events."""
        self.coherence_events.append({
            **event,
            'id': f"coherence_{len(self.coherence_events)}",
            'logged_at': datetime.now().isoformat()
        })
    
    async def log_event(self, event: Dict[str, Any]):
        """Enhanced event logging."""
        # Add browser-specific context if available
        if 'tab_id' in event:
            session_info = self.browser_integrator.get_session_stats(event['tab_id'])
            if not session_info.get('error'):
                event['session_context'] = session_info
        
        # Use base reporting system
        if hasattr(self.base_reporting, 'log_event'):
            await self.base_reporting.log_event(event)
    
    async def archive_session(self, session_data: Dict[str, Any]):
        """Archive browser session data."""
        # Store browser session data with base reporting system
        if hasattr(self.base_reporting, 'archive_session'):
            await self.base_reporting.archive_session(session_data)
    
    def get_coherence_report(self) -> Dict[str, Any]:
        """Generate task coherence specific report."""
        return {
            'total_coherence_events': len(self.coherence_events),
            'events': self.coherence_events[-10:],  # Last 10 events
            'summary': self._summarize_coherence_events()
        }
    
    def _summarize_coherence_events(self) -> Dict[str, Any]:
        """Summarize coherence events for reporting."""
        if not self.coherence_events:
            return {'message': 'No coherence events recorded'}
        
        interventions = [e for e in self.coherence_events if e.get('type') == 'intervention_executed']
        alerts = [e for e in self.coherence_events if e.get('type') == 'coherence_alert']
        
        return {
            'total_interventions': len(interventions),
            'total_alerts': len(alerts),
            'avg_coherence_score': 0.8,  # Would calculate from actual data
            'most_common_drift_type': 'keyword_hijacking'  # Would analyze from actual data
        }


if __name__ == "__main__":
    # Example usage
    import asyncio
    
    async def run_enhanced_supervisor():
        # Configuration
        config = {
            'browser': {
                'websocket_host': 'localhost',
                'websocket_port': 8765,
                'enable_browser_monitoring': True,
                'task_coherence_threshold': 0.6
            }
        }
        
        # Create enhanced supervisor
        supervisor = EnhancedSupervisorAgent(config)
        
        try:
            # Start browser monitoring
            await supervisor.start_browser_monitoring()
            
            print("Enhanced Supervisor Agent with Browser Integration started!")
            print(f"WebSocket server: ws://{config['browser']['websocket_host']}:{config['browser']['websocket_port']}")
            print("Browser extension configuration:")
            print(json.dumps(supervisor.get_browser_extension_config(), indent=2))
            
            # Keep running
            while True:
                await asyncio.sleep(1)
                
        except KeyboardInterrupt:
            print("\nShutting down...")
        finally:
            await supervisor.shutdown()
    
    asyncio.run(run_enhanced_supervisor())
