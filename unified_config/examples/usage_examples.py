"""Example usage of the Unified Configuration System."""

import asyncio
import json
from pathlib import Path

from unified_config.src.config_manager import (
    UnifiedConfigManager, DeploymentMode, ConfigScope
)
from unified_config.src.sync_client import ConfigSyncClient, SyncEvent
from unified_config.src.integrations import create_integration

async def basic_configuration_example():
    """Basic configuration management example."""
    print("=== Basic Configuration Management ===")
    
    # Initialize configuration manager for local installation
    config = UnifiedConfigManager(DeploymentMode.LOCAL)
    
    # Get configuration values
    theme = config.get('system.theme')
    idea_validation = config.get('supervision.idea_validation')
    
    print(f"Current theme: {theme}")
    print(f"Idea validation enabled: {idea_validation}")
    
    # Set configuration values
    print("\nChanging configuration...")
    config.set('system.theme', 'light')
    config.set('supervision.intervention_level', 'high')
    config.set('local.auto_start', False)
    
    # Get all configuration
    all_config = config.get_all_config()
    print(f"\nAll configuration ({len(all_config)} items):")
    for key, value in all_config.items():
        print(f"  {key}: {value}")
    
    # Export configuration
    export_path = Path('config_export.json')
    success = config.export_config(export_path)
    print(f"\nConfiguration exported: {success}")
    
    return config

async def synchronization_example():
    """Configuration synchronization example."""
    print("\n=== Configuration Synchronization ===")
    
    # Create configurations for different deployment modes
    web_config = UnifiedConfigManager(DeploymentMode.WEB)
    extension_config = UnifiedConfigManager(DeploymentMode.EXTENSION)
    
    # Create sync clients
    web_sync = ConfigSyncClient(web_config, user_id="test_user")
    extension_sync = ConfigSyncClient(extension_config, user_id="test_user")
    
    # Event handlers
    def on_sync_complete(event, data):
        print(f"Sync completed: {data.get('items_synced', 0)} items")
    
    def on_config_changed(event, data):
        print(f"Config changed: {data['key']} = {data['value']} (from {data['source_mode']})")
    
    def on_conflict_detected(event, data):
        print(f"Sync conflicts detected: {data['conflicts']}")
    
    # Add event handlers
    web_sync.add_event_handler(SyncEvent.SYNC_COMPLETE, on_sync_complete)
    web_sync.add_event_handler(SyncEvent.CONFIG_CHANGED, on_config_changed)
    web_sync.add_event_handler(SyncEvent.CONFLICT_DETECTED, on_conflict_detected)
    
    # Simulate connections (would actually connect to hybrid gateway)
    print("Simulating sync connections...")
    
    # Make different changes on each deployment
    web_config.set('system.theme', 'dark')
    web_config.set('supervision.idea_validation', True)
    
    extension_config.set('system.theme', 'light')  # This would create a conflict
    extension_config.set('extension.auto_detect_agents', False)
    
    # Show sync configurations
    web_sync_config = web_config.get_sync_config()
    extension_sync_config = extension_config.get_sync_config()
    
    print(f"\nWeb app sync config: {len(web_sync_config)} items")
    print(f"Extension sync config: {len(extension_sync_config)} items")
    
    # Simulate conflict resolution
    print("\nResolving theme conflict...")
    web_config.set('system.theme', 'dark')  # Resolve to dark theme
    extension_config.set('system.theme', 'dark')  # Apply same on extension
    
    print("Conflict resolved: Both deployments using dark theme")

