"""Context Manager for the Supervisor Agent.

This module maintains awareness of the current task context and tracks
conversation flow to support task coherence.
"""

import time
import json
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta

@dataclass
class TaskContext:
    """Represents the context of a current task."""
    task_id: str
    title: str
    description: str
    created_at: float
    last_updated: float
    priority: str = "medium"  # low, medium, high
    status: str = "active"    # active, paused, completed
    tags: List[str] = None
    estimated_duration: Optional[str] = None
    progress_percentage: int = 0
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = []
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'TaskContext':
        return cls(**data)

@dataclass
class ConversationTurn:
    """Represents a single turn in the conversation."""
    timestamp: float
    user_input: str
    agent_response: str
    task_relevance_score: float = 0.0
    detected_intent: str = ""
    keywords: List[str] = None
    
    def __post_init__(self):
        if self.keywords is None:
            self.keywords = []

class ContextManager:
    """Manages task context and conversation history for coherence."""
    
    def __init__(self):
        self.current_task: Optional[TaskContext] = None
        self.task_history: List[TaskContext] = []
        self.conversation_history: List[ConversationTurn] = []
        
        # Context tracking settings
        self.max_conversation_history = 50
        self.max_task_history = 20
        self.context_window_minutes = 60
        
        # Task detection patterns
        self.task_indicators = {
            'creation': ['build', 'create', 'make', 'develop', 'design', 'implement'],
            'modification': ['update', 'change', 'modify', 'fix', 'improve', 'enhance'],
            'analysis': ['analyze', 'review', 'check', 'examine', 'investigate'],
            'planning': ['plan', 'design', 'outline', 'structure', 'organize']
        }
    
    def set_current_task(self, title: str, description: str, 
                        priority: str = "medium", 
                        estimated_duration: Optional[str] = None,
                        tags: Optional[List[str]] = None) -> str:
        """Set or update the current task context."""
        task_id = self._generate_task_id(title)
        
        # If updating existing task
        if self.current_task and self.current_task.title.lower() == title.lower():
            self.current_task.description = description
            self.current_task.last_updated = time.time()
            self.current_task.priority = priority
            if estimated_duration:
                self.current_task.estimated_duration = estimated_duration
            if tags:
                self.current_task.tags = list(set(self.current_task.tags + tags))
            return self.current_task.task_id
        
        # Archive previous task if exists
        if self.current_task:
            self._archive_current_task()
        
        # Create new task
        self.current_task = TaskContext(
            task_id=task_id,
            title=title,
            description=description,
            created_at=time.time(),
            last_updated=time.time(),
            priority=priority,
            estimated_duration=estimated_duration,
            tags=tags or []
        )
        
        return task_id
    
    def update_task_progress(self, progress_percentage: int) -> None:
        """Update the progress of the current task."""
        if self.current_task:
            self.current_task.progress_percentage = max(0, min(100, progress_percentage))
            self.current_task.last_updated = time.time()
            
            if progress_percentage >= 100:
                self.current_task.status = "completed"
    
    def add_conversation_turn(self, user_input: str, agent_response: str) -> None:
        """Add a new conversation turn and analyze its relevance."""
        turn = ConversationTurn(
            timestamp=time.time(),
            user_input=user_input,
            agent_response=agent_response
        )
        
        # Analyze the turn
        turn.task_relevance_score = self._calculate_task_relevance(user_input, agent_response)
        turn.detected_intent = self._detect_intent(user_input)
        turn.keywords = self._extract_keywords(user_input + " " + agent_response)
        
        self.conversation_history.append(turn)
        
        # Trim history if needed
        if len(self.conversation_history) > self.max_conversation_history:
            self.conversation_history = self.conversation_history[-self.max_conversation_history:]
        
        # Update current task based on conversation
        self._update_task_from_conversation(turn)
    
    def get_current_context(self) -> Dict[str, Any]:
        """Get the current task and conversation context."""
        context = {
            'current_task': self.current_task.to_dict() if self.current_task else None,
            'recent_conversation': [],
            'task_progress': self.current_task.progress_percentage if self.current_task else 0,
            'context_summary': self._generate_context_summary()
        }
        
        # Get recent conversation within context window
        cutoff_time = time.time() - (self.context_window_minutes * 60)
        recent_turns = [
            {
                'timestamp': turn.timestamp,
                'user_input': turn.user_input[:200],  # Truncate for context
                'task_relevance': turn.task_relevance_score,
                'intent': turn.detected_intent
            }
            for turn in self.conversation_history
            if turn.timestamp > cutoff_time
        ]
        
        context['recent_conversation'] = recent_turns[-10:]  # Last 10 relevant turns
        
        return context
    
    def detect_task_switch(self, user_input: str) -> Optional[Dict[str, Any]]:
        """Detect if the user is trying to switch to a new task."""
        intent = self._detect_intent(user_input)
        
        # Strong indicators of task switch
        switch_indicators = [
            'let\'s work on', 'switch to', 'now let\'s', 'forget that',
            'new project', 'different task', 'move on to', 'start working on'
        ]
        
        user_lower = user_input.lower()
        
        # Check for explicit switch indicators
        for indicator in switch_indicators:
            if indicator in user_lower:
                return {
                    'switch_detected': True,
                    'confidence': 0.9,
                    'reason': f"Explicit switch indicator: '{indicator}'",
                    'suggested_new_task': self._extract_new_task_from_input(user_input)
                }
        
        # Check for task creation intent when already working on something
        if self.current_task and intent in ['creation', 'planning']:
            # Look for new task indicators
            new_task_patterns = ['build a new', 'create another', 'make a different']
            if any(pattern in user_lower for pattern in new_task_patterns):
                return {
                    'switch_detected': True,
                    'confidence': 0.7,
                    'reason': 'New task creation detected while working on existing task',
                    'suggested_new_task': self._extract_new_task_from_input(user_input)
                }
        
        return None
    
    def get_task_coherence_metrics(self) -> Dict[str, float]:
        """Calculate metrics about task coherence in recent conversation."""
        if not self.current_task or not self.conversation_history:
            return {'coherence_score': 1.0, 'drift_risk': 0.0}
        
        recent_turns = self.conversation_history[-10:]  # Last 10 turns
        
        # Calculate average task relevance
        relevance_scores = [turn.task_relevance_score for turn in recent_turns]
        avg_relevance = sum(relevance_scores) / len(relevance_scores) if relevance_scores else 0
        
        # Calculate drift trend (are we getting less relevant over time?)
        if len(relevance_scores) >= 5:
            early_avg = sum(relevance_scores[:3]) / 3
            recent_avg = sum(relevance_scores[-3:]) / 3
            drift_trend = early_avg - recent_avg  # Positive means we're drifting
        else:
            drift_trend = 0
        
        # Calculate topic consistency
        current_keywords = set()
        for turn in recent_turns:
            current_keywords.update(turn.keywords)
        
        task_keywords = set(self.current_task.title.lower().split() + 
                           self.current_task.description.lower().split())
        
        keyword_overlap = len(current_keywords.intersection(task_keywords)) / \
                         max(len(task_keywords), 1)
        
        # Combined coherence score
        coherence_score = (avg_relevance + keyword_overlap) / 2
        drift_risk = max(0, drift_trend)
        
        return {
            'coherence_score': coherence_score,
            'drift_risk': drift_risk,
            'avg_relevance': avg_relevance,
            'keyword_overlap': keyword_overlap,
            'conversation_length': len(recent_turns)
        }
    
    def _generate_task_id(self, title: str) -> str:
        """Generate a unique task ID."""
        timestamp = int(time.time())
        title_part = ''.join(c for c in title.lower()[:20] if c.isalnum())
        return f"task_{title_part}_{timestamp}"
    
    def _archive_current_task(self) -> None:
        """Archive the current task to history."""
        if self.current_task:
            if self.current_task.status == "active":
                self.current_task.status = "paused"
            
            self.task_history.append(self.current_task)
            
            # Trim task history
            if len(self.task_history) > self.max_task_history:
                self.task_history = self.task_history[-self.max_task_history:]
    
    def _calculate_task_relevance(self, user_input: str, agent_response: str) -> float:
        """Calculate how relevant a conversation turn is to the current task."""
        if not self.current_task:
            return 0.5  # Neutral relevance when no task is set
        
        # Combine input and response for analysis
        combined_text = (user_input + " " + agent_response).lower()
        
        # Get task keywords
        task_keywords = set(
            self.current_task.title.lower().split() + 
            self.current_task.description.lower().split() +
            self.current_task.tags
        )
        
        # Remove common stop words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        task_keywords = {kw for kw in task_keywords if kw not in stop_words and len(kw) > 2}
        
        # Count keyword matches
        matches = sum(1 for keyword in task_keywords if keyword in combined_text)
        
        # Calculate relevance score
        if not task_keywords:
            return 0.5
        
        relevance_score = min(1.0, matches / len(task_keywords))
        
        # Boost score for strong task-related action words
        action_words = ['implement', 'build', 'create', 'develop', 'fix', 'update']
        if any(word in combined_text for word in action_words):
            relevance_score = min(1.0, relevance_score + 0.2)
        
        return relevance_score
    
    def _detect_intent(self, user_input: str) -> str:
        """Detect the user's intent from their input."""
        input_lower = user_input.lower()
        
        for intent_type, indicators in self.task_indicators.items():
            if any(indicator in input_lower for indicator in indicators):
                return intent_type
        
        return "other"
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract relevant keywords from text."""
        # Simple keyword extraction (in practice, you'd use NLP libraries)
        import re
        
        # Remove punctuation and convert to lowercase
        cleaned = re.sub(r'[^\w\s]', '', text.lower())
        words = cleaned.split()
        
        # Filter out common stop words and short words
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
            'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
        }
        
        keywords = [word for word in words if word not in stop_words and len(word) > 2]
        
        # Return unique keywords, limited to top 10
        return list(set(keywords))[:10]
    
    def _update_task_from_conversation(self, turn: ConversationTurn) -> None:
        """Update task context based on conversation turn."""
        if not self.current_task:
            return
        
        # Update task tags with relevant keywords
        relevant_keywords = [kw for kw in turn.keywords if turn.task_relevance_score > 0.5]
        if relevant_keywords:
            new_tags = set(self.current_task.tags + relevant_keywords)
            self.current_task.tags = list(new_tags)[:10]  # Limit to 10 tags
            self.current_task.last_updated = time.time()
    
    def _extract_new_task_from_input(self, user_input: str) -> Optional[str]:
        """Extract potential new task description from user input."""
        # Simple extraction - in practice, you'd use more sophisticated NLP
        creation_patterns = [
            r'build (?:a |an |)(\w[^.!?]*)',
            r'create (?:a |an |)(\w[^.!?]*)',
            r'make (?:a |an |)(\w[^.!?]*)',
            r'develop (?:a |an |)(\w[^.!?]*)',
            r'let\'s work on (\w[^.!?]*)'
        ]
        
        for pattern in creation_patterns:
            import re
            match = re.search(pattern, user_input, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return None
    
    def _generate_context_summary(self) -> str:
        """Generate a brief summary of the current context."""
        if not self.current_task:
            return "No active task"
        
        summary_parts = []
        
        # Current task info
        summary_parts.append(f"Working on: {self.current_task.title}")
        
        if self.current_task.progress_percentage > 0:
            summary_parts.append(f"Progress: {self.current_task.progress_percentage}%")
        
        # Recent activity
        recent_turns = len([turn for turn in self.conversation_history 
                           if time.time() - turn.timestamp < 1800])  # Last 30 minutes
        
        if recent_turns > 0:
            summary_parts.append(f"Recent activity: {recent_turns} interactions")
        
        # Coherence status
        metrics = self.get_task_coherence_metrics()
        if metrics['coherence_score'] < 0.5:
            summary_parts.append("⚠️ Low task coherence detected")
        elif metrics['drift_risk'] > 0.3:
            summary_parts.append("⚠️ Task drift risk detected")
        
        return " | ".join(summary_parts)
    
    def save_context(self, filepath: str) -> None:
        """Save context to file."""
        context_data = {
            'current_task': self.current_task.to_dict() if self.current_task else None,
            'task_history': [task.to_dict() for task in self.task_history],
            'conversation_history': [
                {
                    'timestamp': turn.timestamp,
                    'user_input': turn.user_input,
                    'agent_response': turn.agent_response,
                    'task_relevance_score': turn.task_relevance_score,
                    'detected_intent': turn.detected_intent,
                    'keywords': turn.keywords
                }
                for turn in self.conversation_history
            ],
            'saved_at': time.time()
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(context_data, f, indent=2, ensure_ascii=False)
    
    def load_context(self, filepath: str) -> None:
        """Load context from file."""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                context_data = json.load(f)
            
            # Restore current task
            if context_data.get('current_task'):
                self.current_task = TaskContext.from_dict(context_data['current_task'])
            
            # Restore task history
            self.task_history = [
                TaskContext.from_dict(task_data) 
                for task_data in context_data.get('task_history', [])
            ]
            
            # Restore conversation history
            self.conversation_history = []
            for turn_data in context_data.get('conversation_history', []):
                turn = ConversationTurn(
                    timestamp=turn_data['timestamp'],
                    user_input=turn_data['user_input'],
                    agent_response=turn_data['agent_response'],
                    task_relevance_score=turn_data.get('task_relevance_score', 0.0),
                    detected_intent=turn_data.get('detected_intent', ''),
                    keywords=turn_data.get('keywords', [])
                )
                self.conversation_history.append(turn)
                
        except Exception as e:
            print(f"Warning: Could not load context from {filepath}: {e}")
