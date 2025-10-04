# API Documentation - AI Agent Supervisor

## Overview

The AI Agent Supervisor provides comprehensive REST APIs across all deployment modes, enabling programmatic access to supervision, configuration, and monitoring capabilities. This documentation covers the complete API surface.

## Base URLs

- **Web Application**: `https://ncczq77atgsg.space.minimax.io/api/v1`
- **Local Installation**: `http://localhost:8889/api/v1`
- **Hybrid Gateway**: `http://localhost:8888/api/v1`
- **Browser Extension**: Via WebSocket connections

## Authentication

### JWT Token Authentication

All API endpoints require authentication via JWT tokens:

```http
Authorization: Bearer <jwt_token>
```

### Obtaining Tokens

```http
POST /auth/token
Content-Type: application/json

{
  "user_id": "your_user_id",
  "password": "your_password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2025-08-20T19:39:39Z",
  "user_id": "your_user_id"
}
```

## Core APIs

### System Status

#### Get System Status
```http
GET /status
```

**Response:**
```json
{
  "status": "running",
  "version": "1.0.0",
  "deployment_mode": "local",
  "active_connections": 3,
  "active_tasks": 2,
  "features": {
    "idea_validation": true,
    "task_coherence": true,
    "intervention_alerts": true,
    "activity_logging": true
  },
  "timestamp": "2025-08-19T19:39:39Z"
}
```

#### Get Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-19T19:39:39Z",
  "service": "AI Agent Supervisor",
  "version": "1.0.0",
  "uptime": 86400,
  "checks": {
    "database": "healthy",
    "websocket": "healthy",
    "config": "healthy"
  }
}
```

### Idea Validation API

#### Validate Project Idea
```http
POST /validate-idea
Content-Type: application/json

{
  "idea": "Build a social media platform for developers"
}
```

**Response:**
```json
{
  "idea_id": "idea_1692456779",
  "feasibility_score": 6,
  "risk_level": "medium",
  "success_probability": 0.65,
  "estimated_timeline": "6-12 months",
  "warnings": [
    "Highly competitive market with established players",
    "Requires significant marketing and user acquisition"
  ],
  "suggestions": [
    "Consider focusing on a specific developer niche",
    "Start with a minimal viable product",
    "Research existing solutions and differentiate"
  ],
  "technical_issues": [
    "Real-time messaging infrastructure required",
    "Scalable architecture needed for growth"
  ],
  "business_issues": [
    "Monetization strategy unclear",
    "User retention challenges in social platforms"
  ],
  "resource_requirements": {
    "budget": "High",
    "team_size": "Multiple developers",
    "timeline": "Extended (6+ months)",
    "infrastructure": "Cloud services required"
  }
}
```

#### Get Idea History
```http
GET /ideas?limit=10&offset=0
```

**Response:**
```json
{
  "total": 25,
  "limit": 10,
  "offset": 0,
  "ideas": [
    {
      "id": "idea_1692456779",
      "content": "Build a social media platform for developers",
      "feasibility_score": 6,
      "risk_level": "medium",
      "timestamp": "2025-08-19T19:39:39Z"
    }
  ]
}
```

### Task Management API

#### Create Task
```http
POST /tasks
Content-Type: application/json

{
  "title": "Develop REST API",
  "description": "Create a REST API for user management",
  "expected_deliverables": [
    "API endpoints",
    "Documentation",
    "Unit tests"
  ],
  "time_limit": 7200,
  "priority": "high"
}
```

**Response:**
```json
{
  "id": "task_1692456780",
  "title": "Develop REST API",
  "description": "Create a REST API for user management",
  "status": "active",
  "created_at": "2025-08-19T19:39:39Z",
  "expected_deliverables": [
    "API endpoints",
    "Documentation", 
    "Unit tests"
  ],
  "time_limit": 7200,
  "priority": "high",
  "progress": {
    "completion_percentage": 0,
    "time_elapsed": 0,
    "deliverables_completed": 0
  }
}
```

#### Get Tasks
```http
GET /tasks?status=active&limit=20
```

**Response:**
```json
{
  "total": 15,
  "tasks": [
    {
      "id": "task_1692456780",
      "title": "Develop REST API",
      "status": "active",
      "created_at": "2025-08-19T19:39:39Z",
      "progress": {
        "completion_percentage": 45,
        "time_elapsed": 1800
      }
    }
  ]
}
```

#### Update Task
```http
PUT /tasks/{task_id}
Content-Type: application/json

