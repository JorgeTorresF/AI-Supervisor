"""Comprehensive examples demonstrating the Error Handling System."""

import asyncio
import logging
from datetime import datetime
from typing import Dict, Any

from .error_handling_system import ErrorHandlingSystem, ErrorType, ErrorSeverity, ErrorContext


# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


class ErrorHandlingExamples:
    """Examples demonstrating various error handling scenarios."""
    
    def __init__(self):
        # Initialize error handling system with custom config
        config = {
            'retry': {
                'max_retries': 3,
                'base_delay': 1.0,
                'backoff_multiplier': 2.0
            },
            'rollback': {
                'max_snapshots': 5,
                'cleanup_after_hours': 12
            },
            'escalation': {
                'max_auto_recovery_attempts': 3,
                'escalation_timeout': 180
            },
            'loop_detection': {
                'max_iterations': 25,
                'similarity_threshold': 0.85
            }
        }
        
        self.error_system = ErrorHandlingSystem(config)
        self.logger = logging.getLogger(__name__)
    
    async def example_1_simple_retry(self):
        """Example 1: Simple retry scenario with validation error."""
        
        print("\n" + "="*60)
        print("EXAMPLE 1: Simple Retry Scenario")
        print("="*60)
        
        # Simulate a validation error
        error = ValueError("Invalid input format: expected JSON but got XML")
        
        context = {
            'agent_id': 'data_processor_01',
            'task_id': 'parse_config_file',
            'input_data': {'format': 'xml', 'content': '<config></config>'},
            'expected_format': 'json'
        }
        
        # Define a recovery callback that might succeed after retry
        retry_count = 0
        async def recovery_callback(adjusted_prompt=None):
            nonlocal retry_count
            retry_count += 1
            
            print(f"  Retry attempt {retry_count}")
            if adjusted_prompt:
                print(f"  Using adjusted prompt: {adjusted_prompt[:100]}...")
            
            # Simulate success on second attempt
            if retry_count >= 2:
                return {'status': 'success', 'data': {'parsed': True}}
            else:
                raise ValueError("Still invalid format")
        
        # Handle the error
        result = await self.error_system.handle_error(error, context, recovery_callback)
        
        print(f"\nRecovery Result:")
        print(f"  Success: {result.get('success', False)}")
        print(f"  Attempts Used: {result.get('attempts_used', 0)}")
        print(f"  Final Status: {result.get('result', {}).get('status', 'unknown')}")
        
        return result
    
    async def example_2_rollback_scenario(self):
        """Example 2: Rollback scenario after multiple failures."""
        
        print("\n" + "="*60)
        print("EXAMPLE 2: Rollback Scenario")
        print("="*60)
        
        agent_id = 'model_trainer_01'
        task_id = 'train_classifier'
        
        # Create a snapshot first
        good_state = {
            'model_version': '1.0.0',
            'training_progress': 0.75,
            'accuracy': 0.94,
            'parameters': {'learning_rate': 0.001, 'batch_size': 32}
        }
        
        snapshot_id = await self.error_system.rollback_system.create_snapshot(
            agent_id=agent_id,
            task_id=task_id,
            state_data=good_state,
            metadata={'checkpoint': 'before_hyperparameter_tuning'}
        )
        
        print(f"Created snapshot: {snapshot_id}")
        
        # Simulate a critical error that requires rollback
        error = RuntimeError("Model training diverged - loss became NaN")
        
        context = {
            'agent_id': agent_id,
            'task_id': task_id,
            'current_state': {
                'model_version': '1.1.0',
                'training_progress': 0.20,
                'accuracy': float('nan'),
                'parameters': {'learning_rate': 0.01, 'batch_size': 64}  # Bad params
            },
            'error_occurred_at': 'hyperparameter_optimization'
        }
        
        # Create error context with multiple failed attempts to trigger rollback
        error_context = ErrorContext(
            error_id='error_123',
            error_type=ErrorType.AGENT_FAILURE,
            severity=ErrorSeverity.HIGH,
            timestamp=datetime.utcnow(),
            agent_id=agent_id,
            task_id=task_id,
            error_message=str(error),
            stack_trace='',
            context_data=context,
            retry_count=3,  # Already tried multiple times
            recovery_attempts=[{'success': False}, {'success': False}]
        )
        
        # Handle the error - should trigger rollback
        result = await self.error_system.recovery_orchestrator.orchestrate_recovery(
            error_context
        )
        
        print(f"\nRollback Result:")
        print(f"  Success: {result.get('success', False)}")
        print(f"  Strategy Used: {[s['strategy'] for s in result.get('executed_strategies', [])]}")
        
        if result.get('success', False):
            # Show the restored state
            snapshots = await self.error_system.rollback_system.get_snapshots(agent_id, task_id, 1)
            if snapshots:
                print(f"  Restored to snapshot: {snapshots[0]['snapshot_id']}")
        
        return result
    
    async def example_3_loop_detection(self):
        """Example 3: Infinite loop detection and circuit breaker."""
        
        print("\n" + "="*60)
        print("EXAMPLE 3: Loop Detection and Circuit Breaker")
        print("="*60)
        
        agent_id = 'web_scraper_01'
        task_id = 'extract_product_data'
        
        # Simulate repetitive errors that indicate a loop
        for i in range(6):  # Exceed the loop threshold
            error = TimeoutError(f"Request timeout while fetching page {i % 3 + 1}")
            
            context = {
                'agent_id': agent_id,
                'task_id': task_id,
                'page_url': f'https://example.com/products/page_{i % 3 + 1}',
                'attempt_number': i + 1
            }
            
            error_context = ErrorContext(
                error_id=f'error_loop_{i}',
                error_type=ErrorType.TIMEOUT_ERROR,
                severity=ErrorSeverity.MEDIUM,
                timestamp=datetime.utcnow(),
                agent_id=agent_id,
                task_id=task_id,
                error_message=str(error),
                stack_trace='',
                context_data=context
            )
            
            # Check for loop - should detect after several iterations
            loop_detected = await self.error_system.loop_detector.check_for_loop(
                error_context,
                {'url': context['page_url'], 'attempt': i + 1}
            )
            
            print(f"  Attempt {i + 1}: Loop detected = {loop_detected}")
            
            if loop_detected:
                print(f"  Circuit breaker triggered for agent {agent_id}")
                break
        
        # Check if agent is paused
        is_paused = await self.error_system.loop_detector.is_agent_paused(agent_id)
        print(f"\nAgent Status:")
        print(f"  Is Paused: {is_paused}")
        
        # Get detected patterns
        patterns = await self.error_system.loop_detector.get_loop_patterns(agent_id)
        print(f"  Detected Patterns: {len(patterns)}")
        
        if patterns:
            pattern = patterns[0]
            print(f"  Pattern Details:")
            print(f"    - Occurrences: {pattern['occurrences']}")
            print(f"    - Actions: {pattern['actions'][:3]}...")  # Show first 3
        
        return {'loop_detected': loop_detected, 'agent_paused': is_paused, 'patterns': len(patterns)}
    
    async def example_4_escalation_workflow(self):
        """Example 4: Escalation workflow for critical errors."""
        
        print("\n" + "="*60)
        print("EXAMPLE 4: Escalation Workflow")
        print("="*60)
        
        # Simulate a critical error that needs human intervention
        error = MemoryError("Out of memory while processing large dataset")
        
        context = {
            'agent_id': 'data_analyst_01',
            'task_id': 'process_financial_data',
            'dataset_size': '50GB',
            'available_memory': '8GB',
            'processing_stage': 'feature_engineering'
        }
        
        error_context = ErrorContext(
            error_id='critical_error_001',
            error_type=ErrorType.RESOURCE_ERROR,
            severity=ErrorSeverity.CRITICAL,
            timestamp=datetime.utcnow(),
            agent_id=context['agent_id'],
            task_id=context['task_id'],
            error_message=str(error),
            stack_trace='',
            context_data=context,
            retry_count=0,
            recovery_attempts=[]
        )
        
        # This should trigger immediate escalation due to critical severity
        result = await self.error_system.recovery_orchestrator.orchestrate_recovery(
            error_context
        )
        
        print(f"\nEscalation Result:")
        print(f"  Success: {result.get('success', False)}")
        
        executed_strategies = result.get('executed_strategies', [])
        if executed_strategies:
            strategy_result = executed_strategies[0]['result']
            if 'escalation_ticket' in strategy_result:
                ticket_id = strategy_result['escalation_ticket']
                print(f"  Escalation Ticket: {ticket_id}")
                
                # Get escalation report
                report = await self.error_system.escalation_system.get_escalation_report(ticket_id)
                if report:
                    print(f"  Error Analysis:")
                    print(f"    - Root Cause: {report['error_analysis']['root_cause']}")
                    print(f"    - Impact Level: {report['error_analysis']['impact_assessment']['impact_level']}")
                    print(f"    - Recommendations: {len(report['recommendations'])} items")
        
        return result
    
    async def example_5_history_tracking(self):
        """Example 5: History tracking and version comparison."""
        
        print("\n" + "="*60)
        print("EXAMPLE 5: History Tracking and Versioning")
        print("="*60)
        
        agent_id = 'content_generator_01'
        task_id = 'generate_article'
        
        # Record initial state
        initial_state = {
            'article_title': 'The Future of AI',
            'word_count': 0,
            'sections': [],
            'status': 'initialized'
        }
        
        version1 = await self.error_system.history_manager.record_state(
            agent_id, task_id, initial_state, {'phase': 'initialization'}
        )
        print(f"Recorded initial state: {version1}")
        
        # Record after some progress
        progress_state = {
            'article_title': 'The Future of AI',
            'word_count': 250,
            'sections': ['Introduction', 'Current State'],
            'status': 'in_progress'
        }
        
        version2 = await self.error_system.history_manager.record_state(
            agent_id, task_id, progress_state, {'phase': 'content_creation'}
        )
        print(f"Recorded progress state: {version2}")
        
        # Record an error
        error = ValueError("Invalid section format detected")
        error_context = ErrorContext(
            error_id='format_error_001',
            error_type=ErrorType.VALIDATION_ERROR,
            severity=ErrorSeverity.MEDIUM,
            timestamp=datetime.utcnow(),
            agent_id=agent_id,
            task_id=task_id,
            error_message=str(error),
            stack_trace='',
            context_data={'invalid_section': 'Bad Format Section'}
        )
        
        await self.error_system.history_manager.record_error(error_context)
        print(f"Recorded error: {error_context.error_id}")
        
        # Record an intervention
        before_intervention = progress_state.copy()
        after_intervention = {
            'article_title': 'The Future of AI',
            'word_count': 300,
            'sections': ['Introduction', 'Current State', 'Future Trends'],
            'status': 'recovered'
        }
        
        intervention_id = await self.error_system.history_manager.record_intervention(
            agent_id, task_id, 'manual_fix',
            before_intervention, after_intervention,
            {'operator': 'system', 'fix_type': 'section_format_correction'}
        )
        print(f"Recorded intervention: {intervention_id}")
        
        # Get history
        history = await self.error_system.history_manager.get_history(agent_id, task_id, limit=10)
        print(f"\nHistory Summary:")
        print(f"  Total Entries: {len(history)}")
        
        for entry in history:
            print(f"    - {entry['entry_type']}: {entry['version']} at {entry['timestamp']}")
        
        # Get version history
        versions = await self.error_system.history_manager.get_version_history(agent_id, task_id)
        print(f"  Total Versions: {len(versions)}")
        
        # Compare versions if we have at least 2
        if len(versions) >= 2:
            comparison = await self.error_system.history_manager.compare_versions(
                agent_id, task_id, versions[0]['version'], versions[-1]['version']
            )
            
            print(f"\nVersion Comparison:")
            print(f"  Changes: {comparison['diff']['total_changes']}")
            print(f"  Additions: {comparison['diff']['additions']}")
            print(f"  Deletions: {comparison['diff']['deletions']}")
        
        return {
            'history_entries': len(history),
            'versions': len(versions),
            'interventions': 1
        }
    
    async def example_6_system_health_monitoring(self):
        """Example 6: System health monitoring and status reporting."""
        
        print("\n" + "="*60)
        print("EXAMPLE 6: System Health Monitoring")
        print("="*60)
        
        # Get overall system health
        health = await self.error_system.get_system_health()
        
        print(f"System Health Report:")
        print(f"  Active Errors: {health['active_errors']}")
        print(f"  Total Errors Handled: {health['stats']['total_errors']}")
        print(f"  Successful Recoveries: {health['stats']['successful_recoveries']}")
        print(f"  Failed Recoveries: {health['stats']['failed_recoveries']}")
        print(f"  Escalations: {health['stats']['escalations']}")
        
        print(f"\nSubsystem Status:")
        for subsystem, status in health['subsystem_status'].items():
            print(f"  {subsystem}:")
            if isinstance(status, dict):
                for key, value in status.items():
                    if key in ['active_retries', 'cached_snapshots', 'active_tickets', 'paused_agents', 'cached_entries']:
                        print(f"    - {key}: {value}")
        
        # Process any pending escalations
        processed = await self.error_system.escalation_system.process_escalation_queue()
        print(f"\nProcessed Escalations: {len(processed)}")
        
        return health
    
    async def run_all_examples(self):
        """Run all examples in sequence."""
        
        print("\n" + "="*80)
        print("COMPREHENSIVE ERROR HANDLING SYSTEM EXAMPLES")
        print("="*80)
        
        results = {}
        
        try:
            # Example 1: Simple retry
            results['retry'] = await self.example_1_simple_retry()
            
            # Example 2: Rollback scenario
            results['rollback'] = await self.example_2_rollback_scenario()
            
            # Example 3: Loop detection
            results['loop_detection'] = await self.example_3_loop_detection()
            
            # Example 4: Escalation
            results['escalation'] = await self.example_4_escalation_workflow()
            
            # Example 5: History tracking
            results['history'] = await self.example_5_history_tracking()
            
            # Example 6: System monitoring
            results['monitoring'] = await self.example_6_system_health_monitoring()
            
        except Exception as e:
            print(f"\nExample execution failed: {str(e)}")
            results['error'] = str(e)
        
        finally:
            # Shutdown the system
            print("\n" + "="*60)
            print("SHUTTING DOWN ERROR HANDLING SYSTEM")
            print("="*60)
            
            await self.error_system.shutdown()
            print("System shutdown complete.")
        
        return results


async def main():
    """Main function to run all examples."""
    examples = ErrorHandlingExamples()
    results = await examples.run_all_examples()
    
    print("\n" + "="*80)
    print("EXAMPLES COMPLETED")
    print("="*80)
    print("Results summary:")
    for example, result in results.items():
        if isinstance(result, dict) and 'success' in result:
            print(f"  {example}: {'✓' if result['success'] else '✗'}")
        else:
            print(f"  {example}: completed")


if __name__ == '__main__':
    asyncio.run(main())
