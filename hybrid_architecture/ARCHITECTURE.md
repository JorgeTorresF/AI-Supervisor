# Hybrid Communication Gateway - Architecture & Deployment Guide

## System Overview

The Hybrid Communication Gateway is a comprehensive solution designed to enable seamless communication and data synchronization across multiple deployment modes:

- **Web Applications**: React/Vue/Angular SPAs with WebSocket integration
- **Browser Extensions**: Chrome/Firefox extensions with background scripts
- **Local Installations**: Desktop applications and CLI tools

## Architecture Components

### 1. Core Services

#### WebSocket Hub (`core/websocket_hub.py`)
- **Purpose**: Central WebSocket server managing real-time connections
- **Features**:
  - Multi-deployment mode support
  - Authentication and user session management
  - Message routing and broadcasting
  - Automatic heartbeat and reconnection handling
  - Connection metrics and monitoring

#### API Gateway (`core/api_gateway.py`)
- **Purpose**: RESTful API layer for HTTP-based interactions
- **Features**:
  - CRUD operations for all data types
  - Rate limiting and request validation
  - Standardized response formats
  - Comprehensive error handling

#### Message Router (`core/message_router.py`)
- **Purpose**: Intelligent message routing between deployments
- **Features**:
  - Message type-based routing rules
  - Cross-user and cross-deployment messaging
  - Message persistence and delivery guarantees
  - Priority-based message handling

#### Authentication Bridge (`core/auth_bridge.py`)
- **Purpose**: Unified authentication across all deployment modes
- **Features**:
  - JWT token management
  - Supabase integration
  - API key support for local installations
  - Token caching and validation

#### Data Sync Engine (`core/data_sync.py`)
- **Purpose**: Real-time data synchronization across deployments
- **Features**:
  - Conflict resolution
  - Incremental and full synchronization
  - Type-specific sync handlers (settings, tasks, activities)
  - Sync status tracking and notifications

#### Connection Manager (`core/connection_manager.py`)
- **Purpose**: Connection lifecycle and health management
- **Features**:
  - Connection health monitoring
  - Automatic reconnection logic
  - Performance metrics collection
  - Connection archiving and analytics

### 2. Data Models (`models/`)

- **WebSocket Models**: Connection info, message structures
- **API Models**: Request/response schemas, validation
- **Authentication Models**: User info, token structures
- **Sync Models**: Synchronization requests and status
- **Connection Models**: Metrics and health tracking

### 3. Utilities (`utils/`)

#### Redis Client (`utils/redis_client.py`)
- Connection pooling and management
- Data serialization/deserialization
- Error handling and retries

#### Supabase Client (`utils/supabase_client.py`)
- Database operations
- Authentication integration
- Query optimization

#### Health Checker (`utils/health.py`)
- System resource monitoring
- Component health status
- Performance metrics

#### Rate Limiter (`utils/rate_limiter.py`)
- Request throttling
- Distributed rate limiting via Redis
- Client identification and tracking

### 4. Middleware (`middleware/`)

#### Rate Limiting Middleware
- HTTP request rate limiting
- Client-based throttling
- Configurable limits and windows

#### Logging Middleware
- Request/response logging
- Structured JSON logging
- Request ID tracking

#### Metrics Middleware
- Prometheus metrics collection
- Request duration tracking
- Error rate monitoring

### 5. API Routers (`routers/`)

#### Authentication Router (`/api/auth`)
- User login/logout
- Token refresh and validation
- Multi-deployment authentication

#### Sync Router (`/api/sync`)
- Data synchronization triggers
- Sync status monitoring
- Type-specific sync endpoints

#### Messages Router (`/api/messages`)
- Message sending and broadcasting
- Message history retrieval
- Cross-deployment notifications

#### Configuration Router (`/api/config`)
- System configuration management
- Deployment status monitoring
- Health status reporting

#### Analytics Router (`/api/analytics`)
- Usage analytics and reporting
- Performance metrics
- Connection statistics

## Deployment Architecture

### Development Environment

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web App       │    │ Browser Extension│    │ Local Install   │
│   (React/Vue)   │    │ (Chrome/Firefox) │    │ (Python/Node)   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │   Hybrid Gateway          │
                    │   (FastAPI + WebSockets)  │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │        Backend            │
                    │   Redis + Supabase        │
                    └───────────────────────────┘