async def deployment_integration_example():
    """Deployment integration example."""
    print("\n=== Deployment Integration ===")
    
    # Create configuration managers for different modes
    configs = {
        'web': UnifiedConfigManager(DeploymentMode.WEB),
        'extension': UnifiedConfigManager(DeploymentMode.EXTENSION),
        'local': UnifiedConfigManager(DeploymentMode.LOCAL)
    }
    
    # Create integrations
    integrations = {}
    for mode, config in configs.items():
        deployment_mode = DeploymentMode(mode)
        integration = create_integration(deployment_mode, config)
        await integration.initialize()
        integrations[mode] = integration
    
    # Show deployment statuses
    print("\nDeployment statuses:")
    for mode, integration in integrations.items():
        status = integration.get_deployment_status()
        print(f"  {mode.upper()}: {json.dumps(status, indent=4)}")
    
    # Apply configuration changes
    print("\nApplying configuration changes...")
    
    # Change theme on web app
    await integrations['web'].apply_config_change('system.theme', 'light')
    
    # Enable auto-detect on extension
    await integrations['extension'].apply_config_change('extension.auto_detect_agents', True)
    
    # Change server port on local installation
    await integrations['local'].apply_config_change('local.server_port', 8890)
    
    print("Configuration changes applied to all deployments")

async def advanced_features_example():
    """Advanced configuration features example."""
    print("\n=== Advanced Features ===")
    
    config = UnifiedConfigManager(DeploymentMode.HYBRID)
    
    # Configuration by scope
    user_config = config.get_config_by_scope(ConfigScope.USER)
    deployment_config = config.get_config_by_scope(ConfigScope.DEPLOYMENT)
    
    print(f"\nUser-scoped configuration: {len(user_config)} items")
    for key, value in user_config.items():
        print(f"  {key}: {value}")
    
    print(f"\nDeployment-scoped configuration: {len(deployment_config)} items")
    for key, value in deployment_config.items():
        print(f"  {key}: {value}")
    
    # Reset to defaults
    print("\nResetting to defaults...")
    config.reset_to_defaults()
    
    # Custom configuration with validation
    print("\nTesting configuration validation...")
    
    # Valid values
    success = config.set('supervision.intervention_level', 'high')
    print(f"Set intervention_level to 'high': {success}")
    
    # Invalid values (should fail validation)
    success = config.set('supervision.intervention_level', 'extreme')
    print(f"Set intervention_level to 'extreme': {success}")
    
    success = config.set('local.server_port', 'not_a_number')
    print(f"Set server_port to 'not_a_number': {success}")
    
    # Configuration import/export
    print("\nTesting import/export...")
    
    # Create a custom configuration
    custom_config = {
        'system.theme': 'auto',
        'system.language': 'es',
        'supervision.auto_interventions': False
    }
    
    # Save custom config to file
    custom_config_path = Path('custom_config.json')
    with open(custom_config_path, 'w') as f:
        json.dump({
            'deployment_mode': 'hybrid',
            'export_timestamp': '2025-01-01T00:00:00',
            'version': 1,
            'config_values': {
                key: {
                    'key': key,
                    'value': value,
                    'scope': 'user',
                    'deployment_mode': 'hybrid',
                    'version': 1,
                    'timestamp': '2025-01-01T00:00:00',
                    'checksum': 'abc123'
                } for key, value in custom_config.items()
            }
        }, f, indent=2)
    
    # Import custom configuration
    success = config.import_config(custom_config_path, merge=True)
    print(f"Import custom configuration: {success}")
    
    # Show final configuration
    final_config = config.get_all_config()
    print(f"\nFinal configuration: {len(final_config)} items")
    
    # Cleanup
    custom_config_path.unlink()

async def main():
    """Run all configuration examples."""
    print("🛠️ AI Agent Supervisor - Unified Configuration System Examples")
    print("=" * 70)
    
    try:
        # Run examples
        config = await basic_configuration_example()
        await synchronization_example()
        await deployment_integration_example()
        await advanced_features_example()
        
        print("\n" + "=" * 70)
        print("✅ All configuration examples completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error running examples: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Cleanup export files
        for file_path in [Path('config_export.json')]:
            if file_path.exists():
                file_path.unlink()

if __name__ == "__main__":
    asyncio.run(main())