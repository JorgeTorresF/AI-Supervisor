# Comprehensive Error Handling and Recovery System

A robust error handling and recovery system for the Supervisor Agent with auto-retry mechanisms, rollback capabilities, escalation management, loop detection, and comprehensive recovery orchestration.

## System Overview

The error handling system provides comprehensive error management through six main components:

1. **Auto-Retry System** - 3-retry mechanism with progressive strategies
2. **Rollback Capabilities** - State preservation and restoration  
3. **Escalation System** - Human intervention triggers and queue management
4. **Loop Detection** - Infinite loop detection and circuit breaker patterns
5. **Versioned History** - Complete audit trail of all interventions
6. **Recovery Orchestration** - Coordinated recovery strategy execution

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                Error Handling System                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────── │
│  │  Error Types &  │  │ Recovery        │  │ History       │
│  │  Classification │  │ Orchestrator    │  │ Manager       │
│  └─────────────────┘  └─────────────────┘  └─────────────── │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────── │
│  │  Retry System   │  │ Rollback        │  │ Loop          │
│  │  (Progressive)  │  │ Manager         │  │ Detector      │
│  └─────────────────┘  └─────────────────┘  └─────────────── │
│                                                             │
│  ┌─────────────────┐                                        │
│  │  Escalation     │                                        │
│  │  Handler        │                                        │
│  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

```python
from pathlib import Path
from error_handling.error_handling_system import SupervisorErrorHandlingSystem
from error_handling.error_types import SupervisorError, ErrorType

# Initialize the system
error_system = SupervisorErrorHandlingSystem(
    storage_path=Path("supervisor_data/error_handling"),
    max_retries=3,
    escalation_enabled=True
)

# Handle an error with automatic recovery
async def example_recovery_callback():
    # Your recovery logic here
    return "Recovery successful"

result = await error_system.handle_error(
    error=Exception("Task failed"),
    agent_id="agent_001",
    task_id="task_123",
    context={"retry_count": 0},
    state_data={"current_state": "processing"},
    recovery_callback=example_recovery_callback
)

print(f"Recovery result: {result['recovery_result']}")
print(f"Success: {result['success']}")
```

## Core Components

### 1. Error Types and Classification

**Error Categories:**
- **Recoverable**: Timeout, Rate Limit, Network Error, Temporary Failure
- **Agent-Specific**: Agent Overload, Task Complexity, Context Overflow
- **Loop/Control**: Infinite Loop, Stuck State, Circular Dependency
- **Critical**: System Error, Configuration Error, Authentication Error
- **Fatal**: Corruption, Security Breach, Hardware Failure

```python
from error_handling.error_types import SupervisorError, ErrorType, ErrorSeverity

# Create a custom error
error = SupervisorError(
    message="Task execution timeout",
    error_type=ErrorType.TIMEOUT,
    severity=ErrorSeverity.MEDIUM,
    context={"timeout_seconds": 30}
)

# Classify an exception
classified_type = ErrorClassifier.classify_exception(TimeoutError("Connection timeout"))
```

### 2. Auto-Retry System

**Features:**
- Progressive backoff strategies (exponential, linear, adaptive)
- Intelligent prompt adjustments between retries
- Context-aware retry decisions
- Success rate tracking

```python
from error_handling.retry_system import RetrySystem

retry_system = RetrySystem(max_retries=3)

# Check if error should be retried
should_retry = await retry_system.should_retry(error)

if should_retry:
    result = await retry_system.execute_retry(
        error=error,
        retry_callback=your_callback,
        original_prompt="Original task prompt"
    )
```

### 3. Rollback Manager

**Capabilities:**
- State snapshots with integrity verification
- Named checkpoints for easy rollback
- Version control with checksums
- Automatic cleanup policies

```python
from error_handling.rollback_manager import RollbackManager

rollback_manager = RollbackManager(max_snapshots=50)

# Create checkpoint
checkpoint_id = rollback_manager.create_checkpoint(
    checkpoint_name="before_critical_operation",
    state_data=current_state,
    metadata={"operation": "data_processing"}
)

# Rollback if needed
rollback_result = rollback_manager.rollback_to_checkpoint(
    "before_critical_operation"
)
```

### 4. Escalation Handler

**Management Features:**
- Severity-based escalation levels
- Automatic escalation triggers
- Ticket queue management
- Comprehensive escalation reports

```python
from error_handling.escalation_handler import EscalationHandler, EscalationLevel

escalation_handler = EscalationHandler()

# Escalate critical error
ticket_id = escalation_handler.escalate_error(
    error=critical_error,
    context={"agent_id": "agent_001"},
    level=EscalationLevel.CRITICAL_ALERT
)

# Resolve ticket
escalation_handler.resolve_ticket(
    ticket_id=ticket_id,
    resolution="Issue resolved by system restart",
    resolved_by="ops_team"
)
```

### 5. Loop Detector

**Detection Capabilities:**
- Execution pattern analysis
- State cycle detection
- Stuck agent identification
- Circuit breaker implementation

```python
from error_handling.loop_detector import LoopDetector

loop_detector = LoopDetector()

# Record execution point
loop_detection = loop_detector.record_execution_point(
    agent_id="agent_001",
    task_id="task_123",
    state=current_state,
    output="Task output",
    context={"operation": "process"}
)

# Handle loop if detected
if loop_detection and loop_detection.severity == "critical":
    loop_detector.pause_agent(
        agent_id="agent_001",
        reason="Infinite loop detected"
    )
```

