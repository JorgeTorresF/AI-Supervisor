"""Unified Configuration System for AI Agent Supervisor.

This module provides centralized configuration management across all deployment modes:
- Web Application
- Browser Extension  
- Local Installation
- Hybrid Architecture

Features:
- Cross-platform configuration synchronization
- Version control and conflict resolution
- Secure settings storage and transmission
- Real-time configuration updates
- Backup and restore capabilities
"""

import json
import uuid
import hashlib
from datetime import datetime
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict
from enum import Enum
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DeploymentMode(Enum):
    """Supported deployment modes."""
    WEB = "web"
    EXTENSION = "extension"
    LOCAL = "local"
    HYBRID = "hybrid"

class ConfigScope(Enum):
    """Configuration scope levels."""
    USER = "user"  # User-specific settings
    SYSTEM = "system"  # System-wide settings
    DEPLOYMENT = "deployment"  # Deployment-specific settings
    TEMPORARY = "temporary"  # Session-only settings

class SyncStatus(Enum):
    """Configuration synchronization status."""
    SYNCED = "synced"
    PENDING = "pending"
    CONFLICT = "conflict"
    ERROR = "error"

@dataclass
class ConfigValue:
    """Individual configuration value with metadata."""
    key: str
    value: Any
    scope: ConfigScope
    deployment_mode: DeploymentMode
    version: int
    timestamp: datetime
    checksum: str
    description: Optional[str] = None
    
    def __post_init__(self):
        if not self.checksum:
            self.checksum = self.calculate_checksum()
    
    def calculate_checksum(self) -> str:
        """Calculate checksum for value verification."""
        content = f"{self.key}:{json.dumps(self.value, sort_keys=True)}:{self.version}"
        return hashlib.sha256(content.encode()).hexdigest()[:16]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary format."""
        return {
            'key': self.key,
            'value': self.value,
            'scope': self.scope.value,
            'deployment_mode': self.deployment_mode.value,
            'version': self.version,
            'timestamp': self.timestamp.isoformat(),
            'checksum': self.checksum,
            'description': self.description
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ConfigValue':
        """Create from dictionary format."""
        return cls(
            key=data['key'],
            value=data['value'],
            scope=ConfigScope(data['scope']),
            deployment_mode=DeploymentMode(data['deployment_mode']),
            version=data['version'],
            timestamp=datetime.fromisoformat(data['timestamp']),
            checksum=data['checksum'],
            description=data.get('description')
        )

@dataclass
class ConfigSchema:
    """Configuration schema definition."""
    key: str
    type: str  # 'string', 'number', 'boolean', 'object', 'array'
    default: Any
    required: bool = False
    description: str = ""
    validation: Optional[Dict[str, Any]] = None
    scope: ConfigScope = ConfigScope.USER
    sync_enabled: bool = True
    
class UnifiedConfigManager:
    """Manages configuration across all deployment modes."""
    
    def __init__(self, deployment_mode: DeploymentMode, storage_path: Optional[Path] = None):
        self.deployment_mode = deployment_mode
        self.storage_path = storage_path or self._get_default_storage_path()
        
        # Configuration data
        self.config_values: Dict[str, ConfigValue] = {}
        self.schemas: Dict[str, ConfigSchema] = {}
        self.sync_queue: List[ConfigValue] = []
        
        # Sync configuration
        self.sync_enabled = True
        self.auto_sync_interval = 30  # seconds
        self.last_sync_time: Optional[datetime] = None
        
        # Load configuration
        self.load_schemas()
        self.load_config()
    
    def _get_default_storage_path(self) -> Path:
        """Get default storage path for this deployment mode."""
        if self.deployment_mode == DeploymentMode.LOCAL:
            return Path.home() / '.ai_supervisor' / 'config'
        elif self.deployment_mode == DeploymentMode.EXTENSION:
            return Path.cwd() / 'browser_extension' / 'config'
        elif self.deployment_mode == DeploymentMode.WEB:
            return Path.cwd() / 'web_config'  # Usually handled by Supabase
        else:
            return Path.cwd() / 'hybrid_config'
    
    def load_schemas(self):
        """Load configuration schemas."""
        default_schemas = {
            # Core system settings
            'system.theme': ConfigSchema(
                key='system.theme',
                type='string',
                default='dark',
                description='UI theme (dark/light)',
                validation={'enum': ['dark', 'light', 'auto']}
            ),
            'system.language': ConfigSchema(
                key='system.language',
                type='string',
                default='en',
                description='Interface language'
            ),
            'system.notifications': ConfigSchema(
                key='system.notifications',
                type='boolean',
                default=True,
                description='Enable notifications'
            ),
            
            # Supervision settings
            'supervision.idea_validation': ConfigSchema(
                key='supervision.idea_validation',
                type='boolean',
                default=True,
                description='Enable idea validation system'
            ),
            'supervision.task_coherence': ConfigSchema(
                key='supervision.task_coherence',
                type='boolean',
                default=True,
                description='Enable task coherence protection'
            ),
            'supervision.intervention_level': ConfigSchema(
                key='supervision.intervention_level',
                type='string',
                default='medium',
                description='Intervention aggressiveness level',
                validation={'enum': ['low', 'medium', 'high']}
            ),
            'supervision.auto_interventions': ConfigSchema(
                key='supervision.auto_interventions',
                type='boolean',
                default=True,
                description='Enable automatic interventions'
            ),
            
            # Hybrid architecture settings
            'hybrid.enabled': ConfigSchema(
                key='hybrid.enabled',
                type='boolean',
                default=True,
                description='Enable hybrid architecture mode'
            ),
            'hybrid.gateway_url': ConfigSchema(
                key='hybrid.gateway_url',
                type='string',
                default='ws://localhost:8888/ws',
                description='Hybrid gateway WebSocket URL'
            ),
            'hybrid.auto_connect': ConfigSchema(
                key='hybrid.auto_connect',
                type='boolean',
                default=True,
                description='Auto-connect to hybrid gateway'
            ),
            'hybrid.sync_interval': ConfigSchema(
                key='hybrid.sync_interval',
                type='number',
                default=30,
                description='Sync interval in seconds'
            ),
            
            # Extension-specific settings
            'extension.auto_detect_agents': ConfigSchema(
                key='extension.auto_detect_agents',
                type='boolean',
                default=True,
                description='Auto-detect AI agents on pages',
                scope=ConfigScope.DEPLOYMENT
            ),
            'extension.supported_platforms': ConfigSchema(
                key='extension.supported_platforms',
                type='array',
                default=['chatgpt', 'claude', 'gemini', 'minimax'],
                description='Supported AI platforms'
            ),
            
            # Local installation settings
            'local.server_port': ConfigSchema(
                key='local.server_port',
                type='number',
                default=8889,
                description='Local server port',
                scope=ConfigScope.DEPLOYMENT
            ),
            'local.auto_start': ConfigSchema(
                key='local.auto_start',
                type='boolean',
                default=True,
                description='Auto-start local server',
                scope=ConfigScope.DEPLOYMENT
            ),
            'local.system_tray': ConfigSchema(
                key='local.system_tray',
                type='boolean',
                default=True,
                description='Show system tray icon',
                scope=ConfigScope.DEPLOYMENT
            ),
            
            # Web app settings
            'web.auto_save': ConfigSchema(
                key='web.auto_save',
                type='boolean',
                default=True,
                description='Auto-save user data',
                scope=ConfigScope.DEPLOYMENT
            ),
            'web.session_timeout': ConfigSchema(
                key='web.session_timeout',
                type='number',
                default=3600,
                description='Session timeout in seconds',
                scope=ConfigScope.DEPLOYMENT
            )
        }
        
        self.schemas.update(default_schemas)
        logger.info(f"Loaded {len(self.schemas)} configuration schemas")
    
    def load_config(self):
        """Load configuration from storage."""
        config_file = self.storage_path / 'config.json'
        
        if config_file.exists():
            try:
                with open(config_file, 'r') as f:
                    data = json.load(f)
                
                for item_data in data.get('config_values', []):
                    config_value = ConfigValue.from_dict(item_data)
                    self.config_values[config_value.key] = config_value
                
                logger.info(f"Loaded {len(self.config_values)} configuration values")
                
            except Exception as e:
                logger.error(f"Failed to load configuration: {e}")
        else:
            # Initialize with default values
            self.reset_to_defaults()
    
    def save_config(self):
        """Save configuration to storage."""
        self.storage_path.mkdir(parents=True, exist_ok=True)
        config_file = self.storage_path / 'config.json'
        
        data = {
            'deployment_mode': self.deployment_mode.value,
            'last_updated': datetime.now().isoformat(),
            'version': 1,
            'config_values': [cv.to_dict() for cv in self.config_values.values()]
        }
        
        try:
            with open(config_file, 'w') as f:
                json.dump(data, f, indent=2)
            logger.info(f"Saved {len(self.config_values)} configuration values")
        except Exception as e:
            logger.error(f"Failed to save configuration: {e}")
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value."""
        if key in self.config_values:
            return self.config_values[key].value
        elif key in self.schemas:
            return self.schemas[key].default
        else:
            return default
    
    def set(self, key: str, value: Any, scope: ConfigScope = ConfigScope.USER, 
           description: Optional[str] = None, sync: bool = True) -> bool:
        """Set configuration value."""
        try:
            # Validate against schema if available
            if key in self.schemas:
                schema = self.schemas[key]
                if not self._validate_value(value, schema):
                    logger.error(f"Value validation failed for key: {key}")
                    return False
            
            # Create or update config value
            existing = self.config_values.get(key)
            version = (existing.version + 1) if existing else 1
            
            config_value = ConfigValue(
                key=key,
                value=value,
                scope=scope,
                deployment_mode=self.deployment_mode,
                version=version,
                timestamp=datetime.now(),
                checksum="",  # Will be calculated in __post_init__
                description=description
            )
            
            self.config_values[key] = config_value
            
            # Add to sync queue if sync enabled
            if sync and self.sync_enabled and key in self.schemas and self.schemas[key].sync_enabled:
                self.sync_queue.append(config_value)
            
            # Auto-save
            self.save_config()
            
            logger.info(f"Set configuration: {key} = {value}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to set configuration {key}: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete configuration value."""
        if key in self.config_values:
            del self.config_values[key]
            self.save_config()
            logger.info(f"Deleted configuration: {key}")
            return True
        return False
    
    def reset_to_defaults(self):
        """Reset all configuration to default values."""
        self.config_values.clear()
        
        for schema in self.schemas.values():
            self.set(schema.key, schema.default, schema.scope, 
                    schema.description, sync=False)
        
        logger.info("Configuration reset to defaults")
    
    def get_all_config(self) -> Dict[str, Any]:
        """Get all configuration values."""
        return {key: cv.value for key, cv in self.config_values.items()}
    
    def get_config_by_scope(self, scope: ConfigScope) -> Dict[str, Any]:
        """Get configuration values by scope."""
        return {
            key: cv.value 
            for key, cv in self.config_values.items() 
            if cv.scope == scope
        }
    
    def get_sync_config(self) -> Dict[str, Any]:
        """Get configuration values that should be synced."""
        return {
            key: cv.to_dict()
            for key, cv in self.config_values.items()
            if key in self.schemas and self.schemas[key].sync_enabled
        }
    
    def apply_sync_config(self, sync_data: Dict[str, Any]) -> List[str]:
        """Apply synchronized configuration data."""
        conflicts = []
        
        for key, item_data in sync_data.items():
            try:
                remote_config = ConfigValue.from_dict(item_data)
                
                if key in self.config_values:
                    local_config = self.config_values[key]
                    
                    # Check for conflicts
                    if (local_config.version != remote_config.version and 
                        local_config.timestamp > remote_config.timestamp):
                        conflicts.append(key)
                        logger.warning(f"Sync conflict for key: {key}")
                        continue
                
                # Apply remote configuration
                self.config_values[key] = remote_config
                logger.info(f"Applied sync for key: {key}")
                
            except Exception as e:
                logger.error(f"Failed to apply sync for key {key}: {e}")
                conflicts.append(key)
        
        if not conflicts:
            self.save_config()
            self.last_sync_time = datetime.now()
        
        return conflicts
    
    def _validate_value(self, value: Any, schema: ConfigSchema) -> bool:
        """Validate value against schema."""
        try:
            # Type validation
            if schema.type == 'string' and not isinstance(value, str):
                return False
            elif schema.type == 'number' and not isinstance(value, (int, float)):
                return False
            elif schema.type == 'boolean' and not isinstance(value, bool):
                return False
            elif schema.type == 'array' and not isinstance(value, list):
                return False
            elif schema.type == 'object' and not isinstance(value, dict):
                return False
            
            # Additional validation rules
            if schema.validation:
                if 'enum' in schema.validation:
                    if value not in schema.validation['enum']:
                        return False
                
                if 'min' in schema.validation:
                    if isinstance(value, (int, float)) and value < schema.validation['min']:
                        return False
                
                if 'max' in schema.validation:
                    if isinstance(value, (int, float)) and value > schema.validation['max']:
                        return False
                
                if 'pattern' in schema.validation:
                    import re
                    if isinstance(value, str) and not re.match(schema.validation['pattern'], value):
                        return False
            
            return True
            
        except Exception:
            return False
    
    def export_config(self, file_path: Path, include_system: bool = False) -> bool:
        """Export configuration to file."""
        try:
            export_data = {
                'deployment_mode': self.deployment_mode.value,
                'export_timestamp': datetime.now().isoformat(),
                'version': 1,
                'config_values': {}
            }
            
            for key, cv in self.config_values.items():
                if include_system or cv.scope != ConfigScope.SYSTEM:
                    export_data['config_values'][key] = cv.to_dict()
            
            with open(file_path, 'w') as f:
                json.dump(export_data, f, indent=2)
            
            logger.info(f"Configuration exported to {file_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to export configuration: {e}")
            return False
    
    def import_config(self, file_path: Path, merge: bool = True) -> bool:
        """Import configuration from file."""
        try:
            with open(file_path, 'r') as f:
                import_data = json.load(f)
            
            if not merge:
                self.config_values.clear()
            
            for key, item_data in import_data.get('config_values', {}).items():
                config_value = ConfigValue.from_dict(item_data)
                self.config_values[key] = config_value
            
            self.save_config()
            logger.info(f"Configuration imported from {file_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to import configuration: {e}")
            return False

# Global configuration manager instance
_config_manager: Optional[UnifiedConfigManager] = None

def get_config_manager(deployment_mode: DeploymentMode = None) -> UnifiedConfigManager:
    """Get global configuration manager instance."""
    global _config_manager
    
    if _config_manager is None:
        if deployment_mode is None:
            deployment_mode = DeploymentMode.LOCAL  # Default
        _config_manager = UnifiedConfigManager(deployment_mode)
    
    return _config_manager

def init_config(deployment_mode: DeploymentMode, storage_path: Optional[Path] = None):
    """Initialize global configuration manager."""
    global _config_manager
    _config_manager = UnifiedConfigManager(deployment_mode, storage_path)
    return _config_manager