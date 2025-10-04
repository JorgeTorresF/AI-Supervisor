#!/bin/bash

# Hybrid Architecture Deployment Script
# Deploys the hybrid gateway system for AI Agent Supervisor

echo "🚀 Deploying AI Agent Supervisor - Hybrid Architecture"

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "📦 Docker detected, using containerized deployment"
    
    # Build Docker image
    echo "Building Docker image..."
    docker build -t ai-supervisor-hybrid .
    
    # Stop existing container if running
    docker stop ai-supervisor-hybrid 2>/dev/null || true
    docker rm ai-supervisor-hybrid 2>/dev/null || true
    
    # Run container
    echo "Starting container on port 8888..."
    docker run -d \
        --name ai-supervisor-hybrid \
        -p 8888:8888 \
        --env-file .env \
        --restart unless-stopped \
        ai-supervisor-hybrid
    
    echo "✅ Hybrid gateway deployed at http://localhost:8888"
    
else
    echo "📋 Docker not found, using local Python deployment"
    
    # Check if Python and pip are available
    if ! command -v python3 &> /dev/null; then
        echo "❌ Python 3 is required but not installed"
        exit 1
    fi
    
    # Install dependencies
    echo "Installing Python dependencies..."
    pip3 install -r requirements.txt
    
    # Start the server
    echo "Starting hybrid gateway server..."
    python3 -m uvicorn main:app --host 0.0.0.0 --port 8888 &
    
    SERVER_PID=$!
    echo "✅ Hybrid gateway started with PID $SERVER_PID"
    echo "Server running at http://localhost:8888"
    
    # Save PID for later stopping
    echo $SERVER_PID > hybrid_gateway.pid
fi

echo ""
echo "🌐 Hybrid Architecture Gateway is now running!"
echo "📊 WebSocket endpoint: ws://localhost:8888/ws"
echo "🔗 API endpoint: http://localhost:8888/api/v1"
echo "📚 Documentation: http://localhost:8888/docs"
echo "📈 Status: http://localhost:8888/stats"
echo ""
echo "Next steps:"
echo "1. Configure your browser extension to connect to ws://localhost:8888/ws"
echo "2. Set up authentication tokens in your deployment modes"
echo "3. Test the connections using the web app and extension"
echo ""
echo "To stop the service, run: ./scripts/stop.sh"