#!/bin/bash

# AI Agent Supervisor - Local Installation Script
# This script installs the complete local deployment package

set -e

echo "🚀 AI Agent Supervisor - Local Installation"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="$HOME/.ai_supervisor"
DESKTOP_DIR="$INSTALL_DIR/desktop"
SERVER_DIR="$INSTALL_DIR/server"
DATA_DIR="$INSTALL_DIR/data"
LOGS_DIR="$INSTALL_DIR/logs"

# Check system requirements
check_requirements() {
    echo -e "${BLUE}Checking system requirements...${NC}"
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}Error: Python 3 is required but not installed${NC}"
        exit 1
    fi
    
    python_version=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
    if (( $(echo "$python_version < 3.8" | bc -l) )); then
        echo -e "${RED}Error: Python 3.8+ is required (found $python_version)${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Python $python_version found${NC}"
    
    # Check pip
    if ! command -v pip3 &> /dev/null; then
        echo -e "${RED}Error: pip3 is required but not installed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ pip3 found${NC}"
    
    # Check Node.js for desktop app
    if command -v node &> /dev/null; then
        node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if (( node_version >= 16 )); then
            echo -e "${GREEN}✓ Node.js $(node --version) found${NC}"
            HAS_NODEJS=true
        else
            echo -e "${YELLOW}⚠ Node.js 16+ recommended for desktop app (found $(node --version))${NC}"
            HAS_NODEJS=false
        fi
    else
        echo -e "${YELLOW}⚠ Node.js not found - desktop app will not be available${NC}"
        HAS_NODEJS=false
    fi
    
    echo ""
}

# Create installation directories
setup_directories() {
    echo -e "${BLUE}Setting up installation directories...${NC}"
    
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$SERVER_DIR"
    mkdir -p "$DATA_DIR"
    mkdir -p "$LOGS_DIR"
    
    if [ "$HAS_NODEJS" = true ]; then
        mkdir -p "$DESKTOP_DIR"
    fi
    
    echo -e "${GREEN}✓ Directories created${NC}"
    echo ""
}

