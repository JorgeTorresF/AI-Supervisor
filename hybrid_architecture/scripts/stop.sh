#!/bin/bash

# Stop the hybrid architecture gateway

echo "🛑 Stopping AI Agent Supervisor - Hybrid Architecture"

# Stop Docker container if running
if docker ps | grep -q ai-supervisor-hybrid; then
    echo "Stopping Docker container..."
    docker stop ai-supervisor-hybrid
    docker rm ai-supervisor-hybrid
    echo "✅ Docker container stopped"
fi

# Stop local Python process if running
if [ -f hybrid_gateway.pid ]; then
    PID=$(cat hybrid_gateway.pid)
    if kill -0 $PID 2>/dev/null; then
        echo "Stopping local Python process (PID: $PID)..."
        kill $PID
        rm hybrid_gateway.pid
        echo "✅ Local server stopped"
    else
        echo "Process not running, cleaning up PID file"
        rm hybrid_gateway.pid
    fi
fi

echo "✅ Hybrid Architecture Gateway stopped"