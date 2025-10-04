"""Loop Detection and Control System for preventing infinite loops."""

import asyncio
import logging
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from collections import defaultdict, deque
import difflib


@dataclass
class LoopPattern:
    """Represents a detected loop pattern."""
    pattern_id: str
    agent_id: str
    pattern_hash: str
    occurrences: int
    first_seen: datetime
    last_seen: datetime
    similarity_score: float
    actions: List[str]
    metadata: Dict[str, Any]


class LoopDetector:
    """System for detecting and controlling infinite loops in agent behavior."""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or self._default_config()
        self.logger = logging.getLogger(__name__)
        
        # Action history for each agent
        self.action_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=100))
        
        # Detected patterns
        self.detected_patterns: Dict[str, LoopPattern] = {}
        
        # Agent state tracking
        self.agent_states: Dict[str, Dict[str, Any]] = {}
        
        # Circuit breaker states
        self.circuit_breakers: Dict[str, Dict[str, Any]] = {}
        
        # Statistics
        self.stats = {
            'loops_detected': 0,
            'agents_paused': 0,
            'circuit_breakers_triggered': 0,
            'patterns_identified': 0
        }
    
    def _default_config(self) -> Dict[str, Any]:
        """Default configuration for loop detection."""
        return {
            'max_iterations': 50,
            'similarity_threshold': 0.8,
            'time_window_seconds': 300,
            'min_pattern_length': 3,
            'max_pattern_length': 20,
            'circuit_breaker_threshold': 5,
            'circuit_breaker_timeout': 60,
            'action_history_size': 100,
            'enable_auto_pause': True,
            'enable_pattern_learning': True
        }
    
    async def check_for_loop(
        self,
        error_context: 'ErrorContext',
        action_data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Check if an error indicates a loop condition."""
        
        agent_id = error_context.agent_id
        
        # Record the action/error
        action_record = {
            'timestamp': datetime.utcnow(),
            'error_type': error_context.error_type.value,
            'error_message': error_context.error_message,
            'context': action_data or {}
        }
        
        self.action_history[agent_id].append(action_record)
        
        # Check for various loop indicators
        loop_detected = (
            await self._check_repetitive_actions(agent_id) or
            await self._check_error_patterns(agent_id) or
            await self._check_state_cycles(agent_id) or
            await self._check_time_based_loops(agent_id)
        )
        
        if loop_detected:
            await self._handle_loop_detection(agent_id, error_context)
        
        return loop_detected
    
    async def _check_repetitive_actions(self, agent_id: str) -> bool:
        """Check for repetitive action patterns."""
        
        history = list(self.action_history[agent_id])
        if len(history) < self.config['min_pattern_length']:
            return False
        
        # Look for repeating patterns
        for pattern_length in range(
            self.config['min_pattern_length'],
            min(self.config['max_pattern_length'], len(history) // 2) + 1
        ):
            if await self._detect_pattern_repetition(history, pattern_length):
                return True
        
        return False
    
    async def _detect_pattern_repetition(
        self,
        history: List[Dict[str, Any]],
        pattern_length: int
    ) -> bool:
        """Detect if a pattern is repeating in the history."""
        
        if len(history) < pattern_length * 2:
            return False
        
        # Get the most recent pattern
        recent_pattern = history[-pattern_length:]
        
        # Check how many times this pattern repeats
        repetitions = 1
        for i in range(pattern_length, len(history), pattern_length):
            start_idx = len(history) - i - pattern_length
            if start_idx < 0:
                break
            
            pattern_segment = history[start_idx:start_idx + pattern_length]
            
            if await self._patterns_similar(recent_pattern, pattern_segment):
                repetitions += 1
            else:
                break
        
        # Consider it a loop if pattern repeats enough times
        threshold = max(3, self.config['max_iterations'] // pattern_length)
        return repetitions >= threshold
    
    async def _patterns_similar(
        self,
        pattern1: List[Dict[str, Any]],
        pattern2: List[Dict[str, Any]]
    ) -> bool:
        """Check if two patterns are similar enough to be considered the same."""
        
        if len(pattern1) != len(pattern2):
            return False
        
        similarity_scores = []
        
        for action1, action2 in zip(pattern1, pattern2):
            # Compare error types
            type_match = action1['error_type'] == action2['error_type']
            
            # Compare error messages using text similarity
            msg_similarity = difflib.SequenceMatcher(
                None, action1['error_message'], action2['error_message']
            ).ratio()
            
            # Combine similarities
            action_similarity = (0.6 * (1.0 if type_match else 0.0)) + (0.4 * msg_similarity)
            similarity_scores.append(action_similarity)
        
        # Average similarity across all actions in pattern
        avg_similarity = sum(similarity_scores) / len(similarity_scores)
        
        return avg_similarity >= self.config['similarity_threshold']
    
    async def _check_error_patterns(self, agent_id: str) -> bool:
        """Check for repeating error patterns."""
        
        history = list(self.action_history[agent_id])
        recent_history = history[-20:]  # Look at recent history
        
        error_sequence = [action['error_type'] for action in recent_history]
        
        # Count consecutive identical errors
        if len(error_sequence) >= 5:
            if len(set(error_sequence[-5:])) == 1:  # Last 5 errors are identical
                return True
        
        # Check for alternating error patterns
        if len(error_sequence) >= 6:
            pattern = error_sequence[-6:]
            if pattern[0] == pattern[2] == pattern[4] and pattern[1] == pattern[3] == pattern[5]:
                return True
        
        return False
    
    async def _check_state_cycles(self, agent_id: str) -> bool:
        """Check for state-based cycles."""
        
        # This would check for cycles in agent state transitions
        # For now, implement a simple version
        
        current_state = self.agent_states.get(agent_id, {})
        if not current_state:
            return False
        
        # Check if we've seen this exact state recently
        state_hash = self._hash_state(current_state)
        
        # Store state history (simplified)
        if not hasattr(self, '_state_history'):
            self._state_history = defaultdict(list)
        
        self._state_history[agent_id].append({
            'timestamp': datetime.utcnow(),
            'state_hash': state_hash
        })
        
        # Keep only recent states
        cutoff = datetime.utcnow() - timedelta(seconds=self.config['time_window_seconds'])
        self._state_history[agent_id] = [
            s for s in self._state_history[agent_id]
            if s['timestamp'] > cutoff
        ]
        
        # Check for repeated states
        recent_hashes = [s['state_hash'] for s in self._state_history[agent_id][-10:]]
        return recent_hashes.count(state_hash) >= 3
    
    async def _check_time_based_loops(self, agent_id: str) -> bool:
        """Check for time-based loop indicators."""
        
        history = list(self.action_history[agent_id])
        if len(history) < 10:
            return False
        
        # Check if too many actions in short time period
        recent_actions = [
            action for action in history
            if (datetime.utcnow() - action['timestamp']).total_seconds() < 60
        ]
        
        return len(recent_actions) > self.config['max_iterations']
    
    async def _handle_loop_detection(
        self,
        agent_id: str,
        error_context: 'ErrorContext'
    ):
        """Handle detected loop condition."""
        
        self.stats['loops_detected'] += 1
        
        self.logger.warning(f"Loop detected for agent {agent_id}")
        
        # Create loop pattern record
        pattern_id = await self._create_loop_pattern(agent_id, error_context)
        
        # Trigger circuit breaker if enabled
        if self.config.get('enable_auto_pause', True):
            await self._trigger_circuit_breaker(agent_id, pattern_id)
    
    async def _create_loop_pattern(
        self,
        agent_id: str,
        error_context: 'ErrorContext'
    ) -> str:
        """Create a record of the detected loop pattern."""
        
        import uuid
        
        pattern_id = str(uuid.uuid4())
        
        # Extract recent actions for pattern
        recent_actions = list(self.action_history[agent_id])[-10:]
        action_strings = [f"{a['error_type']}:{a['error_message'][:50]}" for a in recent_actions]
        
        # Create pattern hash
        pattern_data = '|'.join(action_strings)
        pattern_hash = hashlib.sha256(pattern_data.encode()).hexdigest()
        
        # Check if we've seen this pattern before
        existing_pattern = next(
            (p for p in self.detected_patterns.values() if p.pattern_hash == pattern_hash),
            None
        )
        
        if existing_pattern:
            existing_pattern.occurrences += 1
            existing_pattern.last_seen = datetime.utcnow()
            return existing_pattern.pattern_id
        
        # Create new pattern
        pattern = LoopPattern(
            pattern_id=pattern_id,
            agent_id=agent_id,
            pattern_hash=pattern_hash,
            occurrences=1,
            first_seen=datetime.utcnow(),
            last_seen=datetime.utcnow(),
            similarity_score=1.0,
            actions=action_strings,
            metadata={
                'error_context': error_context.error_id,
                'detection_method': 'automatic'
            }
        )
        
        self.detected_patterns[pattern_id] = pattern
        self.stats['patterns_identified'] += 1
        
        return pattern_id
    
    async def _trigger_circuit_breaker(self, agent_id: str, pattern_id: str):
        """Trigger circuit breaker to pause agent."""
        
        self.circuit_breakers[agent_id] = {
            'triggered_at': datetime.utcnow(),
            'pattern_id': pattern_id,
            'timeout': self.config['circuit_breaker_timeout'],
            'status': 'open'
        }
        
        self.stats['circuit_breakers_triggered'] += 1
        self.stats['agents_paused'] += 1
        
        self.logger.warning(
            f"Circuit breaker triggered for agent {agent_id}. "
            f"Agent paused for {self.config['circuit_breaker_timeout']} seconds."
        )
    
    async def is_agent_paused(self, agent_id: str) -> bool:
        """Check if an agent is currently paused by circuit breaker."""
        
        breaker = self.circuit_breakers.get(agent_id)
        if not breaker or breaker['status'] != 'open':
            return False
        
        # Check if timeout has expired
        time_since_trigger = (datetime.utcnow() - breaker['triggered_at']).total_seconds()
        if time_since_trigger > breaker['timeout']:
            # Reset circuit breaker
            breaker['status'] = 'closed'
            self.stats['agents_paused'] -= 1
            return False
        
        return True
    
    async def reset_agent(self, agent_id: str) -> bool:
        """Reset an agent's loop detection state."""
        
        try:
            # Clear action history
            self.action_history[agent_id].clear()
            
            # Reset circuit breaker
            if agent_id in self.circuit_breakers:
                self.circuit_breakers[agent_id]['status'] = 'closed'
                self.stats['agents_paused'] = max(0, self.stats['agents_paused'] - 1)
            
            # Clear agent state
            self.agent_states.pop(agent_id, None)
            
            self.logger.info(f"Reset loop detection state for agent {agent_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to reset agent {agent_id}: {str(e)}")
            return False
    
    async def get_loop_patterns(self, agent_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get detected loop patterns."""
        
        patterns = []
        for pattern in self.detected_patterns.values():
            if agent_id and pattern.agent_id != agent_id:
                continue
            
            patterns.append({
                'pattern_id': pattern.pattern_id,
                'agent_id': pattern.agent_id,
                'occurrences': pattern.occurrences,
                'first_seen': pattern.first_seen.isoformat(),
                'last_seen': pattern.last_seen.isoformat(),
                'similarity_score': pattern.similarity_score,
                'actions': pattern.actions,
                'metadata': pattern.metadata
            })
        
        return patterns
    
    def _hash_state(self, state: Dict[str, Any]) -> str:
        """Create a hash of agent state for comparison."""
        import json
        state_str = json.dumps(state, sort_keys=True, default=str)
        return hashlib.sha256(state_str.encode()).hexdigest()
    
    async def get_status(self) -> Dict[str, Any]:
        """Get status of the loop detection system."""
        return {
            'active_agents': len(self.action_history),
            'paused_agents': [agent_id for agent_id, breaker in self.circuit_breakers.items() if breaker['status'] == 'open'],
            'detected_patterns': len(self.detected_patterns),
            'stats': self.stats,
            'config': self.config,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    async def shutdown(self):
        """Shutdown the loop detection system."""
        self.logger.info("Shutting down loop detection system")
        
        # Reset all circuit breakers
        for agent_id in list(self.circuit_breakers.keys()):
            await self.reset_agent(agent_id)
        
        self.action_history.clear()
        self.detected_patterns.clear()
        self.agent_states.clear()
        self.circuit_breakers.clear()
        
        self.logger.info("Loop detection system shutdown complete")
