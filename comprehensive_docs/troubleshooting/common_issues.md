# Troubleshooting Guide - Common Issues

## Overview

This guide covers the most common issues across all deployment modes of the AI Agent Supervisor system, their symptoms, root causes, and step-by-step solutions.

## General Troubleshooting Approach

### 1. Identify the Issue
- **Gather Symptoms**: What exactly is not working?
- **Check Logs**: Review application logs for error messages
- **Verify Configuration**: Ensure settings are correct
- **Test Components**: Isolate the problematic component

### 2. Common Diagnostic Commands

```bash
# Check system status
curl http://localhost:8889/api/v1/status

# View logs
tail -f ~/.ai_supervisor/logs/supervisor_local.log

# Check processes
ps aux | grep -E "(local_server|python|node)"

# Check network connections
netstat -tuln | grep -E "(8888|8889)"

# Test WebSocket connection
wscat ws://localhost:8888/ws
```

## Installation Issues

### Python Version Incompatibility

**Symptoms**:
- Import errors during installation
- "Python version not supported" messages
- Module compatibility warnings

**Root Cause**: Using Python version < 3.8

**Solution**:
```bash
# Check Python version
python3 --version

# Install Python 3.8+ if needed
# Ubuntu/Debian
sudo apt update
sudo apt install python3.10

# macOS (using Homebrew)
brew install python@3.10

# Update pip
python3.10 -m pip install --upgrade pip

# Reinstall dependencies
python3.10 -m pip install -r requirements.txt
```

### Missing Dependencies

**Symptoms**:
- ModuleNotFoundError during startup
- Import failures in logs
- Incomplete functionality

**Root Cause**: Dependencies not properly installed

**Solution**:
```bash
# Verify pip is working
pip3 --version

# Install missing dependencies
pip3 install -r requirements.txt --force-reinstall

# For specific missing modules
pip3 install fastapi uvicorn websockets

# Check installed packages
pip3 list | grep -E "(fastapi|uvicorn|websockets)"
```

### Permission Denied Errors

**Symptoms**:
- Cannot create directories
- Cannot write to log files
- Installation script fails

**Root Cause**: Insufficient file system permissions

**Solution**:
```bash
# Fix ownership of installation directory
sudo chown -R $USER:$USER ~/.ai_supervisor

# Set correct permissions
chmod -R 755 ~/.ai_supervisor
chmod +x ~/.ai_supervisor/server/start_server.sh

# For system service installation
sudo chmod +x /usr/local/bin/ai-supervisor
```

## Connection Issues

### Port Already in Use

**Symptoms**:
- "Address already in use" errors
- Server fails to start
- "Port 8889 is busy" messages

**Root Cause**: Another process is using the required port

**Solution**:
```bash
# Find process using the port
lsof -i :8889

# Kill the process
kill -9 $(lsof -ti:8889)

# Or use a different port
# Edit ~/.ai_supervisor/config.json
{
  "server": {
    "port": 8890
  }
}

# Start with custom port
python3 local_server.py --port 8890
```

### WebSocket Connection Failed

**Symptoms**:
- "WebSocket connection failed" in browser extension
- Sync not working between modes
- Real-time updates not functioning

**Root Cause**: WebSocket server not running or blocked

**Solution**:
```bash
# Check if WebSocket server is running
netstat -tuln | grep 8888

# Test WebSocket connection
# Install wscat if needed: npm install -g wscat
wscat -c ws://localhost:8888/ws

# Check firewall settings
sudo ufw status

# Allow WebSocket port
sudo ufw allow 8888

# Restart hybrid gateway
cd hybrid_architecture
python3 main.py
```

### Network Connectivity Issues

**Symptoms**:
- "Connection timeout" errors
- Cannot reach web application
- Hybrid sync not working

**Root Cause**: Network configuration or firewall issues

**Solution**:
```bash
# Test local connectivity
ping localhost
curl http://localhost:8889/health

# Check DNS resolution
nslookup ncczq77atgsg.space.minimax.io

# Test external connectivity
curl -I https://ncczq77atgsg.space.minimax.io

# Check proxy settings
echo $HTTP_PROXY
echo $HTTPS_PROXY

# Disable proxy temporarily
unset HTTP_PROXY HTTPS_PROXY
```

## Configuration Issues

### Invalid Configuration Format

**Symptoms**:
- "Configuration parse error" messages
- Settings not loading properly
- Default values being used unexpectedly

**Root Cause**: Malformed JSON in configuration files

**Solution**:
```bash
# Validate JSON configuration
python3 -m json.tool ~/.ai_supervisor/config.json

# If invalid, restore from backup
cp ~/.ai_supervisor/config.json.backup ~/.ai_supervisor/config.json

# Or reset to defaults
curl -X POST http://localhost:8889/api/v1/config/reset
```

### Settings Not Syncing

**Symptoms**:
- Changes in web app not reflected in extension
- Configuration drift between deployment modes
- "Sync failed" warnings

**Root Cause**: Sync client not connected or authentication issues

