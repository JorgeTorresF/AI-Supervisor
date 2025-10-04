# Supervisor Agent - Task Coherence System

## Overview

The Task Coherence Protection System is the core intelligence of the Supervisor Agent, designed to prevent AI agents from derailing from their assigned tasks and to validate project ideas before development begins.

## Key Features

### 🎯 Task Coherence Protection
- **Real-time monitoring** of agent responses for task deviation
- **Automatic intervention** when derailment is detected
- **Prompt rewriting** to refocus agents on main objectives
- **Context preservation** across long conversations

### 🧠 Idea Validation System  
- **Feasibility scoring** (1-10 scale) for project ideas
- **Risk assessment** (Low/Medium/High/Critical)
- **Technical validation** against known limitations
- **Market viability** analysis
- **Resource requirement** estimation

### 🔍 Derailment Detection
Detects and classifies various types of derailment:
- **Topic Drift**: Gradual shift away from main topic
- **Scope Creep**: Adding unrelated features/requirements  
- **Technology Switch**: Changing tech stack mid-project
- **Goal Confusion**: Misunderstanding main objectives
- **Distraction**: Getting sidetracked by tangential topics
- **Premature Optimization**: Focusing on optimization too early

### ⚡ Real-time Interventions
- **Warning messages** for risky ideas or derailment
- **Corrective suggestions** to get back on track
- **Prompt rewriting** for better coherence
- **Blocking** of critically problematic requests

## System Components

### ContextManager
```python
from src.task_coherence import ContextManager

context = ContextManager()
context.set_current_task("Build Social Media App", "Create a social platform for sharing photos")
context.add_conversation_turn(user_input, agent_response)
```

### IdeaValidator
```python
from src.task_coherence import IdeaValidator

validator = IdeaValidator()
result = validator.validate_idea("Build a time travel app")
print(f"Feasibility: {result.feasibility_score}/10")
print(f"Risk Level: {result.risk_level}")
```

### InterventionEngine
```python
from src.task_coherence import InterventionEngine

engine = InterventionEngine()
interventions = engine.analyze_and_intervene(
    user_prompt="Let's build a hackathon app instead",
    agent_response="Great idea! Let me start coding...", 
    current_task="Build Social Media App",
    conversation_history=history
)
```

## Integration Examples

### Basic Usage
```python
# Initialize the complete system
from src.task_coherence import create_supervisor_system

supervisor = create_supervisor_system()

# Set current task
supervisor['context_manager'].set_current_task(
    "Build E-commerce Website", 
    "Create an online store with payment processing"
)

# Validate a new idea
validation = supervisor['idea_validator'].validate_idea(
    "Let's create a blockchain-based quantum AI marketplace"
)

if validation.risk_level.value in ['high', 'critical']:
    print("⚠️ Warning: This idea has significant risks!")
    for warning in validation.warnings:
        print(f"• {warning}")
```

### Advanced Integration
```python
# Monitor a conversation for derailment
def monitor_conversation(user_input, agent_response, current_task):
    supervisor = create_supervisor_system()
    
    # Add conversation turn
    supervisor['context_manager'].add_conversation_turn(user_input, agent_response)
    
    # Check for interventions needed
    interventions = supervisor['intervention_engine'].analyze_and_intervene(
        user_input, agent_response, current_task, []
    )
    
    for intervention in interventions:
        if intervention.type.value == 'warning':
            print(f"⚠️ {intervention.message}")
        elif intervention.type.value == 'redirect':
            print(f"🎯 Suggested correction: {intervention.suggested_prompt}")
        elif intervention.type.value == 'block':
            print(f"🚫 Blocking request: {intervention.message}")
    
    return interventions
```

## Configuration

The system can be customized with user preferences:

```python
# Set intervention aggressiveness
engine.set_user_preferences({
    'aggressiveness': 'high',      # low/medium/high
    'auto_rewrite': True,          # Automatically rewrite prompts
    'block_bad_ideas': True,       # Block critically bad ideas
    'learning_mode': True          # Learn from interventions
})
```

## Metrics and Analytics

```python
# Get coherence metrics
metrics = context_manager.get_task_coherence_metrics()
print(f"Coherence Score: {metrics['coherence_score']:.2f}")
print(f"Drift Risk: {metrics['drift_risk']:.2f}")

# Get intervention statistics  
stats = intervention_engine.get_intervention_stats()
print(f"Total Interventions: {stats['total_interventions']}")
print(f"Success Rate: {stats['average_confidence']:.0%}")
```

## Next Steps

This system forms the foundation for:
1. **Web Application Interface** - Dashboard for monitoring and control
2. **Browser Extension** - Real-time supervision of web-based AI agents
3. **Hybrid Architecture** - Seamless multi-platform integration
4. **Local Installation** - Offline supervision capabilities

The task coherence system is designed to be deployment-agnostic and can be integrated into any of the planned deployment modes.
