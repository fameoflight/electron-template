import 'reflect-metadata';
import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { setupHandlers } from './handlers'
import { initializeDatabase } from '@db/dataSource'
import { initializeGraphQLSchema } from './graphql/server'
import JobQueue from './services/JobQueue.js'
import { registerJobs } from './jobs/index.js'
import { SystemTrayService } from './services/SystemTrayService'
import { MenuService } from './services/MenuService'
import { IconService } from './services/IconService'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null = null
let systemTrayService: SystemTrayService | null = null
let menuService: MenuService | null = null

// Use global to persist job queue across HMR reloads in development
declare global {
  var __jobQueue: JobQueue | null;
  var __jobQueueInitPromise: Promise<void> | null;
}

let jobQueueInitializationPromise: Promise<void> | null = global.__jobQueueInitPromise || null

async function createWindow() {
  // Close ALL existing windows during HMR to prevent duplicates
  // During development, Vite HMR restarts main process but windows might persist
  const existingWindows = BrowserWindow.getAllWindows();
  if (existingWindows.length > 0) {
    console.log(`🔄 Found ${existingWindows.length} existing window(s), closing them...`);
    existingWindows.forEach(w => {
      if (!w.isDestroyed()) {
        w.destroy(); // Force close immediately
      }
    });
  }

  // Reset win reference
  win = null;

  const preloadPath = path.join(__dirname, 'preload.mjs');

  // Get icon service and window icon options
  const iconService = IconService.getInstance();
  const iconOptions = await iconService.getWindowIconOptions();

  win = new BrowserWindow({
    width: 1200,
    height: 800,
    ...iconOptions,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      // Enable file path access for drag and drop
      // In Electron 39+, File.path is restricted by default
      webSecurity: VITE_DEV_SERVER_URL ? false : true, // Disable in dev for File.path access
    },
  })

  // Initialize services after window is created (only if they don't exist)
  if (!systemTrayService) {
    systemTrayService = new SystemTrayService(win);
    await systemTrayService.createTray();
  }

  if (!menuService) {
    menuService = new MenuService(win);
    menuService.createApplicationMenu();
    menuService.registerGlobalShortcuts();
  }

  // Try setting dock icon again after window creation (sometimes timing matters)
  await iconService.setupDockIconAfterWindowCreation();

  // Open DevTools in development
  if (VITE_DEV_SERVER_URL) {
    win.webContents.openDevTools()
  }

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  // Listen for preload script errors
  win.webContents.on('preload-error', (event, preloadPath, error) => {
    console.error('❌ Main process: Preload script error:', { preloadPath, error: error.message });
  })

  // Check if window.electron exists after page load
  win.webContents.on('dom-ready', () => {
    win?.webContents.executeJavaScript('typeof window.electron !== "undefined"')
      .then(result => {
        if (result) {
          win?.webContents.executeJavaScript('Object.keys(window.electron)')
            .then(keys => console.log('🔧 Main process: window.electron keys:', keys));
        }
      })
      .catch(err => console.error('❌ Main process: Error checking window.electron:', err));
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  // Open urls in the user's browser
  win.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Add isQuitting flag to app
  (app as any).isQuitting = false;

  // Handle window close event - minimize to tray instead
  win.on('close', (event) => {
    if (!(app as any).isQuitting) {
      event.preventDefault();
      console.log('[Main] Window close requested - minimizing to tray');

      if (win) {
        win.hide();

        // On macOS, hide from dock when minimized to tray
        if (process.platform === 'darwin' && app.dock) {
          app.dock.hide();
        }
      }
    }
  });

  // Start job queue after window is ready (non-blocking)
  setTimeout(() => {
    if (!jobQueueInitializationPromise) {
      jobQueueInitializationPromise = initializeJobQueue();
    }
  }, 1000); // Delay by 1 second to let UI render first
}

// Initialize job queue asynchronously
async function initializeJobQueue(): Promise<void> {
  // Check if job queue already exists (from previous HMR reload)
  if (global.__jobQueue) {
    console.log('🔄 JobQueue already running (HMR reused)');
    return;
  }

  const queueStartTime = Date.now();

  try {
    // Create new job queue
    const jobQueue = new JobQueue();

    // Register all jobs
    await registerJobs(jobQueue);

    // Start the queue
    await jobQueue.start();

    // Store in global to persist across HMR reloads
    global.__jobQueue = jobQueue;
    global.__jobQueueInitPromise = jobQueueInitializationPromise;

    console.log(`🚀 JobQueue started in ${Date.now() - queueStartTime}ms`);

    // Start monitoring job queue status for system tray updates
    startJobQueueMonitoring();
  } catch (error) {
    console.error('❌ Failed to start JobQueue:', error);
    global.__jobQueueInitPromise = null;
  }
}

// Monitor job queue and update system tray
function startJobQueueMonitoring() {
  const monitoringInterval = setInterval(async () => {
    if (!global.__jobQueue) {
      clearInterval(monitoringInterval);
      return;
    }

    try {
      const status = global.__jobQueue.getStatus();
      const stats = await global.__jobQueue.getStats();

      // Update system tray with current job queue status
      if (systemTrayService) {
        systemTrayService.updateJobQueueStatus({
          runningJobs: status.runningJobs.length,
          pendingJobs: stats.pending,
          completedJobs: stats.completed,
          failedJobs: stats.failed
        });
      }
    } catch (error) {
      console.error('[Main] Error monitoring job queue:', error);
    }
  }, 2000); // Update every 2 seconds

  // Store interval ID for cleanup
  (global as any).__jobQueueMonitoringInterval = monitoringInterval;
}

// Cleanup services
function cleanupServices() {
  // Clear job queue monitoring interval
  const monitoringInterval = (global as any).__jobQueueMonitoringInterval;
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    (global as any).__jobQueueMonitoringInterval = null;
  }

  // Destroy system tray
  if (systemTrayService) {
    systemTrayService.destroy();
    systemTrayService = null;
  }

  // Unregister global shortcuts
  if (menuService) {
    menuService.unregisterGlobalShortcuts();
    menuService = null;
  }

}

