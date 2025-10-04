#!/usr/bin/env python3
"""
Usage Examples for Supervisor Agent MCP Server

Demonstrates how to use all 10 tools provided by the supervisor agent.
"""

import asyncio
import json
from datetime import datetime, timedelta

# Mock MCP client for demonstration
class MockMCPClient:
    def __init__(self, server_name):
        self.server_name = server_name
    
    async def call(self, tool_name, parameters):
        # This would normally connect to the actual MCP server
        print(f"Calling {tool_name} with parameters: {json.dumps(parameters, indent=2)}")
        
        # Mock responses for demonstration
        mock_responses = {
            "monitor_agent": {
                "success": True,
                "session_id": "session_12345",
                "agent_id": parameters.get("agent_id"),
                "monitoring_active": True,
                "timestamp": datetime.now().isoformat()
            },
            "set_monitoring_rules": {
                "success": True,
                "agent_id": parameters.get("agent_id"),
                "rules_applied": parameters.get("rules"),
                "active_monitoring": True,
                "timestamp": datetime.now().isoformat()
            },
            "get_supervision_report": {
                "success": True,
                "report": {
                    "report_id": "report_67890",
                    "generated_at": datetime.now().isoformat(),
                    "time_range": parameters.get("time_range", "1h"),
                    "summary": {
                        "total_agents": 3,
                        "active_sessions": 2,
                        "total_interventions": 1,
                        "successful_recoveries": 5,
                        "escalated_issues": 0
                    },
                    "alerts": [],
                    "recommendations": ["System operating within normal parameters"]
                },
                "timestamp": datetime.now().isoformat()
            }
        }
        
        return mock_responses.get(tool_name, {"success": True, "message": "Mock response"})