**Solution**:
```bash
# Check hybrid gateway status
curl http://localhost:8888/api/v1/status

# Test authentication
curl -H "Authorization: Bearer your_token" \
  http://localhost:8888/api/v1/connections

# Force manual sync
curl -X POST http://localhost:8888/api/v1/sync \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "source_mode": "local",
    "target_modes": ["web", "extension"],
    "data_types": ["settings"]
  }'
```

## Performance Issues

### High Memory Usage

**Symptoms**:
- System running slowly
- "Out of memory" errors
- High RAM consumption by AI Supervisor processes

**Root Cause**: Memory leaks or inefficient configuration

**Solution**:
```bash
# Monitor memory usage
top -p $(pgrep -f local_server)

# Check memory configuration
grep -E "memory|cache" ~/.ai_supervisor/config.json

# Optimize configuration
{
  "performance": {
    "max_memory_mb": 256,
    "gc_threshold": 0.8,
    "cache_size": 100
  }
}

# Restart with memory limits
sudo systemd-run --scope -p MemoryMax=512M python3 local_server.py
```

### Slow Response Times

**Symptoms**:
- API endpoints taking >5 seconds to respond
- UI feels sluggish
- Timeouts in browser extension

**Root Cause**: Database performance or network latency

**Solution**:
```bash
# Check database performance
sqlite3 ~/.ai_supervisor/data/supervisor.db "PRAGMA integrity_check;"
sqlite3 ~/.ai_supervisor/data/supervisor.db "VACUUM;"

# Monitor API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8889/api/v1/status

# Optimize database
sqlite3 ~/.ai_supervisor/data/supervisor.db "PRAGMA optimize;"

# Enable query optimization
sqlite3 ~/.ai_supervisor/data/supervisor.db "PRAGMA analysis_limit=1000;"
```

### High CPU Usage

**Symptoms**:
- CPU usage consistently >50%
- Fan running constantly
- System overheating

**Root Cause**: Inefficient processing or infinite loops

**Solution**:
```bash
# Profile CPU usage
top -H -p $(pgrep -f local_server)

# Check for infinite loops in logs
grep -E "(loop|infinite|stuck)" ~/.ai_supervisor/logs/supervisor_local.log

# Reduce processing frequency
{
  "performance": {
    "analysis_frequency": "low",
    "sync_interval": 60,
    "heartbeat_interval": 30
  }
}

# Use production settings
export ENVIRONMENT=production
python3 local_server.py
```

## Database Issues

### Database Locked Errors

**Symptoms**:
- "Database is locked" error messages
- Operations timing out
- Data not being saved

**Root Cause**: Multiple processes accessing SQLite database

**Solution**:
```bash
# Check for multiple processes
ps aux | grep -E "(local_server|sqlite)"

# Kill zombie processes
kill $(ps aux | grep '[l]ocal_server' | awk '{print $2}')

# Fix database locks
sqlite3 ~/.ai_supervisor/data/supervisor.db "BEGIN IMMEDIATE; ROLLBACK;"

# Enable WAL mode for better concurrency
sqlite3 ~/.ai_supervisor/data/supervisor.db "PRAGMA journal_mode=WAL;"
```

### Database Corruption

**Symptoms**:
- "Database disk image is malformed" errors
- Data inconsistencies
- Crashes during database operations

**Root Cause**: Improper shutdowns or hardware issues

**Solution**:
```bash
# Check database integrity
sqlite3 ~/.ai_supervisor/data/supervisor.db "PRAGMA integrity_check;"

# Attempt repair
sqlite3 ~/.ai_supervisor/data/supervisor.db ".recover" | \
  sqlite3 ~/.ai_supervisor/data/supervisor_recovered.db

# Restore from backup
cp ~/.ai_supervisor/backups/supervisor_latest.db \
   ~/.ai_supervisor/data/supervisor.db

# If all else fails, recreate database
rm ~/.ai_supervisor/data/supervisor.db
python3 local_server.py --init-db
```

## Browser Extension Issues

### Extension Not Loading

**Symptoms**:
- Extension icon not visible in toolbar
- "Extension failed to load" errors
- No response when clicking extension

**Root Cause**: Installation issues or browser restrictions

**Solution**:
```bash
# Check manifest.json syntax
python3 -m json.tool browser_extension/manifest.json

# Verify file permissions
ls -la browser_extension/

# Reload extension in browser
# Chrome: chrome://extensions/ -> Reload
# Firefox: about:debugging -> Reload

# Check browser console for errors
# F12 -> Console -> Look for extension errors
```

### Content Script Not Injecting

**Symptoms**:
- No AI agent detection on supported sites
- Extension popup shows "No active sessions"
- Page monitoring not working

**Root Cause**: Content script permissions or site restrictions

**Solution**:
```javascript
// Check if content script is running
console.log('AI Supervisor content script loaded');

// Verify page matches patterns
// Check manifest.json content_scripts.matches

// Test manual injection
chrome.tabs.executeScript({
  file: 'content.js'
}, (result) => {
  console.log('Script injection result:', result);
});
```

### Storage API Issues

**Symptoms**:
- Settings not persisting across browser sessions
- "Storage API not available" errors
- Extension reset to defaults frequently

**Root Cause**: Browser storage limitations or permissions