```

### Production Environment

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web App       │    │ Browser Extension│    │ Local Install   │
│   (Production)  │    │ (Chrome Store)   │    │ (Distributed)   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      Load Balancer        │
                    │        (Nginx)            │
                    └─────────────┬─────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                       │                        │
┌───────┴───────┐    ┌─────────┴────────┐    ┌─────────┴────────┐
│ Gateway Node 1│    │ Gateway Node 2   │    │ Gateway Node N   │
│ (Docker)      │    │ (Docker)         │    │ (Docker)         │
└───────┬───────┘    └─────────┬────────┘    └─────────┬────────┘
        │                      │                       │
        └──────────────────────┼───────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │      Shared Services      │
                │   Redis Cluster +         │
                │   Supabase +              │
                │   Prometheus              │
                └───────────────────────────┘
```

## Message Flow

### 1. Connection Establishment

```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant Auth
    participant Redis
    
    Client->>Gateway: WebSocket Connect
    Gateway->>Gateway: Generate Connection ID
    Client->>Gateway: Auth Message + Token
    Gateway->>Auth: Validate Token
    Auth->>Gateway: User Info
    Gateway->>Redis: Cache Session
    Gateway->>Client: Auth Success
    
    loop Heartbeat
        Client->>Gateway: Heartbeat
        Gateway->>Client: Heartbeat Ack
    end
```

### 2. Cross-Deployment Messaging

```mermaid
sequenceDiagram
    participant WebApp
    participant Gateway
    participant Extension
    participant Local
    
    WebApp->>Gateway: Broadcast Message
    Gateway->>Gateway: Route Message
    Gateway->>Extension: Forward Message
    Gateway->>Local: Forward Message
    Extension->>Gateway: Ack
    Local->>Gateway: Ack
```

### 3. Data Synchronization

```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant SyncEngine
    participant Database
    participant OtherClients
    
    Client->>Gateway: Sync Request
    Gateway->>SyncEngine: Process Sync
    SyncEngine->>Database: Update Data
    SyncEngine->>SyncEngine: Generate Sync Result
    SyncEngine->>Gateway: Sync Complete
    Gateway->>OtherClients: Sync Notification
    Gateway->>Client: Sync Result
```

## Configuration Management

### Environment Variables

```bash
# Server Configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
DEBUG=false
ENVIRONMENT=production

# Security
JWT_SECRET_KEY=your-256-bit-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Redis Configuration
REDIS_URL=redis://redis-cluster:6379/0
REDIS_PASSWORD=secure-password

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# WebSocket Configuration
WS_MAX_CONNECTIONS=10000
WS_HEARTBEAT_INTERVAL=30
WS_CONNECTION_TIMEOUT=300

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_BURST=10

# Monitoring
METRICS_ENABLED=true
METRICS_PORT=9090
LOG_LEVEL=INFO

# CORS Settings
ALLOWED_ORIGINS=https://app.yourdomain.com,chrome-extension://
ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
ALLOWED_HEADERS=*
```

### Docker Configuration

#### Production docker-compose.yml

```yaml
version: '3.8'

services:
  hybrid-gateway:
    image: hybrid-gateway:latest
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
        max_attempts: 3
    ports:
      - "8000-8002:8000"
      - "9090-9092:9090"
    environment:
      - ENVIRONMENT=production
      - REDIS_URL=redis://redis-cluster:6379/0
      - DATABASE_URL=postgresql://postgres:password@postgres-cluster:5432/hybrid_gateway
    depends_on:
      - redis-cluster
      - postgres-cluster
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - hybrid-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - hybrid-gateway
    networks:
      - hybrid-network

  redis-cluster:
    image: redis:7-alpine
    command: redis-server --appendonly yes --cluster-enabled yes
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - hybrid-network

  postgres-cluster:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=hybrid_gateway
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=secure-password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - hybrid-network

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9091:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - hybrid-network

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    networks:
      - hybrid-network

volumes:
  redis_data:
  postgres_data:
  prometheus_data:
  grafana_data:

networks:
  hybrid-network:
    driver: bridge
```

## Monitoring & Observability

### Prometheus Metrics

