"""History Manager for versioned tracking of agent states and interventions."""

import asyncio
import json
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path
import difflib
import gzip


@dataclass
class HistoryEntry:
    """Represents a single history entry."""
    entry_id: str
    timestamp: datetime
    agent_id: str
    task_id: str
    entry_type: str  # 'state', 'error', 'intervention', 'recovery'
    version: str
    data: Dict[str, Any]
    metadata: Dict[str, Any]
    parent_version: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['timestamp'] = self.timestamp.isoformat()
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'HistoryEntry':
        data['timestamp'] = datetime.fromisoformat(data['timestamp'])
        return cls(**data)


class HistoryManager:
    """System for managing versioned history of agent outputs and interventions."""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or self._default_config()
        self.logger = logging.getLogger(__name__)
        
        # Storage paths
        self.storage_path = Path(self.config.get('storage_path', 'history'))
        self.storage_path.mkdir(parents=True, exist_ok=True)
        
        # In-memory history cache
        self.history_cache: Dict[str, List[HistoryEntry]] = {}
        
        # Version tracking
        self.version_counters: Dict[str, int] = {}
        
        # Statistics
        self.stats = {
            'entries_created': 0,
            'versions_tracked': 0,
            'interventions_recorded': 0,
            'comparisons_performed': 0,
            'cleanups_performed': 0
        }
        
        # Load existing history
        asyncio.create_task(self._load_existing_history())
    
    def _default_config(self) -> Dict[str, Any]:
        """Default configuration for history manager."""
        return {
            'storage_path': 'history',
            'max_versions_per_agent': 100,
            'retention_days': 30,
            'compression_enabled': True,
            'auto_cleanup_hours': 24,
            'diff_algorithm': 'unified',
            'cache_size': 1000
        }
    
    async def record_error(self, error_context: 'ErrorContext') -> str:
        """Record an error in the history."""
        
        entry_id = await self._create_history_entry(
            agent_id=error_context.agent_id,
            task_id=error_context.task_id,
            entry_type='error',
            data={
                'error_id': error_context.error_id,
                'error_type': error_context.error_type.value,
                'severity': error_context.severity.value,
                'error_message': error_context.error_message,
                'stack_trace': error_context.stack_trace,
                'context_data': error_context.context_data
            },
            metadata={
                'retry_count': error_context.retry_count,
                'recovery_attempts': error_context.recovery_attempts
            }
        )
        
        return entry_id
    
    async def record_state(
        self,
        agent_id: str,
        task_id: str,
        state_data: Dict[str, Any],
        metadata: Dict[str, Any] = None
    ) -> str:
        """Record an agent state in the history."""
        
        entry_id = await self._create_history_entry(
            agent_id=agent_id,
            task_id=task_id,
            entry_type='state',
            data=state_data,
            metadata=metadata or {}
        )
        
        return entry_id
    
    async def record_intervention(
        self,
        agent_id: str,
        task_id: str,
        intervention_type: str,
        before_data: Dict[str, Any],
        after_data: Dict[str, Any],
        metadata: Dict[str, Any] = None
    ) -> str:
        """Record an intervention in the history."""
        
        entry_id = await self._create_history_entry(
            agent_id=agent_id,
            task_id=task_id,
            entry_type='intervention',
            data={
                'intervention_type': intervention_type,
                'before_state': before_data,
                'after_state': after_data,
                'diff': await self._generate_diff(before_data, after_data)
            },
            metadata=metadata or {}
        )
        
        self.stats['interventions_recorded'] += 1
        
        return entry_id
    
    async def record_recovery(
        self,
        agent_id: str,
        task_id: str,
        recovery_data: Dict[str, Any],
        metadata: Dict[str, Any] = None
    ) -> str:
        """Record a recovery operation in the history."""
        
        entry_id = await self._create_history_entry(
            agent_id=agent_id,
            task_id=task_id,
            entry_type='recovery',
            data=recovery_data,
            metadata=metadata or {}
        )
        
        return entry_id
    
    async def _create_history_entry(
        self,
        agent_id: str,
        task_id: str,
        entry_type: str,
        data: Dict[str, Any],
        metadata: Dict[str, Any],
        parent_version: Optional[str] = None
    ) -> str:
        """Create a new history entry."""
        
        # Generate entry ID and version
        import uuid
        entry_id = str(uuid.uuid4())
        version = self._get_next_version(agent_id, task_id)
        
        # Create history entry
        entry = HistoryEntry(
            entry_id=entry_id,
            timestamp=datetime.utcnow(),
            agent_id=agent_id,
            task_id=task_id,
            entry_type=entry_type,
            version=version,
            data=data,
            metadata=metadata,
            parent_version=parent_version
        )
        
        # Store entry
        await self._store_history_entry(entry)
        
        # Update cache
        cache_key = f"{agent_id}_{task_id}"
        if cache_key not in self.history_cache:
            self.history_cache[cache_key] = []
        
        self.history_cache[cache_key].append(entry)
        
        # Cleanup old entries if necessary
        await self._cleanup_old_entries(cache_key)
        
        self.stats['entries_created'] += 1
        self.stats['versions_tracked'] += 1
        
        return entry_id
    
    async def get_history(
        self,
        agent_id: str,
        task_id: Optional[str] = None,
        entry_type: Optional[str] = None,
        limit: int = 50,
        since: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Get history entries with optional filtering."""
        
        entries = []
        
        # Search through cache
        for cache_key, cached_entries in self.history_cache.items():
            key_agent_id, key_task_id = cache_key.split('_', 1)
            
            if key_agent_id != agent_id:
                continue
            
            if task_id and key_task_id != task_id:
                continue
            
            for entry in cached_entries:
                if entry_type and entry.entry_type != entry_type:
                    continue
                
                if since and entry.timestamp < since:
                    continue
                
                entries.append(entry.to_dict())
        
        # Sort by timestamp (newest first)
        entries.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return entries[:limit]
    
    async def get_version_history(
        self,
        agent_id: str,
        task_id: str
    ) -> List[Dict[str, Any]]:
        """Get version history for a specific agent/task."""
        
        cache_key = f"{agent_id}_{task_id}"
        entries = self.history_cache.get(cache_key, [])
        
        # Group by version
        version_history = []
        for entry in sorted(entries, key=lambda x: x.timestamp):
            version_history.append({
                'version': entry.version,
                'timestamp': entry.timestamp.isoformat(),
                'entry_type': entry.entry_type,
                'entry_id': entry.entry_id,
                'parent_version': entry.parent_version,
                'has_changes': len(entry.data) > 0
            })
        
        return version_history
    
    async def compare_versions(
        self,
        agent_id: str,
        task_id: str,
        version1: str,
        version2: str
    ) -> Dict[str, Any]:
        """Compare two versions and generate diff."""
        
        entry1 = await self._get_entry_by_version(agent_id, task_id, version1)
        entry2 = await self._get_entry_by_version(agent_id, task_id, version2)
        
        if not entry1 or not entry2:
            return {'error': 'One or both versions not found'}
        
        # Generate diff
        diff = await self._generate_diff(entry1.data, entry2.data)
        
        self.stats['comparisons_performed'] += 1
        
        return {
            'version1': {
                'version': entry1.version,
                'timestamp': entry1.timestamp.isoformat(),
                'entry_type': entry1.entry_type
            },
            'version2': {
                'version': entry2.version,
                'timestamp': entry2.timestamp.isoformat(),
                'entry_type': entry2.entry_type
            },
            'diff': diff,
            'comparison_timestamp': datetime.utcnow().isoformat()
        }
    
    async def get_intervention_timeline(
        self,
        agent_id: str,
        task_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get timeline of interventions for an agent."""
        
        interventions = await self.get_history(
            agent_id=agent_id,
            task_id=task_id,
            entry_type='intervention'
        )
        
        timeline = []
        for intervention in interventions:
            timeline.append({
                'timestamp': intervention['timestamp'],
                'intervention_type': intervention['data'].get('intervention_type', 'unknown'),
                'version': intervention['version'],
                'has_before_after': 'before_state' in intervention['data'] and 'after_state' in intervention['data'],
                'metadata': intervention['metadata']
            })
        
        return timeline
    
    async def _generate_diff(
        self,
        data1: Dict[str, Any],
        data2: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate diff between two data structures."""
        
        try:
            # Convert to JSON strings for comparison
            json1 = json.dumps(data1, indent=2, sort_keys=True, default=str)
            json2 = json.dumps(data2, indent=2, sort_keys=True, default=str)
            
            # Generate unified diff
            diff_lines = list(difflib.unified_diff(
                json1.splitlines(keepends=True),
                json2.splitlines(keepends=True),
                fromfile='before',
                tofile='after',
                lineterm=''
            ))
            
            # Count changes
            additions = sum(1 for line in diff_lines if line.startswith('+') and not line.startswith('+++'))
            deletions = sum(1 for line in diff_lines if line.startswith('-') and not line.startswith('---'))
            
            return {
                'diff_lines': diff_lines,
                'additions': additions,
                'deletions': deletions,
                'total_changes': additions + deletions,
                'algorithm': self.config.get('diff_algorithm', 'unified')
            }
            
        except Exception as e:
            self.logger.error(f"Failed to generate diff: {str(e)}")
            return {
                'error': str(e),
                'diff_lines': [],
                'additions': 0,
                'deletions': 0,
                'total_changes': 0
            }
    
    def _get_next_version(self, agent_id: str, task_id: str) -> str:
        """Get next version number for agent/task."""
        key = f"{agent_id}_{task_id}"
        
        if key not in self.version_counters:
            self.version_counters[key] = 0
        
        self.version_counters[key] += 1
        return f"v{self.version_counters[key]:04d}"
    
    async def _get_entry_by_version(
        self,
        agent_id: str,
        task_id: str,
        version: str
    ) -> Optional[HistoryEntry]:
        """Get a specific entry by version."""
        
        cache_key = f"{agent_id}_{task_id}"
        entries = self.history_cache.get(cache_key, [])
        
        for entry in entries:
            if entry.version == version:
                return entry
        
        return None
    
    async def _store_history_entry(self, entry: HistoryEntry):
        """Store history entry to disk."""
        
        # Create directory structure
        agent_dir = self.storage_path / entry.agent_id
        agent_dir.mkdir(exist_ok=True)
        
        # Create filename
        filename = f"{entry.task_id}_{entry.version}_{entry.entry_type}.json"
        
        if self.config.get('compression_enabled', True):
            filename += '.gz'
            file_path = agent_dir / filename
            
            with gzip.open(file_path, 'wt') as f:
                json.dump(entry.to_dict(), f, indent=2, default=str)
        else:
            file_path = agent_dir / filename
            
            with open(file_path, 'w') as f:
                json.dump(entry.to_dict(), f, indent=2, default=str)
    
    async def _load_existing_history(self):
        """Load existing history from storage."""
        
        try:
            for agent_dir in self.storage_path.iterdir():
                if not agent_dir.is_dir():
                    continue
                
                agent_id = agent_dir.name
                
                for history_file in agent_dir.glob('*.json*'):
                    try:
                        # Load entry
                        if history_file.suffix == '.gz':
                            with gzip.open(history_file, 'rt') as f:
                                data = json.load(f)
                        else:
                            with open(history_file, 'r') as f:
                                data = json.load(f)
                        
                        entry = HistoryEntry.from_dict(data)
                        
                        # Add to cache
                        cache_key = f"{entry.agent_id}_{entry.task_id}"
                        if cache_key not in self.history_cache:
                            self.history_cache[cache_key] = []
                        
                        self.history_cache[cache_key].append(entry)
                        
                        # Update version counter
                        version_num = int(entry.version[1:])  # Remove 'v' prefix
                        if cache_key not in self.version_counters or version_num > self.version_counters[cache_key]:
                            self.version_counters[cache_key] = version_num
                        
                    except Exception as e:
                        self.logger.error(f"Failed to load history file {history_file}: {str(e)}")
            
            total_entries = sum(len(entries) for entries in self.history_cache.values())
            self.logger.info(f"Loaded {total_entries} history entries from storage")
            
        except Exception as e:
            self.logger.error(f"Failed to load existing history: {str(e)}")
    
    async def _cleanup_old_entries(self, cache_key: str):
        """Clean up old entries for a specific cache key."""
        
        entries = self.history_cache.get(cache_key, [])
        max_versions = self.config.get('max_versions_per_agent', 100)
        retention_days = self.config.get('retention_days', 30)
        
        # Remove excess versions
        if len(entries) > max_versions:
            # Sort by timestamp and keep newest
            entries.sort(key=lambda x: x.timestamp, reverse=True)
            entries_to_remove = entries[max_versions:]
            
            for entry in entries_to_remove:
                await self._delete_entry(entry)
            
            self.history_cache[cache_key] = entries[:max_versions]
        
        # Remove old entries
        cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
        entries_to_keep = []
        
        for entry in self.history_cache[cache_key]:
            if entry.timestamp >= cutoff_date:
                entries_to_keep.append(entry)
            else:
                await self._delete_entry(entry)
        
        self.history_cache[cache_key] = entries_to_keep
        self.stats['cleanups_performed'] += 1
    
    async def _delete_entry(self, entry: HistoryEntry):
        """Delete a history entry from disk."""
        
        try:
            agent_dir = self.storage_path / entry.agent_id
            filename = f"{entry.task_id}_{entry.version}_{entry.entry_type}.json"
            
            # Try both compressed and uncompressed versions
            for ext in ['.gz', '']:
                file_path = agent_dir / (filename + ext)
                if file_path.exists():
                    file_path.unlink()
                    break
                    
        except Exception as e:
            self.logger.error(f"Failed to delete history entry {entry.entry_id}: {str(e)}")
    
    async def get_status(self) -> Dict[str, Any]:
        """Get status of the history manager."""
        total_entries = sum(len(entries) for entries in self.history_cache.values())
        
        return {
            'cached_entries': total_entries,
            'tracked_agents': len(self.history_cache),
            'version_counters': len(self.version_counters),
            'stats': self.stats,
            'storage_path': str(self.storage_path),
            'config': self.config,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    async def shutdown(self):
        """Shutdown the history manager."""
        self.logger.info("Shutting down history manager")
        
        # Perform final cleanup
        for cache_key in list(self.history_cache.keys()):
            await self._cleanup_old_entries(cache_key)
        
        self.history_cache.clear()
        self.version_counters.clear()
        
        self.logger.info("History manager shutdown complete")
