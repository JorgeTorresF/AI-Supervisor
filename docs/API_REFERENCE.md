# Enhanced Supervisor Agent - Technical API Reference

## Table of Contents
1. [WebSocket API](#websocket-api)
2. [Task Coherence Engine API](#task-coherence-engine-api)
3. [Browser Integration API](#browser-integration-api)
4. [Configuration API](#configuration-api)
5. [Monitoring and Reporting API](#monitoring-and-reporting-api)
6. [Error Handling](#error-handling)
7. [Data Models](#data-models)

---

## WebSocket API

### Connection
```
ws://localhost:8765
```

### Authentication Flow

1. **Initial Connection**
   ```json
   {
     "type": "AUTH_REQUEST",
     "id": "req-123",
     "extension_id": "browser-extension-id",
     "challenge": "random-challenge-string",
     "signature": "hmac-sha256-signature"
   }
   ```

2. **Authentication Response**
   ```json
   {
     "status": "success",
     "id": "req-123",
     "auth_token": "jwt-token-string",
     "expires_at": "2024-01-01T00:00:00Z"
   }
   ```

3. **Extension Registration**
   ```json
   {
     "type": "EXTENSION_REGISTER",
     "id": "req-124",
     "extension_info": {
       "version": "1.0.0",
       "capabilities": ["real-time-monitoring", "intervention"],
       "supported_platforms": ["minimax", "chatgpt", "claude"]
     }
   }
   ```

### Core Message Types

#### USER_INPUT_ANALYSIS
Analyze user input to establish or update task context.

**Request:**
```json
{
  "type": "USER_INPUT_ANALYSIS",
  "id": "req-125",
  "tab_id": "tab-abc123",
  "data": {
    "input": "I'm building a social media app for this hackathon",
    "url": "https://chat.minimax.com",
    "timestamp": 1701234567890,
    "context": {
      "previous_goal": "mobile app",
      "session_start": 1701234500000
    }
  }
}
```

**Response:**
```json
{
  "status": "success",
  "id": "req-125",
  "task_context": {
    "primary_goal": "social media app",
    "domain": "software_development",
    "context_keywords": ["hackathon"],
    "forbidden_switches": ["event planning", "hackathon organization"],
    "establishment_timestamp": 1701234567890
  }
}
```

#### AGENT_MESSAGE_ANALYSIS
Analyze agent response for task coherence issues.

**Request:**
```json
{
  "type": "AGENT_MESSAGE_ANALYSIS",
  "id": "req-126",
  "tab_id": "tab-abc123",
  "data": {
    "content": "I'd be happy to help you organize this hackathon! Let me start by helping you plan the event venue and participant registration...",
    "platform": "minimax",
    "user_input": "I'm building a social media app for this hackathon",
    "timestamp": 1701234568000,
    "message_id": "msg-789"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "id": "req-126",
  "coherence_analysis": {
    "final_score": 0.25,
    "needs_intervention": true,
    "severity": "CRITICAL",
    "issues": [
      "Keyword hijacking detected: hackathon",
      "No mention of primary goal: social media app",
      "Forbidden topic switch: event planning"
    ],
    "component_scores": {
      "goal_alignment": 0.1,
      "keyword_hijacking": 0.2,
      "forbidden_switching": 0.3,
      "domain_consistency": 0.8,
      "response_relevance": 0.4
    }
  },
  "intervention": {
    "intervention_id": "int-456",
    "type": "CRITICAL_CORRECTION",
    "message": "🚨 Agent is focusing too much on 'hackathon' instead of your main task: 'social media app'",
    "suggested_prompt": "Please refocus on the social media app development. I mentioned 'hackathon' as context, not as the main focus. Let's get back to working on the app features and architecture.",
    "preventive_measures": [
      "Add explicit context separation in future prompts",
      "Use phrases like 'focus only on the development' to clarify intent"
    ]
  }
}
```

#### SESSION_START
Initialize monitoring for a new browser tab session.

**Request:**
```json
{
  "type": "SESSION_START",
  "id": "req-127",
  "tab_id": "tab-abc123",
  "data": {
    "url": "https://chat.minimax.com",
    "platform": "minimax",
    "user_agent": "Mozilla/5.0...",
    "session_config": {
      "coherence_threshold": 0.6,
      "auto_intervention": true,
      "max_interventions": 10
    }
  }
}
```

**Response:**
```json
{
  "status": "success",
  "id": "req-127",
  "session_id": "tab-abc123",
  "monitoring_active": true
}
```

#### SESSION_END
End monitoring for a browser tab session.

**Request:**
```json
{
  "type": "SESSION_END",
  "id": "req-128",
  "tab_id": "tab-abc123",
  "data": {
    "reason": "tab_closed",
    "duration_seconds": 1800,
    "final_stats": {
      "message_count": 25,
      "intervention_count": 3
    }
  }
}
```

### Server-to-Client Messages

#### INTERVENTION_REQUIRED
Notify browser extension that intervention is needed.

```json
{
  "type": "INTERVENTION_REQUIRED",
  "tab_id": "tab-abc123",
  "timestamp": 1701234569000,
  "data": {
    "intervention_type": "CRITICAL_CORRECTION",
    "severity": "CRITICAL",
    "message": "🚨 Agent is focusing too much on 'hackathon' instead of your main task: 'social media app'",
    "suggested_prompt": "Please refocus on the social media app development...",
    "auto_apply": false,
    "timeout_seconds": 30
  }
}
```

#### TASK_CONTEXT_UPDATED
Notify browser extension of task context changes.

```json
{
  "type": "TASK_CONTEXT_UPDATED",
  "tab_id": "tab-abc123",
  "timestamp": 1701234570000,
  "data": {
    "primary_goal": "social media app",
    "domain": "software_development",
    "context_keywords": ["hackathon"],
    "confidence": 0.9
  }
}
```

---

## Task Coherence Engine API

### TaskCoherenceEngine Class

#### initialize_task_context(user_input, agent_response=None)
Establish primary task context from user input.

**Parameters:**
- `user_input` (str): The user's input message
- `agent_response` (str, optional): Agent's response for context

**Returns:**
```python
TaskContext(
    primary_goal="social media app",
    domain="software_development",
    context_keywords=["hackathon"],
    forbidden_switches=["event planning", "hackathon organization"],
    establishment_timestamp=1701234567.890
)
```

#### analyze_response_coherence(agent_response, user_input=None)
Analyze agent response for task coherence issues.

**Parameters:**
- `agent_response` (str): The agent's response to analyze
- `user_input` (str, optional): The user input that prompted the response

**Returns:**
```python
CoherenceAnalysis(
    goal_alignment=GoalAlignmentResult(score=0.1, issues=["No mention of primary goal"]),
    keyword_hijacking=KeywordHijackingResult(
        score=0.2, 
        hijacked_keywords=[{
            "keyword": "hackathon",
            "focus_percentage": 80,
            "hijacking_indicators": ["explicit_topic_switch", "excessive_detail_focus"]
        }]
    ),
    forbidden_switching=ForbiddenSwitchingResult(
        score=0.3,
        detected_switches=[{
            "topic": "event planning",
            "match_ratio": 0.7,
            "confidence": 0.8
        }]
    ),
    domain_consistency=DomainConsistencyResult(score=0.8),
    response_relevance=RelevanceResult(score=0.4),
    final_score=0.25,
    needs_intervention=True,
    issues=["Keyword hijacking detected: hackathon", "No mention of primary goal: social media app"]
)
```

#### generate_intervention_strategy(coherence_analysis)
Generate intervention strategy based on analysis.

**Parameters:**
- `coherence_analysis` (CoherenceAnalysis): The coherence analysis result

**Returns:**
```python
InterventionStrategy(
    severity="CRITICAL",
    intervention_type="CRITICAL_CORRECTION",
    user_notification="🚨 Agent is focusing too much on 'hackathon' instead of your main task: 'social media app'",
    correction_prompt="Please refocus on the social media app development. I mentioned 'hackathon' as context, not as the main focus.",
    preventive_measures=[
        "Add explicit context separation in future prompts",
        "Use phrases like 'focus only on the development' to clarify intent"
    ]
)
```

### Core Analysis Methods

#### _extract_primary_goal(text)
Extract the main task/goal from user input.

**Patterns Detected:**
- `build|create|develop|make + [goal] + app|application|system`
- `working on|building|creating + [goal]`
- `project|task|goal + is|involves + [goal]`

**Example:**
```python
engine._extract_primary_goal("I'm building a social media app for this hackathon")
# Returns: "social media"
```

#### _identify_domain(text)
Identify the primary domain/field of the task.

**Supported Domains:**
- `software_development`: app, application, software, code, programming
- `web_development`: website, web, frontend, backend, html, css
- `mobile_development`: mobile, ios, android, smartphone
- `data_science`: data, analysis, machine learning, ai
- `design`: design, ui, ux, interface, visual
- `business`: business, startup, company, strategy
- `research`: research, study, analysis, investigation

#### _extract_context_keywords(text)
Extract contextual keywords that provide setting but should not become the focus.

**Patterns:**
- `for|at|during + [context]`: hackathon, competition, event, conference
- `because of|due to + [context]`: deadline, timeline, presentation
- `as part of|for + [context]`: work, job, assignment, homework

#### _detect_keyword_hijacking(response)
Detect when agent focuses too much on contextual keywords.

**Detection Criteria:**
- Direct mentions > 2
- Keyword sentences > 30% of total sentences
- Explicit topic switching patterns
- Action redirection to contextual topics

**Hijacking Indicators:**
- `explicit_topic_switch`: "let's talk about [keyword]"
- `excessive_detail_focus`: >40% sentences about keyword
- `action_redirection`: Suggesting actions related to keyword instead of main goal

---

## Browser Integration API

### BrowserCoherenceIntegrator Class

#### handle_browser_message(message, tab_id)
Process messages from browser extension.

**Message Types:**
- `USER_INPUT_ANALYSIS`: Analyze user input for task context
- `AGENT_MESSAGE_ANALYSIS`: Analyze agent response for coherence
- `SESSION_START`: Start monitoring session
- `SESSION_END`: End monitoring session
- `MANUAL_TASK_CONTEXT`: Set task context manually

#### get_session_stats(tab_id=None)
Get statistics for browser sessions.

**Single Session Response:**
```python
{
    'tab_id': 'tab-123',
    'platform': 'minimax',
    'message_count': 15,
    'intervention_count': 2,
    'duration_minutes': 25,
    'task_context': {
        'primary_goal': 'social media app',
        'domain': 'software_development'
    }
}
```

**All Sessions Response:**
```python
{
    'active_sessions': 3,
    'sessions': [/* array of session objects */]
}
```

### Browser Session Management

#### BrowserSession Data Model
```python
@dataclass
class BrowserSession:
    tab_id: str
    url: str
    platform: str
    start_time: datetime
    end_time: Optional[datetime] = None
    message_count: int = 0
    intervention_count: int = 0
    task_context: Any = None
    last_activity: Optional[datetime] = None
```

---

## Configuration API

### Server Configuration

#### CoherenceProtectionConfig Class
```python
class CoherenceProtectionConfig:
    intervention_threshold: float = 0.6
    enable_proactive_suggestions: bool = True
    enable_user_notifications: bool = True
    max_interventions_per_session: int = 10
    context_expiry_minutes: int = 60
    enable_learning: bool = True
    
    # Severity thresholds
    critical_threshold: float = 0.3
    moderate_threshold: float = 0.6
    
    # Feature flags
    enable_keyword_hijacking_detection: bool = True
    enable_forbidden_topic_detection: bool = True
    enable_domain_consistency_check: bool = True
```

#### update_from_dict(config_dict)
Update configuration from dictionary.

```python
config.update_from_dict({
    'intervention_threshold': 0.7,
    'enable_proactive_suggestions': False,
    'max_interventions_per_session': 5
})
```

### WebSocket Server Configuration

```python
# In WebSocket message
{
  "type": "UPDATE_CONFIG",
  "config": {
    "intervention_threshold": 0.7,
    "enable_proactive_suggestions": false,
    "max_interventions_per_session": 5
  }
}
```

---

## Monitoring and Reporting API

### Enhanced Reporting System

#### log_coherence_event(event)
Log task coherence related events.

```python
await reporting.log_coherence_event({
    'tab_id': 'tab-123',
    'type': 'intervention_executed',
    'intervention_type': 'CRITICAL_CORRECTION',
    'severity': 'CRITICAL',
    'coherence_score': 0.25,
    'timestamp': datetime.now().isoformat()
})
```

#### get_coherence_report()
Generate task coherence specific report.

**Response:**
```python
{
    'total_coherence_events': 15,
    'events': [/* last 10 events */],
    'summary': {
        'total_interventions': 8,
        'total_alerts': 7,
        'avg_coherence_score': 0.75,
        'most_common_drift_type': 'keyword_hijacking'
    }
}
```

### Statistics API

#### GET_STATS WebSocket Message
Retrieve comprehensive statistics.

**Request:**
```json
{
  "type": "GET_STATS",
  "tab_id": "tab-123"  // Optional, for specific session
}
```

**Response:**
```json
{
  "status": "success",
  "stats": {
    "tab_id": "tab-123",
    "platform": "minimax",
    "message_count": 15,
    "intervention_count": 2,
    "duration_minutes": 25,
    "task_context": {
      "primary_goal": "social media app",
      "domain": "software_development"
    },
    "server_stats": {
      "active_connections": 5,
      "active_extensions": 2,
      "uptime_seconds": 3600
    }
  }
}
```

---

## Error Handling

### Error Response Format
```json
{
  "status": "error",
  "id": "req-123",
  "message": "Authentication required",
  "error_code": "AUTH_REQUIRED",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Common Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `AUTH_REQUIRED` | Authentication needed | Send AUTH_REQUEST first |
| `INVALID_TOKEN` | Auth token expired/invalid | Re-authenticate |
| `RATE_LIMITED` | Too many requests | Wait and reduce frequency |
| `INVALID_MESSAGE` | Malformed message | Check JSON format |
| `TAB_NOT_FOUND` | Session doesn't exist | Start session first |
| `INTERNAL_ERROR` | Server error | Check logs, retry |

### Error Handling Best Practices

1. **Implement Retry Logic**
   ```javascript
   async function sendWithRetry(message, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         const response = await sendMessage(message);
         if (response.status === 'success') {
           return response;
         }
         if (response.error_code === 'RATE_LIMITED') {
           await sleep(1000 * (i + 1)); // Exponential backoff
         }
       } catch (error) {
         if (i === maxRetries - 1) throw error;
       }
     }
   }
   ```

2. **Handle Connection Loss**
   ```javascript
   websocket.onclose = (event) => {
     console.log('Connection lost, attempting reconnect...');
     setTimeout(reconnect, 1000);
   };
   ```

3. **Validate Messages**
   ```javascript
   function validateMessage(message) {
     if (!message.type || !message.id) {
       throw new Error('Invalid message format');
     }
     return true;
   }
   ```

---

## Data Models

### TaskContext
```python
@dataclass
class TaskContext:
    primary_goal: str              # "social media app"
    domain: str                    # "software_development"
    context_keywords: List[str]    # ["hackathon"]
    forbidden_switches: List[str]  # ["event planning"]
    establishment_timestamp: float # Unix timestamp
```

### CoherenceAnalysis
```python
@dataclass
class CoherenceAnalysis:
    goal_alignment: GoalAlignmentResult
    keyword_hijacking: KeywordHijackingResult
    forbidden_switching: ForbiddenSwitchingResult
    domain_consistency: DomainConsistencyResult
    response_relevance: RelevanceResult
    final_score: float             # 0.0 - 1.0
    needs_intervention: bool
    issues: List[str]
```

### InterventionStrategy
```python
@dataclass
class InterventionStrategy:
    severity: str                  # "CRITICAL", "MODERATE", "LOW"
    intervention_type: str         # "CRITICAL_CORRECTION", "GUIDED_REDIRECTION", "GENTLE_REMINDER"
    user_notification: str         # User-facing message
    correction_prompt: str         # Suggested user prompt
    preventive_measures: List[str] # Prevention suggestions
```

### WebSocketConnection
```python
@dataclass
class WebSocketConnection:
    id: str
    websocket: WebSocketServerProtocol
    client_ip: str
    connected_at: datetime
    last_activity: Optional[datetime]
    is_authenticated: bool
    extension_id: Optional[str]
    auth_token: Optional[str]
    message_count: int
```

---

## Rate Limiting and Security

### Rate Limits
- **Default**: 100 requests per minute per IP
- **Authentication**: 10 requests per minute per IP
- **Burst**: Up to 10 requests in 1 second

### Authentication
- **HMAC-SHA256** signatures for extension authentication
- **JWT tokens** for session management
- **24-hour** token expiration
- **Challenge-response** authentication flow

### Security Headers
```python
# WebSocket security configuration
{
    'ping_interval': 30,
    'ping_timeout': 10,
    'close_timeout': 10,
    'max_connections': 100,
    'require_origin_header': True,
    'allowed_origins': ['chrome-extension://*']
}
```

This API reference provides comprehensive documentation for integrating with and extending the Enhanced Supervisor Agent system. For implementation examples, see the setup guide and test files.
