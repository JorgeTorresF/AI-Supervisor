"""Auto-Retry System with progressive strategies and intelligent retry logic."""

import asyncio
import logging
import time
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass
import json


class RetryStrategy(Enum):
    """Retry strategies for different error types."""
    EXPONENTIAL_BACKOFF = "exponential_backoff"
    LINEAR_BACKOFF = "linear_backoff"
    FIXED_DELAY = "fixed_delay"
    IMMEDIATE = "immediate"
    ADAPTIVE = "adaptive"


class PromptAdjustmentType(Enum):
    """Types of prompt adjustments for retries."""
    ADD_CONTEXT = "add_context"
    SIMPLIFY = "simplify"
    REPHRASE = "rephrase"
    ADD_EXAMPLES = "add_examples"
    INCREASE_SPECIFICITY = "increase_specificity"
    CHANGE_APPROACH = "change_approach"


@dataclass
class RetryContext:
    """Context for a retry operation."""
    attempt: int
    max_attempts: int
    last_error: str
    strategy: RetryStrategy
    delay: float
    prompt_adjustments: List[PromptAdjustmentType]
    adjusted_prompt: Optional[str] = None
    metadata: Dict[str, Any] = None


class AutoRetrySystem:
    """Auto-retry system with progressive strategies and intelligent adjustments."""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or self._default_config()
        self.logger = logging.getLogger(__name__)
        
        # Active retry operations
        self.active_retries: Dict[str, RetryContext] = {}
        
        # Retry statistics
        self.stats = {
            'total_retries': 0,
            'successful_retries': 0,
            'failed_retries': 0,
            'strategy_usage': {strategy.value: 0 for strategy in RetryStrategy}
        }
    
    def _default_config(self) -> Dict[str, Any]:
        """Default configuration for auto-retry system."""
        return {
            'max_retries': 3,
            'base_delay': 1.0,
            'max_delay': 30.0,
            'backoff_multiplier': 2.0,
            'strategy_mapping': {
                'timeout_error': RetryStrategy.EXPONENTIAL_BACKOFF.value,
                'communication_error': RetryStrategy.EXPONENTIAL_BACKOFF.value,
                'validation_error': RetryStrategy.LINEAR_BACKOFF.value,
                'tool_failure': RetryStrategy.ADAPTIVE.value,
                'agent_failure': RetryStrategy.ADAPTIVE.value,
                'unknown_error': RetryStrategy.LINEAR_BACKOFF.value
            },
            'prompt_adjustments': {
                'attempt_1': [PromptAdjustmentType.ADD_CONTEXT.value],
                'attempt_2': [PromptAdjustmentType.REPHRASE.value, PromptAdjustmentType.SIMPLIFY.value],
                'attempt_3': [PromptAdjustmentType.CHANGE_APPROACH.value, PromptAdjustmentType.ADD_EXAMPLES.value]
            },
            'adaptive_learning': True,
            'success_rate_threshold': 0.3
        }
    
    async def should_retry(
        self,
        error_context: 'ErrorContext',
        current_attempt: int = 0
    ) -> bool:
        """Determine if an error should be retried."""
        
        # Check maximum retry attempts
        if current_attempt >= self.config['max_retries']:
            self.logger.info(f"Max retries ({self.config['max_retries']}) reached for {error_context.error_id}")
            return False
        
        # Check error type retry eligibility
        non_retryable_errors = [
            'infinite_loop',
            'configuration_error',
            'permission_error'
        ]
        
        if error_context.error_type.value in non_retryable_errors:
            self.logger.info(f"Error type {error_context.error_type.value} is not retryable")
            return False
        
        # Check success rate for adaptive learning
        if self.config.get('adaptive_learning', False):
            success_rate = self._calculate_success_rate(error_context.error_type)
            if success_rate < self.config.get('success_rate_threshold', 0.3):
                self.logger.info(f"Success rate too low ({success_rate}) for retry")
                return False
        
        return True
    
    async def execute_retry(
        self,
        error_context: 'ErrorContext',
        retry_callback: Callable,
        original_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """Execute a retry with progressive strategy and prompt adjustment."""
        
        retry_id = f"{error_context.error_id}_retry_{error_context.retry_count + 1}"
        
        # Determine retry strategy
        strategy = self._get_retry_strategy(error_context)
        
        # Calculate delay
        delay = self._calculate_delay(strategy, error_context.retry_count)
        
        # Get prompt adjustments
        adjustments = self._get_prompt_adjustments(error_context.retry_count + 1)
        
        # Create retry context
        retry_context = RetryContext(
            attempt=error_context.retry_count + 1,
            max_attempts=self.config['max_retries'],
            last_error=error_context.error_message,
            strategy=strategy,
            delay=delay,
            prompt_adjustments=adjustments,
            metadata={
                'error_type': error_context.error_type.value,
                'severity': error_context.severity.value,
                'timestamp': datetime.utcnow().isoformat()
            }
        )
        
        # Adjust prompt if provided
        if original_prompt:
            retry_context.adjusted_prompt = self._adjust_prompt(
                original_prompt, adjustments, error_context
            )
        
        self.active_retries[retry_id] = retry_context
        
        self.logger.info(
            f"Starting retry {retry_context.attempt}/{retry_context.max_attempts} "
            f"for {error_context.error_id} with strategy {strategy.value} and delay {delay}s"
        )
        
        # Wait for delay
        if delay > 0:
            await asyncio.sleep(delay)
        
        try:
            # Execute retry
            if retry_context.adjusted_prompt:
                result = await retry_callback(retry_context.adjusted_prompt)
            else:
                result = await retry_callback()
            
            # Success
            self.stats['successful_retries'] += 1
            self.stats['strategy_usage'][strategy.value] += 1
            self.active_retries.pop(retry_id, None)
            
            self.logger.info(f"Retry {retry_id} successful")
            
            return {
                'success': True,
                'result': result,
                'retry_context': retry_context,
                'attempts_used': retry_context.attempt
            }
            
        except Exception as e:
            # Retry failed
            self.stats['failed_retries'] += 1
            self.active_retries.pop(retry_id, None)
            
            self.logger.error(f"Retry {retry_id} failed: {str(e)}")
            
            return {
                'success': False,
                'error': str(e),
                'retry_context': retry_context,
                'attempts_used': retry_context.attempt
            }
        
        finally:
            self.stats['total_retries'] += 1
    
    def _get_retry_strategy(self, error_context: 'ErrorContext') -> RetryStrategy:
        """Determine the retry strategy based on error context."""
        strategy_name = self.config['strategy_mapping'].get(
            error_context.error_type.value,
            RetryStrategy.LINEAR_BACKOFF.value
        )
        
        return RetryStrategy(strategy_name)
    
    def _calculate_delay(self, strategy: RetryStrategy, attempt: int) -> float:
        """Calculate retry delay based on strategy and attempt number."""
        base_delay = self.config['base_delay']
        max_delay = self.config['max_delay']
        multiplier = self.config['backoff_multiplier']
        
        if strategy == RetryStrategy.IMMEDIATE:
            return 0
        elif strategy == RetryStrategy.FIXED_DELAY:
            return min(base_delay, max_delay)
        elif strategy == RetryStrategy.LINEAR_BACKOFF:
            return min(base_delay * (attempt + 1), max_delay)
        elif strategy == RetryStrategy.EXPONENTIAL_BACKOFF:
            return min(base_delay * (multiplier ** attempt), max_delay)
        elif strategy == RetryStrategy.ADAPTIVE:
            # Adaptive strategy considers recent success rates
            success_rate = self._calculate_recent_success_rate()
            adaptive_multiplier = 1.0 + (1.0 - success_rate)
            return min(base_delay * adaptive_multiplier * (attempt + 1), max_delay)
        
        return base_delay
    
    def _get_prompt_adjustments(self, attempt: int) -> List[PromptAdjustmentType]:
        """Get prompt adjustments for the given attempt number."""
        attempt_key = f'attempt_{attempt}'
        adjustment_names = self.config['prompt_adjustments'].get(
            attempt_key,
            [PromptAdjustmentType.ADD_CONTEXT.value]
        )
        
        return [PromptAdjustmentType(name) for name in adjustment_names]
    
    def _adjust_prompt(
        self,
        original_prompt: str,
        adjustments: List[PromptAdjustmentType],
        error_context: 'ErrorContext'
    ) -> str:
        """Apply prompt adjustments based on retry strategy."""
        
        adjusted_prompt = original_prompt
        
        for adjustment in adjustments:
            if adjustment == PromptAdjustmentType.ADD_CONTEXT:
                adjusted_prompt = self._add_context_to_prompt(
                    adjusted_prompt, error_context
                )
            elif adjustment == PromptAdjustmentType.SIMPLIFY:
                adjusted_prompt = self._simplify_prompt(adjusted_prompt)
            elif adjustment == PromptAdjustmentType.REPHRASE:
                adjusted_prompt = self._rephrase_prompt(adjusted_prompt)
            elif adjustment == PromptAdjustmentType.ADD_EXAMPLES:
                adjusted_prompt = self._add_examples_to_prompt(adjusted_prompt)
            elif adjustment == PromptAdjustmentType.INCREASE_SPECIFICITY:
                adjusted_prompt = self._increase_prompt_specificity(adjusted_prompt)
            elif adjustment == PromptAdjustmentType.CHANGE_APPROACH:
                adjusted_prompt = self._change_prompt_approach(
                    adjusted_prompt, error_context
                )
        
        return adjusted_prompt
    
    def _add_context_to_prompt(self, prompt: str, error_context: 'ErrorContext') -> str:
        """Add error context to the prompt."""
        context_addition = f"\n\nNote: The previous attempt failed with error: {error_context.error_message}. Please consider this when formulating your response."
        return prompt + context_addition
    
    def _simplify_prompt(self, prompt: str) -> str:
        """Simplify the prompt by breaking it down."""
        simplification = "\n\nPlease focus on the core requirement and provide a simpler, more direct approach."
        return prompt + simplification
    
    def _rephrase_prompt(self, prompt: str) -> str:
        """Rephrase the prompt for clarity."""
        rephrase_prefix = "Let me rephrase this request more clearly: "
        return rephrase_prefix + prompt
    
    def _add_examples_to_prompt(self, prompt: str) -> str:
        """Add examples to the prompt."""
        examples_addition = "\n\nPlease provide concrete examples in your response to illustrate the solution."
        return prompt + examples_addition
    
    def _increase_prompt_specificity(self, prompt: str) -> str:
        """Make the prompt more specific."""
        specificity_addition = "\n\nPlease be very specific in your response, including detailed steps and exact parameters."
        return prompt + specificity_addition
    
    def _change_prompt_approach(self, prompt: str, error_context: 'ErrorContext') -> str:
        """Change the approach based on error type."""
        approach_change = "\n\nGiven the previous failure, please try a different approach or methodology to solve this problem."
        return prompt + approach_change
    
    def _calculate_success_rate(self, error_type: 'ErrorType') -> float:
        """Calculate success rate for a specific error type."""
        # This would typically query historical data
        # For now, return a reasonable default
        return 0.7
    
    def _calculate_recent_success_rate(self) -> float:
        """Calculate recent overall success rate."""
        total = self.stats['successful_retries'] + self.stats['failed_retries']
        if total == 0:
            return 1.0
        return self.stats['successful_retries'] / total
    
    async def get_status(self) -> Dict[str, Any]:
        """Get status of the auto-retry system."""
        return {
            'active_retries': len(self.active_retries),
            'stats': self.stats,
            'config': self.config,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    async def shutdown(self):
        """Shutdown the auto-retry system."""
        self.logger.info("Shutting down auto-retry system")
        self.active_retries.clear()
        self.logger.info("Auto-retry system shutdown complete")
