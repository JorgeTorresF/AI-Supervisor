# User Guide - Local Installation

## Overview

The AI Agent Supervisor Local Installation provides complete control and privacy by running the entire system on your local machine. It includes a Python-based server, desktop application, and full offline capabilities while maintaining compatibility with other deployment modes.

## System Requirements

### Minimum Requirements
- **Operating System**: Windows 10+, macOS 10.14+, Ubuntu 18.04+
- **Python**: Version 3.8 or higher
- **Memory**: 512 MB RAM available
- **Storage**: 500 MB free disk space
- **Network**: Optional (for hybrid mode sync)

### Recommended Requirements
- **Python**: Version 3.10+
- **Node.js**: Version 16+ (for desktop application)
- **Memory**: 1 GB RAM available
- **Storage**: 2 GB free disk space
- **CPU**: Multi-core processor for better performance

## Installation

### Automated Installation (Recommended)

#### Linux/macOS
```bash
# Navigate to the installation directory
cd local_installation

# Make installer executable
chmod +x installer/install.sh

# Run installer
./installer/install.sh
```

#### Windows
```powershell
# Run PowerShell as Administrator
cd local_installation
.\installer\install.ps1
```

### Manual Installation

If the automated installer doesn't work:

#### 1. Install Python Dependencies
```bash
cd local_installation/server
pip3 install -r requirements.txt
```

#### 2. Set Up Configuration
```bash
# Create configuration directory
mkdir -p ~/.ai_supervisor

# Copy default configuration
cp config/default_config.json ~/.ai_supervisor/config.json
```

#### 3. Initialize Database
```bash
# Run server once to initialize database
python3 local_server.py --init-only
```

#### 4. Install Desktop App (Optional)
```bash
cd ../desktop
npm install
npm run build
```

## Getting Started

### First Run

1. **Start the Server**:
   ```bash
   cd ~/.ai_supervisor/server
   ./start_server.sh
   ```
   
   Or directly:
   ```bash
   python3 local_server.py
   ```

2. **Access Web Interface**:
   - Open browser to `http://localhost:8889`
   - Complete initial setup wizard
   - Configure supervision preferences

3. **Launch Desktop App** (if installed):
   ```bash
   cd ~/.ai_supervisor/desktop
   npm start
   ```

### Initial Configuration

#### Server Settings
```json
{
  "server": {
    "host": "127.0.0.1",
    "port": 8889,
    "debug": false,
    "auto_start": true
  },
  "database": {
    "path": "~/.ai_supervisor/data/supervisor.db",
    "backup_interval": 3600,
    "max_backups": 10
  }
}
```

#### Supervision Settings
```json
{
  "supervision": {
    "idea_validation": true,
    "task_coherence": true,
    "intervention_level": "medium",
    "auto_interventions": true,
    "context_tracking": true
  }
}
```

## Core Features

### Local Web Interface

Access the full supervision dashboard at `http://localhost:8889`:

#### Dashboard Components
- **System Status**: Server health and resource usage
- **Active Tasks**: Currently monitored tasks
- **Recent Activity**: Latest supervision events
- **Configuration**: Real-time settings management
- **Data Export**: Backup and export capabilities

#### Idea Validation
```bash
# Test via command line
curl -X POST http://localhost:8889/api/v1/validate-idea \
  -H "Content-Type: application/json" \
  -d '{"idea": "Build a time travel machine"}'

# Response
{
  "feasibility_score": 1,
  "risk_level": "critical",
  "warnings": [
    "Involves potentially impossible technology",
    "Violates known laws of physics"
  ],
  "suggestions": [
    "Consider time-themed game or simulation instead",
    "Focus on achievable technology projects"
  ]
}
```

### Desktop Application

The Electron-based desktop app provides:

#### System Tray Integration
- **Quick Access**: Right-click tray icon for menu
- **Status Indicators**: Visual server status
- **Notifications**: Desktop alerts for interventions
- **Auto-start**: Launch on system boot

#### Desktop App Features
- **Native Notifications**: System-level alerts
- **Keyboard Shortcuts**: Quick actions
- **Window Management**: Minimize to tray
- **Deep Links**: Handle `ai-supervisor://` URLs

### Command Line Interface

#### Server Management
```bash
# Start server
~/.ai_supervisor/server/start_server.sh

# Stop server
pkill -f "python3 local_server.py"

# Check status
curl http://localhost:8889/api/v1/status

# View logs
tail -f ~/.ai_supervisor/logs/supervisor_local.log
```

#### Configuration Management
```bash
# Export configuration
curl http://localhost:8889/api/v1/config/export > my_config.json

# Import configuration
curl -X POST http://localhost:8889/api/v1/config/import \
  -H "Content-Type: application/json" \
  -d @my_config.json

# Reset to defaults
curl -X POST http://localhost:8889/api/v1/config/reset
```