{
  "status": "in_progress",
  "progress": {
    "completion_percentage": 75,
    "deliverables_completed": 2,
    "notes": "API endpoints completed, working on documentation"
  }
}
```

### Activity Logging API

#### Log Activity
```http
POST /activities
Content-Type: application/json

{
  "task_id": "task_1692456780",
  "activity_type": "code_generation",
  "content": "Generated user authentication endpoints",
  "metadata": {
    "platform": "chatgpt",
    "duration": 300,
    "tokens_used": 1500
  }
}
```

#### Get Activity Log
```http
GET /activities?task_id=task_1692456780&limit=50
```

**Response:**
```json
{
  "total": 25,
  "activities": [
    {
      "id": "activity_1692456781",
      "task_id": "task_1692456780",
      "activity_type": "code_generation",
      "content": "Generated user authentication endpoints",
      "timestamp": "2025-08-19T19:39:39Z",
      "metadata": {
        "platform": "chatgpt",
        "duration": 300,
        "tokens_used": 1500
      }
    }
  ]
}
```

### Intervention API

#### Get Interventions
```http
GET /interventions?task_id=task_1692456780
```

**Response:**
```json
{
  "total": 5,
  "interventions": [
    {
      "id": "intervention_1692456782",
      "task_id": "task_1692456780",
      "type": "redirect",
      "message": "The discussion has shifted away from API development. Consider refocusing on the main objective.",
      "confidence": 0.85,
      "reasoning": "Derailment detected: off-topic discussion about UI design",
      "timestamp": "2025-08-19T19:39:39Z",
      "resolved": false
    }
  ]
}
```

#### Mark Intervention as Resolved
```http
PUT /interventions/{intervention_id}
Content-Type: application/json

{
  "resolved": true,
  "user_feedback": "helpful",
  "notes": "Successfully refocused on API development"
}
```

## Configuration API

### Get Configuration
```http
GET /config
```

**Response:**
```json
{
  "system": {
    "theme": "dark",
    "language": "en",
    "notifications": true
  },
  "supervision": {
    "idea_validation": true,
    "task_coherence": true,
    "intervention_level": "medium",
    "auto_interventions": true
  },
  "hybrid": {
    "enabled": true,
    "gateway_url": "ws://localhost:8888/ws",
    "auto_connect": true
  }
}
```

### Update Configuration
```http
PUT /config
Content-Type: application/json

{
  "system.theme": "light",
  "supervision.intervention_level": "high"
}
```

### Export Configuration
```http
GET /config/export
```

**Response:**
```json
{
  "deployment_mode": "local",
  "export_timestamp": "2025-08-19T19:39:39Z",
  "version": 1,
  "config_values": {
    "system.theme": {
      "key": "system.theme",
      "value": "dark",
      "scope": "user",
      "version": 1,
      "timestamp": "2025-08-19T19:39:39Z"
    }
  }
}
```

## Hybrid Architecture API

### Get Deployment Status
```http
GET /deployments/status
```

**Response:**
```json
{
  "user_id": "test_user",
  "deployments": [
    {
      "mode": "web",
      "active": true,
      "connections": 1,
      "last_activity": "2025-08-19T19:39:39Z",
      "version": "1.0.0"
    },
    {
      "mode": "extension",
      "active": true,
      "connections": 1,
      "last_activity": "2025-08-19T19:35:22Z",
      "version": "1.0.0"
    },
    {
      "mode": "local",
      "active": false,
      "connections": 0,
      "last_activity": null,
      "version": "1.0.0"
    }
  ],
  "total_connections": 2,
  "hybrid_mode_enabled": true
}
```

### Synchronize Data
```http
POST /sync
Content-Type: application/json

{
  "source_mode": "web",
  "target_modes": ["extension", "local"],
  "data_types": ["settings", "tasks"]
}
```

**Response:**
```json
{
  "sync_id": "sync_1692456783",
  "status": "sync_initiated",
  "target_modes": ["extension", "local"]
}
```

### Send Cross-Deployment Message
```http
POST /message
Content-Type: application/json

{
  "type": "intervention_alert",
  "target_mode": "extension",
  "payload": {
    "message": "High-priority intervention detected",
    "task_id": "task_1692456780",
    "urgency": "high"
  }
}
```

## WebSocket API

### Connection
```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:8889/ws?user_id=test_user&deployment_mode=web&auth_token=your_token');

