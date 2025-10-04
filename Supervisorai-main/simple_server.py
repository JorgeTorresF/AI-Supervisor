#!/usr/bin/env python3
"""
Simplified Supervisor WebSocket Server for Demo
"""

import asyncio
import json
import logging
import websockets
from datetime import datetime
from typing import Dict, Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DecisionType(Enum):
    ALLOW = "ALLOW"
    WARN = "WARN"
    CORRECT = "CORRECT"
    ESCALATE = "ESCALATE"

@dataclass
class SupervisorDecision:
    decision: DecisionType
    confidence: float
    reasoning: str
    timestamp: str
    action_required: bool = False
    
@dataclass
class AgentState:
    quality_score: float = 0.8
    error_count: int = 0
    resource_usage: float = 0.3
    task_progress: float = 0.5
    drift_score: float = 0.1
    timestamp: str = ""

class SimpleSupervisor:
    """Simplified supervisor for demo purposes"""
    
    def __init__(self):
        self.sessions = {}
        self.decision_log = []
        self.active_tasks = {}
        
    def make_decision(self, agent_state: AgentState) -> SupervisorDecision:
        """Make a supervision decision based on agent state"""
        
        # Simple decision logic with weighted scoring
        score = (
            agent_state.quality_score * 0.3 +
            (1 - agent_state.drift_score) * 0.2 +
            agent_state.task_progress * 0.2 +
            (1 - agent_state.resource_usage) * 0.15 +
            max(0, 1 - agent_state.error_count * 0.1) * 0.15
        )
        
        # Determine decision based on score
        if score >= 0.8:
            decision = DecisionType.ALLOW
            reasoning = f"High performance score ({score:.2f}). Agent performing well."
        elif score >= 0.6:
            decision = DecisionType.WARN
            reasoning = f"Moderate performance score ({score:.2f}). Monitor closely."
        elif score >= 0.4:
            decision = DecisionType.CORRECT
            reasoning = f"Low performance score ({score:.2f}). Correction needed."
        else:
            decision = DecisionType.ESCALATE
            reasoning = f"Critical performance score ({score:.2f}). Immediate escalation required."
            
        supervisor_decision = SupervisorDecision(
            decision=decision,
            confidence=min(0.95, score + 0.1),
            reasoning=reasoning,
            timestamp=datetime.utcnow().isoformat(),
            action_required=(decision != DecisionType.ALLOW)
        )
        
        # Log the decision
        self.decision_log.append(asdict(supervisor_decision))
        logger.info(f"Decision made: {decision.value} (confidence: {supervisor_decision.confidence:.2f})")
        
        return supervisor_decision

# Global supervisor instance
supervisor = SimpleSupervisor()

# WebSocket server
async def handle_client(websocket):
    """Handle WebSocket client connections"""
    logger.info(f"Client connected from {websocket.remote_address}")
    
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                tool = data.get('tool')
                args = data.get('args', {})
                
                if tool == 'get_minimax_decision':
                    # Create agent state from args
                    agent_state = AgentState(
                        quality_score=args.get('quality_score', 0.8),
                        error_count=args.get('error_count', 0),
                        resource_usage=args.get('resource_usage', 0.3),
                        task_progress=args.get('task_progress', 0.5),
                        drift_score=args.get('drift_score', 0.1),
                        timestamp=datetime.utcnow().isoformat()
                    )
                    
                    # Get supervisor decision
                    decision = supervisor.make_decision(agent_state)
                    
                    response = {
                        'success': True,
                        'decision': decision.decision.value,
                        'confidence': decision.confidence,
                        'reasoning': decision.reasoning,
                        'timestamp': decision.timestamp,
                        'action_required': decision.action_required
                    }
                    
                elif tool == 'get_decision_log':
                    response = {
                        'success': True,
                        'decisions': supervisor.decision_log[-args.get('limit', 50):]
                    }
                    
                elif tool == 'start_session':
                    session_id = args.get('session_id', f"session_{len(supervisor.sessions)}")
                    supervisor.sessions[session_id] = {
                        'started_at': datetime.utcnow().isoformat(),
                        'agent_name': args.get('agent_name', 'unknown'),
                        'task_description': args.get('task_description', '')
                    }
                    response = {
                        'success': True,
                        'session_id': session_id,
                        'message': 'Supervision session started'
                    }
                    
                else:
                    response = {
                        'success': False,
                        'error': f'Unknown tool: {tool}'
                    }
                    
                await websocket.send(json.dumps(response))
                
            except json.JSONDecodeError:
                error_response = {
                    'success': False,
                    'error': 'Invalid JSON message'
                }
                await websocket.send(json.dumps(error_response))
                
            except Exception as e:
                logger.error(f"Error processing message: {e}")
                error_response = {
                    'success': False,
                    'error': str(e)
                }
                await websocket.send(json.dumps(error_response))
                
    except websockets.exceptions.ConnectionClosed:
        logger.info(f"Client {websocket.remote_address} disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")

async def main():
    """Start the WebSocket server"""
    host = "localhost"
    port = 8765
    
    logger.info(f"Starting Supervisor WebSocket server on {host}:{port}")
    
    # Start WebSocket server
    server = await websockets.serve(handle_client, host, port)
    logger.info(f"✅ Supervisor AI Server running on ws://{host}:{port}")
    
    # Keep server running
    await server.wait_closed()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}")