## Advanced Configuration

### Auto-start Service

#### systemd (Linux)
```bash
# Create service file
sudo tee /etc/systemd/user/ai-supervisor.service > /dev/null <<EOF
[Unit]
Description=AI Agent Supervisor Local Server
After=network.target

[Service]
Type=simple
User=%i
WorkingDirectory=/home/%i/.ai_supervisor/server
ExecStart=/home/%i/.ai_supervisor/server/start_server.sh
Restart=always
RestartSec=10

[Install]
WantedBy=default.target
EOF

# Enable service
systemctl --user daemon-reload
systemctl --user enable ai-supervisor.service
systemctl --user start ai-supervisor.service
```

#### LaunchAgent (macOS)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" 
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.minimax.ai-supervisor</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/{username}/.ai_supervisor/server/start_server.sh</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

### Database Configuration

#### SQLite Optimization
```sql
-- Optimize database performance
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;
PRAGMA temp_store = memory;
```

#### Backup Strategy
```bash
#!/bin/bash
# Automated backup script

BACKUP_DIR="~/.ai_supervisor/backups"
DB_PATH="~/.ai_supervisor/data/supervisor.db"
DATE=$(date +"%Y%m%d_%H%M%S")

# Create backup
sqlite3 $DB_PATH ".backup ${BACKUP_DIR}/supervisor_${DATE}.db"

# Clean old backups (keep last 10)
ls -t ${BACKUP_DIR}/supervisor_*.db | tail -n +11 | xargs rm -f
```

### Integration with Other Modes

#### Hybrid Gateway Connection
```json
{
  "hybrid": {
    "enabled": true,
    "gateway_url": "ws://localhost:8888/ws",
    "user_id": "local_user",
    "auth_token": "your_auth_token",
    "auto_connect": true,
    "sync_interval": 30
  }
}
```

#### Browser Extension Integration
```json
{
  "extension_integration": {
    "enabled": true,
    "websocket_port": 8889,
    "cors_origins": [
      "chrome-extension://*",
      "moz-extension://*"
    ],
    "sync_settings": true
  }
}
```

## Monitoring and Maintenance

### Performance Monitoring

#### Resource Usage
```bash
# Monitor resource usage
ps aux | grep local_server.py

# Memory usage
echo "Memory: $(ps -o pid,ppid,pmem,pcpu,comm -p $(pgrep -f local_server.py))"

# Disk usage
du -sh ~/.ai_supervisor/

# Network connections
netstat -tuln | grep 8889
```

#### Log Analysis
```bash
# Error analysis
grep -i error ~/.ai_supervisor/logs/supervisor_local.log | tail -10

# Performance metrics
grep -i "response_time" ~/.ai_supervisor/logs/supervisor_local.log | tail -10

# Database activity
grep -i "database" ~/.ai_supervisor/logs/supervisor_local.log | tail -10
```

### Maintenance Tasks

#### Database Maintenance
```bash
# Vacuum database
sqlite3 ~/.ai_supervisor/data/supervisor.db "VACUUM;"

# Analyze tables
sqlite3 ~/.ai_supervisor/data/supervisor.db "ANALYZE;"

# Check integrity
sqlite3 ~/.ai_supervisor/data/supervisor.db "PRAGMA integrity_check;"
```

#### Log Rotation
```bash
#!/bin/bash
# Log rotation script

LOG_DIR="~/.ai_supervisor/logs"
MAX_SIZE=10485760  # 10MB

for log_file in $LOG_DIR/*.log; do
  if [ -f "$log_file" ] && [ $(stat -c%s "$log_file") -gt $MAX_SIZE ]; then
    mv "$log_file" "${log_file}.old"
    touch "$log_file"
    echo "Rotated: $log_file"
  fi
done
```

## Security Configuration

### Network Security

#### Firewall Configuration
```bash
# Allow local connections only
sudo ufw allow from 127.0.0.1 to any port 8889

# Block external access
sudo ufw deny 8889

# For hybrid mode, allow specific IP
sudo ufw allow from [hybrid_gateway_ip] to any port 8889
```

#### SSL/TLS Setup (Optional)
```python
# Enable HTTPS for local server
import ssl

ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
ssl_context.load_cert_chain(
    certfile="~/.ai_supervisor/ssl/cert.pem",
    keyfile="~/.ai_supervisor/ssl/key.pem"
)

uvicorn.run(
    app,
    host="127.0.0.1",
    port=8889,
    ssl_keyfile="~/.ai_supervisor/ssl/key.pem",
    ssl_certfile="~/.ai_supervisor/ssl/cert.pem"
)
```

