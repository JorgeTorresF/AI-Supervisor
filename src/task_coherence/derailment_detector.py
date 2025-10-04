"""Derailment Detector for the Supervisor Agent.

This module detects when AI agents are deviating from their assigned tasks
and identifies different types of derailment patterns.
"""

import re
import time
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum

class DerailmentType(Enum):
    """Types of derailment that can occur during conversations."""
    TOPIC_DRIFT = "topic_drift"          # Gradual shift away from main topic
    SCOPE_CREEP = "scope_creep"          # Adding unrelated features/requirements
    TECHNOLOGY_SWITCH = "tech_switch"    # Switching to different tech stack
    GOAL_CONFUSION = "goal_confusion"    # Misunderstanding the main objective
    DISTRACTION = "distraction"          # Getting sidetracked by tangential topics
    PREMATURE_OPTIMIZATION = "premature_opt"  # Focusing on optimization too early

@dataclass
class DerailmentResult:
    """Result of derailment detection analysis."""
    is_derailed: bool
    derailment_type: DerailmentType
    confidence: float  # 0.0 to 1.0
    evidence: List[str]
    suggested_correction: str
    severity: str  # "low", "medium", "high"

class DerailmentDetector:
    """Detects various types of task derailment in agent responses."""
    
    def __init__(self):
        # Patterns for different types of derailment
        self.derailment_patterns = {
            DerailmentType.TOPIC_DRIFT: {
                'indicators': [
                    r'speaking of.*', r'this reminds me.*', r'by the way.*',
                    r'while we\'re on the topic.*', r'incidentally.*',
                    r'as an aside.*', r'tangentially.*'
                ],
                'keywords': ['unrelated', 'different', 'separate', 'another']
            },
            
            DerailmentType.SCOPE_CREEP: {
                'indicators': [
                    r'we could also.*', r'what about.*', r'it might be good to.*',
                    r'while we\'re at it.*', r'additionally.*', r'furthermore.*',
                    r'we should probably.*', r'don\'t forget to.*'
                ],
                'keywords': ['feature', 'addition', 'extra', 'bonus', 'enhancement']
            },
            
            DerailmentType.TECHNOLOGY_SWITCH: {
                'indicators': [
                    r'actually, let\'s use.*', r'better idea.*', r'instead of.*',
                    r'what if we used.*', r'have you considered.*',
                    r'maybe we should switch.*'
                ],
                'keywords': ['framework', 'library', 'language', 'platform', 'tool']
            },
            
            DerailmentType.GOAL_CONFUSION: {
                'indicators': [
                    r'wait, what are we.*', r'i thought we were.*',
                    r'are we still.*', r'should we be.*',
                    r'what\'s the goal.*', r'remind me why.*'
                ],
                'keywords': ['confused', 'unclear', 'purpose', 'objective', 'goal']
            },
            
            DerailmentType.DISTRACTION: {
                'indicators': [
                    r'oh, that\'s interesting.*', r'fun fact.*', r'did you know.*',
                    r'this is cool.*', r'speaking of which.*',
                    r'that reminds me of.*'
                ],
                'keywords': ['interesting', 'cool', 'fascinating', 'neat', 'wow']
            },
            
            DerailmentType.PREMATURE_OPTIMIZATION: {
                'indicators': [
                    r'let\'s optimize.*', r'we need to make this faster.*',
                    r'performance is crucial.*', r'this won\'t scale.*',
                    r'we should cache.*', r'what about efficiency.*'
                ],
                'keywords': ['optimize', 'performance', 'scale', 'efficiency', 'speed']
            }
        }
        
        # Task-related keywords that should appear in on-topic responses
        self.task_indicators = [
            'implement', 'build', 'create', 'develop', 'code', 'function',
            'feature', 'requirement', 'specification', 'design', 'architecture'
        ]
    
    def detect_derailment(self, main_task: str, agent_response: str, 
                         conversation_history: List[str]) -> DerailmentResult:
        """Detect if an agent response shows signs of derailment."""
        if not main_task or not agent_response:
            return DerailmentResult(
                is_derailed=False,
                derailment_type=DerailmentType.TOPIC_DRIFT,
                confidence=0.0,
                evidence=[],
                suggested_correction="",
                severity="low"
            )
        
        response_lower = agent_response.lower()
        task_lower = main_task.lower()
        
        # Check each derailment type
        best_match = None
        highest_confidence = 0.0
        
        for derailment_type, patterns in self.derailment_patterns.items():
            confidence, evidence = self._check_derailment_type(
                derailment_type, patterns, response_lower, task_lower
            )
            
            if confidence > highest_confidence:
                highest_confidence = confidence
                best_match = (derailment_type, evidence)
        
        # Check for general task relevance
        task_relevance = self._calculate_task_relevance(task_lower, response_lower)
        
        # Adjust confidence based on task relevance
        if task_relevance < 0.3:  # Very low relevance
            highest_confidence = max(highest_confidence, 0.6)
            if not best_match:
                best_match = (DerailmentType.TOPIC_DRIFT, ["Low task relevance detected"])
        
        # Check conversation context for drift patterns
        context_confidence = self._analyze_conversation_context(
            conversation_history, main_task
        )
        
        # Combine confidences
        final_confidence = max(highest_confidence, context_confidence)
        
        if final_confidence > 0.5:  # Threshold for derailment detection
            derailment_type, evidence = best_match or (DerailmentType.TOPIC_DRIFT, [])
            
            return DerailmentResult(
                is_derailed=True,
                derailment_type=derailment_type,
                confidence=final_confidence,
                evidence=evidence,
                suggested_correction=self._generate_correction(derailment_type, main_task),
                severity=self._determine_severity(final_confidence, derailment_type)
            )
        
        return DerailmentResult(
            is_derailed=False,
            derailment_type=DerailmentType.TOPIC_DRIFT,
            confidence=final_confidence,
            evidence=[],
            suggested_correction="",
            severity="low"
        )
    
    def _check_derailment_type(self, derailment_type: DerailmentType,
                              patterns: Dict, response_lower: str, 
                              task_lower: str) -> Tuple[float, List[str]]:
        """Check for a specific type of derailment."""
        confidence = 0.0
        evidence = []
        
        # Check for pattern indicators
        for indicator_pattern in patterns['indicators']:
            matches = re.findall(indicator_pattern, response_lower, re.IGNORECASE)
            if matches:
                confidence += 0.3
                evidence.append(f"Pattern detected: {indicator_pattern}")
        
        # Check for derailment keywords
        keyword_matches = 0
        for keyword in patterns['keywords']:
            if keyword in response_lower:
                keyword_matches += 1
        
        if keyword_matches > 0:
            confidence += min(0.4, keyword_matches * 0.1)
            evidence.append(f"Derailment keywords found: {keyword_matches}")
        
        # Special case handling for different derailment types
        if derailment_type == DerailmentType.TECHNOLOGY_SWITCH:
            tech_mentions = self._count_technology_mentions(response_lower)
            task_tech = self._extract_technologies(task_lower)
            
            if tech_mentions > len(task_tech):
                confidence += 0.2
                evidence.append("New technologies mentioned not in original task")
        
        elif derailment_type == DerailmentType.SCOPE_CREEP:
            feature_count = len(re.findall(r'feature|functionality|capability', response_lower))
            if feature_count > 2:  # Arbitrary threshold
                confidence += 0.2
                evidence.append(f"Multiple new features mentioned: {feature_count}")
        
        return min(1.0, confidence), evidence
    
    def _calculate_task_relevance(self, task_lower: str, response_lower: str) -> float:
        """Calculate how relevant the response is to the main task."""
        # Extract key terms from task
        task_terms = set(re.findall(r'\w+', task_lower))
        task_terms = {term for term in task_terms if len(term) > 3}  # Filter short words
        
        if not task_terms:
            return 0.5  # Neutral if no terms found
        
        # Count matches in response
        response_terms = set(re.findall(r'\w+', response_lower))
        matches = task_terms.intersection(response_terms)
        
        relevance = len(matches) / len(task_terms)
        
        # Boost for task-related action words
        for indicator in self.task_indicators:
            if indicator in response_lower:
                relevance += 0.1
        
        return min(1.0, relevance)
    
    def _analyze_conversation_context(self, conversation_history: List[str], 
                                    main_task: str) -> float:
        """Analyze conversation history for drift patterns."""
        if len(conversation_history) < 3:
            return 0.0
        
        task_lower = main_task.lower()
        
        # Calculate relevance trend over last few messages
        recent_messages = conversation_history[-5:]  # Last 5 messages
        relevance_scores = []
        
        for message in recent_messages:
            relevance = self._calculate_task_relevance(task_lower, message.lower())
            relevance_scores.append(relevance)
        
        if len(relevance_scores) < 3:
            return 0.0
        
        # Check for declining relevance trend
        early_avg = sum(relevance_scores[:2]) / 2
        recent_avg = sum(relevance_scores[-2:]) / 2
        
        if early_avg - recent_avg > 0.3:  # Significant decline in relevance
            return 0.4
        
        # Check for consistently low relevance
        avg_relevance = sum(relevance_scores) / len(relevance_scores)
        if avg_relevance < 0.4:
            return 0.3
        
        return 0.0
    
    def _count_technology_mentions(self, text: str) -> int:
        """Count mentions of technologies/frameworks/tools."""
        tech_patterns = [
            r'\b(?:react|vue|angular|node|python|javascript|typescript|java|go|rust)\b',
            r'\b(?:express|flask|django|spring|rails|laravel)\b',
            r'\b(?:mysql|postgresql|mongodb|redis|elasticsearch)\b',
            r'\b(?:aws|azure|gcp|docker|kubernetes|terraform)\b'
        ]
        
        count = 0
        for pattern in tech_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            count += len(matches)
        
        return count
    
    def _extract_technologies(self, text: str) -> List[str]:
        """Extract technology names from text."""
        tech_patterns = [
            r'\b(react|vue|angular|node|python|javascript|typescript|java|go|rust)\b',
            r'\b(express|flask|django|spring|rails|laravel)\b',
            r'\b(mysql|postgresql|mongodb|redis|elasticsearch)\b'
        ]
        
        technologies = []
        for pattern in tech_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            technologies.extend(matches)
        
        return list(set(technologies))
    
    def _generate_correction(self, derailment_type: DerailmentType, main_task: str) -> str:
        """Generate a suggested correction based on derailment type."""
        corrections = {
            DerailmentType.TOPIC_DRIFT: 
                f"Refocus on the main task: {main_task}. Avoid tangential topics.",
            DerailmentType.SCOPE_CREEP: 
                f"Stay within the original scope of {main_task}. Save additional features for later.",
            DerailmentType.TECHNOLOGY_SWITCH: 
                f"Stick to the originally planned technology stack for {main_task}.",
            DerailmentType.GOAL_CONFUSION: 
                f"Remember: the goal is {main_task}. Let's clarify the objectives.",
            DerailmentType.DISTRACTION: 
                f"Return focus to {main_task}. Interesting tangents can be explored later.",
            DerailmentType.PREMATURE_OPTIMIZATION: 
                f"Focus on implementing {main_task} first. Optimization comes after core functionality."
        }
        
        return corrections.get(derailment_type, f"Refocus on the main task: {main_task}")
    
    def _determine_severity(self, confidence: float, derailment_type: DerailmentType) -> str:
        """Determine the severity of the derailment."""
        # Some derailment types are more serious than others
        high_impact_types = {
            DerailmentType.GOAL_CONFUSION,
            DerailmentType.TECHNOLOGY_SWITCH,
            DerailmentType.SCOPE_CREEP
        }
        
        if derailment_type in high_impact_types:
            if confidence > 0.8:
                return "high"
            elif confidence > 0.6:
                return "medium"
        
        if confidence > 0.8:
            return "medium"
        
        return "low"
    
    def analyze_derailment_trends(self, conversation_history: List[str], 
                                main_task: str) -> Dict[str, any]:
        """Analyze trends in derailment over the conversation."""
        if len(conversation_history) < 5:
            return {'insufficient_data': True}
        
        # Analyze each message for derailment
        derailment_scores = []
        derailment_types = []
        
        for i, message in enumerate(conversation_history):
            result = self.detect_derailment(main_task, message, conversation_history[:i])
            derailment_scores.append(result.confidence)
            if result.is_derailed:
                derailment_types.append(result.derailment_type)
        
        # Calculate trends
        recent_avg = sum(derailment_scores[-3:]) / 3 if len(derailment_scores) >= 3 else 0
        overall_avg = sum(derailment_scores) / len(derailment_scores)
        
        # Most common derailment type
        most_common_type = None
        if derailment_types:
            type_counts = {}
            for dt in derailment_types:
                type_counts[dt] = type_counts.get(dt, 0) + 1
            most_common_type = max(type_counts, key=type_counts.get)
        
        return {
            'recent_derailment_score': recent_avg,
            'overall_derailment_score': overall_avg,
            'derailment_trend': 'increasing' if recent_avg > overall_avg else 'stable',
            'most_common_derailment': most_common_type.value if most_common_type else None,
            'total_derailments': len(derailment_types),
            'conversation_length': len(conversation_history)
        }
