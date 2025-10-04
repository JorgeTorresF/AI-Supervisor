"""Idea Validation System for the Supervisor Agent.

This module evaluates project ideas and provides warnings about potentially
problematic concepts before time is invested in development.
"""

import re
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum

class RiskLevel(Enum):
    """Risk levels for project ideas."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class ValidationResult:
    """Result of idea validation."""
    feasibility_score: int  # 1-10, 10 being most feasible
    risk_level: RiskLevel
    warnings: List[str]
    suggestions: List[str]
    technical_issues: List[str]
    business_issues: List[str]
    resource_requirements: Dict[str, str]
    estimated_timeline: str
    success_probability: float

class IdeaValidator:
    """Validates project ideas and identifies potential issues."""
    
    def __init__(self):
        # Technical red flags
        self.technical_flags = {
            'impossible_tech': [
                r'time travel', r'faster than light', r'perpetual motion',
                r'unlimited energy', r'consciousness upload', r'teleportation'
            ],
            'complex_ai': [
                r'artificial general intelligence', r'agi', r'sentient ai',
                r'conscious ai', r'self-aware ai', r'ai that thinks'
            ],
            'bleeding_edge': [
                r'quantum computing app', r'brain-computer interface',
                r'neural implant', r'direct neural connection'
            ],
            'resource_intensive': [
                r'real-time 3d rendering', r'massive multiplayer',
                r'blockchain from scratch', r'custom operating system'
            ]
        }
        
        # Business red flags
        self.business_flags = {
            'saturated_markets': [
                r'another social media', r'facebook clone', r'twitter alternative',
                r'instagram competitor', r'tiktok clone', r'messaging app'
            ],
            'legal_issues': [
                r'scrape copyrighted', r'bypass copyright', r'piracy',
                r'illegal streaming', r'hack', r'exploit', r'crack'
            ],
            'no_market': [
                r'app for pets', r'ai for plants', r'social network for',
                r'dating app for', r'uber for'
            ]
        }
        
        # Resource requirements patterns
        self.resource_patterns = {
            'high_budget': [
                r'machine learning model', r'ai training', r'cloud infrastructure',
                r'real-time processing', r'video streaming', r'live chat'
            ],
            'team_required': [
                r'enterprise software', r'large scale application',
                r'multi-platform app', r'complex backend'
            ],
            'long_timeline': [
                r'operating system', r'game engine', r'compiler',
                r'programming language', r'database system'
            ]
        }
    
    def validate_idea(self, idea_text: str) -> ValidationResult:
        """Validate a project idea and return detailed analysis."""
        idea_lower = idea_text.lower()
        
        # Initialize results
        warnings = []
        suggestions = []
        technical_issues = []
        business_issues = []
        resource_requirements = {}
        
        # Check technical red flags
        for category, patterns in self.technical_flags.items():
            for pattern in patterns:
                if re.search(pattern, idea_lower):
                    if category == 'impossible_tech':
                        technical_issues.append(f"Involves potentially impossible technology: {pattern}")
                        warnings.append("This idea involves technology that doesn't exist or violates known physics")
                    elif category == 'complex_ai':
                        technical_issues.append(f"Requires advanced AI beyond current capabilities: {pattern}")
                        warnings.append("Current AI technology cannot achieve true consciousness or AGI")
                    elif category == 'bleeding_edge':
                        technical_issues.append(f"Uses cutting-edge technology: {pattern}")
                        warnings.append("This technology is experimental and may not be accessible")
                    elif category == 'resource_intensive':
                        technical_issues.append(f"Highly resource-intensive: {pattern}")
                        resource_requirements['compute'] = 'Very High'
        
        # Check business red flags
        for category, patterns in self.business_flags.items():
            for pattern in patterns:
                if re.search(pattern, idea_lower):
                    if category == 'saturated_markets':
                        business_issues.append(f"Highly competitive market: {pattern}")
                        warnings.append("This market is extremely saturated with established players")
                        suggestions.append("Consider finding a unique niche or novel approach")
                    elif category == 'legal_issues':
                        business_issues.append(f"Potential legal concerns: {pattern}")
                        warnings.append("This idea may involve legal or ethical issues")
                    elif category == 'no_market':
                        business_issues.append(f"Questionable market demand: {pattern}")
                        warnings.append("Market demand for this concept is unclear")
        
        # Check resource requirements
        for category, patterns in self.resource_patterns.items():
            for pattern in patterns:
                if re.search(pattern, idea_lower):
                    if category == 'high_budget':
                        resource_requirements['budget'] = 'High'
                        resource_requirements['infrastructure'] = 'Cloud services required'
                    elif category == 'team_required':
                        resource_requirements['team_size'] = 'Multiple developers'
                        resource_requirements['timeline'] = 'Extended (6+ months)'
                    elif category == 'long_timeline':
                        resource_requirements['timeline'] = 'Very Long (1+ years)'
                        resource_requirements['complexity'] = 'Extremely High'
        
        # Calculate feasibility score
        feasibility_score = self._calculate_feasibility_score(
            technical_issues, business_issues, resource_requirements
        )
        
        # Determine risk level
        risk_level = self._determine_risk_level(feasibility_score, warnings)
        
        # Generate suggestions if no specific ones exist
        if not suggestions and warnings:
            suggestions = self._generate_suggestions(idea_lower, warnings)
        
        # Estimate timeline
        estimated_timeline = self._estimate_timeline(idea_lower, resource_requirements)
        
        # Calculate success probability
        success_probability = self._calculate_success_probability(
            feasibility_score, len(warnings), len(technical_issues), len(business_issues)
        )
        
        return ValidationResult(
            feasibility_score=feasibility_score,
            risk_level=risk_level,
            warnings=warnings,
            suggestions=suggestions,
            technical_issues=technical_issues,
            business_issues=business_issues,
            resource_requirements=resource_requirements,
            estimated_timeline=estimated_timeline,
            success_probability=success_probability
        )
    
    def _calculate_feasibility_score(self, technical_issues: List[str], 
                                   business_issues: List[str], 
                                   resource_requirements: Dict[str, str]) -> int:
        """Calculate feasibility score from 1-10."""
        score = 10
        
        # Deduct for technical issues
        score -= len(technical_issues) * 2
        
        # Deduct for business issues
        score -= len(business_issues) * 1.5
        
        # Deduct for high resource requirements
        if resource_requirements.get('budget') == 'High':
            score -= 1
        if resource_requirements.get('team_size') == 'Multiple developers':
            score -= 1
        if 'Very Long' in resource_requirements.get('timeline', ''):
            score -= 2
        
        return max(1, min(10, int(score)))
    
    def _determine_risk_level(self, feasibility_score: int, warnings: List[str]) -> RiskLevel:
        """Determine risk level based on score and warnings."""
        if feasibility_score <= 3 or len(warnings) >= 4:
            return RiskLevel.CRITICAL
        elif feasibility_score <= 5 or len(warnings) >= 2:
            return RiskLevel.HIGH
        elif feasibility_score <= 7 or len(warnings) >= 1:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW
    
    def _generate_suggestions(self, idea_lower: str, warnings: List[str]) -> List[str]:
        """Generate helpful suggestions based on warnings."""
        suggestions = []
        
        if any('saturated' in w.lower() for w in warnings):
            suggestions.append("Consider targeting a specific niche market instead")
            suggestions.append("Focus on a unique feature that competitors lack")
        
        if any('technology' in w.lower() for w in warnings):
            suggestions.append("Start with existing technology and iterate")
            suggestions.append("Consider a simpler MVP approach first")
        
        if any('legal' in w.lower() for w in warnings):
            suggestions.append("Consult with a legal expert before proceeding")
            suggestions.append("Research compliance requirements thoroughly")
        
        if any('market' in w.lower() for w in warnings):
            suggestions.append("Conduct market research to validate demand")
            suggestions.append("Consider pivoting to a related problem with clearer demand")
        
        return suggestions
    
    def _estimate_timeline(self, idea_lower: str, resource_requirements: Dict[str, str]) -> str:
        """Estimate project timeline."""
        if 'Very Long' in resource_requirements.get('timeline', ''):
            return "12+ months"
        elif 'Extended' in resource_requirements.get('timeline', ''):
            return "6-12 months"
        elif any(keyword in idea_lower for keyword in ['simple', 'basic', 'minimal']):
            return "1-3 months"
        elif any(keyword in idea_lower for keyword in ['app', 'website', 'tool']):
            return "3-6 months"
        else:
            return "3-6 months"
    
    def _calculate_success_probability(self, feasibility_score: int, 
                                     warning_count: int,
                                     technical_issues: int, 
                                     business_issues: int) -> float:
        """Calculate probability of success (0.0 to 1.0)."""
        base_probability = feasibility_score / 10.0
        
        # Reduce probability based on issues
        penalty = (warning_count * 0.1) + (technical_issues * 0.05) + (business_issues * 0.08)
        
        return max(0.1, min(0.95, base_probability - penalty))
