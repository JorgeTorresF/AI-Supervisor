"""Local AI Agent Supervisor Server.

This module provides a complete local installation of the AI Agent Supervisor system,
including task coherence protection, idea validation, and hybrid architecture integration.
"""

import asyncio
import json
import logging
import sqlite3
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any

from fastapi import FastAPI, WebSocket, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from pydantic import BaseModel
import uvicorn

# Import task coherence modules
import sys
sys.path.append(str(Path(__file__).parent.parent / 'src'))

from task_coherence import (
    ContextManager, DerailmentDetector, IdeaValidator, 
    InterventionEngine, PromptRewriter
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/supervisor_local.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class LocalConfig:
    """Local installation configuration."""
    def __init__(self):
        self.app_dir = Path.home() / '.ai_supervisor'
        self.data_dir = self.app_dir / 'data'
        self.logs_dir = self.app_dir / 'logs'
        self.config_file = self.app_dir / 'config.json'
        self.db_file = self.data_dir / 'supervisor.db'
        
        # Ensure directories exist
        self.app_dir.mkdir(exist_ok=True)
        self.data_dir.mkdir(exist_ok=True)
        self.logs_dir.mkdir(exist_ok=True)
        
        # Default configuration
        self.default_config = {
            'server': {
                'host': '127.0.0.1',
                'port': 8889,
                'auto_start': True,
                'debug': False
            },
            'hybrid': {
                'enabled': True,
                'gateway_url': 'ws://localhost:8888/ws',
                'auto_connect': True
            },
            'features': {
                'idea_validation': True,
                'task_coherence': True,
                'intervention_alerts': True,
                'activity_logging': True
            },
            'ui': {
                'theme': 'dark',
                'auto_open_browser': True,
                'system_tray': True
            }
        }
        
        self.config = self.load_config()
    
    def load_config(self) -> Dict[str, Any]:
        """Load configuration from file."""
        if self.config_file.exists():
            try:
                with open(self.config_file, 'r') as f:
                    config = json.load(f)
                # Merge with defaults
                return {**self.default_config, **config}
            except Exception as e:
                logger.error(f"Failed to load config: {e}")
        
        # Save default config
        self.save_config(self.default_config)
        return self.default_config
    
    def save_config(self, config: Dict[str, Any]) -> None:
        """Save configuration to file."""
        try:
            with open(self.config_file, 'w') as f:
                json.dump(config, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save config: {e}")

class LocalDatabase:
    """Local SQLite database for storing supervisor data."""
    
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize the local database."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Create tables
            cursor.executescript("""
                CREATE TABLE IF NOT EXISTS tasks (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    description TEXT,
                    status TEXT NOT NULL DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS activities (
                    id TEXT PRIMARY KEY,
                    task_id TEXT,
                    activity_type TEXT NOT NULL,
                    content TEXT,
                    metadata TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (task_id) REFERENCES tasks (id)
                );
                
                CREATE TABLE IF NOT EXISTS interventions (
                    id TEXT PRIMARY KEY,
                    task_id TEXT,
                    intervention_type TEXT NOT NULL,
                    message TEXT NOT NULL,
                    confidence REAL,
                    reasoning TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (task_id) REFERENCES tasks (id)
                );
                
                CREATE TABLE IF NOT EXISTS ideas (
                    id TEXT PRIMARY KEY,
                    content TEXT NOT NULL,
                    feasibility_score INTEGER,
                    risk_level TEXT,
                    warnings TEXT,
                    suggestions TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            conn.commit()
            conn.close()
            logger.info("Database initialized successfully")
            
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
    
    def execute_query(self, query: str, params: tuple = ()) -> List[Dict]:
        """Execute a database query and return results."""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(query, params)
            results = [dict(row) for row in cursor.fetchall()]
            conn.close()
            return results
        except Exception as e:
            logger.error(f"Query execution failed: {e}")
            return []
    
    def execute_update(self, query: str, params: tuple = ()) -> bool:
        """Execute an update/insert query."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute(query, params)
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"Update execution failed: {e}")
            return False

class LocalSupervisorApp:
    """Main local application class."""
    
    def __init__(self):
        self.config = LocalConfig()
        self.database = LocalDatabase(self.config.db_file)
        
        # Initialize supervisor components
        self.context_manager = ContextManager()
        self.derailment_detector = DerailmentDetector()
        self.idea_validator = IdeaValidator()
        self.intervention_engine = InterventionEngine()
        self.prompt_rewriter = PromptRewriter()
        
        # Active connections and sessions
        self.active_connections: Dict[str, WebSocket] = {}
        self.active_tasks: Dict[str, Dict] = {}
        
        # Create FastAPI app
        self.app = self.create_app()
    
    def create_app(self) -> FastAPI:
        """Create and configure FastAPI application."""
        app = FastAPI(
            title="AI Agent Supervisor - Local Installation",
            description="Local AI Agent Supervision System",
            version="1.0.0"
        )
        
        # Configure CORS
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"]
        )
        
        # Mount static files
        static_dir = Path(__file__).parent / "static"
        if static_dir.exists():
            app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")
        
        # Add routes
        self.add_routes(app)
        
        return app
    
    def add_routes(self, app: FastAPI):
        """Add API routes to the application."""
        
        @app.get("/")
        async def home():
            """Home page."""
            html_content = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>AI Agent Supervisor - Local</title>
                <style>
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        background: linear-gradient(135deg, #1e3c72, #2a5298);
                        color: white;
                        margin: 0;
                        padding: 20px;
                        min-height: 100vh;
                    }
                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                        text-align: center;
                        padding: 40px;
                    }
                    h1 { font-size: 2.5em; margin-bottom: 20px; }
                    .status { 
                        background: rgba(255,255,255,0.1); 
                        padding: 20px; 
                        border-radius: 10px;
                        margin: 20px 0;
                    }
                    .nav {
                        display: flex;
                        justify-content: center;
                        gap: 20px;
                        margin-top: 30px;
                    }
                    .nav a {
                        background: rgba(255,255,255,0.2);
                        color: white;
                        padding: 10px 20px;
                        text-decoration: none;
                        border-radius: 5px;
                        transition: background 0.3s;
                    }
                    .nav a:hover {
                        background: rgba(255,255,255,0.3);
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🤖 AI Agent Supervisor</h1>
                    <h2>Local Installation</h2>
                    <div class="status">
                        <h3>✅ System Status: Running</h3>
                        <p>Local server is active on port {port}</p>
                        <p>Task coherence protection: <strong>Enabled</strong></p>
                        <p>Idea validation: <strong>Enabled</strong></p>
                    </div>
                    <div class="nav">
                        <a href="/dashboard">Dashboard</a>
                        <a href="/api/v1/validate-idea">Idea Validator</a>
                        <a href="/api/v1/status">API Status</a>
                        <a href="/docs">API Docs</a>
                        <a href="/settings">Settings</a>
                    </div>
                </div>
            </body>
            </html>
            """.format(port=self.config.config['server']['port'])
            return HTMLResponse(content=html_content)
        
        @app.get("/api/v1/status")
        async def get_status():
            """Get system status."""
            return {
                "status": "running",
                "version": "1.0.0",
                "deployment_mode": "local",
                "active_connections": len(self.active_connections),
                "active_tasks": len(self.active_tasks),
                "features": self.config.config['features'],
                "timestamp": datetime.now().isoformat()
            }
        
        @app.post("/api/v1/validate-idea")
        async def validate_idea(request: dict):
            """Validate a project idea."""
            idea_text = request.get('idea', '')
            if not idea_text:
                raise HTTPException(status_code=400, detail="Idea text is required")
            
            validation_result = self.idea_validator.validate_idea(idea_text)
            
            # Store in database
            idea_id = f"idea_{datetime.now().timestamp()}"
            self.database.execute_update(
                "INSERT INTO ideas (id, content, feasibility_score, risk_level, warnings, suggestions) VALUES (?, ?, ?, ?, ?, ?)",
                (idea_id, idea_text, validation_result.feasibility_score, 
                 validation_result.risk_level.value, json.dumps(validation_result.warnings),
                 json.dumps(validation_result.suggestions))
            )
            
            return {
                "idea_id": idea_id,
                "feasibility_score": validation_result.feasibility_score,
                "risk_level": validation_result.risk_level.value,
                "warnings": validation_result.warnings,
                "suggestions": validation_result.suggestions,
                "success_probability": validation_result.success_probability,
                "estimated_timeline": validation_result.estimated_timeline
            }
        
        @app.websocket("/ws")
        async def websocket_endpoint(websocket: WebSocket):
            """WebSocket endpoint for real-time communication."""
            await websocket.accept()
            connection_id = f"local_{datetime.now().timestamp()}"
            self.active_connections[connection_id] = websocket
            
            try:
                await websocket.send_text(json.dumps({
                    "type": "connection_ack",
                    "connection_id": connection_id,
                    "deployment_mode": "local"
                }))
                
                while True:
                    data = await websocket.receive_text()
                    message = json.loads(data)
                    await self.handle_websocket_message(connection_id, message)
                    
            except Exception as e:
                logger.error(f"WebSocket error: {e}")
            finally:
                if connection_id in self.active_connections:
                    del self.active_connections[connection_id]
    
    async def handle_websocket_message(self, connection_id: str, message: dict):
        """Handle incoming WebSocket message."""
        message_type = message.get('type', 'unknown')
        payload = message.get('payload', {})
        
        if message_type == 'task_start':
            task_id = payload.get('task_id')
            self.active_tasks[task_id] = {
                'connection_id': connection_id,
                'start_time': datetime.now(),
                'context': payload.get('context', {})
            }
        
        elif message_type == 'intervention_request':
            # Handle intervention using our engine
            interventions = self.intervention_engine.analyze_and_intervene(
                payload.get('user_prompt', ''),
                payload.get('agent_response', ''),
                payload.get('current_task', ''),
                payload.get('conversation_history', [])
            )
            
            # Send interventions back
            websocket = self.active_connections.get(connection_id)
            if websocket:
                await websocket.send_text(json.dumps({
                    "type": "interventions",
                    "interventions": [{
                        "type": intervention.type.value,
                        "message": intervention.message,
                        "confidence": intervention.confidence,
                        "reasoning": intervention.reasoning
                    } for intervention in interventions]
                }))
    
    def run(self):
        """Run the local application."""
        config = self.config.config['server']
        logger.info(f"Starting AI Agent Supervisor local server on {config['host']}:{config['port']}")
        
        uvicorn.run(
            self.app,
            host=config['host'],
            port=config['port'],
            log_level="info" if config['debug'] else "warning"
        )

if __name__ == "__main__":
    app = LocalSupervisorApp()
    app.run()