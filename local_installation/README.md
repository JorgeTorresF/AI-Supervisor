# AI Agent Supervisor - Local Installation

This package provides a complete local installation of the AI Agent Supervisor system, including:

- **Python Server**: Local web server with API endpoints
- **Desktop Application**: Electron-based desktop app with system tray support
- **Database**: SQLite database for local data storage
- **Integration**: Seamless integration with browser extension and hybrid gateway

## System Requirements

### Minimum Requirements
- **Python**: 3.8 or higher
- **pip**: Latest version
- **Operating System**: Windows 10+, macOS 10.14+, or Linux (Ubuntu 18.04+)
- **Memory**: 512 MB RAM
- **Storage**: 500 MB free space

### Optional Requirements
- **Node.js**: 16+ (for desktop application)
- **Chrome/Firefox**: For browser extension integration

## Quick Installation

### Linux/macOS
```bash
# Clone or download the project
cd local_installation
chmod +x installer/install.sh
./installer/install.sh
```

### Windows
```powershell
# Run PowerShell as Administrator
cd local_installation
.\installer\install.ps1
```

## Manual Installation

### 1. Install Python Dependencies
```bash
cd server
pip3 install -r requirements.txt
```

### 2. Start Local Server
```bash
python3 local_server.py
```

### 3. Install Desktop App (Optional)
```bash
cd desktop
npm install
npm start
```

## Features

### Local Web Server
- **Port**: 8889 (configurable)
- **API Endpoints**: Full REST API compatibility
- **WebSocket**: Real-time communication support
- **Database**: SQLite for local data persistence
- **Security**: Local-only access by default

### Desktop Application
- **Cross-platform**: Windows, macOS, Linux
- **System Tray**: Minimize to system tray
- **Auto-start**: Optional system service
- **Notifications**: Desktop notifications for interventions
- **Deep Links**: Handle ai-supervisor:// URLs

### Data Management
- **Local Storage**: All data stored locally
- **Backup**: Automatic backup of important data
- **Export**: Export data to various formats
- **Privacy**: No data sent to external servers

## Configuration

Configuration file: `~/.ai_supervisor/config.json`

```json
{
  "server": {
    "host": "127.0.0.1",
    "port": 8889,
    "auto_start": true,
    "debug": false
  },
  "hybrid": {
    "enabled": true,
    "gateway_url": "ws://localhost:8888/ws",
    "auto_connect": true
  },
  "features": {
    "idea_validation": true,
    "task_coherence": true,
    "intervention_alerts": true,
    "activity_logging": true
  },
  "ui": {
    "theme": "dark",
    "auto_open_browser": true,
    "system_tray": true
  }
}
```

## Directory Structure

```
~/.ai_supervisor/
├── config.json          # Configuration file
├── data/
│   ├── supervisor.db    # SQLite database
│   └── backups/         # Automatic backups
├── logs/
│   └── supervisor_local.log
├── server/              # Python server files
├── desktop/             # Electron app files
└── uninstall.sh         # Uninstaller script
```

## Integration with Other Modes

### Browser Extension
1. The local server automatically provides WebSocket endpoints
2. Browser extension connects to `ws://localhost:8889/ws`
3. Real-time synchronization between extension and local app

### Hybrid Gateway
1. Local installation can connect to hybrid gateway
2. Enables communication with web app and other instances
3. Configurable in settings

### Web Application
1. Can sync data with web app through hybrid gateway
2. Authentication tokens shared securely
3. Offline-first approach with sync when online

## API Endpoints

### Server Status
- `GET /` - Web interface home
- `GET /api/v1/status` - Server status and configuration
- `WebSocket /ws` - Real-time communication

### Idea Validation
- `POST /api/v1/validate-idea` - Validate project ideas
- `GET /api/v1/ideas` - List validated ideas

### Task Management
- `GET /api/v1/tasks` - List active tasks
- `POST /api/v1/tasks` - Create new task
- `PUT /api/v1/tasks/{id}` - Update task

### Activity Logging
- `GET /api/v1/activities` - Get activity log
- `POST /api/v1/activities` - Log activity

## Desktop Application Features

### System Tray
- Right-click context menu
- Quick access to features
- System notifications
- Auto-start options

### Menu Bar
- **File**: New task, settings, quit
- **View**: Reload, zoom, developer tools
- **Tools**: Idea validator, task monitor, activity log
- **Help**: Documentation, about, issue reporting

### Keyboard Shortcuts
- `Ctrl/Cmd + N`: New task
- `Ctrl/Cmd + ,`: Settings
- `Ctrl/Cmd + R`: Reload
- `Ctrl/Cmd + Q`: Quit

## Troubleshooting

### Server Won't Start
1. Check if Python 3.8+ is installed
2. Verify dependencies: `pip3 install -r requirements.txt`
3. Check if port 8889 is available
4. Review logs in `~/.ai_supervisor/logs/`

### Desktop App Issues
1. Ensure Node.js 16+ is installed
2. Run `npm install` in desktop directory
3. Check for permission issues
4. Try running with `--dev` flag for debugging

### Browser Extension Connection
1. Verify server is running on port 8889
2. Check browser extension permissions
3. Ensure WebSocket connection is allowed
4. Review network firewall settings

### Database Issues
1. Check SQLite file permissions
2. Verify disk space availability
3. Run database integrity check
4. Restore from backup if corrupted

## Updates

To update the local installation:

```bash
# Stop services
sudo systemctl stop ai-supervisor  # Linux
# or kill desktop app process

# Download new version
git pull  # if using git
# or download new release

# Reinstall
./installer/install.sh
```

## Uninstallation

```bash
# Run uninstaller
~/.ai_supervisor/uninstall.sh

# Or manual removal
sudo systemctl stop ai-supervisor
sudo systemctl disable ai-supervisor
rm -rf ~/.ai_supervisor
```

## Security Considerations

- Server binds to localhost (127.0.0.1) by default
- No external network access unless explicitly configured
- All data stored locally on user's machine
- Optional encryption for sensitive data
- Regular security updates recommended

## Performance

- **Memory Usage**: ~50-100 MB (server + desktop app)
- **CPU Usage**: <1% idle, <5% during analysis
- **Storage**: ~10-50 MB for typical usage
- **Network**: Local only (unless hybrid mode enabled)

## Support

- **Documentation**: Check `/docs` directory
- **Issues**: Report on GitHub repository
- **Logs**: Available in `~/.ai_supervisor/logs/`
- **Configuration**: Edit `~/.ai_supervisor/config.json`