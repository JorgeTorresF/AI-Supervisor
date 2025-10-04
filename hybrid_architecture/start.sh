#!/bin/bash

# Hybrid Communication Gateway Startup Script

set -e

echo "Starting Hybrid Communication Gateway..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "Please edit .env file with your configuration before running again."
    exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Check Redis connection
echo "Checking Redis connection..."
if ! redis-cli ping > /dev/null 2>&1; then
    echo "Warning: Redis is not running. Please start Redis server."
    echo "On Ubuntu/Debian: sudo systemctl start redis-server"
    echo "On macOS: brew services start redis"
fi

# Run database migrations if needed
# echo "Running database migrations..."
# alembic upgrade head

# Start the application
echo "Starting application..."
if [ "$1" = "--dev" ]; then
    echo "Running in development mode..."
    uvicorn main:app --reload --host 0.0.0.0 --port 8000 --log-level debug
else
    echo "Running in production mode..."
    uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
fi