// Handle window close events - minimize to tray instead of quitting
app.on('window-all-closed', async () => {
  console.log('[Main] All windows closed - keeping app running in system tray');

  // Hide window and keep app running in system tray
  if (win && !win.isDestroyed()) {
    win.hide();

    // On macOS, hide from dock when all windows are closed
    if (process.platform === 'darwin' && app.dock) {
      app.dock.hide();
    }
  }

  // Don't quit - keep job queue running
  // The app will stay alive as long as systemTrayService exists
})

// Handle app before quit for all platforms
app.on('before-quit', async (event) => {
  // Check if job queue has active jobs
  if (global.__jobQueue) {
    const status = global.__jobQueue.getStatus();
    if (status.runningJobs.length > 0) {
      console.log(`[Main] ${status.runningJobs.length} jobs still running - preventing quit`);
      event.preventDefault();

      // Show dialog to user
      const { dialog } = await import('electron');
      const result = await dialog.showMessageBox({
        type: 'warning',
        buttons: ['Wait for Jobs', 'Force Quit', 'Cancel'],
        defaultId: 0,
        message: 'Background jobs are still running',
        detail: `${status.runningJobs.length} jobs are currently executing. Quitting now may interrupt ongoing operations.`
      });

      if (result.response === 0) {
        // Wait for jobs - don't quit
        return;
      } else if (result.response === 1) {
        // Force quit
        console.log('[Main] Force quitting despite active jobs');
      } else {
        // Cancel quit
        event.preventDefault();
        return;
      }
    }
  }

  // Stop the job queue
  if (global.__jobQueue) {
    await global.__jobQueue.stop();
    global.__jobQueue = null;
  }
  global.__jobQueueInitPromise = null;

  // Cleanup services
  cleanupServices();
})

// Handle app will quit (called after before-quit)
app.on('will-quit', (event) => {
  // Ensure global shortcuts are unregistered
  if (menuService) {
    menuService.unregisterGlobalShortcuts();
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Prevent multiple instances - this handles Vite HMR restarts
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  console.log('🚫 Another instance is already running, quitting...')
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, focus our existing window
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })
}

// Handle HMR hot-reload events from vite-plugin-electron
// This reloads renderer when preload scripts are rebuilt
if (VITE_DEV_SERVER_URL) {
  process.on('message', (msg) => {
    if (msg === 'electron-vite&type=hot-reload') {
      console.log('🔥 HMR: Reloading all windows...');
      for (const win of BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed()) {
          win.webContents.reload();
        }
      }
    }
  });
}

app.whenReady().then(async () => {
  const appStartTime = Date.now();

  // Set app name
  app.setName('CodeBlocks');

  // Initialize database and GraphQL in parallel (blocking, but necessary)
  await Promise.all([
    initializeDatabase(),
    initializeGraphQLSchema()
  ]);

  console.log(`✅ App core ready in ${Date.now() - appStartTime}ms`);

  setupHandlers(ipcMain)

  // Set dock icon for macOS (app level)
  const iconService = IconService.getInstance();
  await iconService.setupDockIcon();

  createWindow()

  console.log(`🚀 App window created in ${Date.now() - appStartTime}ms`);
});
