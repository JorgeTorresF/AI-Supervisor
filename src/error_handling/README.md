# Error Handling and Recovery System

A comprehensive error handling and recovery system for the Supervisor Agent, providing robust mechanisms for automatic error recovery, rollback capabilities, escalation workflows, and loop detection.

## Overview

The Error Handling System consists of six integrated components that work together to provide comprehensive error recovery:

1. **Auto-Retry System** - Intelligent retry mechanisms with progressive strategies
2. **Rollback System** - State preservation and recovery capabilities
3. **Escalation System** - Human intervention and critical error handling
4. **Loop Detection** - Infinite loop detection and circuit breaker patterns
5. **History Manager** - Versioned tracking of agent states and interventions
6. **Recovery Orchestrator** - Coordinates all recovery mechanisms

## Features

### 🔄 Auto-Retry System
- **Progressive Retry Strategies**: Exponential backoff, linear backoff, fixed delay, adaptive
- **Intelligent Prompt Adjustment**: Context addition, simplification, rephrasing, examples
- **Success Rate Learning**: Adaptive retry decisions based on historical success rates
- **Error Type Classification**: Different retry strategies for different error types

### 📸 Rollback System
- **State Snapshots**: Create and manage versioned state snapshots
- **Integrity Verification**: Checksum validation for snapshot integrity
- **Automatic Cleanup**: Age-based and count-based snapshot cleanup
- **Rollback Validation**: Optional validation callbacks for rollback operations

### 🚨 Escalation System
- **Multi-Level Escalation**: Auto-recovery → Supervisor Review → Human Intervention → Critical Alert
- **Priority Scoring**: Intelligent priority calculation based on error severity and context
- **Notification System**: Configurable notification channels (email, Slack, webhooks)
- **Escalation Reports**: Comprehensive error analysis and recommendations

### 🔁 Loop Detection
- **Pattern Recognition**: Detects repetitive action patterns and error cycles
- **Circuit Breaker**: Automatic agent pause when loops are detected
- **Similarity Analysis**: Advanced pattern matching with configurable thresholds
- **Agent State Tracking**: Monitors state transitions for cycle detection

### 📚 History Manager
- **Versioned History**: Complete tracking of agent states, errors, and interventions
- **Diff Generation**: Compare versions and generate detailed diffs
- **Intervention Timeline**: Track all manual and automatic interventions
- **Compression Support**: Optional gzip compression for storage efficiency

### 🎯 Recovery Orchestrator
- **Strategy Selection**: Intelligent selection of optimal recovery strategies
- **Multi-Phase Recovery**: Assessment → Strategy Selection → Execution → Validation → Completion
- **Hybrid Approaches**: Combines multiple recovery strategies for complex scenarios
- **Recovery Validation**: Ensures recovery operations are successful and stable

## Quick Start

### Basic Usage

```python
import asyncio
from src.error_handling import ErrorHandlingSystem

async def main():
    # Initialize the error handling system
    error_system = ErrorHandlingSystem()
    
    try:
        # Your agent code that might fail
        result = await some_risky_operation()
    except Exception as error:
        # Handle the error automatically
        context = {
            'agent_id': 'my_agent_01',
            'task_id': 'important_task',
            'additional_context': {'key': 'value'}
        }
        
        # Define recovery callback
        async def recovery_callback(adjusted_prompt=None):
            # Retry the operation, possibly with adjusted parameters
            return await some_risky_operation(adjusted_prompt)
        
        # Let the system handle the error
        recovery_result = await error_system.handle_error(
            error, context, recovery_callback
        )
        
        if recovery_result.get('success', False):
            print(f"Successfully recovered: {recovery_result['result']}")
        else:
            print(f"Recovery failed: {recovery_result.get('error', 'Unknown error')}")
    
    finally:
        # Always shutdown the system
        await error_system.shutdown()

asyncio.run(main())
```

### Advanced Configuration

```python
from src.error_handling import ErrorHandlingSystem

# Custom configuration
config = {
    'retry': {
        'max_retries': 5,
        'base_delay': 2.0,
        'backoff_multiplier': 1.5,
        'max_delay': 60.0,
        'adaptive_learning': True
    },
    'rollback': {
        'max_snapshots': 20,
        'cleanup_after_hours': 48,
        'compression_enabled': True,
        'verification_enabled': True
    },
    'escalation': {
        'max_auto_recovery_attempts': 3,
        'escalation_timeout': 600,
        'critical_error_types': ['resource_error', 'infinite_loop'],
        'notification_channels': {
            'email': True,
            'slack': True,
            'webhook': False
        }
    },
    'loop_detection': {
        'max_iterations': 100,
        'similarity_threshold': 0.9,
        'time_window_seconds': 600,
        'enable_auto_pause': True
    },
    'history': {
        'max_versions': 200,
        'retention_days': 60,
        'compression_enabled': True
    }
}

error_system = ErrorHandlingSystem(config)
```