### 6. History Manager

**Audit Trail Features:**
- Versioned history entries
- Event type categorization
- Intervention tracking with before/after states
- Diff generation between versions
- Search and filtering capabilities

```python
from error_handling.history_manager import HistoryManager, HistoryEventType

history_manager = HistoryManager()

# Create history timeline
history_id = history_manager.create_history(
    agent_id="agent_001",
    task_id="task_123",
    initial_data={"state": "initialized"}
)

# Record intervention
entry_id = history_manager.record_intervention(
    history_id=history_id,
    intervention_type="retry_with_adjustment",
    intervention_data={"attempt": 2},
    before_state=old_state,
    after_state=new_state
)
```

### 7. Recovery Orchestrator

**Orchestration Features:**
- Multi-strategy recovery plans
- Priority-based strategy execution
- Fallback mechanism support
- Success rate estimation

```python
from error_handling.recovery_orchestrator import RecoveryOrchestrator

# Orchestrator is automatically initialized by the main system
# Execute recovery (handled automatically by main system)
recovery_result = await recovery_orchestrator.recover_from_error(
    error=supervisor_error,
    context=recovery_context,
    agent_id="agent_001",
    task_id="task_123",
    recovery_callback=your_callback
)
```

## Advanced Usage

### Custom Error Handling

```python
# Create custom error with specific context
custom_error = SupervisorError(
    message="Custom business logic failure",
    error_type=ErrorType.VALIDATION_ERROR,
    severity=ErrorSeverity.HIGH,
    context={
        "validation_rule": "data_integrity_check",
        "failed_records": 15,
        "total_records": 1000
    },
    recoverable=True
)

# Handle with custom recovery callback
async def custom_recovery():
    # Implement custom recovery logic
    await clean_invalid_records()
    await revalidate_data()
    return "Data cleaned and revalidated"

result = await error_system.handle_error(
    error=custom_error,
    agent_id="data_processor",
    task_id="validation_001",
    recovery_callback=custom_recovery
)
```

### Manual System Operations

```python
# Create manual checkpoint
checkpoint_id = await error_system.create_checkpoint(
    checkpoint_name="pre_deployment",
    state_data=deployment_state,
    metadata={"version": "1.2.3"}
)

# Pause agent manually
if suspicious_behavior:
    await error_system.pause_agent(
        agent_id="suspicious_agent",
        reason="Unusual activity detected"
    )

# Resume agent after investigation
if investigation_complete:
    await error_system.resume_agent("suspicious_agent")

# Get system status
status = await error_system.get_system_status()
print(f"Total errors handled: {status['system_stats']['total_errors_handled']}")
```

### Monitoring and Reporting

```python
# Get pending escalations
escalations = await error_system.get_pending_escalations()
for ticket in escalations:
    print(f"Ticket: {ticket['ticket_id']}, Priority: {ticket['priority']}")

# Generate system health report
health_status = await error_system.get_system_status()
print(f"System Health: {health_status}")

# Query history
history_entries = history_manager.search_entries(
    history_id="hist_001",
    event_type=HistoryEventType.ERROR_OCCURRED,
    start_time=datetime.now() - timedelta(hours=24)
)
```

## Configuration

### System Configuration

```python
error_system = SupervisorErrorHandlingSystem(
    storage_path=Path("custom/path"),
    max_retries=5,
    max_snapshots=100,
    escalation_enabled=True
)
```

### Component-Specific Configuration

Each component can be configured through the system or individually:

- **Retry System**: Backoff strategies, success thresholds
- **Rollback Manager**: Snapshot limits, cleanup policies  
- **Escalation Handler**: Priority weights, notification channels
- **Loop Detector**: Detection thresholds, circuit breaker settings
- **History Manager**: Retention periods, versioning limits

## Error Handling Patterns

### Progressive Recovery

1. **Immediate Retry** - Quick retry with minimal delay
2. **Adjusted Retry** - Retry with context/prompt adjustments
3. **Rollback and Retry** - Restore previous state and retry
4. **Human Escalation** - Transfer to human intervention
5. **Emergency Stop** - Pause all operations for critical errors

### Loop Detection Patterns

- **Execution Loops** - Same operation repeated multiple times
- **State Loops** - System cycling through same states
- **Stuck Agents** - No progress for extended periods
- **Circular Dependencies** - A→B→C→A patterns

## Best Practices

1. **State Management**
   - Create checkpoints before risky operations
   - Include comprehensive state data in snapshots
   - Use meaningful checkpoint names

2. **Error Context**
   - Provide rich context information
   - Include relevant metadata and parameters
   - Track operation history

3. **Recovery Callbacks**
   - Implement idempotent recovery operations
   - Handle partial failure scenarios
   - Provide clear success/failure indicators

4. **Monitoring**
   - Regularly check system health status
   - Monitor escalation queues
   - Review loop detection alerts

5. **Maintenance**
   - Resolve escalation tickets promptly
   - Clean up old snapshots and history
   - Update retry thresholds based on success rates

## Integration

The error handling system integrates seamlessly with the Supervisor Agent's core components:

- **Task Execution**: Automatic error interception
- **Agent Monitoring**: Real-time loop detection
- **Quality Control**: Recovery success tracking
- **Audit Logging**: Complete intervention history

Refer to the examples directory for complete usage examples and integration patterns.