async def demonstrate_supervisor_tools():
    """
    Demonstrate all 10 supervisor tools with practical examples
    """
    
    print("=" * 80)
    print("SUPERVISOR AGENT MCP SERVER - USAGE EXAMPLES")
    print("=" * 80)
    
    # Initialize mock client (replace with actual MCP client)
    client = MockMCPClient("supervisor-agent")
    
    # 1. Monitor Agent
    print("\n1. MONITOR AGENT")
    print("-" * 40)
    
    monitor_result = await client.call("monitor_agent", {
        "agent_id": "data_processor_01",
        "task_config": {
            "objectives": [
                "Process customer survey data",
                "Generate sentiment analysis report",
                "Create data visualization dashboard"
            ],
            "constraints": {
                "max_time": 3600,  # 1 hour
                "memory_limit": "2GB",
                "accuracy_required": 0.95
            },
            "expected_outputs": [
                "processed_survey_data.json",
                "sentiment_report.md", 
                "dashboard.html"
            ],
            "quality_requirements": {
                "completeness": 0.9,
                "format_compliance": 0.95,
                "content_accuracy": 0.9
            }
        }
    })
    
    print(f"Monitoring started for agent: {monitor_result['agent_id']}")
    print(f"Session ID: {monitor_result['session_id']}")
    
    # 2. Set Monitoring Rules
    print("\n2. SET MONITORING RULES")
    print("-" * 40)
    
    rules_result = await client.call("set_monitoring_rules", {
        "agent_id": "data_processor_01",
        "rules": {
            "confidence_threshold": 0.8,
            "quality_threshold": 0.85,
            "error_tolerance": 2,
            "response_time_limit": 300,  # 5 minutes
            "resource_limits": {
                "max_cpu_usage": 0.8,
                "max_memory_usage": 0.9
            },
            "alert_on_low_confidence": True,
            "auto_intervention_enabled": True,
            "escalation_triggers": {
                "consecutive_failures": 3,
                "low_confidence_duration": 600  # 10 minutes
            }
        }
    })
    
    print(f"Monitoring rules configured for agent: {rules_result['agent_id']}")
    
    # 3. Get Supervision Report
    print("\n3. GET SUPERVISION REPORT")
    print("-" * 40)
    
    report_result = await client.call("get_supervision_report", {
        "agent_id": "data_processor_01",
        "time_range": "24h"
    })
    
    report = report_result['report']
    print(f"Report ID: {report['report_id']}")
    print(f"Time Range: {report['time_range']}")
    print(f"Summary: {json.dumps(report['summary'], indent=2)}")
    
    # 4. Intervene Task
    print("\n4. INTERVENE TASK")
    print("-" * 40)
    
    # Example: Pause agent due to quality concerns
    intervention_result = await client.call("intervene_task", {
        "agent_id": "data_processor_01",
        "intervention_type": "pause",
        "parameters": {
            "reason": "Quality score below threshold detected",
            "pause_duration": 300,  # 5 minutes
            "next_action": "review_and_adjust"
        }
    })
    
    print(f"Intervention executed: {intervention_result.get('intervention_id')}")
    
    # Example: Redirect agent to focus on specific task
    redirect_result = await client.call("intervene_task", {
        "agent_id": "data_processor_01", 
        "intervention_type": "redirect",
        "parameters": {
            "new_objective": "Focus on data validation and cleaning first",
            "priority_adjustment": "high",
            "resource_reallocation": {
                "increase_memory": "1GB",
                "reduce_concurrent_tasks": 2
            }
        }
    })
    
    print(f"Redirection completed: {redirect_result.get('success')}")
    
    # 5. Validate Output
    print("\n5. VALIDATE OUTPUT")
    print("-" * 40)
    
    validation_result = await client.call("validate_output", {
        "agent_id": "data_processor_01",
        "output_data": {
            "survey_responses_processed": 1250,
            "sentiment_scores": {
                "positive": 0.45,
                "neutral": 0.32,
                "negative": 0.23
            },
            "confidence_score": 0.87,
            "processing_time": 425.6,
            "data_quality_metrics": {
                "completeness": 0.94,
                "consistency": 0.91,
                "accuracy": 0.89
            }
        },
        "validation_criteria": {
            "completeness_required": True,
            "min_samples_processed": 1000,
            "format_validation": True,
            "quality_threshold": 0.85,
            "confidence_threshold": 0.8,
            "required_fields": [
                "survey_responses_processed",
                "sentiment_scores",
                "confidence_score"
            ]
        }
    })
    
    validation = validation_result.get('validation', {})
    print(f"Validation ID: {validation.get('validation_id')}")
    print(f"Overall Valid: {validation.get('overall_valid')}")
    print(f"Quality Scores: {json.dumps(validation.get('scores', {}), indent=2)}")
    
    # 6. Get Audit Log
    print("\n6. GET AUDIT LOG")
    print("-" * 40)
    
    # Get all audit entries for the agent in the last hour
    audit_result = await client.call("get_audit_log", {
        "agent_id": "data_processor_01",
        "start_time": (datetime.now() - timedelta(hours=1)).isoformat(),
        "end_time": datetime.now().isoformat()
    })
    
    print(f"Found {audit_result.get('entry_count', 0)} audit entries")
    
    # Get specific event types
    intervention_audit = await client.call("get_audit_log", {
        "event_type": "intervention",
        "start_time": (datetime.now() - timedelta(hours=24)).isoformat()
    })
    
    print(f"Intervention events in last 24h: {intervention_audit.get('entry_count', 0)}")
    
    # 7. Configure Escalation
    print("\n7. CONFIGURE ESCALATION")
    print("-" * 40)
    
    escalation_result = await client.call("configure_escalation", {
        "agent_id": "data_processor_01",
        "escalation_config": {
            "confidence_threshold": 0.6,
            "error_count_threshold": 3,
            "quality_threshold": 0.7,
            "escalation_contacts": [
                "supervisor@company.com",
                "ai-ops@company.com"
            ],
            "escalation_procedures": [
                "notify",
                "pause_agent", 
                "create_ticket",
                "manual_review"
            ],
            "auto_escalation_enabled": True,
            "escalation_timeout": 1800,  # 30 minutes
            "priority_levels": {
                "low": {"response_time": 3600},
                "medium": {"response_time": 1800},
                "high": {"response_time": 600},
                "critical": {"response_time": 300}
            }
        }
    })
    
    print(f"Escalation configured for agent: {escalation_result.get('agent_id')}")
    print(f"Auto-escalation enabled: {escalation_result.get('auto_escalation_enabled')}")
    
    # 8. Knowledge Base Update
    print("\n8. KNOWLEDGE BASE UPDATE")
    print("-" * 40)
    
    # Add a best practice
    kb_update1 = await client.call("knowledge_base_update", {
        "update_type": "best_practice",
        "data": {
            "title": "Effective Data Processing Supervision",
            "description": "Monitor memory usage closely during large dataset processing",
            "applicable_scenarios": [
                "batch_data_processing",
                "large_dataset_analysis", 
                "memory_intensive_tasks"
            ],
            "recommended_actions": [
                "Set memory usage alerts at 80%",
                "Implement data chunking for large datasets",
                "Monitor processing time vs dataset size ratio"
            ],
            "success_metrics": {
                "memory_efficiency": "> 0.85",
                "processing_time_reduction": "> 0.2",
                "error_rate_reduction": "> 0.5"
            }
        },
        "category": "data_processing"
    })
    
    # Add a detected pattern
    kb_update2 = await client.call("knowledge_base_update", {
        "update_type": "pattern",
        "data": {
            "pattern_name": "Confidence Drop During Complex Analysis",
            "description": "Agent confidence tends to drop when processing unstructured text data",
            "indicators": [
                "confidence_score < 0.7",
                "text_processing_task = true",
                "data_structure = unstructured"
            ],
            "frequency": "high",
            "impact": "medium",
            "recommended_interventions": [
                "Provide additional context or examples",
                "Break down complex text into smaller chunks",
                "Use specialized NLP preprocessing"
            ]
        },
        "category": "pattern_recognition"
    })
    
    print(f"Best practice added: {kb_update1.get('update_id')}")
    print(f"Pattern recorded: {kb_update2.get('update_id')}")
    
    # 9. Rollback State
    print("\n9. ROLLBACK STATE")
    print("-" * 40)
    
    # Rollback to specific snapshot
    rollback_result1 = await client.call("rollback_state", {
        "agent_id": "data_processor_01",
        "snapshot_id": "snapshot_abc123"
    })
    
    print(f"Rollback to snapshot: {rollback_result1.get('success')}")
    
    # Rollback by number of steps
    rollback_result2 = await client.call("rollback_state", {
        "agent_id": "data_processor_01",
        "rollback_steps": 3
    })
    
    print(f"Rollback 3 steps: {rollback_result2.get('success')}")
    print(f"Restored snapshot: {rollback_result2.get('restored_snapshot_id')}")
    
    # 10. Generate Summary
    print("\n10. GENERATE SUMMARY")
    print("-" * 40)
    
    # Overview summary
    overview_summary = await client.call("generate_summary", {
        "summary_type": "overview",
        "time_range": "24h",
        "include_recommendations": True
    })
    
    summary = overview_summary.get('summary', {})
    print(f"Overview Summary ID: {summary.get('summary_id')}")
    print(f"Time Range: {summary.get('time_range')}")
    
    if 'supervised_agents' in summary:
        agents_info = summary['supervised_agents']
        print(f"Supervised Agents: {agents_info.get('total', 0)} total, {agents_info.get('active', 0)} active")
    
    # Performance summary
    performance_summary = await client.call("generate_summary", {
        "summary_type": "performance", 
        "time_range": "7d",
        "include_recommendations": True
    })
    
    perf_summary = performance_summary.get('summary', {})
    print(f"\nPerformance Summary (7 days):")
    if 'performance_metrics' in perf_summary:
        metrics = perf_summary['performance_metrics']
        print(f"  Success Rate: {metrics.get('success_rate', 0):.2%}")
        print(f"  Total Evaluations: {metrics.get('total_evaluations', 0)}")
        print(f"  Total Interventions: {metrics.get('total_interventions', 0)}")
    
    # Issues summary
    issues_summary = await client.call("generate_summary", {
        "summary_type": "issues",
        "time_range": "24h",
        "include_recommendations": True
    })
    
    issues = issues_summary.get('summary', {})
    print(f"\nIssues Summary (24h):")
    if 'issues_summary' in issues:
        issue_info = issues['issues_summary']
        print(f"  Total Issues: {issue_info.get('total_issues', 0)}")
        print(f"  Critical Issues: {issue_info.get('critical_issues', 0)}")
        print(f"  Resolved Issues: {issue_info.get('resolved_issues', 0)}")
    
    # Show recommendations if available
    recommendations = summary.get('recommendations', [])
    if recommendations:
        print(f"\nRecommendations:")
        for i, rec in enumerate(recommendations, 1):
            print(f"  {i}. {rec}")
    
    print("\n" + "=" * 80)
    print("SUPERVISOR AGENT DEMONSTRATION COMPLETED")
    print("=" * 80)
    print("\nAll 10 tools demonstrated successfully!")
    print("\nNext Steps:")
    print("- Replace MockMCPClient with actual MCP client")
    print("- Configure real agents for supervision")
    print("- Set up monitoring dashboards")
    print("- Configure alerting and escalation procedures")
    print("- Integrate with your AI agent frameworks")