ws.onopen = function(event) {
  console.log('Connected to AI Supervisor WebSocket');
};

ws.onmessage = function(event) {
  const message = JSON.parse(event.data);
  handleMessage(message);
};
```

### Message Types

#### Task Update
```json
{
  "type": "task_update",
  "task_id": "task_1692456780",
  "payload": {
    "status": "in_progress",
    "progress": 75,
    "last_activity": "2025-08-19T19:39:39Z"
  }
}
```

#### Intervention Alert
```json
{
  "type": "intervention",
  "intervention_id": "intervention_1692456782",
  "payload": {
    "message": "Task coherence alert",
    "confidence": 0.9,
    "suggested_action": "Refocus on main objective"
  }
}
```

#### Configuration Change
```json
{
  "type": "config_change",
  "payload": {
    "key": "system.theme",
    "old_value": "dark",
    "new_value": "light",
    "source_mode": "web"
  }
}
```

## Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": {
      "field": "idea",
      "issue": "Field is required"
    },
    "timestamp": "2025-08-19T19:39:39Z",
    "request_id": "req_1692456784"
  }
}
```

### HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| **200** | OK | Successful GET, PUT requests |
| **201** | Created | Successful POST requests |
| **400** | Bad Request | Invalid input parameters |
| **401** | Unauthorized | Missing or invalid authentication |
| **403** | Forbidden | Insufficient permissions |
| **404** | Not Found | Resource does not exist |
| **409** | Conflict | Resource conflict (e.g., duplicate) |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Internal Server Error | Server-side error |

### Common Error Codes

| Code | Description |
|------|-------------|
| **AUTH001** | Invalid or expired authentication token |
| **VALID001** | Input validation failed |
| **TASK001** | Task not found |
| **SYNC001** | Synchronization failed |
| **CONFIG001** | Configuration error |
| **RATE001** | Rate limit exceeded |

## Rate Limiting

### Rate Limits by Endpoint

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/validate-idea` | 10 requests | 1 minute |
| `/tasks` | 60 requests | 1 minute |
| `/activities` | 120 requests | 1 minute |
| `/config` | 30 requests | 1 minute |
| `/sync` | 5 requests | 1 minute |

### Rate Limit Headers
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1692456840
```

## SDKs and Examples

### Python SDK Example
```python
import requests
from datetime import datetime

class AISupervisorClient:
    def __init__(self, base_url, auth_token):
        self.base_url = base_url
        self.auth_token = auth_token
        self.headers = {
            'Authorization': f'Bearer {auth_token}',
            'Content-Type': 'application/json'
        }
    
    def validate_idea(self, idea_text):
        """Validate a project idea."""
        response = requests.post(
            f'{self.base_url}/validate-idea',
            json={'idea': idea_text},
            headers=self.headers
        )
        return response.json()
    
    def create_task(self, title, description, deliverables=None):
        """Create a new task."""
        data = {
            'title': title,
            'description': description,
            'expected_deliverables': deliverables or []
        }
        response = requests.post(
            f'{self.base_url}/tasks',
            json=data,
            headers=self.headers
        )
        return response.json()

# Usage
client = AISupervisorClient('http://localhost:8889/api/v1', 'your_token')
result = client.validate_idea('Build a time travel machine')
print(f"Feasibility: {result['feasibility_score']}/10")
```

### JavaScript SDK Example
```javascript
class AISupervisorClient {
  constructor(baseUrl, authToken) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
  }

  async validateIdea(ideaText) {
    const response = await fetch(`${this.baseUrl}/validate-idea`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ idea: ideaText })
    });
    return response.json();
  }

  async getTasks(status = 'active') {
    const response = await fetch(
      `${this.baseUrl}/tasks?status=${status}`,
      {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      }
    );
    return response.json();
  }
}

// Usage
const client = new AISupervisorClient(
  'http://localhost:8889/api/v1',
  'your_token'
);

client.validateIdea('Build a social media app')
  .then(result => {
    console.log(`Risk Level: ${result.risk_level}`);
    console.log(`Warnings: ${result.warnings.join(', ')}`);
  });
```

---

**Next**: Check out the [Setup Guides](../setup_guides/) for deployment instructions.