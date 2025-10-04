"""Prompt Rewriter for the Supervisor Agent.

This module rewrites user prompts to maintain task coherence and prevent derailment.
"""

import re
from typing import List, Dict, Optional
from .derailment_detector import DerailmentType

class PromptRewriter:
    """Rewrites prompts to maintain task coherence."""
    
    def __init__(self):
        # Common derailment patterns and their fixes
        self.derailment_fixes = {
            DerailmentType.TOPIC_DRIFT: {
                'prefix': "Remember, we're working on {task}. ",
                'context_reminder': "Stay focused on the main objective: {task}. "
            },
            DerailmentType.SCOPE_CREEP: {
                'prefix': "For our {task} project, ",
                'context_reminder': "Keep this specific to {task} requirements. "
            },
            DerailmentType.TECHNOLOGY_SWITCH: {
                'prefix': "Using our current tech stack for {task}, ",
                'context_reminder': "Maintain consistency with {task} technology choices. "
            },
            DerailmentType.GOAL_CONFUSION: {
                'prefix': "To achieve our {task} goal, ",
                'context_reminder': "Focus on delivering {task} as specified. "
            }
        }
        
        # Task context templates
        self.task_templates = {
            'social_media_app': {
                'keywords': ['social', 'media', 'app', 'posts', 'users', 'feed'],
                'context': 'building a social media application'
            },
            'ecommerce_site': {
                'keywords': ['ecommerce', 'shop', 'store', 'products', 'cart', 'payment'],
                'context': 'developing an e-commerce website'
            },
            'dashboard': {
                'keywords': ['dashboard', 'analytics', 'metrics', 'charts', 'data'],
                'context': 'creating a data dashboard'
            },
            'api': {
                'keywords': ['api', 'endpoint', 'rest', 'graphql', 'service'],
                'context': 'building an API service'
            }
        }
    
    def create_refocus_prompt(self, main_task: str, original_prompt: str, 
                            derailment_type: DerailmentType) -> str:
        """Create a refocused prompt that redirects back to the main task."""
        if not main_task or not original_prompt:
            return original_prompt
        
        # Get the appropriate fix strategy
        fix_strategy = self.derailment_fixes.get(derailment_type, 
                                               self.derailment_fixes[DerailmentType.TOPIC_DRIFT])
        
        # Clean the original prompt of derailing elements
        cleaned_prompt = self._remove_derailing_elements(original_prompt, main_task)
        
        # Add context reminder
        context_reminder = fix_strategy['context_reminder'].format(task=main_task)
        
        # Construct the refocused prompt
        refocused_prompt = context_reminder + cleaned_prompt
        
        # Add specific task context if available
        task_context = self._get_task_context(main_task)
        if task_context:
            refocused_prompt = f"While {task_context}, " + refocused_prompt.lower()
        
        return refocused_prompt
    
    def enhance_prompt_for_coherence(self, prompt: str, main_task: str, 
                                   conversation_context: List[str]) -> str:
        """Enhance a prompt to maintain task coherence proactively."""
        if not main_task:
            return prompt
        
        # Add task context at the beginning
        task_context = self._get_task_context(main_task)
        if task_context:
            enhanced_prompt = f"For our {task_context} project: {prompt}"
        else:
            enhanced_prompt = f"For our {main_task}: {prompt}"
        
        # Add conversation context if relevant
        if conversation_context:
            recent_context = self._extract_relevant_context(conversation_context, main_task)
            if recent_context:
                enhanced_prompt += f"\n\nContext: {recent_context}"
        
        return enhanced_prompt
    
    def _remove_derailing_elements(self, prompt: str, main_task: str) -> str:
        """Remove elements from prompt that might cause derailment."""
        cleaned_prompt = prompt
        
        # Remove mentions of unrelated projects/topics
        # This is a simple implementation - in practice, you'd want more sophisticated NLP
        derailing_patterns = [
            r'by the way[^.]*',  # Remove "by the way" tangents
            r'also[,\s]+(?:can you|could you|let\'s)[^.]*',  # Remove additional requests
            r'while we\'re at it[^.]*',  # Remove scope creep
            r'speaking of[^,]*,',  # Remove topic switches
        ]
        
        for pattern in derailing_patterns:
            cleaned_prompt = re.sub(pattern, '', cleaned_prompt, flags=re.IGNORECASE)
        
        # Clean up extra whitespace
        cleaned_prompt = re.sub(r'\s+', ' ', cleaned_prompt).strip()
        
        return cleaned_prompt
    
    def _get_task_context(self, main_task: str) -> Optional[str]:
        """Get contextual description for a task."""
        task_lower = main_task.lower()
        
        for task_type, template in self.task_templates.items():
            if any(keyword in task_lower for keyword in template['keywords']):
                return template['context']
        
        return None
    
    def _extract_relevant_context(self, conversation_history: List[str], 
                                main_task: str) -> Optional[str]:
        """Extract relevant context from conversation history."""
        if not conversation_history or len(conversation_history) < 2:
            return None
        
        # Get the last 2-3 relevant messages
        recent_messages = conversation_history[-3:]
        task_keywords = main_task.lower().split()
        
        relevant_context = []
        for message in recent_messages:
            message_lower = message.lower()
            # Check if message is relevant to main task
            if any(keyword in message_lower for keyword in task_keywords):
                # Extract key points (simplified)
                if len(message) < 100:
                    relevant_context.append(message)
                else:
                    # Take first sentence if message is long
                    first_sentence = message.split('.')[0] + '.'
                    relevant_context.append(first_sentence)
        
        if relevant_context:
            return ' '.join(relevant_context[-2:])  # Last 2 relevant messages
        
        return None
    
    def suggest_better_prompt(self, problematic_prompt: str, main_task: str) -> str:
        """Suggest a better version of a problematic prompt."""
        # This is a simplified version - in practice, you'd use more advanced NLP
        suggestions = []
        
        prompt_lower = problematic_prompt.lower()
        
        # Check for common issues and suggest fixes
        if 'can you also' in prompt_lower or 'and also' in prompt_lower:
            suggestions.append("Consider focusing on one request at a time")
        
        if 'by the way' in prompt_lower:
            suggestions.append("Remove tangential requests to maintain focus")
        
        if len(problematic_prompt.split()) > 50:
            suggestions.append("Break this into smaller, more focused requests")
        
        # Generate improved prompt
        cleaned_prompt = self._remove_derailing_elements(problematic_prompt, main_task)
        improved_prompt = self.enhance_prompt_for_coherence(cleaned_prompt, main_task, [])
        
        return improved_prompt
    
    def validate_prompt_coherence(self, prompt: str, main_task: str) -> Dict[str, any]:
        """Validate if a prompt maintains coherence with the main task."""
        issues = []
        suggestions = []
        coherence_score = 1.0
        
        prompt_lower = prompt.lower()
        task_lower = main_task.lower()
        
        # Check for task-related keywords
        task_keywords = task_lower.split()
        task_mentions = sum(1 for keyword in task_keywords if keyword in prompt_lower)
        
        if task_mentions == 0:
            issues.append("Prompt doesn't mention the main task")
            coherence_score -= 0.3
            suggestions.append("Add reference to the main task")
        
        # Check for scope creep indicators
        scope_creep_indicators = ['also', 'and also', 'can you also', 'while we\'re at it']
        if any(indicator in prompt_lower for indicator in scope_creep_indicators):
            issues.append("Potential scope creep detected")
            coherence_score -= 0.2
            suggestions.append("Focus on one task at a time")
        
        # Check for topic drift indicators
        topic_drift_indicators = ['by the way', 'speaking of', 'this reminds me']
        if any(indicator in prompt_lower for indicator in topic_drift_indicators):
            issues.append("Potential topic drift detected")
            coherence_score -= 0.2
            suggestions.append("Remove tangential topics")
        
        # Check prompt length (very long prompts often have coherence issues)
        if len(prompt.split()) > 100:
            issues.append("Prompt is very long and may lack focus")
            coherence_score -= 0.1
            suggestions.append("Break into smaller, focused requests")
        
        coherence_score = max(0.0, coherence_score)
        
        return {
            'coherence_score': coherence_score,
            'issues': issues,
            'suggestions': suggestions,
            'is_coherent': coherence_score >= 0.7
        }
