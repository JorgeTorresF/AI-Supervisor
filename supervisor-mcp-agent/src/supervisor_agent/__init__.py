from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any, Union, Literal
from datetime import datetime
from enum import Enum
from pydantic import BaseModel


class InterventionLevel(Enum):
    """Intervention levels for the tiered response system"""
    WARNING = "warning"
    CORRECTION = "correction"
    ESCALATION = "escalation"


class TaskStatus(Enum):
    """Status of monitored tasks"""
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    ESCALATED = "escalated"


class ConfidenceLevel(Enum):
    """Confidence levels for supervisor decisions"""
    LOW = "low"  # < 60%
    MEDIUM = "medium"  # 60-80%
    HIGH = "high"  # > 80%


@dataclass
class ResourceUsage:
    """Resource usage tracking"""
    token_count: int = 0
    loop_cycles: int = 0
    runtime_seconds: float = 0.0
    memory_usage_mb: float = 0.0
    api_calls: int = 0
    error_count: int = 0


@dataclass
class QualityMetrics:
    """Quality assessment metrics"""
    structure_score: float = 0.0  # JSON/Markdown validity
    coherence_score: float = 0.0  # Logical consistency
    instruction_adherence: float = 0.0  # Following user instructions
    completeness_score: float = 0.0  # Task completion level
    confidence_score: float = 0.0  # Overall confidence


@dataclass
class MonitoringRules:
    """Configuration for monitoring behavior"""
    max_token_threshold: int = 10000
    max_loop_cycles: int = 50
    max_runtime_minutes: float = 30.0
    quality_threshold: float = 0.7
    auto_correct_threshold: float = 0.8
    escalation_threshold: float = 0.5
    enable_auto_retry: bool = True
    max_retries: int = 3
    enable_learning: bool = True
    enable_rollback: bool = True


@dataclass
class AgentTask:
    """Represents a monitored agent task"""
    task_id: str
    agent_name: str
    framework: str  # "mcp", "langchain", "autogen", "custom"
    original_input: str
    instructions: List[str]
    status: TaskStatus
    created_at: datetime
    updated_at: datetime
    resource_usage: ResourceUsage = field(default_factory=ResourceUsage)
    quality_metrics: QualityMetrics = field(default_factory=QualityMetrics)
    outputs: List[Dict[str, Any]] = field(default_factory=list)
    interventions: List[Dict[str, Any]] = field(default_factory=list)
    audit_trail: List[Dict[str, Any]] = field(default_factory=list)
    last_known_good_state: Optional[Dict[str, Any]] = None


@dataclass
class SupervisionReport:
    """Comprehensive supervision report"""
    report_id: str
    generated_at: datetime
    tasks_monitored: int
    total_interventions: int
    interventions_by_level: Dict[InterventionLevel, int]
    quality_trends: Dict[str, float]
    common_failures: List[Dict[str, Any]]
    recommendations: List[str]
    confidence_distribution: Dict[ConfidenceLevel, int]


@dataclass
class EscalationConfig:
    """Configuration for escalation rules"""
    notification_channels: List[str] = field(default_factory=list)
    escalation_triggers: List[str] = field(default_factory=list)
    auto_pause_on_escalation: bool = True
    require_human_approval: bool = True
    escalation_timeout_minutes: int = 60


@dataclass
class KnowledgeBaseEntry:
    """Entry in the failure knowledge base"""
    pattern_id: str
    pattern_description: str
    failure_type: str
    common_causes: List[str]
    suggested_fixes: List[str]
    confidence_score: float
    occurrences: int
    last_seen: datetime


class SupervisorError(Exception):
    """Base exception for supervisor operations"""
    pass


class InterventionRequired(SupervisorError):
    """Exception raised when intervention is required"""
    def __init__(self, level: InterventionLevel, reason: str, confidence: float):
        self.level = level
        self.reason = reason
        self.confidence = confidence
        super().__init__(f"{level.value}: {reason} (confidence: {confidence:.2f})")