## Component Examples

### Creating Snapshots for Rollback

```python
# Create a snapshot before risky operation
agent_state = {
    'model_version': '2.1.0',
    'training_progress': 0.85,
    'parameters': {'learning_rate': 0.001}
}

snapshot_id = await error_system.rollback_system.create_snapshot(
    agent_id='trainer_01',
    task_id='model_training',
    state_data=agent_state,
    metadata={'checkpoint': 'before_fine_tuning'}
)

print(f"Created snapshot: {snapshot_id}")
```

### Manual Escalation

```python
# Create manual escalation for complex issues
ticket_id = await error_system.escalation_system.create_escalation(
    error_context,
    recovery_attempts=[],
    level=EscalationLevel.HUMAN_INTERVENTION
)

# Get escalation report
report = await error_system.escalation_system.get_escalation_report(ticket_id)
print(f"Escalation report: {report}")
```

### Loop Detection Monitoring

```python
# Check if agent is stuck in a loop
is_paused = await error_system.loop_detector.is_agent_paused('agent_01')

# Get detected patterns
patterns = await error_system.loop_detector.get_loop_patterns('agent_01')

# Reset agent if needed
if is_paused:
    await error_system.loop_detector.reset_agent('agent_01')
```

### History and Version Management

```python
# Record agent state
version_id = await error_system.history_manager.record_state(
    agent_id='agent_01',
    task_id='task_01',
    state_data={'status': 'completed', 'result': 'success'},
    metadata={'phase': 'final'}
)

# Compare versions
comparison = await error_system.history_manager.compare_versions(
    'agent_01', 'task_01', 'v0001', 'v0002'
)

print(f"Changes detected: {comparison['diff']['total_changes']}")
```

## System Health Monitoring

```python
# Get system health status
health = await error_system.get_system_health()

print(f"Active errors: {health['active_errors']}")
print(f"Success rate: {health['stats']['successful_recoveries'] / health['stats']['total_errors']}")

# Monitor subsystem status
for subsystem, status in health['subsystem_status'].items():
    print(f"{subsystem}: {status}")
```

## Error Types and Severity Levels

### Error Types
- `AGENT_FAILURE` - Agent execution failures
- `TOOL_FAILURE` - Tool or function call failures
- `COMMUNICATION_ERROR` - Network or communication issues
- `TIMEOUT_ERROR` - Operation timeouts
- `VALIDATION_ERROR` - Data validation failures
- `INFINITE_LOOP` - Detected infinite loops
- `RESOURCE_ERROR` - Memory, disk, or other resource issues
- `CONFIGURATION_ERROR` - Configuration or setup problems
- `UNKNOWN_ERROR` - Unclassified errors

### Severity Levels
- `LOW` - Minor issues, auto-retry recommended
- `MEDIUM` - Moderate issues, may require intervention
- `HIGH` - Serious issues, likely to need escalation
- `CRITICAL` - Critical failures, immediate escalation required

## Recovery Strategies

The system automatically selects recovery strategies based on error context:

1. **Auto-Retry** - For transient errors and network issues
2. **Rollback** - For state corruption or failed updates
3. **Escalation** - For critical errors or repeated failures
4. **Circuit Breaker** - For infinite loops or stuck agents
5. **Hybrid** - Combines multiple strategies for complex scenarios
6. **Manual** - Queues for human intervention

## Performance and Scalability

- **Asynchronous Operations**: All operations are async for high performance
- **Memory Management**: Automatic cleanup and configurable limits
- **Storage Optimization**: Optional compression and retention policies
- **Concurrent Processing**: Handles multiple errors simultaneously
- **Resource Monitoring**: Built-in resource usage tracking

## Configuration Options

Detailed configuration options for each component:

### Auto-Retry Configuration
```python
'retry': {
    'max_retries': 3,                    # Maximum retry attempts
    'base_delay': 1.0,                   # Base delay in seconds
    'backoff_multiplier': 2.0,           # Exponential backoff multiplier
    'max_delay': 30.0,                   # Maximum delay between retries
    'adaptive_learning': True,           # Enable success rate learning
    'success_rate_threshold': 0.3        # Minimum success rate for retries
}
```

