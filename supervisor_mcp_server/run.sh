#!/bin/bash

# Supervisor Agent MCP Server Runner
# Comprehensive agent supervision with monitoring, error handling, and reporting

set -e

echo "Starting Supervisor Agent MCP Server..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not installed."
    exit 1
fi

# Install required packages if not available
echo "Installing required packages..."
python3 -m pip install fastmcp pydantic --quiet 2>/dev/null || true

# Create necessary directories
mkdir -p supervisor_data/{monitoring,error_handling,reporting,knowledge_base,audit,snapshots}
mkdir -p logs

# Set up logging
export PYTHONPATH="${PWD}:$PYTHONPATH"
export LOG_LEVEL="INFO"

# Start the MCP server
echo "Launching Supervisor Agent MCP Server..."
exec python3 server.py
