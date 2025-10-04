"""Integration modules for connecting unified config to deployment modes."""

import json
import asyncio
from pathlib import Path
from typing import Dict, Any, Optional
from abc import ABC, abstractmethod

from .config_manager import UnifiedConfigManager, DeploymentMode
from .sync_client import ConfigSyncClient

class DeploymentIntegration(ABC):
    """Base class for deployment mode integrations."""
    
    def __init__(self, config_manager: UnifiedConfigManager):
        self.config_manager = config_manager
        self.sync_client: Optional[ConfigSyncClient] = None
    
    @abstractmethod
    async def initialize(self) -> bool:
        """Initialize the integration."""
        pass
    
    @abstractmethod
    async def apply_config_change(self, key: str, value: Any):
        """Apply configuration change to the deployment."""
        pass
    
    @abstractmethod
    def get_deployment_status(self) -> Dict[str, Any]:
        """Get current deployment status."""
        pass

class WebAppIntegration(DeploymentIntegration):
    """Integration for web application deployment."""
    
    def __init__(self, config_manager: UnifiedConfigManager, supabase_client=None):
        super().__init__(config_manager)
        self.supabase_client = supabase_client
        self.web_config_table = 'user_configurations'
    
    async def initialize(self) -> bool:
        """Initialize web app integration."""
        try:
            # Initialize sync client for hybrid communication
            gateway_url = self.config_manager.get('hybrid.gateway_url', 'ws://localhost:8888/ws')
            if self.config_manager.get('hybrid.enabled', True):
                self.sync_client = ConfigSyncClient(self.config_manager, gateway_url)
                await self.sync_client.connect()
            
            # Load config from Supabase if available
            if self.supabase_client:
                await self._load_from_supabase()
            
            return True
            
        except Exception as e:
            print(f"Web app integration initialization failed: {e}")
            return False
    
    async def apply_config_change(self, key: str, value: Any):
        """Apply configuration change to web app."""
        # Update local config
        self.config_manager.set(key, value)
        
        # Save to Supabase
        if self.supabase_client:
            await self._save_to_supabase(key, value)
        
        # Send to hybrid gateway
        if self.sync_client:
            await self.sync_client.sync_configuration()
        
        # Apply UI changes based on configuration
        if key.startswith('system.theme'):
            await self._apply_theme_change(value)
        elif key.startswith('supervision.'):
            await self._apply_supervision_change(key, value)
    
    async def _load_from_supabase(self):
        """Load configuration from Supabase."""
        try:
            result = self.supabase_client.table(self.web_config_table).select('*').execute()
            
            for record in result.data:
                key = record.get('config_key')
                value = record.get('config_value')
                if key and value is not None:
                    # Parse JSON value if it's a string
                    if isinstance(value, str):
                        try:
                            value = json.loads(value)
                        except json.JSONDecodeError:
                            pass
                    
                    self.config_manager.set(key, value, sync=False)
            
        except Exception as e:
            print(f"Failed to load config from Supabase: {e}")
    
    async def _save_to_supabase(self, key: str, value: Any):
        """Save configuration to Supabase."""
        try:
            # Convert complex values to JSON
            if isinstance(value, (dict, list)):
                value_str = json.dumps(value)
            else:
                value_str = str(value)
            
            self.supabase_client.table(self.web_config_table).upsert({
                'config_key': key,
                'config_value': value_str,
                'updated_at': 'now()'
            }).execute()
            
        except Exception as e:
            print(f"Failed to save config to Supabase: {e}")
    
    async def _apply_theme_change(self, theme: str):
        """Apply theme change to web UI."""
        # This would integrate with React state management
        print(f"Applying theme change: {theme}")
    
    async def _apply_supervision_change(self, key: str, value: Any):
        """Apply supervision setting changes."""
        print(f"Applying supervision change: {key} = {value}")
    
    def get_deployment_status(self) -> Dict[str, Any]:
        """Get web app deployment status."""
        return {
            'deployment_mode': 'web',
            'supabase_connected': self.supabase_client is not None,
            'hybrid_connected': self.sync_client.is_connected if self.sync_client else False,
            'config_items': len(self.config_manager.config_values)
        }

class BrowserExtensionIntegration(DeploymentIntegration):
    """Integration for browser extension deployment."""
    
    def __init__(self, config_manager: UnifiedConfigManager):
        super().__init__(config_manager)
        self.extension_storage_key = 'ai_supervisor_config'
    
    async def initialize(self) -> bool:
        """Initialize browser extension integration."""
        try:
            # Load config from extension storage
            await self._load_from_extension_storage()
            
            # Initialize sync client
            gateway_url = self.config_manager.get('hybrid.gateway_url', 'ws://localhost:8888/ws')
            if self.config_manager.get('hybrid.enabled', True):
                self.sync_client = ConfigSyncClient(self.config_manager, gateway_url)
                await self.sync_client.connect()
            
            return True
            
        except Exception as e:
            print(f"Browser extension integration initialization failed: {e}")
            return False
    
    async def apply_config_change(self, key: str, value: Any):
        """Apply configuration change to browser extension."""
        # Update local config
        self.config_manager.set(key, value)
        
        # Save to extension storage
        await self._save_to_extension_storage()
        
        # Send to hybrid gateway
        if self.sync_client:
            await self.sync_client.sync_configuration()
        
        # Apply extension-specific changes
        if key == 'extension.auto_detect_agents':
            await self._update_content_scripts(value)
        elif key.startswith('supervision.'):
            await self._update_supervision_settings(key, value)
    
    async def _load_from_extension_storage(self):
        """Load configuration from browser extension storage."""
        # This would use chrome.storage API in actual implementation
        try:
            # Simulated load from extension storage
            storage_path = Path.cwd() / 'browser_extension' / 'config.json'
            if storage_path.exists():
                with open(storage_path, 'r') as f:
                    config_data = json.load(f)
                
                for key, value in config_data.items():
                    self.config_manager.set(key, value, sync=False)
        
        except Exception as e:
            print(f"Failed to load extension config: {e}")
    
    async def _save_to_extension_storage(self):
        """Save configuration to browser extension storage."""
        try:
            config_data = self.config_manager.get_all_config()
            
            # Save to local file (in real extension, would use chrome.storage)
            storage_path = Path.cwd() / 'browser_extension' / 'config.json'
            storage_path.parent.mkdir(exist_ok=True)
            
            with open(storage_path, 'w') as f:
                json.dump(config_data, f, indent=2)
        
        except Exception as e:
            print(f"Failed to save extension config: {e}")
    
    async def _update_content_scripts(self, auto_detect: bool):
        """Update content script behavior."""
        print(f"Updating content script auto-detect: {auto_detect}")
    
    async def _update_supervision_settings(self, key: str, value: Any):
        """Update supervision settings in extension."""
        print(f"Updating extension supervision: {key} = {value}")
    
    def get_deployment_status(self) -> Dict[str, Any]:
        """Get browser extension deployment status."""
        return {
            'deployment_mode': 'extension',
            'hybrid_connected': self.sync_client.is_connected if self.sync_client else False,
            'config_items': len(self.config_manager.config_values),
            'storage_type': 'chrome.storage'
        }

