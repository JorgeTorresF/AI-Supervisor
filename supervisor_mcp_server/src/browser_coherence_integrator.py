# Browser Integration Layer for Task Coherence Protection
# Connects the Task Coherence Engine with the browser extension

import json
import asyncio
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
import logging

from .task_coherence_engine import TaskCoherenceEngine, InterventionStrategy

class BrowserCoherenceIntegrator:
    """
    Integration layer that connects browser extension with task coherence protection.
    Handles real-time analysis and intervention coordination.
    """
    
    def __init__(self, websocket_handler=None, storage_handler=None):
        self.coherence_engine = TaskCoherenceEngine()
        self.websocket_handler = websocket_handler
        self.storage_handler = storage_handler
        
        # Session management
        self.active_sessions = {}  # tab_id -> BrowserSession
        self.intervention_queue = []
        
        # Configuration
        self.config = CoherenceProtectionConfig()
        
        # Logging
        self.logger = logging.getLogger(__name__)
        
    async def handle_browser_message(self, message: Dict[str, Any], tab_id: str) -> Dict[str, Any]:
        """
        Handle incoming messages from browser extension.
        """
        try:
            message_type = message.get('type')
            data = message.get('data', {})
            
            if message_type == 'USER_INPUT_ANALYSIS':
                return await self._handle_user_input_analysis(data, tab_id)
            elif message_type == 'AGENT_MESSAGE_ANALYSIS':
                return await self._handle_agent_message_analysis(data, tab_id)
            elif message_type == 'SESSION_START':
                return await self._handle_session_start(data, tab_id)
            elif message_type == 'SESSION_END':
                return await self._handle_session_end(data, tab_id)
            elif message_type == 'MANUAL_TASK_CONTEXT':
                return await self._handle_manual_task_context(data, tab_id)
            else:
                self.logger.warning(f"Unknown message type: {message_type}")
                return {'status': 'error', 'message': 'Unknown message type'}
                
        except Exception as e:
            self.logger.error(f"Error handling browser message: {e}")
            return {'status': 'error', 'message': str(e)}
    
    async def _handle_user_input_analysis(self, data: Dict, tab_id: str) -> Dict[str, Any]:
        """
        Handle user input analysis request from browser.
        """
        user_input = data.get('input', '')
        existing_context = data.get('context')
        
        # Get or create session
        session = self._get_or_create_session(tab_id, data.get('url', ''))
        
        # Initialize or update task context
        if not session.task_context or self._should_update_context(user_input, session.task_context):
            session.task_context = self.coherence_engine.initialize_task_context(user_input)
            
            # Log context establishment
            await self._log_event({
                'tab_id': tab_id,
                'type': 'task_context_established',
                'primary_goal': session.task_context.primary_goal,
                'domain': session.task_context.domain,
                'context_keywords': session.task_context.context_keywords,
                'timestamp': datetime.now().isoformat()
            })
            
            # Notify browser of new context
            await self._notify_browser(tab_id, {
                'type': 'TASK_CONTEXT_UPDATED',
                'data': {
                    'primary_goal': session.task_context.primary_goal,
                    'domain': session.task_context.domain,
                    'context_keywords': session.task_context.context_keywords
                }
            })
        
        return {
            'status': 'success',
            'task_context': {
                'primary_goal': session.task_context.primary_goal,
                'domain': session.task_context.domain,
                'context_keywords': session.task_context.context_keywords
            } if session.task_context else None
        }
    
    async def _handle_agent_message_analysis(self, data: Dict, tab_id: str) -> Dict[str, Any]:
        """
        Handle agent message analysis - the core coherence check.
        """
        agent_content = data.get('content', '')
        platform = data.get('platform', 'unknown')
        user_input = data.get('user_input')
        
        session = self.active_sessions.get(tab_id)
        if not session or not session.task_context:
            return {'status': 'error', 'message': 'No task context available'}
        
        # Perform coherence analysis
        self.coherence_engine.task_context = session.task_context
        coherence_analysis = self.coherence_engine.analyze_response_coherence(agent_content, user_input)
        
        # Update session statistics
        session.message_count += 1
        session.last_activity = datetime.now()
        
        # Log the analysis
        await self._log_event({
            'tab_id': tab_id,
            'type': 'coherence_analysis',
            'coherence_score': coherence_analysis.final_score,
            'needs_intervention': coherence_analysis.needs_intervention,
            'issues': coherence_analysis.issues,
            'platform': platform,
            'timestamp': datetime.now().isoformat()
        })
        
        # Handle intervention if needed
        intervention_response = None
        if coherence_analysis.needs_intervention:
            intervention_strategy = self.coherence_engine.generate_intervention_strategy(coherence_analysis)
            intervention_response = await self._execute_intervention(intervention_strategy, tab_id, coherence_analysis)
        
        return {
            'status': 'success',
            'coherence_analysis': {
                'final_score': coherence_analysis.final_score,
                'needs_intervention': coherence_analysis.needs_intervention,
                'severity': coherence_analysis.get_severity_level(),
                'issues': coherence_analysis.issues
            },
            'intervention': intervention_response
        }
    
    async def _execute_intervention(self, strategy: InterventionStrategy, tab_id: str, analysis) -> Dict[str, Any]:
        """
        Execute intervention strategy.
        """
        session = self.active_sessions[tab_id]
        session.intervention_count += 1
        
        # Create intervention record
        intervention = {
            'id': f"{tab_id}-{session.intervention_count}-{int(datetime.now().timestamp())}",
            'tab_id': tab_id,
            'type': strategy.intervention_type,
            'severity': strategy.severity,
            'user_notification': strategy.user_notification,
            'correction_prompt': strategy.correction_prompt,
            'coherence_score': analysis.final_score,
            'timestamp': datetime.now().isoformat()
        }
        
        # Log intervention
        await self._log_event({
            'tab_id': tab_id,
            'type': 'intervention_executed',
            'intervention_type': strategy.intervention_type,
            'severity': strategy.severity,
            'timestamp': datetime.now().isoformat()
        })
        
        # Send to browser for user notification
        await self._notify_browser(tab_id, {
            'type': 'INTERVENTION_REQUIRED',
            'data': {
                'intervention_type': strategy.intervention_type,
                'severity': strategy.severity,
                'message': strategy.user_notification,
                'suggested_prompt': strategy.correction_prompt,
                'preventive_measures': strategy.preventive_measures
            }
        })
        
        return {
            'intervention_id': intervention['id'],
            'type': strategy.intervention_type,
            'message': strategy.user_notification,
            'suggested_prompt': strategy.correction_prompt
        }
    
    async def _handle_session_start(self, data: Dict, tab_id: str) -> Dict[str, Any]:
        """
        Handle session start.
        """
        url = data.get('url', '')
        platform = data.get('platform', 'unknown')
        
        session = BrowserSession(
            tab_id=tab_id,
            url=url,
            platform=platform,
            start_time=datetime.now()
        )
        
        self.active_sessions[tab_id] = session
        
        self.logger.info(f"Started monitoring session for tab {tab_id} on {platform}")
        
        return {'status': 'success', 'session_id': tab_id}
    
    async def _handle_session_end(self, data: Dict, tab_id: str) -> Dict[str, Any]:
        """
        Handle session end.
        """
        if tab_id in self.active_sessions:
            session = self.active_sessions[tab_id]
            session.end_time = datetime.now()
            
            # Archive session data
            await self._archive_session(session)
            
            # Remove from active sessions
            del self.active_sessions[tab_id]
            
            self.logger.info(f"Ended monitoring session for tab {tab_id}")
        
        return {'status': 'success'}
    
    async def _handle_manual_task_context(self, data: Dict, tab_id: str) -> Dict[str, Any]:
        """
        Handle manually set task context from user.
        """
        main_goal = data.get('main_goal', '')
        
        if not main_goal:
            return {'status': 'error', 'message': 'Main goal is required'}
        
        # Create task context from manual input
        session = self._get_or_create_session(tab_id, data.get('url', ''))
        session.task_context = self.coherence_engine.initialize_task_context(f"I want to {main_goal}")
        
        # Override with manual goal
        session.task_context.primary_goal = main_goal
        
        await self._log_event({
            'tab_id': tab_id,
            'type': 'manual_task_context_set',
            'primary_goal': main_goal,
            'timestamp': datetime.now().isoformat()
        })
        
        return {
            'status': 'success',
            'task_context': {
                'primary_goal': session.task_context.primary_goal,
                'domain': session.task_context.domain
            }
        }
    
    def _get_or_create_session(self, tab_id: str, url: str = '') -> 'BrowserSession':
        """
        Get existing session or create new one.
        """
        if tab_id not in self.active_sessions:
            self.active_sessions[tab_id] = BrowserSession(
                tab_id=tab_id,
                url=url,
                platform='unknown',
                start_time=datetime.now()
            )
        
        return self.active_sessions[tab_id]
    
    def _should_update_context(self, user_input: str, existing_context) -> bool:
        """
        Determine if task context should be updated based on new user input.
        """
        if not existing_context:
            return True
        
        # Check for explicit goal changes
        goal_change_patterns = [
            r"(?:now|instead)\s+(?:i want to|let's|i need to)\s+([\w\s]+)",
            r"(?:change|switch)\s+(?:to|the task to)\s+([\w\s]+)",
            r"(?:new|different)\s+(?:project|task|goal)\s*:?\s*([\w\s]+)"
        ]
        
        import re
        for pattern in goal_change_patterns:
            if re.search(pattern, user_input.lower()):
                return True
        
        return False
    
    async def _notify_browser(self, tab_id: str, message: Dict[str, Any]):
        """
        Send notification to browser extension.
        """
        if self.websocket_handler:
            await self.websocket_handler.send_to_tab(tab_id, message)
        else:
            self.logger.warning(f"No websocket handler available to send message to tab {tab_id}")
    
    async def _log_event(self, event: Dict[str, Any]):
        """
        Log event for monitoring and analysis.
        """
        if self.storage_handler:
            await self.storage_handler.log_event(event)
        else:
            self.logger.info(f"Event: {json.dumps(event, indent=2)}")
    
    async def _archive_session(self, session: 'BrowserSession'):
        """
        Archive completed session.
        """
        session_data = {
            'tab_id': session.tab_id,
            'url': session.url,
            'platform': session.platform,
            'start_time': session.start_time.isoformat(),
            'end_time': session.end_time.isoformat() if session.end_time else None,
            'message_count': session.message_count,
            'intervention_count': session.intervention_count,
            'task_context': {
                'primary_goal': session.task_context.primary_goal,
                'domain': session.task_context.domain,
                'context_keywords': session.task_context.context_keywords
            } if session.task_context else None
        }
        
        if self.storage_handler:
            await self.storage_handler.archive_session(session_data)
        else:
            self.logger.info(f"Session archived: {json.dumps(session_data, indent=2)}")
    
    def get_session_stats(self, tab_id: str = None) -> Dict[str, Any]:
        """
        Get statistics for active sessions.
        """
        if tab_id:
            session = self.active_sessions.get(tab_id)
            if session:
                return {
                    'tab_id': session.tab_id,
                    'platform': session.platform,
                    'message_count': session.message_count,
                    'intervention_count': session.intervention_count,
                    'duration_minutes': (datetime.now() - session.start_time).total_seconds() / 60,
                    'task_context': {
                        'primary_goal': session.task_context.primary_goal,
                        'domain': session.task_context.domain
                    } if session.task_context else None
                }
            return {'error': 'Session not found'}
        else:
            return {
                'active_sessions': len(self.active_sessions),
                'sessions': [self.get_session_stats(tab_id) for tab_id in self.active_sessions.keys()]
            }