### Data Protection

#### Configuration Encryption
```python
# Encrypt sensitive configuration values
from cryptography.fernet import Fernet

# Generate key (store securely)
key = Fernet.generate_key()
cipher = Fernet(key)

# Encrypt sensitive data
encrypted_token = cipher.encrypt(b"your_auth_token")

# Decrypt when needed
token = cipher.decrypt(encrypted_token)
```

#### Database Encryption
```bash
# Use encrypted SQLite extension
sudo apt-get install sqlcipher

# Create encrypted database
sqlcipher ~/.ai_supervisor/data/supervisor_encrypted.db
```

## Troubleshooting

### Common Issues

#### 1. Server Won't Start
**Symptoms**:
- Port 8889 already in use
- Permission denied errors
- Python module import errors

**Solutions**:
```bash
# Check port usage
lsof -i :8889

# Kill existing process
kill $(lsof -ti:8889)

# Check Python path
which python3
python3 -m pip list | grep fastapi

# Reinstall dependencies
pip3 install -r requirements.txt --force-reinstall
```

#### 2. Database Connection Issues
**Symptoms**:
- "Database locked" errors
- Slow query performance
- Data corruption

**Solutions**:
```bash
# Check database file permissions
ls -la ~/.ai_supervisor/data/supervisor.db

# Fix permissions
chmod 644 ~/.ai_supervisor/data/supervisor.db

# Test database integrity
sqlite3 ~/.ai_supervisor/data/supervisor.db "PRAGMA integrity_check;"

# Repair database if needed
sqlite3 ~/.ai_supervisor/data/supervisor.db ".recover" > recovered.sql
```

#### 3. Desktop App Issues
**Symptoms**:
- App won't launch
- System tray not showing
- Notifications not working

**Solutions**:
```bash
# Check Node.js version
node --version
npm --version

# Rebuild native modules
cd ~/.ai_supervisor/desktop
npm rebuild

# Clear Electron cache
rm -rf ~/.ai_supervisor/desktop/node_modules/.cache

# Run in debug mode
DEBUG=* npm start
```

### Performance Optimization

#### Server Optimization
```python
# Optimize FastAPI settings
app = FastAPI(
    title="AI Supervisor Local",
    docs_url=None,  # Disable docs in production
    redoc_url=None,
    debug=False
)

# Add performance middleware
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
```

#### Memory Usage
```json
{
  "performance": {
    "max_memory_mb": 256,
    "gc_threshold": 0.8,
    "cache_size": 100,
    "worker_processes": 1
  }
}
```

## Backup and Recovery

### Backup Strategy

#### Full System Backup
```bash
#!/bin/bash
# Complete backup script

BACKUP_DIR="/backup/ai_supervisor"
SOURCE_DIR="~/.ai_supervisor"
DATE=$(date +"%Y%m%d_%H%M%S")

# Create backup
tar -czf "${BACKUP_DIR}/ai_supervisor_${DATE}.tar.gz" \
  -C "$(dirname $SOURCE_DIR)" \
  "$(basename $SOURCE_DIR)"

# Upload to cloud (optional)
# rsync -av "${BACKUP_DIR}/" user@backup-server:/backups/ai_supervisor/
```

#### Incremental Backup
```bash
# Incremental backup using rsync
rsync -av --delete ~/.ai_supervisor/ /backup/ai_supervisor_incremental/
```

### Recovery Procedures

#### Configuration Recovery
```bash
# Restore from backup
tar -xzf ai_supervisor_20250819_120000.tar.gz -C ~/

# Fix permissions
chown -R $USER:$USER ~/.ai_supervisor
chmod +x ~/.ai_supervisor/server/start_server.sh

# Restart services
systemctl --user restart ai-supervisor.service
```

#### Database Recovery
```bash
# Restore database from backup
cp ~/.ai_supervisor/backups/supervisor_latest.db ~/.ai_supervisor/data/supervisor.db

# Verify integrity
sqlite3 ~/.ai_supervisor/data/supervisor.db "PRAGMA integrity_check;"
```

## Uninstallation

### Automated Uninstall
```bash
# Run uninstaller
~/.ai_supervisor/uninstall.sh
```

### Manual Uninstall
```bash
# Stop services
systemctl --user stop ai-supervisor.service
systemctl --user disable ai-supervisor.service

# Remove files
rm -rf ~/.ai_supervisor

# Clean up system service
rm ~/.config/systemd/user/ai-supervisor.service
systemctl --user daemon-reload

# Remove desktop entry
rm ~/.local/share/applications/ai-supervisor.desktop
```

---

**Next Steps**: Set up [Hybrid Mode](hybrid_architecture.md) to connect with other deployment modes.