class LocalInstallationIntegration(DeploymentIntegration):
    """Integration for local installation deployment."""
    
    def __init__(self, config_manager: UnifiedConfigManager, local_server=None):
        super().__init__(config_manager)
        self.local_server = local_server
        self.config_file = Path.home() / '.ai_supervisor' / 'config.json'
    
    async def initialize(self) -> bool:
        """Initialize local installation integration."""
        try:
            # Config is already loaded by config_manager
            
            # Initialize sync client for hybrid communication
            gateway_url = self.config_manager.get('hybrid.gateway_url', 'ws://localhost:8888/ws')
            if self.config_manager.get('hybrid.enabled', True):
                self.sync_client = ConfigSyncClient(self.config_manager, gateway_url)
                await self.sync_client.connect()
            
            return True
            
        except Exception as e:
            print(f"Local installation integration initialization failed: {e}")
            return False
    
    async def apply_config_change(self, key: str, value: Any):
        """Apply configuration change to local installation."""
        # Update local config
        self.config_manager.set(key, value)
        
        # Send to hybrid gateway
        if self.sync_client:
            await self.sync_client.sync_configuration()
        
        # Apply local-specific changes
        if key == 'local.server_port':
            await self._update_server_port(value)
        elif key == 'local.system_tray':
            await self._update_system_tray(value)
        elif key.startswith('supervision.'):
            await self._update_supervision_engine(key, value)
    
    async def _update_server_port(self, port: int):
        """Update local server port."""
        print(f"Server port change requested: {port} (requires restart)")
    
    async def _update_system_tray(self, enabled: bool):
        """Update system tray visibility."""
        print(f"System tray visibility: {enabled}")
    
    async def _update_supervision_engine(self, key: str, value: Any):
        """Update supervision engine settings."""
        print(f"Updating local supervision: {key} = {value}")
    
    def get_deployment_status(self) -> Dict[str, Any]:
        """Get local installation deployment status."""
        return {
            'deployment_mode': 'local',
            'server_running': self.local_server is not None,
            'hybrid_connected': self.sync_client.is_connected if self.sync_client else False,
            'config_file': str(self.config_file),
            'config_items': len(self.config_manager.config_values)
        }

class HybridGatewayIntegration(DeploymentIntegration):
    """Integration for hybrid architecture gateway."""
    
    def __init__(self, config_manager: UnifiedConfigManager):
        super().__init__(config_manager)
        self.connected_deployments: Dict[str, Any] = {}
    
    async def initialize(self) -> bool:
        """Initialize hybrid gateway integration."""
        try:
            # Gateway acts as the central hub - no sync client needed
            return True
            
        except Exception as e:
            print(f"Hybrid gateway integration initialization failed: {e}")
            return False
    
    async def apply_config_change(self, key: str, value: Any):
        """Apply configuration change through hybrid gateway."""
        # Update local config
        self.config_manager.set(key, value)
        
        # Broadcast to all connected deployments
        await self._broadcast_config_change(key, value)
    
    async def _broadcast_config_change(self, key: str, value: Any):
        """Broadcast configuration change to all connected deployments."""
        print(f"Broadcasting config change: {key} = {value}")
        # This would integrate with the WebSocket hub
    
    def get_deployment_status(self) -> Dict[str, Any]:
        """Get hybrid gateway deployment status."""
        return {
            'deployment_mode': 'hybrid',
            'connected_deployments': len(self.connected_deployments),
            'gateway_running': True,
            'config_items': len(self.config_manager.config_values)
        }

# Factory function to create appropriate integration
def create_integration(deployment_mode: DeploymentMode, 
                      config_manager: UnifiedConfigManager,
                      **kwargs) -> DeploymentIntegration:
    """Create appropriate integration for deployment mode."""
    
    if deployment_mode == DeploymentMode.WEB:
        return WebAppIntegration(config_manager, kwargs.get('supabase_client'))
    elif deployment_mode == DeploymentMode.EXTENSION:
        return BrowserExtensionIntegration(config_manager)
    elif deployment_mode == DeploymentMode.LOCAL:
        return LocalInstallationIntegration(config_manager, kwargs.get('local_server'))
    elif deployment_mode == DeploymentMode.HYBRID:
        return HybridGatewayIntegration(config_manager)
    else:
        raise ValueError(f"Unsupported deployment mode: {deployment_mode}")