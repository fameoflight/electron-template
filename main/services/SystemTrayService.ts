import { Tray, Menu, BrowserWindow, app } from 'electron';
import { IconService } from './IconService';

interface JobQueueStatus {
  runningJobs: number;
  pendingJobs: number;
  completedJobs: number;
  failedJobs: number;
}

export class SystemTrayService {
  private tray: Tray | null = null;
  private mainWindow: BrowserWindow;
  private iconService: IconService;
  private jobQueueStatus: JobQueueStatus = {
    runningJobs: 0,
    pendingJobs: 0,
    completedJobs: 0,
    failedJobs: 0
  };

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.iconService = IconService.getInstance();
  }

  async createTray() {
    console.log(`[SystemTray] Creating system tray for platform: ${process.platform}`);

    // Load tray icon using IconService
    const trayIcon = await this.iconService.loadIcon(this.iconService.getSystemTrayIconPath(), 'tray');

    // Resize to appropriate tray icon size
    const size = process.platform === 'win32' ? 16 : 22; // Windows: 16x16, macOS: 22x22
    const resizedIcon = trayIcon.resize({ width: size, height: size });

    this.tray = new Tray(resizedIcon);
    console.log('✓ System tray icon created successfully');
    console.log(`[SystemTray] Tray created successfully. Visible: ${!this.tray.isDestroyed()}`);

    // Set initial tooltip with job queue status
    this.updateTrayTooltip();

    // Handle tray interactions based on platform
    this.setupTrayInteractions();

    // Update context menu periodically with job queue status
    this.updateContextMenu();

    // Set up periodic updates
    setInterval(() => {
      this.updateContextMenu();
    }, 2000); // Update every 2 seconds
  }

  private setupTrayInteractions() {
    if (!this.tray) return;

    if (process.platform === 'darwin') {
      // macOS: Left-click shows context menu, right-click shows window
      this.tray.on('click', () => {
        this.tray?.popUpContextMenu();
      });

      this.tray.on('right-click', () => {
        this.showWindow();
      });
    } else {
      // Windows/Linux: Left-click shows window, right-click shows context menu
      this.tray.on('click', () => {
        this.showWindow();
      });

      this.tray.on('right-click', () => {
        this.tray?.popUpContextMenu();
      });
    }
  }

  private updateTrayTooltip() {
    if (!this.tray) return;

    const { runningJobs, pendingJobs } = this.jobQueueStatus;
    let tooltip = 'CodeBlocks';

    if (runningJobs > 0 || pendingJobs > 0) {
      tooltip += ` • ${runningJobs} running, ${pendingJobs} pending`;
    }

    this.tray.setToolTip(tooltip);
  }

  private updateContextMenu() {
    if (!this.tray) return;

    const { runningJobs, pendingJobs, completedJobs, failedJobs } = this.jobQueueStatus;
    const hasActiveJobs = runningJobs > 0 || pendingJobs > 0;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show App',
        click: () => this.showWindow()
      },
      { type: 'separator' },
      {
        label: 'Job Queue Status',
        submenu: [
          {
            label: `Running: ${runningJobs}`,
            enabled: false
          },
          {
            label: `Pending: ${pendingJobs}`,
            enabled: false
          },
          {
            label: `Completed: ${completedJobs}`,
            enabled: false
          },
          {
            label: `Failed: ${failedJobs}`,
            enabled: false
          }
        ]
      },
      { type: 'separator' },
      {
        label: 'Quick Actions',
        submenu: [
          {
            label: 'View Dashboard',
            click: () => {
              this.mainWindow.webContents.send('tray:navigate', '/dashboard');
              this.showWindow();
            }
          },
          {
            label: 'Job History',
            click: () => {
              this.mainWindow.webContents.send('tray:navigate', '/jobs');
              this.showWindow();
            }
          }
        ]
      },
      { type: 'separator' },
      {
        label: hasActiveJobs ? 'Quit (Jobs Running)' : 'Quit',
        enabled: !hasActiveJobs,
        click: () => {
          if (hasActiveJobs) {
            // Show warning dialog
            this.mainWindow.webContents.send('tray:quit-with-active-jobs');
          } else {
            // Safe to quit
            this.safeQuit();
          }
        }
      },
      {
        label: 'Force Quit',
        visible: hasActiveJobs,
        click: () => {
          this.forceQuit();
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);
    this.updateTrayTooltip();
  }

  private showWindow() {
    if (this.mainWindow.isMinimized()) {
      this.mainWindow.restore();
    }

    if (!this.mainWindow.isVisible()) {
      this.mainWindow.show();
    }

    this.mainWindow.focus();

    // On macOS, show dock icon when window is shown
    if (process.platform === 'darwin' && app.dock) {
      app.dock.show();
    }
  }

  hideWindow() {
    if (!this.mainWindow.isDestroyed()) {
      this.mainWindow.hide();

      // Hide from dock on macOS for true background operation
      if (process.platform === 'darwin' && app.dock) {
        app.dock.hide();
      }
    }
  }

  updateJobQueueStatus(status: Partial<JobQueueStatus>) {
    this.jobQueueStatus = { ...this.jobQueueStatus, ...status };
    this.updateContextMenu();
  }

  private safeQuit() {
    console.log('[SystemTray] Safe quit initiated');
    app.quit();
  }

  private forceQuit() {
    console.log('[SystemTray] Force quit initiated');
    app.quit();
  }

  // Public method to update tray status (kept for backward compatibility)
  updateTray(title: string, hasNotifications = false) {
    if (!this.tray) return;

    // This method is kept for backward compatibility
    // The actual tooltip is now managed by updateTrayTooltip()
    if (hasNotifications) {
      this.tray.setToolTip(`🔔 ${title}`);
    } else {
      this.updateTrayTooltip();
    }
  }

  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}