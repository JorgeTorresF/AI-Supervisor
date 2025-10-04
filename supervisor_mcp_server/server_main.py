#!/usr/bin/env python3
# Main server for Enhanced Supervisor Agent with Browser Integration
# Brings together all components for a complete supervision solution

import asyncio
import json
import logging
import signal
import sys
import os
from pathlib import Path
from typing import Dict, Any, Optional
from dataclasses import dataclass
import argparse

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.enhanced_supervisor_agent import EnhancedSupervisorAgent
from src.websocket_server import SupervisorWebSocketServer
from src.task_coherence_engine import TaskCoherenceEngine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('supervisor_server.log')
    ]
)

logger = logging.getLogger(__name__)

@dataclass
class ServerConfig:
    """Server configuration."""
    host: str = 'localhost'
    websocket_port: int = 8765
    mcp_port: int = 8766
    enable_browser_monitoring: bool = True
    enable_mcp_server: bool = True
    log_level: str = 'INFO'
    config_file: Optional[str] = None
    
class SupervisorServer:
    """Main server that orchestrates all supervisor components."""
    
    def __init__(self, config: ServerConfig):
        self.config = config
        self.enhanced_supervisor = None
        self.is_running = False
        
        # Set up logging
        logging.getLogger().setLevel(getattr(logging, config.log_level.upper()))
        
        # Signal handling
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    async def start(self):
        """Start the supervisor server with all components."""
        try:
            logger.info("Starting Enhanced Supervisor Agent Server...")
            
            # Load configuration if specified
            supervisor_config = self._load_supervisor_config()
            
            # Create enhanced supervisor
            self.enhanced_supervisor = EnhancedSupervisorAgent(supervisor_config)
            
            # Start browser monitoring if enabled
            if self.config.enable_browser_monitoring:
                await self.enhanced_supervisor.start_browser_monitoring()
                logger.info(f"Browser monitoring started on ws://{self.config.host}:{self.config.websocket_port}")
            
            # Start MCP server if enabled
            if self.config.enable_mcp_server:
                # This would start the traditional MCP server
                logger.info(f"MCP server would start on port {self.config.mcp_port} (not implemented in this example)")
            
            self.is_running = True
            
            # Display startup information
            self._display_startup_info()
            
            # Keep server running
            while self.is_running:
                await asyncio.sleep(1)
            
        except Exception as e:
            logger.error(f"Failed to start server: {e}")
            raise
    
    async def stop(self):
        """Stop the supervisor server."""
        logger.info("Stopping Enhanced Supervisor Agent Server...")
        self.is_running = False
        
        if self.enhanced_supervisor:
            await self.enhanced_supervisor.shutdown()
        
        logger.info("Server stopped successfully")
    
    def _load_supervisor_config(self) -> Dict[str, Any]:
        """Load supervisor configuration."""
        supervisor_config = {
            'browser': {
                'websocket_host': self.config.host,
                'websocket_port': self.config.websocket_port,
                'enable_browser_monitoring': self.config.enable_browser_monitoring,
                'task_coherence_threshold': 0.6,
                'auto_intervention': True,
                'max_interventions_per_session': 10,
                'enable_user_notifications': True,
                'enable_proactive_suggestions': True
            },
            'mcp': {
                'port': self.config.mcp_port,
                'enable_server': self.config.enable_mcp_server
            },
            'logging': {
                'level': self.config.log_level
            }
        }
        
        # Load from config file if specified
        if self.config.config_file and os.path.exists(self.config.config_file):
            try:
                with open(self.config.config_file, 'r') as f:
                    file_config = json.load(f)
                    supervisor_config.update(file_config)
                logger.info(f"Loaded configuration from {self.config.config_file}")
            except Exception as e:
                logger.warning(f"Failed to load config file {self.config.config_file}: {e}")
        
        return supervisor_config
    
    def _display_startup_info(self):
        """Display server startup information."""
        print("\n" + "="*60)
        print("🤖 ENHANCED SUPERVISOR AGENT SERVER")
        print("   Browser Integration + Task Coherence Protection")
        print("="*60)
        
        if self.config.enable_browser_monitoring:
            print(f"🌐 Browser Monitoring: ws://{self.config.host}:{self.config.websocket_port}")
            print("   - Task Coherence Protection: ✅ ENABLED")
            print("   - Real-time Intervention: ✅ ENABLED")
            print("   - Multi-platform Support: ✅ ENABLED")
        
        if self.config.enable_mcp_server:
            print(f"🔧 MCP Server: {self.config.host}:{self.config.mcp_port}")
        
        print("\n📋 KEY FEATURES:")
        print("   • Prevents AI agents from switching tasks (e.g., hackathon derailment)")
        print("   • Real-time monitoring of browser-based AI agents")
        print("   • Automatic intervention when agents drift from main goal")
        print("   • Unified supervision for both MCP and browser agents")
        print("   • Comprehensive reporting and analytics")
        
        print("\n🔧 BROWSER EXTENSION SETUP:")
        if self.enhanced_supervisor:
            ext_config = self.enhanced_supervisor.get_browser_extension_config()
            print(f"   WebSocket URL: {ext_config['websocket_url']}")
            print(f"   Coherence Threshold: {ext_config['task_coherence_threshold']}")
            print(f"   Auto-intervention: {ext_config['auto_intervention']}")
        
        print("\n📊 USAGE EXAMPLE:")
        print('   User: "I\'m building a social media app for this hackathon"')
        print('   Agent: "Let me help you plan the hackathon event..." ❌')
        print('   Supervisor: "🚨 Agent is focusing on \'hackathon\' instead of \'social media app\'": ')
        print('                "Please refocus on the app development task"')
        
        print("\n⚡ Server is running! Press Ctrl+C to stop.")
        print("="*60 + "\n")
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals."""
        logger.info(f"Received signal {signum}, initiating shutdown...")
        self.is_running = False


def parse_arguments() -> ServerConfig:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Enhanced Supervisor Agent Server with Browser Integration",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s                              # Start with default settings
  %(prog)s --host 0.0.0.0 --ws-port 8765  # Listen on all interfaces
  %(prog)s --config config.json         # Load configuration from file
  %(prog)s --no-browser                 # Disable browser monitoring
  %(prog)s --log-level DEBUG            # Enable debug logging
        """
    )
    
    parser.add_argument(
        '--host', 
        default='localhost',
        help='Host to bind to (default: localhost)'
    )
    
    parser.add_argument(
        '--ws-port', 
        type=int, 
        default=8765,
        help='WebSocket port for browser communication (default: 8765)'
    )
    
    parser.add_argument(
        '--mcp-port', 
        type=int, 
        default=8766,
        help='MCP server port (default: 8766)'
    )
    
    parser.add_argument(
        '--no-browser', 
        action='store_true',
        help='Disable browser monitoring'
    )
    
    parser.add_argument(
        '--no-mcp', 
        action='store_true',
        help='Disable MCP server'
    )
    
    parser.add_argument(
        '--log-level',
        choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'],
        default='INFO',
        help='Logging level (default: INFO)'
    )
    
    parser.add_argument(
        '--config',
        help='Path to configuration file (JSON format)'
    )
    
    args = parser.parse_args()
    
    return ServerConfig(
        host=args.host,
        websocket_port=args.ws_port,
        mcp_port=args.mcp_port,
        enable_browser_monitoring=not args.no_browser,
        enable_mcp_server=not args.no_mcp,
        log_level=args.log_level,
        config_file=args.config
    )


async def main():
    """Main entry point."""
    config = parse_arguments()
    server = SupervisorServer(config)
    
    try:
        await server.start()
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt")
    except Exception as e:
        logger.error(f"Server error: {e}")
    finally:
        await server.stop()


if __name__ == "__main__":
    # Example configuration file creation
    if len(sys.argv) > 1 and sys.argv[1] == "--create-config":
        config_example = {
            "browser": {
                "websocket_host": "localhost",
                "websocket_port": 8765,
                "enable_browser_monitoring": True,
                "task_coherence_threshold": 0.6,
                "auto_intervention": True,
                "max_interventions_per_session": 10,
                "enable_user_notifications": True,
                "enable_proactive_suggestions": True
            },
            "mcp": {
                "port": 8766,
                "enable_server": True
            },
            "logging": {
                "level": "INFO"
            }
        }
        
        config_file = "supervisor_config.json"
        with open(config_file, 'w') as f:
            json.dump(config_example, f, indent=2)
        
        print(f"Created example configuration file: {config_file}")
        print("You can now run: python server_main.py --config supervisor_config.json")
        sys.exit(0)
    
    # Run the server
    asyncio.run(main())