- `http_requests_total`: Total HTTP requests by method, endpoint, status
- `http_request_duration_seconds`: Request duration histogram
- `websocket_connections_active`: Active WebSocket connections by deployment
- `data_sync_operations_total`: Data sync operations by type and status
- `auth_operations_total`: Authentication operations by type and status
- `message_routing_total`: Message routing operations by type

### Health Checks

- **System Health**: CPU, memory, disk usage
- **Service Health**: Redis, Supabase connectivity
- **Application Health**: Component status, connection counts
- **Performance Health**: Response times, error rates

### Logging Strategy

```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "level": "INFO",
  "logger": "hybrid_gateway",
  "request_id": "req-12345",
  "user_id": "user-67890",
  "deployment_mode": "web_app",
  "event": "websocket_connection",
  "message": "WebSocket connection established",
  "context": {
    "connection_id": "conn-abcde",
    "client_ip": "192.168.1.1",
    "user_agent": "Mozilla/5.0..."
  }
}
```

## Security Considerations

### Authentication & Authorization
- JWT tokens with configurable expiration
- Multi-deployment mode authentication
- API key support for headless clients
- Token revocation and blacklisting

### Network Security
- HTTPS/WSS in production
- CORS policy enforcement
- Rate limiting per client
- IP-based access control

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection headers
- Encrypted data storage

### Monitoring & Auditing
- All API calls logged
- Authentication events tracked
- Failed access attempts monitored
- Performance metrics collected

## Scaling Strategies

### Horizontal Scaling
- Multiple gateway instances behind load balancer
- Redis for shared session storage
- Database connection pooling
- WebSocket sticky sessions

### Performance Optimization
- Async/await for non-blocking operations
- Connection pooling for external services
- Message queuing for high-throughput scenarios
- Caching frequently accessed data

### Resource Management
- Connection limits per deployment mode
- Memory usage monitoring
- CPU usage optimization
- Database query optimization

## Troubleshooting Guide

### Common Issues

#### WebSocket Connection Failures
```bash
# Check gateway status
curl http://localhost:8000/health

# Check WebSocket endpoint
wscat -c ws://localhost:8000/ws/web_app/test-client

# Check logs
docker logs hybrid-gateway
```

#### Authentication Problems
```bash
# Test authentication endpoint
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"deployment_mode":"web_app","credentials":{"supabase_token":"test"}}'

# Validate token
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/auth/validate
```

#### Sync Issues
```bash
# Check sync status
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/sync/status

# Trigger manual sync
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"sync_type":"settings","deployment_mode":"web_app"}' \
  http://localhost:8000/api/sync/trigger
```

#### Performance Issues
```bash
# Check metrics
curl http://localhost:8000/metrics

# Check connection stats
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/config/stats

# Monitor resource usage
docker stats hybrid-gateway
```

### Debug Mode

Enable debug mode for detailed logging:

```bash
DEBUG=true uvicorn main:app --reload --log-level debug
```

Debug features:
- Detailed request/response logging
- WebSocket message tracing
- SQL query logging
- Error stack traces
- Performance timing information

## Development Workflow

### Local Development Setup

```bash
# Clone and setup
git clone <repository>
cd hybrid_architecture
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your local configuration

# Start Redis (required)
redis-server

# Run in development mode
./start.sh --dev
```

### Testing Strategy

```bash
# Unit tests
pytest tests/unit/

# Integration tests
pytest tests/integration/

# WebSocket tests
pytest tests/websocket/

# Load tests
locust -f tests/load/locustfile.py

# Coverage report
pytest --cov=. --cov-report=html
```

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: pip install -r requirements.txt
      
      - name: Run tests
        run: pytest tests/ --cov=.
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          docker build -t hybrid-gateway:latest .
          docker push registry.example.com/hybrid-gateway:latest
          # Deploy to production cluster
```

## Future Enhancements

### Planned Features
- Message encryption for sensitive data
- Multi-tenant support
- Advanced analytics dashboard
- Plugin system for custom integrations
- Mobile app SDK support

### Performance Improvements
- Message compression
- Binary WebSocket protocols
- Database sharding
- CDN integration for static assets

### Monitoring Enhancements
- Distributed tracing with Jaeger
- Advanced alerting with PagerDuty
- Custom dashboards in Grafana
- Log aggregation with ELK stack

This architecture provides a robust, scalable foundation for cross-deployment communication while maintaining high performance, security, and observability standards.
