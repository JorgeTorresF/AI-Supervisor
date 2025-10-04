# Comprehensive Supervisor Agent MCP Server

A complete, production-ready MCP server that provides comprehensive agent supervision capabilities through integrated monitoring, error handling, and reporting systems.

## Overview

The Supervisor Agent integrates three core systems:

- **Monitoring System**: Real-time task monitoring, instruction adherence, output quality assessment, and confidence scoring
- **Error Handling System**: Auto-retry mechanisms, state rollback, escalation management, and recovery orchestration
- **Reporting System**: Comprehensive auditing, alerting, pattern detection, and dashboard capabilities

## Architecture

```
Supervisor Agent MCP Server
├── Core MCP Server (FastMCP)
├── Integrated Supervisor Agent
│   ├── Monitoring Engine
│   │   ├── Task Completion Monitor
│   │   ├── Instruction Adherence Monitor  
│   │   ├── Output Quality Monitor
│   │   ├── Error Tracker
│   │   ├── Resource Monitor
│   │   └── Confidence Scorer
│   ├── Error Handling System
│   │   ├── Auto-Retry System
│   │   ├── Rollback Manager
│   │   ├── Escalation Handler
│   │   ├── Loop Detector
│   │   ├── History Manager
│   │   └── Recovery Orchestrator
│   └── Reporting System
│       ├── Audit System
│       ├── Alert System
│       ├── Report Generator
│       ├── Confidence Reporting
│       ├── Pattern Detection
│       └── Dashboard System
```

## Tools Provided

The MCP server exposes 10 comprehensive supervision tools:

### 1. `monitor_agent`
Start monitoring a specific agent with comprehensive supervision.
```python
{
  "agent_id": "agent_001",
  "task_config": {
    "objectives": ["Complete data analysis", "Generate report"],
    "constraints": {"max_time": 3600, "memory_limit": "1GB"},
    "quality_requirements": {"accuracy": 0.95, "completeness": 0.9}
  }
}
```

### 2. `set_monitoring_rules`
Configure monitoring rules and thresholds for an agent.
```python
{
  "agent_id": "agent_001", 
  "rules": {
    "confidence_threshold": 0.8,
    "quality_threshold": 0.9,
    "error_tolerance": 2,
    "alert_on_low_confidence": true
  }
}
```

### 3. `get_supervision_report`
Generate comprehensive supervision report for agent(s).
```python
{
  "agent_id": "agent_001",  # Optional - reports on all if omitted
  "time_range": "24h"       # "1h", "24h", "7d", "30d"
}
```

### 4. `intervene_task`
Intervene in agent task execution with specific actions.
```python
{
  "agent_id": "agent_001",
  "intervention_type": "pause",  # pause, redirect, adjust, terminate
  "parameters": {
    "reason": "Quality concerns detected",
    "new_objective": "Focus on data validation first"
  }
}
```

### 5. `validate_output`
Validate agent output against quality criteria and standards.
```python
{
  "agent_id": "agent_001",
  "output_data": {"result": "analysis complete", "confidence": 0.85},
  "validation_criteria": {
    "completeness_required": true,
    "format_validation": true,
    "quality_threshold": 0.8
  }
}
```

### 6. `get_audit_log`
Retrieve audit log entries for supervision activities.
```python
{
  "agent_id": "agent_001",           # Optional filter
  "start_time": "2024-01-01T00:00:00Z", # Optional filter
  "end_time": "2024-01-02T00:00:00Z",   # Optional filter
  "event_type": "intervention"         # Optional filter
}
```

### 7. `configure_escalation`
Configure escalation rules and triggers for an agent.
```python
{
  "agent_id": "agent_001",
  "escalation_config": {
    "confidence_threshold": 0.5,
    "error_count_threshold": 3,
    "auto_escalation_enabled": true,
    "escalation_contacts": ["admin@company.com"]
  }
}
```