**Solution**:
```javascript
// Check storage permissions in manifest.json
{
  "permissions": [
    "storage"
  ]
}

// Test storage API
chrome.storage.sync.set({test: 'value'}, () => {
  console.log('Storage set successful');
});

chrome.storage.sync.get(['test'], (result) => {
  console.log('Storage get result:', result);
});

// Clear storage if corrupted
chrome.storage.sync.clear();
chrome.storage.local.clear();
```

## Web Application Issues

### Authentication Failures

**Symptoms**:
- "Invalid credentials" errors
- Automatic logouts
- "Token expired" messages

**Root Cause**: Authentication service issues or token management problems

**Solution**:
```bash
# Check Supabase connection
curl https://your-project.supabase.co/rest/v1/ \
  -H "apikey: your-anon-key"

# Verify JWT token
echo "your_jwt_token" | base64 -d

# Test authentication endpoint
curl -X POST https://ncczq77atgsg.space.minimax.io/auth/token \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test", "password": "test"}'

# Clear browser cache and cookies
# Or use incognito/private mode
```

### Real-time Updates Not Working

**Symptoms**:
- Dashboard data not updating automatically
- No live notifications
- Manual refresh required

**Root Cause**: WebSocket connection issues or edge function problems

**Solution**:
```javascript
// Test WebSocket connection in browser console
const ws = new WebSocket('wss://ncczq77atgsg.space.minimax.io/functions/v1/websocket-handler');

ws.onopen = () => console.log('WebSocket connected');
ws.onerror = (error) => console.error('WebSocket error:', error);
ws.onmessage = (msg) => console.log('WebSocket message:', msg.data);

// Check network tab for WebSocket status
// F12 -> Network -> WS -> Look for connection issues
```

## System Integration Issues

### Service Not Starting Automatically

**Symptoms**:
- Manual start required after reboot
- systemd service fails
- Auto-start not working

**Root Cause**: Service configuration or permission issues

**Solution**:
```bash
# Check service status
systemctl --user status ai-supervisor.service

# View service logs
journalctl --user -u ai-supervisor.service

# Fix service configuration
sudo systemctl --user daemon-reload
systemctl --user enable ai-supervisor.service

# Test service manually
systemctl --user start ai-supervisor.service

# For macOS LaunchAgent
launchctl list | grep ai-supervisor
launchctl load ~/Library/LaunchAgents/com.minimax.ai-supervisor.plist
```

### Desktop App System Tray Issues

**Symptoms**:
- Tray icon not appearing
- Context menu not working
- Notifications not showing

**Root Cause**: Desktop environment or permissions issues

**Solution**:
```bash
# Check if system tray is available
echo $XDG_CURRENT_DESKTOP
ps aux | grep -E "(gnome-shell|kde|xfce)"

# Install system tray support
# GNOME: gnome-shell-extension-appindicator
# KDE: plasma-workspace

# Test notification system
notify-send "Test" "Notification test message"

# Debug Electron app
DEBUG=* npm start
```

## Recovery Procedures

### Complete System Reset

If multiple issues persist, perform a complete reset:

```bash
# 1. Stop all services
systemctl --user stop ai-supervisor.service
pkill -f "(local_server|python.*supervisor)"

# 2. Backup important data
cp -r ~/.ai_supervisor/data ~/.ai_supervisor/data.backup

# 3. Remove installation
rm -rf ~/.ai_supervisor

# 4. Reinstall from scratch
cd local_installation
./installer/install.sh

# 5. Restore data if needed
cp -r ~/.ai_supervisor/data.backup/* ~/.ai_supervisor/data/
```

### Configuration Reset

To reset only configuration while preserving data:

```bash
# Backup current config
cp ~/.ai_supervisor/config.json ~/.ai_supervisor/config.json.backup

# Reset to defaults
curl -X POST http://localhost:8889/api/v1/config/reset

# Or manually restore default config
cp local_installation/config/default_config.json ~/.ai_supervisor/config.json

# Restart services
systemctl --user restart ai-supervisor.service
```

## Getting Additional Help

### Log Analysis

```bash
# Comprehensive log collection
tar -czf ai_supervisor_logs.tar.gz \
  ~/.ai_supervisor/logs/ \
  /var/log/syslog \
  ~/.local/share/applications/ai-supervisor.desktop

# System information
uname -a > system_info.txt
python3 --version >> system_info.txt
node --version >> system_info.txt
pip3 list >> system_info.txt
```

### Debug Mode

Enable comprehensive debugging:

```json
{
  "debug": {
    "enabled": true,
    "level": "DEBUG",
    "log_to_console": true,
    "log_sql_queries": true,
    "log_websocket_messages": true
  }
}
```

### Support Channels

1. **Check Documentation**: Review relevant user guides
2. **Search Issues**: Look for similar problems in GitHub issues
3. **Create Bug Report**: Include logs, system info, and steps to reproduce
4. **Community Support**: Ask questions in GitHub discussions

---

**Remember**: When reporting issues, always include:
- Operating system and version
- Python and Node.js versions
- Deployment mode(s) affected
- Relevant log excerpts
- Steps to reproduce the issue