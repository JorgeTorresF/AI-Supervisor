const { app, BrowserWindow, Menu, Tray, shell, ipcMain, dialog, Notification } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const axios = require('axios');
const notifier = require('node-notifier');

class LocalSupervisorApp {
  constructor() {
    this.mainWindow = null;
    this.tray = null;
    this.serverProcess = null;
    this.webSocket = null;
    this.serverPort = 8889;
    this.serverUrl = `http://localhost:${this.serverPort}`;
    this.wsUrl = `ws://localhost:${this.serverPort}/ws`;
    
    // Configuration
    this.config = {
      startMinimized: false,
      minimizeToTray: true,
      autoStartServer: true,
      enableNotifications: true
    };
    
    this.init();
  }
  
  init() {
    // Set up app event handlers
    app.whenReady().then(() => {
      this.createMainWindow();
      this.createTray();
      this.setupMenus();
      this.startLocalServer();
      
      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createMainWindow();
        }
      });
    });
    
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        this.cleanup();
        app.quit();
      }
    });
    
    app.on('before-quit', () => {
      this.cleanup();
    });
    
    // Set up IPC handlers
    this.setupIPC();
  }
  
  createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      icon: path.join(__dirname, '../assets/icon.png'),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      show: !this.config.startMinimized,
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
    });
    
    // Wait for server to start before loading
    setTimeout(() => {
      this.mainWindow.loadURL(this.serverUrl);
    }, 3000);
    
    // Handle window events
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
    
    this.mainWindow.on('minimize', () => {
      if (this.config.minimizeToTray && this.tray) {
        this.mainWindow.hide();
      }
    });
    
    // Handle external links
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
    
    // Dev tools in development
    if (process.argv.includes('--dev')) {
      this.mainWindow.webContents.openDevTools();
    }
  }
  
  createTray() {
    if (!this.config.minimizeToTray) return;
    
    const trayIconPath = path.join(__dirname, '../assets/tray-icon.png');
    this.tray = new Tray(trayIconPath);
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show AI Supervisor',
        click: () => {
          if (this.mainWindow) {
            this.mainWindow.show();
            this.mainWindow.focus();
          } else {
            this.createMainWindow();
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Server Status',
        submenu: [
          {
            label: this.serverProcess ? 'Running' : 'Stopped',
            enabled: false
          },
          {
            label: 'Restart Server',
            click: () => this.restartServer()
          }
        ]
      },
      {
        label: 'Open Browser Extension',
        click: () => {
          shell.openExternal('chrome://extensions/');
        }
      },
      { type: 'separator' },
      {
        label: 'Settings',
        click: () => this.showSettings()
      },
      {
        label: 'About',
        click: () => this.showAbout()
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          this.cleanup();
          app.quit();
        }
      }
    ]);
    
    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip('AI Agent Supervisor');
    
    this.tray.on('double-click', () => {
      if (this.mainWindow) {
        this.mainWindow.show();
        this.mainWindow.focus();
      } else {
        this.createMainWindow();
      }
    });
  }
  
  setupMenus() {
    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Task',
            accelerator: 'CmdOrCtrl+N',
            click: () => this.newTask()
          },
          { type: 'separator' },
          {
            label: 'Settings',
            accelerator: 'CmdOrCtrl+,',
            click: () => this.showSettings()
          },
          { type: 'separator' },
          {
            label: 'Quit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              this.cleanup();
              app.quit();
            }
          }
        ]
      },
      {
        label: 'View',
        submenu: [
          {
            label: 'Reload',
            accelerator: 'CmdOrCtrl+R',
            click: () => {
              if (this.mainWindow) {
                this.mainWindow.reload();
              }
            }
          },
          {
            label: 'Toggle Developer Tools',
            accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
            click: () => {
              if (this.mainWindow) {
                this.mainWindow.webContents.toggleDevTools();
              }
            }
          },
          { type: 'separator' },
          {
            label: 'Actual Size',
            accelerator: 'CmdOrCtrl+0',
            click: () => {
              if (this.mainWindow) {
                this.mainWindow.webContents.setZoomLevel(0);
              }
            }
          },
          {
            label: 'Zoom In',
            accelerator: 'CmdOrCtrl+Plus',
            click: () => {
              if (this.mainWindow) {
                const zoomLevel = this.mainWindow.webContents.getZoomLevel();
                this.mainWindow.webContents.setZoomLevel(zoomLevel + 0.5);
              }
            }
          },
          {
            label: 'Zoom Out',
            accelerator: 'CmdOrCtrl+-',
            click: () => {
              if (this.mainWindow) {
                const zoomLevel = this.mainWindow.webContents.getZoomLevel();
                this.mainWindow.webContents.setZoomLevel(zoomLevel - 0.5);
              }
            }
          }
        ]
      },
      {
        label: 'Tools',
        submenu: [
          {
            label: 'Idea Validator',
            click: () => this.openIdeaValidator()
          },
          {
            label: 'Task Monitor',
            click: () => this.openTaskMonitor()
          },
          {
            label: 'Activity Log',
            click: () => this.openActivityLog()
          },
          { type: 'separator' },
          {
            label: 'Hybrid Gateway Connection',
            click: () => this.testHybridConnection()
          }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About AI Agent Supervisor',
            click: () => this.showAbout()
          },
          {
            label: 'Documentation',
            click: () => {
              shell.openExternal('https://github.com/minimax/ai-supervisor/docs');
            }
          },
          {
            label: 'Report Issue',
            click: () => {
              shell.openExternal('https://github.com/minimax/ai-supervisor/issues');
            }
          }
        ]
      }
    ];
    
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }
  
  setupIPC() {
    ipcMain.handle('get-server-status', async () => {
      try {
        const response = await axios.get(`${this.serverUrl}/api/v1/status`);
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    ipcMain.handle('validate-idea', async (event, ideaText) => {
      try {
        const response = await axios.post(`${this.serverUrl}/api/v1/validate-idea`, {
          idea: ideaText
        });
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    ipcMain.handle('show-notification', (event, { title, message, type }) => {
      if (this.config.enableNotifications) {
        if (Notification.isSupported()) {
          new Notification({ title, body: message }).show();
        } else {
          notifier.notify({ title, message });
        }
      }
    });
  }
  
  startLocalServer() {
    if (!this.config.autoStartServer) return;
    
    console.log('Starting local supervisor server...');
    
    const serverScript = path.join(__dirname, '../server/local_server.py');
    this.serverProcess = spawn('python', [serverScript], {
      stdio: 'pipe'
    });
    
    this.serverProcess.stdout.on('data', (data) => {
      console.log(`Server: ${data}`);
    });
    
    this.serverProcess.stderr.on('data', (data) => {
      console.error(`Server Error: ${data}`);
    });
    
    this.serverProcess.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
      this.serverProcess = null;
    });
    
    // Connect WebSocket after server starts
    setTimeout(() => {
      this.connectWebSocket();
    }, 5000);
  }
  
  connectWebSocket() {
    try {
      this.webSocket = new WebSocket(this.wsUrl);
      
      this.webSocket.on('open', () => {
        console.log('Connected to local supervisor WebSocket');
      });
      
      this.webSocket.on('message', (data) => {
        const message = JSON.parse(data);
        this.handleWebSocketMessage(message);
      });
      
      this.webSocket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
      
      this.webSocket.on('close', () => {
        console.log('WebSocket connection closed');
        // Attempt to reconnect
        setTimeout(() => this.connectWebSocket(), 5000);
      });
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }
  
  handleWebSocketMessage(message) {
    switch (message.type) {
      case 'intervention':
        if (this.config.enableNotifications) {
          new Notification({
            title: 'AI Agent Intervention',
            body: message.message
          }).show();
        }
        break;
      
      case 'task_update':
        // Handle task updates
        break;
      
      case 'system_alert':
        if (this.config.enableNotifications) {
          new Notification({
            title: 'System Alert',
            body: message.message
          }).show();
        }
        break;
    }
  }
  
  restartServer() {
    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = null;
    }
    
    setTimeout(() => {
      this.startLocalServer();
    }, 2000);
  }
  
  cleanup() {
    if (this.webSocket) {
      this.webSocket.close();
    }
    
    if (this.serverProcess) {
      this.serverProcess.kill();
    }
  }
  
  // UI Methods
  newTask() {
    if (this.mainWindow) {
      this.mainWindow.webContents.executeJavaScript("window.location.hash = '#/new-task'");
    }
  }
  
  showSettings() {
    if (this.mainWindow) {
      this.mainWindow.webContents.executeJavaScript("window.location.hash = '#/settings'");
    }
  }
  
  showAbout() {
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'About AI Agent Supervisor',
      message: 'AI Agent Supervisor v1.0.0',
      detail: 'Local installation for monitoring and supervising AI agents with task coherence protection and idea validation.\n\nDeveloped by MiniMax Agent'
    });
  }
  
  openIdeaValidator() {
    if (this.mainWindow) {
      this.mainWindow.webContents.executeJavaScript("window.location.hash = '#/idea-validator'");
    }
  }
  
  openTaskMonitor() {
    if (this.mainWindow) {
      this.mainWindow.webContents.executeJavaScript("window.location.hash = '#/task-monitor'");
    }
  }
  
  openActivityLog() {
    if (this.mainWindow) {
      this.mainWindow.webContents.executeJavaScript("window.location.hash = '#/activity-log'");
    }
  }
  
  async testHybridConnection() {
    try {
      const response = await axios.get('http://localhost:8888/api/v1/status');
      dialog.showMessageBox(this.mainWindow, {
        type: 'info',
        title: 'Hybrid Gateway Connection',
        message: 'Connection Successful',
        detail: `Connected to hybrid gateway:\n${JSON.stringify(response.data, null, 2)}`
      });
    } catch (error) {
      dialog.showMessageBox(this.mainWindow, {
        type: 'error',
        title: 'Hybrid Gateway Connection',
        message: 'Connection Failed',
        detail: `Unable to connect to hybrid gateway:\n${error.message}`
      });
    }
  }
}

// Start the application
const supervisorApp = new LocalSupervisorApp();

// Handle protocol for URL schemes
app.setAsDefaultProtocolClient('ai-supervisor');

// Handle deep links
app.on('open-url', (event, url) => {
  event.preventDefault();
  console.log(`Deep link: ${url}`);
});

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (supervisorApp.mainWindow) {
      if (supervisorApp.mainWindow.isMinimized()) {
        supervisorApp.mainWindow.restore();
      }
      supervisorApp.mainWindow.focus();
    }
  });
}