@dataclass
class BrowserSession:
    """Represents an active browser session being monitored."""
    tab_id: str
    url: str
    platform: str
    start_time: datetime
    end_time: Optional[datetime] = None
    message_count: int = 0
    intervention_count: int = 0
    task_context: Any = None  # TaskContext object
    last_activity: Optional[datetime] = None


class CoherenceProtectionConfig:
    """Configuration for task coherence protection."""
    
    def __init__(self):
        self.intervention_threshold = 0.6
        self.enable_proactive_suggestions = True
        self.enable_user_notifications = True
        self.max_interventions_per_session = 10
        self.context_expiry_minutes = 60
        self.enable_learning = True
        
        # Severity thresholds
        self.critical_threshold = 0.3
        self.moderate_threshold = 0.6
        
        # Feature flags
        self.enable_keyword_hijacking_detection = True
        self.enable_forbidden_topic_detection = True
        self.enable_domain_consistency_check = True
    
    def update_from_dict(self, config_dict: Dict[str, Any]):
        """Update configuration from dictionary."""
        for key, value in config_dict.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary."""
        return {
            'intervention_threshold': self.intervention_threshold,
            'enable_proactive_suggestions': self.enable_proactive_suggestions,
            'enable_user_notifications': self.enable_user_notifications,
            'max_interventions_per_session': self.max_interventions_per_session,
            'context_expiry_minutes': self.context_expiry_minutes,
            'enable_learning': self.enable_learning,
            'critical_threshold': self.critical_threshold,
            'moderate_threshold': self.moderate_threshold,
            'enable_keyword_hijacking_detection': self.enable_keyword_hijacking_detection,
            'enable_forbidden_topic_detection': self.enable_forbidden_topic_detection,
            'enable_domain_consistency_check': self.enable_domain_consistency_check
        }


if __name__ == "__main__":
    # Example usage
    import asyncio
    
    async def test_browser_integration():
        integrator = BrowserCoherenceIntegrator()
        
        # Simulate user input that establishes context
        user_message = {
            'type': 'USER_INPUT_ANALYSIS',
            'data': {
                'input': "I'm building a social media app for this hackathon",
                'url': 'https://chat.example.com'
            }
        }
        
        result = await integrator.handle_browser_message(user_message, 'tab-123')
        print(f"User input analysis: {json.dumps(result, indent=2)}")
        
        # Simulate problematic agent response
        agent_message = {
            'type': 'AGENT_MESSAGE_ANALYSIS',
            'data': {
                'content': """I'd be happy to help you with this hackathon! Let me start by helping you plan the event. 
                For a successful hackathon, you'll need to consider the venue, participant registration, 
                team formation activities, and judging criteria.""",
                'platform': 'test_platform',
                'user_input': "I'm building a social media app for this hackathon"
            }
        }
        
        result = await integrator.handle_browser_message(agent_message, 'tab-123')
        print(f"Agent message analysis: {json.dumps(result, indent=2)}")
        
        # Get session stats
        stats = integrator.get_session_stats('tab-123')
        print(f"Session stats: {json.dumps(stats, indent=2)}")
    
    asyncio.run(test_browser_integration())