### 8. `knowledge_base_update`
Update supervisor knowledge base with new patterns, procedures, or insights.
```python
{
  "update_type": "best_practice",  # pattern, procedure, insight, best_practice
  "data": {
    "title": "Effective Error Recovery",
    "description": "Always try rollback before escalation",
    "applicable_scenarios": ["data_corruption", "state_inconsistency"]
  },
  "category": "error_handling"
}
```

### 9. `rollback_state`
Rollback agent state to a previous checkpoint or snapshot.
```python
{
  "agent_id": "agent_001",
  "snapshot_id": "snap_123456",  # Optional - specific snapshot
  "rollback_steps": 3            # Alternative - steps back
}
```

### 10. `generate_summary`
Generate comprehensive summary reports of supervision activities.
```python
{
  "summary_type": "overview",  # overview, performance, issues, trends
  "time_range": "24h",        # 1h, 24h, 7d, 30d
  "include_recommendations": true
}
```

## Features

### Monitoring Capabilities
- **Real-time Monitoring**: Continuous evaluation of agent execution
- **Multi-dimensional Assessment**: Task completion, instruction adherence, output quality
- **Confidence Scoring**: AI-powered confidence assessment with calibration
- **Resource Tracking**: CPU, memory, API usage, and cost monitoring
- **Error Detection**: Automatic error identification and categorization

### Error Handling & Recovery
- **Auto-retry System**: Progressive retry strategies with exponential backoff
- **State Management**: Automatic snapshots and rollback capabilities
- **Loop Detection**: Identifies and breaks infinite execution loops
- **Escalation Management**: Tiered escalation to human oversight
- **Recovery Orchestration**: Coordinated multi-strategy error recovery

### Reporting & Analytics
- **Comprehensive Auditing**: Complete audit trail of all supervision activities
- **Real-time Alerts**: Configurable alerting for critical events
- **Pattern Detection**: AI-powered pattern recognition in supervision data
- **Dashboard System**: Real-time metrics and visualization capabilities
- **Periodic Reports**: Automated generation of supervision reports

### Integration Support
- **Framework Agnostic**: Compatible with MCP, LangChain, AutoGen, and custom frameworks
- **RESTful API**: HTTP endpoints for external system integration
- **Webhook Support**: Event-driven notifications and integrations
- **Export Capabilities**: Data export in multiple formats (JSON, CSV, PDF)

## Installation & Setup

### Quick Start
```bash
# Clone or download the supervisor MCP server
cd supervisor_mcp_server

# Make run script executable
chmod +x run.sh

# Start the server
./run.sh
```

### Manual Setup
```bash
# Install dependencies
pip install fastmcp pydantic

# Create necessary directories
mkdir -p supervisor_data/{monitoring,error_handling,reporting,knowledge_base,audit,snapshots}
mkdir -p logs

# Start the server
python3 server.py
```

## Configuration

The system uses a flexible configuration system. Create `config.json` to customize:

```json
{
  "monitoring": {
    "enabled": true,
    "evaluation_interval": 5.0,
    "confidence_threshold": 0.7,
    "real_time_updates": true
  },
  "error_handling": {
    "enabled": true,
    "max_retries": 3,
    "auto_escalation": true,
    "rollback_enabled": true
  },
  "reporting": {
    "enabled": true,
    "audit_logging": true,
    "dashboard_enabled": true,
    "alert_notifications": true
  },
  "storage": {
    "base_path": "supervisor_data",
    "max_snapshots": 50,
    "retention_days": 30
  }
}
```

## Usage Examples

### Basic Agent Supervision
```python
import json
from mcp import Client

client = Client("supervisor-agent")

# Start monitoring an agent
result = await client.call("monitor_agent", {
    "agent_id": "data_processor_01",
    "task_config": {
        "objectives": ["Process customer data", "Generate insights"],
        "constraints": {"max_time": 1800, "accuracy_required": 0.95},
        "expected_outputs": ["processed_data.json", "insights_report.md"]
    }
})

print(f"Monitoring started: {result['session_id']}")

# Check supervision status
report = await client.call("get_supervision_report", {
    "agent_id": "data_processor_01",
    "time_range": "1h"
})

print(f"Agent status: {report['report']['summary']}")
```