# Additional integration examples

async def integration_examples():
    """
    Show how to integrate with different frameworks
    """
    
    print("\n" + "=" * 80)
    print("FRAMEWORK INTEGRATION EXAMPLES")
    print("=" * 80)
    
    # LangChain Integration Example
    print("\n1. LANGCHAIN INTEGRATION")
    print("-" * 40)
    
    langchain_example = """
    from langchain.agents import AgentExecutor
    from supervisor_integration import SupervisorWrapper
    
    # Wrap your existing LangChain agent
    supervised_agent = SupervisorWrapper(
        agent=your_existing_langchain_agent,
        supervisor_config={
            "confidence_threshold": 0.8,
            "auto_intervention": True,
            "escalation_enabled": True
        }
    )
    
    # Use normally - supervision happens automatically
    result = await supervised_agent.arun(
        "Analyze the quarterly sales data and provide insights"
    )
    """
    print(langchain_example)
    
    # AutoGen Integration Example
    print("\n2. AUTOGEN INTEGRATION")
    print("-" * 40)
    
    autogen_example = """
    from autogen import ConversableAgent
    from supervisor_integration import AutoGenSupervisorMixin
    
    class SupervisedAgent(ConversableAgent, AutoGenSupervisorMixin):
        def __init__(self, name, **kwargs):
            super().__init__(name, **kwargs)
            self.setup_supervision(
                agent_id=name,
                monitoring_rules={
                    "confidence_threshold": 0.75,
                    "quality_threshold": 0.8
                }
            )
        
        async def generate_reply(self, messages, sender, exclude):
            # Supervised reply generation
            return await self.supervised_generate_reply(
                messages, sender, exclude
            )
    
    # Create supervised agents
    analyst = SupervisedAgent("data_analyst")
    reviewer = SupervisedAgent("quality_reviewer")
    """
    print(autogen_example)
    
    # Custom Framework Integration
    print("\n3. CUSTOM FRAMEWORK INTEGRATION")
    print("-" * 40)
    
    custom_example = """
    from supervisor_client import SupervisorMCPClient
    
    class SupervisedCustomAgent:
        def __init__(self, agent_id):
            self.agent_id = agent_id
            self.supervisor = SupervisorMCPClient()
            
            # Start supervision
            asyncio.create_task(self.supervisor.monitor_agent(
                agent_id=self.agent_id,
                task_config=self.get_task_config()
            ))
        
        async def execute_task(self, task):
            try:
                # Execute your task
                result = await self.process_task(task)
                
                # Validate output
                validation = await self.supervisor.validate_output(
                    agent_id=self.agent_id,
                    output_data=result,
                    validation_criteria=self.get_validation_criteria()
                )
                
                if not validation['validation']['overall_valid']:
                    # Handle validation failure
                    await self.supervisor.intervene_task(
                        agent_id=self.agent_id,
                        intervention_type="adjust",
                        parameters={"reason": "Output validation failed"}
                    )
                
                return result
                
            except Exception as e:
                # Let supervisor handle the error
                await self.supervisor.handle_error(
                    agent_id=self.agent_id,
                    error=e,
                    context={"task": task}
                )
                raise
    """
    print(custom_example)

if __name__ == "__main__":
    # Run the demonstration
    asyncio.run(demonstrate_supervisor_tools())
    asyncio.run(integration_examples())
