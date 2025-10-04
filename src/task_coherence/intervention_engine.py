"""Intervention Engine for the Supervisor Agent.

This module handles real-time interventions when agents deviate from their tasks
or when bad ideas are detected.
"""

import time
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

from .derailment_detector import DerailmentDetector, DerailmentType
from .idea_validator import IdeaValidator, ValidationResult, RiskLevel
from .prompt_rewriter import PromptRewriter

class InterventionType(Enum):
    """Types of interventions the engine can perform."""
    WARNING = "warning"
    REDIRECT = "redirect"
    BLOCK = "block"
    SUGGEST = "suggest"
    REWRITE = "rewrite"

@dataclass
class InterventionAction:
    """An action to be taken by the intervention engine."""
    type: InterventionType
    message: str
    suggested_prompt: Optional[str] = None
    confidence: float = 0.0
    reasoning: str = ""

class InterventionEngine:
    """Manages real-time interventions for agent supervision."""
    
    def __init__(self):
        self.derailment_detector = DerailmentDetector()
        self.idea_validator = IdeaValidator()
        self.prompt_rewriter = PromptRewriter()
        
        # Intervention thresholds
        self.derailment_threshold = 0.7
        self.idea_risk_threshold = RiskLevel.HIGH
        
        # Intervention history for learning
        self.intervention_history: List[Dict[str, Any]] = []
        
        # User preferences
        self.user_preferences = {
            'aggressiveness': 'medium',  # low, medium, high
            'auto_rewrite': True,
            'block_bad_ideas': True,
            'learning_mode': True
        }
    
    def analyze_and_intervene(self, 
                            user_prompt: str,
                            agent_response: str,
                            current_task: str,
                            conversation_history: List[str]) -> List[InterventionAction]:
        """Analyze the interaction and determine necessary interventions."""
        interventions = []
        
        # 1. Validate the user's idea/request
        idea_interventions = self._validate_user_idea(user_prompt)
        interventions.extend(idea_interventions)
        
        # 2. Check for task derailment
        derailment_interventions = self._check_task_derailment(
            user_prompt, agent_response, current_task, conversation_history
        )
        interventions.extend(derailment_interventions)
        
        # 3. Log interventions for learning
        self._log_interventions(user_prompt, agent_response, interventions)
        
        return interventions
    
    def _validate_user_idea(self, user_prompt: str) -> List[InterventionAction]:
        """Validate user ideas and suggest alternatives for bad ones."""
        interventions = []
        
        # Skip if this doesn't look like a new project idea
        if not self._looks_like_project_idea(user_prompt):
            return interventions
        
        validation_result = self.idea_validator.validate_idea(user_prompt)
        
        # Handle critical risk ideas
        if validation_result.risk_level == RiskLevel.CRITICAL:
            if self.user_preferences['block_bad_ideas']:
                interventions.append(InterventionAction(
                    type=InterventionType.BLOCK,
                    message=f"⚠️ CRITICAL ISSUES DETECTED: This idea has serious feasibility problems (Score: {validation_result.feasibility_score}/10). \n\n" +
                           "\n".join([f"• {warning}" for warning in validation_result.warnings]),
                    confidence=0.9,
                    reasoning="Critical feasibility issues detected"
                ))
        
        # Handle high risk ideas
        elif validation_result.risk_level == RiskLevel.HIGH:
            warning_message = f"🚨 HIGH RISK IDEA: This project may face significant challenges (Score: {validation_result.feasibility_score}/10)\n\n"
            warning_message += "**Potential Issues:**\n"
            warning_message += "\n".join([f"• {warning}" for warning in validation_result.warnings])
            
            if validation_result.suggestions:
                warning_message += "\n\n**Suggestions:**\n"
                warning_message += "\n".join([f"• {suggestion}" for suggestion in validation_result.suggestions])
            
            interventions.append(InterventionAction(
                type=InterventionType.WARNING,
                message=warning_message,
                confidence=0.8,
                reasoning="High risk factors identified"
            ))
        
        # Provide helpful information for medium risk ideas
        elif validation_result.risk_level == RiskLevel.MEDIUM:
            info_message = f"ℹ️ Project Analysis (Score: {validation_result.feasibility_score}/10)\n"
            info_message += f"Estimated timeline: {validation_result.estimated_timeline}\n"
            info_message += f"Success probability: {validation_result.success_probability:.0%}\n\n"
            
            if validation_result.resource_requirements:
                info_message += "**Resource Requirements:**\n"
                for key, value in validation_result.resource_requirements.items():
                    info_message += f"• {key.title()}: {value}\n"
            
            interventions.append(InterventionAction(
                type=InterventionType.SUGGEST,
                message=info_message,
                confidence=0.6,
                reasoning="Moderate complexity detected"
            ))
        
        return interventions
    
    def _check_task_derailment(self, 
                              user_prompt: str,
                              agent_response: str,
                              current_task: str,
                              conversation_history: List[str]) -> List[InterventionAction]:
        """Check if the agent is derailing from the main task."""
        interventions = []
        
        if not current_task or not agent_response:
            return interventions
        
        # Detect derailment
        derailment_result = self.derailment_detector.detect_derailment(
            current_task, agent_response, conversation_history
        )
        
        if derailment_result.confidence > self.derailment_threshold:
            # Generate corrective prompt
            corrective_prompt = self.prompt_rewriter.create_refocus_prompt(
                current_task, user_prompt, derailment_result.derailment_type
            )
            
            intervention_message = f"🎯 TASK FOCUS ALERT: The agent seems to be deviating from the main task.\n\n"
            intervention_message += f"**Current Task:** {current_task}\n"
            intervention_message += f"**Detected Issue:** {derailment_result.derailment_type.value}\n"
            intervention_message += f"**Confidence:** {derailment_result.confidence:.0%}\n\n"
            intervention_message += "**Suggested redirect:** Use the refined prompt below to get back on track."
            
            interventions.append(InterventionAction(
                type=InterventionType.REDIRECT,
                message=intervention_message,
                suggested_prompt=corrective_prompt,
                confidence=derailment_result.confidence,
                reasoning=f"Derailment detected: {derailment_result.derailment_type.value}"
            ))
        
        return interventions
    
    def _looks_like_project_idea(self, prompt: str) -> bool:
        """Determine if a prompt contains a project idea that should be validated."""
        idea_indicators = [
            'build', 'create', 'make', 'develop', 'design', 'implement',
            'app', 'website', 'tool', 'system', 'platform', 'service',
            'project', 'application', 'software', 'program',
            'i want to', 'can you help me', 'let\'s create', 'i need'
        ]
        
        prompt_lower = prompt.lower()
        return any(indicator in prompt_lower for indicator in idea_indicators)
    
    def _log_interventions(self, user_prompt: str, agent_response: str, 
                          interventions: List[InterventionAction]) -> None:
        """Log interventions for learning and improvement."""
        if not self.user_preferences['learning_mode']:
            return
        
        log_entry = {
            'timestamp': time.time(),
            'user_prompt': user_prompt,
            'agent_response': agent_response[:200] + '...' if len(agent_response) > 200 else agent_response,
            'interventions': [
                {
                    'type': intervention.type.value,
                    'confidence': intervention.confidence,
                    'reasoning': intervention.reasoning
                }
                for intervention in interventions
            ]
        }
        
        self.intervention_history.append(log_entry)
        
        # Keep only last 100 entries to manage memory
        if len(self.intervention_history) > 100:
            self.intervention_history = self.intervention_history[-100:]
    
    def set_user_preferences(self, preferences: Dict[str, Any]) -> None:
        """Update user preferences for intervention behavior."""
        self.user_preferences.update(preferences)
        
        # Adjust thresholds based on aggressiveness
        if preferences.get('aggressiveness') == 'low':
            self.derailment_threshold = 0.8
            self.idea_risk_threshold = RiskLevel.CRITICAL
        elif preferences.get('aggressiveness') == 'high':
            self.derailment_threshold = 0.5
            self.idea_risk_threshold = RiskLevel.MEDIUM
        else:  # medium
            self.derailment_threshold = 0.7
            self.idea_risk_threshold = RiskLevel.HIGH
    
    def get_intervention_stats(self) -> Dict[str, Any]:
        """Get statistics about past interventions."""
        if not self.intervention_history:
            return {'total_interventions': 0}
        
        total_interventions = sum(len(entry['interventions']) for entry in self.intervention_history)
        
        intervention_types = {}
        for entry in self.intervention_history:
            for intervention in entry['interventions']:
                intervention_type = intervention['type']
                intervention_types[intervention_type] = intervention_types.get(intervention_type, 0) + 1
        
        avg_confidence = sum(
            intervention['confidence']
            for entry in self.intervention_history
            for intervention in entry['interventions']
        ) / max(1, total_interventions)
        
        return {
            'total_sessions': len(self.intervention_history),
            'total_interventions': total_interventions,
            'intervention_types': intervention_types,
            'average_confidence': avg_confidence,
            'recent_activity': len([entry for entry in self.intervention_history 
                                 if time.time() - entry['timestamp'] < 3600])  # Last hour
        }
