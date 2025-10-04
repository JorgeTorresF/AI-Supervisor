"""Task Coherence Protection System for the Supervisor Agent.

This package provides comprehensive task coherence protection, including:
- Context management and task tracking
- Derailment detection and classification
- Idea validation and risk assessment
- Real-time intervention and course correction
- Prompt rewriting for better coherence

Main Components:
- ContextManager: Tracks current task and conversation context
- DerailmentDetector: Identifies when agents deviate from tasks
- IdeaValidator: Validates project ideas and warns about bad ones
- InterventionEngine: Orchestrates real-time interventions
- PromptRewriter: Rewrites prompts to maintain task focus
"""

from .context_manager import ContextManager, TaskContext, ConversationTurn
from .derailment_detector import DerailmentDetector, DerailmentType, DerailmentResult
from .idea_validator import IdeaValidator, ValidationResult, RiskLevel
from .intervention_engine import InterventionEngine, InterventionType, InterventionAction
from .prompt_rewriter import PromptRewriter

__version__ = "1.0.0"
__author__ = "MiniMax Agent"

__all__ = [
    # Main classes
    "ContextManager",
    "DerailmentDetector", 
    "IdeaValidator",
    "InterventionEngine",
    "PromptRewriter",
    
    # Data classes
    "TaskContext",
    "ConversationTurn",
    "DerailmentResult",
    "ValidationResult",
    "InterventionAction",
    
    # Enums
    "DerailmentType",
    "RiskLevel",
    "InterventionType"
]

# Convenience factory function
def create_supervisor_system():
    """Create a complete supervisor system with all components initialized."""
    context_manager = ContextManager()
    derailment_detector = DerailmentDetector()
    idea_validator = IdeaValidator()
    intervention_engine = InterventionEngine()
    prompt_rewriter = PromptRewriter()
    
    return {
        'context_manager': context_manager,
        'derailment_detector': derailment_detector,
        'idea_validator': idea_validator,
        'intervention_engine': intervention_engine,
        'prompt_rewriter': prompt_rewriter
    }
