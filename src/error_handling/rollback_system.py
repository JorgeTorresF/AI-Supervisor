"""Rollback System with state preservation and recovery capabilities."""

import asyncio
import json
import logging
import os
import shutil
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from pathlib import Path
import hashlib


@dataclass
class StateSnapshot:
    """Represents a state snapshot that can be restored."""
    snapshot_id: str
    timestamp: datetime
    agent_id: str
    task_id: str
    state_data: Dict[str, Any]
    metadata: Dict[str, Any]
    checksum: str
    version: str = "1.0"
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['timestamp'] = self.timestamp.isoformat()
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'StateSnapshot':
        data['timestamp'] = datetime.fromisoformat(data['timestamp'])
        return cls(**data)


class RollbackSystem:
    """System for creating state snapshots and rolling back to previous states."""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or self._default_config()
        self.logger = logging.getLogger(__name__)
        
        # Storage paths
        self.storage_path = Path(self.config.get('storage_path', 'snapshots'))
        self.storage_path.mkdir(parents=True, exist_ok=True)
        
        # In-memory snapshot cache
        self.snapshot_cache: Dict[str, StateSnapshot] = {}
        
        # Statistics
        self.stats = {
            'snapshots_created': 0,
            'rollbacks_executed': 0,
            'rollback_successes': 0,
            'rollback_failures': 0,
            'storage_size_mb': 0
        }
        
        # Load existing snapshots
        asyncio.create_task(self._load_existing_snapshots())
    
    def _default_config(self) -> Dict[str, Any]:
        """Default configuration for rollback system."""
        return {
            'storage_path': 'snapshots',
            'max_snapshots_per_agent': 10,
            'max_total_snapshots': 100,
            'cleanup_after_hours': 24,
            'compression_enabled': True,
            'verification_enabled': True,
            'backup_to_remote': False
        }
    
    async def create_snapshot(
        self,
        agent_id: str,
        task_id: str,
        state_data: Dict[str, Any],
        metadata: Dict[str, Any] = None
    ) -> str:
        """Create a state snapshot."""
        
        # Generate snapshot ID
        snapshot_id = self._generate_snapshot_id(agent_id, task_id)
        
        # Calculate checksum
        checksum = self._calculate_checksum(state_data)
        
        # Create snapshot
        snapshot = StateSnapshot(
            snapshot_id=snapshot_id,
            timestamp=datetime.utcnow(),
            agent_id=agent_id,
            task_id=task_id,
            state_data=state_data,
            metadata=metadata or {},
            checksum=checksum
        )
        
        # Store snapshot
        await self._store_snapshot(snapshot)
        
        # Cache snapshot
        self.snapshot_cache[snapshot_id] = snapshot
        
        # Cleanup old snapshots
        await self._cleanup_old_snapshots(agent_id)
        
        self.stats['snapshots_created'] += 1
        self.logger.info(f"Created snapshot {snapshot_id} for agent {agent_id}")
        
        return snapshot_id
    
    async def rollback_to_snapshot(
        self,
        snapshot_id: str,
        validation_callback: Optional[callable] = None
    ) -> Dict[str, Any]:
        """Rollback to a specific snapshot."""
        
        try:
            # Load snapshot
            snapshot = await self._load_snapshot(snapshot_id)
            if not snapshot:
                return {
                    'success': False,
                    'error': f'Snapshot {snapshot_id} not found',
                    'rollback_id': None
                }
            
            # Verify snapshot integrity
            if self.config.get('verification_enabled', True):
                if not self._verify_snapshot_integrity(snapshot):
                    return {
                        'success': False,
                        'error': f'Snapshot {snapshot_id} integrity check failed',
                        'rollback_id': None
                    }
            
            # Validate rollback if callback provided
            if validation_callback:
                validation_result = await validation_callback(snapshot)
                if not validation_result.get('valid', True):
                    return {
                        'success': False,
                        'error': f'Rollback validation failed: {validation_result.get("reason", "Unknown")}',
                        'rollback_id': None
                    }
            
            # Execute rollback
            rollback_id = await self._execute_rollback(snapshot)
            
            self.stats['rollbacks_executed'] += 1
            self.stats['rollback_successes'] += 1
            
            self.logger.info(f"Successfully rolled back to snapshot {snapshot_id}")
            
            return {
                'success': True,
                'snapshot_id': snapshot_id,
                'rollback_id': rollback_id,
                'state_data': snapshot.state_data,
                'metadata': snapshot.metadata,
                'timestamp': snapshot.timestamp.isoformat()
            }
            
        except Exception as e:
            self.stats['rollback_failures'] += 1
            self.logger.error(f"Rollback to snapshot {snapshot_id} failed: {str(e)}")
            
            return {
                'success': False,
                'error': str(e),
                'rollback_id': None
            }
    
    async def get_snapshots(
        self,
        agent_id: Optional[str] = None,
        task_id: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get available snapshots with optional filtering."""
        
        snapshots = []
        
        for snapshot in self.snapshot_cache.values():
            if agent_id and snapshot.agent_id != agent_id:
                continue
            if task_id and snapshot.task_id != task_id:
                continue
            
            snapshots.append({
                'snapshot_id': snapshot.snapshot_id,
                'timestamp': snapshot.timestamp.isoformat(),
                'agent_id': snapshot.agent_id,
                'task_id': snapshot.task_id,
                'metadata': snapshot.metadata,
                'size_bytes': len(json.dumps(snapshot.state_data))
            })
        
        # Sort by timestamp (newest first)
        snapshots.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return snapshots[:limit]
    
    async def delete_snapshot(self, snapshot_id: str) -> bool:
        """Delete a specific snapshot."""
        
        try:
            # Remove from cache
            self.snapshot_cache.pop(snapshot_id, None)
            
            # Remove from storage
            snapshot_file = self.storage_path / f"{snapshot_id}.json"
            if snapshot_file.exists():
                snapshot_file.unlink()
            
            self.logger.info(f"Deleted snapshot {snapshot_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to delete snapshot {snapshot_id}: {str(e)}")
            return False
    
    def _generate_snapshot_id(self, agent_id: str, task_id: str) -> str:
        """Generate a unique snapshot ID."""
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S_%f')
        return f"{agent_id}_{task_id}_{timestamp}"
    
    def _calculate_checksum(self, data: Any) -> str:
        """Calculate checksum for data integrity."""
        data_str = json.dumps(data, sort_keys=True, default=str)
        return hashlib.sha256(data_str.encode()).hexdigest()
    
    def _verify_snapshot_integrity(self, snapshot: StateSnapshot) -> bool:
        """Verify snapshot data integrity."""
        calculated_checksum = self._calculate_checksum(snapshot.state_data)
        return calculated_checksum == snapshot.checksum
    
    async def _store_snapshot(self, snapshot: StateSnapshot):
        """Store snapshot to disk."""
        snapshot_file = self.storage_path / f"{snapshot.snapshot_id}.json"
        
        with open(snapshot_file, 'w') as f:
            json.dump(snapshot.to_dict(), f, indent=2, default=str)
        
        # Update storage size stats
        self.stats['storage_size_mb'] = sum(
            f.stat().st_size for f in self.storage_path.glob('*.json')
        ) / (1024 * 1024)
    
    async def _load_snapshot(self, snapshot_id: str) -> Optional[StateSnapshot]:
        """Load snapshot from cache or disk."""
        
        # Check cache first
        if snapshot_id in self.snapshot_cache:
            return self.snapshot_cache[snapshot_id]
        
        # Load from disk
        snapshot_file = self.storage_path / f"{snapshot_id}.json"
        if not snapshot_file.exists():
            return None
        
        try:
            with open(snapshot_file, 'r') as f:
                data = json.load(f)
            
            snapshot = StateSnapshot.from_dict(data)
            self.snapshot_cache[snapshot_id] = snapshot
            return snapshot
            
        except Exception as e:
            self.logger.error(f"Failed to load snapshot {snapshot_id}: {str(e)}")
            return None
    
    async def _load_existing_snapshots(self):
        """Load existing snapshots from storage."""
        
        try:
            for snapshot_file in self.storage_path.glob('*.json'):
                snapshot_id = snapshot_file.stem
                snapshot = await self._load_snapshot(snapshot_id)
                if snapshot:
                    self.snapshot_cache[snapshot_id] = snapshot
            
            self.logger.info(f"Loaded {len(self.snapshot_cache)} existing snapshots")
            
        except Exception as e:
            self.logger.error(f"Failed to load existing snapshots: {str(e)}")
    
    async def _execute_rollback(self, snapshot: StateSnapshot) -> str:
        """Execute the actual rollback operation."""
        
        # Generate rollback ID
        rollback_id = f"rollback_{snapshot.snapshot_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        
        # Log rollback operation
        rollback_log = {
            'rollback_id': rollback_id,
            'snapshot_id': snapshot.snapshot_id,
            'timestamp': datetime.utcnow().isoformat(),
            'agent_id': snapshot.agent_id,
            'task_id': snapshot.task_id,
            'state_restored': True
        }
        
        # Save rollback log
        log_file = self.storage_path / f"rollback_{rollback_id}.json"
        with open(log_file, 'w') as f:
            json.dump(rollback_log, f, indent=2)
        
        return rollback_id
    
    async def _cleanup_old_snapshots(self, agent_id: str):
        """Clean up old snapshots for an agent."""
        
        # Get snapshots for this agent
        agent_snapshots = [
            s for s in self.snapshot_cache.values()
            if s.agent_id == agent_id
        ]
        
        # Sort by timestamp (oldest first)
        agent_snapshots.sort(key=lambda x: x.timestamp)
        
        # Remove excess snapshots
        max_snapshots = self.config.get('max_snapshots_per_agent', 10)
        if len(agent_snapshots) > max_snapshots:
            snapshots_to_remove = agent_snapshots[:-max_snapshots]
            
            for snapshot in snapshots_to_remove:
                await self.delete_snapshot(snapshot.snapshot_id)
        
        # Remove old snapshots based on age
        cleanup_hours = self.config.get('cleanup_after_hours', 24)
        cutoff_time = datetime.utcnow() - timedelta(hours=cleanup_hours)
        
        for snapshot in agent_snapshots:
            if snapshot.timestamp < cutoff_time:
                await self.delete_snapshot(snapshot.snapshot_id)
    
    async def get_status(self) -> Dict[str, Any]:
        """Get status of the rollback system."""
        return {
            'cached_snapshots': len(self.snapshot_cache),
            'stats': self.stats,
            'storage_path': str(self.storage_path),
            'config': self.config,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    async def shutdown(self):
        """Shutdown the rollback system."""
        self.logger.info("Shutting down rollback system")
        self.snapshot_cache.clear()
        self.logger.info("Rollback system shutdown complete")