### Error Recovery
```python
# Configure escalation rules
escalation_result = await client.call("configure_escalation", {
    "agent_id": "data_processor_01",
    "escalation_config": {
        "confidence_threshold": 0.6,
        "error_count_threshold": 2,
        "auto_escalation_enabled": True,
        "escalation_timeout": 300
    }
})

# If issues occur, rollback to previous state
rollback_result = await client.call("rollback_state", {
    "agent_id": "data_processor_01",
    "rollback_steps": 2
})
```

### Knowledge Base Management
```python
# Add learning to knowledge base
kb_update = await client.call("knowledge_base_update", {
    "update_type": "pattern",
    "data": {
        "pattern_name": "Data Processing Bottleneck",
        "description": "Large datasets cause memory issues",
        "indicators": ["high_memory_usage", "slow_processing"],
        "recommended_actions": ["chunk_data", "increase_memory_limit"]
    },
    "category": "performance"
})
```

## Framework Integration

### LangChain Integration
```python
from langchain.agents import AgentExecutor
from supervisor_integration import SupervisorWrapper

# Wrap your LangChain agent with supervision
supervised_agent = SupervisorWrapper(
    agent=your_langchain_agent,
    supervisor_client=client,
    monitoring_config={"confidence_threshold": 0.8}
)

# Use normally - supervision happens automatically
result = supervised_agent.run("Analyze the quarterly sales data")
```

### AutoGen Integration
```python
from autogen import Agent
from supervisor_integration import AutoGenSupervisorMixin

class SupervisedAgent(Agent, AutoGenSupervisorMixin):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.setup_supervision(supervisor_client=client)
    
    async def execute_task(self, task):
        # Automatic supervision during execution
        return await self.supervised_execute(task)
```

## API Reference

### Response Formats

All tools return responses in the following format:
```json
{
  "success": true|false,
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {}, 
  "error": "error message if success=false"
}
```

### Error Handling

The system provides detailed error information:
```json
{
  "success": false,
  "error": "Agent not found",
  "error_code": "AGENT_NOT_FOUND",
  "error_details": {
    "agent_id": "invalid_agent",
    "available_agents": ["agent_001", "agent_002"]
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Monitoring Metrics

The system tracks comprehensive metrics:

- **Task Completion Rate**: Percentage of successfully completed tasks
- **Average Confidence Score**: Mean confidence across all decisions
- **Error Frequency**: Errors per hour/day/week
- **Recovery Success Rate**: Percentage of successful automatic recoveries
- **Escalation Rate**: Percentage of issues requiring human intervention
- **Response Time**: Average time to detect and respond to issues
- **Resource Utilization**: CPU, memory, API usage efficiency

## Security & Privacy

- **Data Encryption**: All stored data is encrypted at rest
- **Access Control**: Role-based access to supervision functions
- **Audit Logging**: Complete audit trail of all supervision activities
- **Privacy Protection**: Configurable data retention and anonymization
- **Secure Communication**: TLS encryption for all network communication

## Troubleshooting

### Common Issues

**Server won't start:**
```bash
# Check Python version (3.8+ required)
python3 --version

# Install missing dependencies
pip install -r requirements.txt

# Check port availability
lsof -i :8080
```

**Agent not being monitored:**
```python
# Verify agent registration
result = await client.call("get_supervision_report")
print(result['report']['agents_included'])

# Check monitoring rules
rules = await client.call("get_monitoring_rules", {"agent_id": "your_agent"})
```

**High memory usage:**
```json
{
  "monitoring": {
    "history_limit": 100,
    "snapshot_retention": 10
  },
  "reporting": {
    "max_audit_entries": 1000
  }
}
```

## Contributing

We welcome contributions to improve the Supervisor Agent:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

Please ensure all tests pass and follow the coding standards.

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- GitHub Issues: Report bugs and request features
- Documentation: Comprehensive guides and API reference
- Community: Join discussions and share experiences

---

**The Comprehensive Supervisor Agent provides enterprise-grade agent supervision with monitoring, error handling, and reporting capabilities, ensuring reliable and observable AI agent operations.**