### Rollback Configuration
```python
'rollback': {
    'max_snapshots': 10,                 # Maximum snapshots per agent
    'cleanup_after_hours': 24,           # Cleanup snapshots after hours
    'compression_enabled': True,         # Enable snapshot compression
    'verification_enabled': True,        # Enable integrity verification
    'backup_to_remote': False            # Enable remote backup
}
```

### Escalation Configuration
```python
'escalation': {
    'max_auto_recovery_attempts': 5,     # Max attempts before escalation
    'escalation_timeout': 300,           # Escalation timeout in seconds
    'critical_error_types': [            # Error types for immediate escalation
        'infinite_loop',
        'resource_error'
    ],
    'notification_channels': {           # Notification settings
        'email': True,
        'slack': False,
        'webhook': False
    }
}
```

## Integration with Supervisor Agent

The Error Handling System integrates seamlessly with the Supervisor Agent:

```python
from src.supervisor_agent import SupervisorAgent
from src.error_handling import ErrorHandlingSystem

class EnhancedSupervisorAgent(SupervisorAgent):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.error_system = ErrorHandlingSystem()
    
    async def execute_task(self, task):
        # Create snapshot before task execution
        snapshot_id = await self.error_system.rollback_system.create_snapshot(
            agent_id=self.agent_id,
            task_id=task.id,
            state_data=self.get_current_state()
        )
        
        try:
            result = await super().execute_task(task)
            return result
        except Exception as error:
            # Handle error with full recovery system
            context = {
                'agent_id': self.agent_id,
                'task_id': task.id,
                'task_data': task.to_dict()
            }
            
            async def recovery_callback(adjusted_prompt=None):
                if adjusted_prompt:
                    task.prompt = adjusted_prompt
                return await super().execute_task(task)
            
            recovery_result = await self.error_system.handle_error(
                error, context, recovery_callback
            )
            
            if recovery_result.get('success', False):
                return recovery_result['result']
            else:
                raise error  # Re-raise if recovery failed
```

## Testing

Run the comprehensive examples to test all functionality:

```bash
python -m src.error_handling.examples
```

This will demonstrate:
- Simple retry scenarios
- Rollback operations
- Loop detection and circuit breaker
- Escalation workflows
- History tracking and version comparison
- System health monitoring

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Reduce `max_snapshots` and `max_versions`
   - Enable compression
   - Decrease retention periods

2. **Slow Recovery Operations**
   - Reduce `max_retries`
   - Decrease `base_delay`
   - Optimize validation callbacks

3. **False Loop Detection**
   - Increase `similarity_threshold`
   - Extend `time_window_seconds`
   - Adjust `max_iterations`

### Logging

Enable detailed logging for debugging:

```python
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger('src.error_handling')
logger.setLevel(logging.DEBUG)
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Error Handling System                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                   │
│  │  Auto-Retry     │    │  Rollback       │                   │
│  │  System         │    │  System         │                   │
│  │                 │    │                 │                   │
│  │ • Strategies    │    │ • Snapshots     │                   │
│  │ • Adjustments   │    │ • Validation    │                   │
│  │ • Learning      │    │ • Cleanup       │                   │
│  └─────────────────┘    └─────────────────┘                   │
│           │                       │                           │
│           └───────┐       ┌───────┘                           │
│                   │       │                                   │
│  ┌─────────────────┴───────┴─────────────────┐                 │
│  │        Recovery Orchestrator              │                 │
│  │                                           │                 │
│  │ • Strategy Selection                      │                 │
│  │ • Multi-Phase Recovery                    │                 │
│  │ • Validation & Completion                 │                 │
│  └─────────────────┬───────┬─────────────────┘                 │
│                   │       │                                   │
│           ┌───────┘       └───────┐                           │
│           │                       │                           │
│  ┌─────────────────┐    ┌─────────────────┐                   │
│  │  Loop Detector  │    │  Escalation     │                   │
│  │                 │    │  System         │                   │
│  │ • Pattern Recog │    │                 │                   │
│  │ • Circuit Break │    │ • Multi-Level   │                   │
│  │ • Agent Control │    │ • Notifications │                   │
│  └─────────────────┘    └─────────────────┘                   │
│           │                       │                           │
│           └───────┐       ┌───────┘                           │
│                   │       │                                   │
│  ┌─────────────────┴───────┴─────────────────┐                 │
│  │         History Manager                   │                 │
│  │                                           │                 │
│  │ • Version Tracking                        │                 │
│  │ • Diff Generation                         │                 │
│  │ • Intervention Timeline                   │                 │
│  └───────────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

## License

This Error Handling System is part of the Supervisor Agent project and follows the same licensing terms.

---

**Note**: This system is designed for production use with the Supervisor Agent. All components are thoroughly tested and include comprehensive error handling themselves to ensure system reliability.