# Install Python server
install_server() {
    echo -e "${BLUE}Installing Python server components...${NC}"
    
    # Copy server files
    cp -r server/* "$SERVER_DIR/"
    cp -r ../src "$INSTALL_DIR/"
    
    # Install Python dependencies
    echo "Installing Python dependencies..."
    pip3 install -r "$SERVER_DIR/requirements.txt" --user
    
    # Create startup script
    cat > "$SERVER_DIR/start_server.sh" << EOF
#!/bin/bash
cd "$SERVER_DIR"
echo "Starting AI Agent Supervisor local server..."
python3 local_server.py
EOF
    
    chmod +x "$SERVER_DIR/start_server.sh"
    
    echo -e "${GREEN}✓ Server installed${NC}"
    echo ""
}

# Install desktop app
install_desktop_app() {
    if [ "$HAS_NODEJS" != true ]; then
        echo -e "${YELLOW}Skipping desktop app installation (Node.js not available)${NC}"
        return
    fi
    
    echo -e "${BLUE}Installing desktop application...${NC}"
    
    # Copy desktop files
    cp -r desktop/* "$DESKTOP_DIR/"
    
    # Install Node.js dependencies
    cd "$DESKTOP_DIR"
    echo "Installing Node.js dependencies..."
    npm install
    
    # Build the application
    echo "Building desktop application..."
    npm run pack
    
    # Create desktop entry for Linux
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        create_desktop_entry
    fi
    
    echo -e "${GREEN}✓ Desktop app installed${NC}"
    echo ""
}

# Create desktop entry (Linux)
create_desktop_entry() {
    DESKTOP_ENTRY="$HOME/.local/share/applications/ai-supervisor.desktop"
    
    mkdir -p "$(dirname "$DESKTOP_ENTRY")"
    
    cat > "$DESKTOP_ENTRY" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=AI Agent Supervisor
Comment=Monitor and supervise AI agents
Exec=node "$DESKTOP_DIR/src/main.js"
Icon=$DESKTOP_DIR/assets/icon.png
Terminal=false
Categories=Development;Utility;
Keywords=AI;Agent;Supervisor;Monitoring;
EOF
    
    chmod +x "$DESKTOP_ENTRY"
    echo -e "${GREEN}✓ Desktop entry created${NC}"
}

# Create system service (optional)
create_system_service() {
    echo ""
    read -p "Do you want to create a system service to auto-start the server? [y/N]: " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            create_systemd_service
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            create_launchd_service
        else
            echo -e "${YELLOW}Auto-start service not supported on this platform${NC}"
        fi
    fi
}

# Create systemd service (Linux)
create_systemd_service() {
    SERVICE_FILE="$HOME/.config/systemd/user/ai-supervisor.service"
    
    mkdir -p "$(dirname "$SERVICE_FILE")"
    
    cat > "$SERVICE_FILE" << EOF
[Unit]
Description=AI Agent Supervisor Local Server
After=network.target

[Service]
Type=simple
User=%i
WorkingDirectory=$SERVER_DIR
ExecStart=$SERVER_DIR/start_server.sh
Restart=always
RestartSec=10

[Install]
WantedBy=default.target
EOF
    
    systemctl --user daemon-reload
    systemctl --user enable ai-supervisor.service
    
    echo -e "${GREEN}✓ Systemd service created and enabled${NC}"
    echo "Use 'systemctl --user start ai-supervisor' to start the service"
}

# Create launch daemon (macOS)
create_launchd_service() {
    PLIST_FILE="$HOME/Library/LaunchAgents/com.minimax.ai-supervisor.plist"
    
    mkdir -p "$(dirname "$PLIST_FILE")"
    
    cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.minimax.ai-supervisor</string>
    <key>ProgramArguments</key>
    <array>
        <string>$SERVER_DIR/start_server.sh</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>$SERVER_DIR</string>
</dict>
</plist>
EOF
    
    launchctl load "$PLIST_FILE"
    
    echo -e "${GREEN}✓ LaunchAgent created and loaded${NC}"
    echo "The service will start automatically on login"
}

# Configure browser extension
configure_extension() {
    echo ""
    echo -e "${BLUE}Browser Extension Configuration${NC}"
    echo "The browser extension is located in: ../browser_extension/"
    echo ""
    echo "To install the browser extension:"
    echo "1. Open Chrome and go to chrome://extensions/"
    echo "2. Enable 'Developer mode'"
    echo "3. Click 'Load unpacked' and select the browser_extension folder"
    echo "4. The extension will automatically connect to your local server"
    echo ""
    
    read -p "Press Enter to continue..."
}

# Create uninstall script
create_uninstaller() {
    UNINSTALL_SCRIPT="$INSTALL_DIR/uninstall.sh"
    
    cat > "$UNINSTALL_SCRIPT" << 'EOF'
#!/bin/bash

echo "🗑️ Uninstalling AI Agent Supervisor..."

# Stop services
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    systemctl --user stop ai-supervisor.service 2>/dev/null || true
    systemctl --user disable ai-supervisor.service 2>/dev/null || true
    rm -f "$HOME/.config/systemd/user/ai-supervisor.service"
    systemctl --user daemon-reload
elif [[ "$OSTYPE" == "darwin"* ]]; then
    launchctl unload "$HOME/Library/LaunchAgents/com.minimax.ai-supervisor.plist" 2>/dev/null || true
    rm -f "$HOME/Library/LaunchAgents/com.minimax.ai-supervisor.plist"
fi

# Remove desktop entry
rm -f "$HOME/.local/share/applications/ai-supervisor.desktop"

echo "Services stopped and desktop entries removed."
echo ""
read -p "Do you want to remove all data and configuration files? [y/N]: " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$HOME/.ai_supervisor"
    echo "✅ All files removed."
else
    echo "Configuration and data files preserved in $HOME/.ai_supervisor"
fi

echo "Uninstallation complete."
EOF
    
    chmod +x "$UNINSTALL_SCRIPT"
    echo -e "${GREEN}✓ Uninstaller created at $UNINSTALL_SCRIPT${NC}"
}

# Installation summary
install_summary() {
    echo ""
    echo -e "${GREEN}🎉 Installation Complete!${NC}"
    echo "========================"
    echo ""
    echo "Installation directory: $INSTALL_DIR"
    echo "Server port: 8889"
    echo "Web interface: http://localhost:8889"
    echo ""
    echo "Quick start:"
    echo "1. Start server: $SERVER_DIR/start_server.sh"
    
    if [ "$HAS_NODEJS" = true ]; then
        echo "2. Or run desktop app: cd $DESKTOP_DIR && npm start"
    fi
    
    echo "3. Install browser extension from ../browser_extension/"
    echo "4. Access web interface at http://localhost:8889"
    echo ""
    echo "Logs: $LOGS_DIR/"
    echo "Data: $DATA_DIR/"
    echo "Uninstall: $INSTALL_DIR/uninstall.sh"
    echo ""
    
    read -p "Do you want to start the server now? [y/N]: " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Starting server..."
        cd "$SERVER_DIR"
        python3 local_server.py &
        SERVER_PID=$!
        echo "Server started with PID $SERVER_PID"
        echo "Access the web interface at http://localhost:8889"
        
        if [ "$HAS_NODEJS" = true ]; then
            echo ""
            read -p "Do you want to start the desktop app too? [y/N]: " -n 1 -r
            echo
            
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                cd "$DESKTOP_DIR"
                npm start &
                echo "Desktop app started"
            fi
        fi
    fi
}

# Main installation process
main() {
    echo "This script will install AI Agent Supervisor locally on your system."
    echo ""
    
    read -p "Continue with installation? [Y/n]: " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        echo "Installation cancelled."
        exit 0
    fi
    
    check_requirements
    setup_directories
    install_server
    install_desktop_app
    create_system_service
    configure_extension
    create_uninstaller
    install_summary
}

# Run main installation
main