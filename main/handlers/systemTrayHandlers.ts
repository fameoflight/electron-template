import { ipcMain, dialog, app } from 'electron';

// We need to access the global variables from the main process
declare global {
  var __jobQueue: import('../services/JobQueue.js').default | null;
}

/**
 * System tray and job queue related IPC handlers
 */
export const systemTrayHandlers = {
  "systemTray:getJobQueueStatus": async () => {
    if (!global.__jobQueue) {
      return { isRunning: false, status: null };
    }

    try {
      const status = global.__jobQueue.getStatus();
      const stats = await global.__jobQueue.getStats();

      return {
        isRunning: true,
        status: {
          ...status,
          ...stats
        }
      };
    } catch (error) {
      console.error('[SystemTray] Error getting job queue status:', error);
      return { isRunning: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  "systemTray:forceQuit": async () => {
    console.log('[SystemTray] Force quit requested via IPC');

    // Set app as quitting to prevent window close prevention
    (app as any).isQuitting = true;

    app.quit();
  },

  "systemTray:quitWithConfirmation": async () => {
    if (!global.__jobQueue) {
      app.quit();
      return { shouldQuit: true };
    }

    try {
      const status = global.__jobQueue.getStatus();
      const hasActiveJobs = status.runningJobs.length > 0;

      if (!hasActiveJobs) {
        const app = (await import('electron')).app;
        app.quit();
        return { shouldQuit: true };
      }

      // Show confirmation dialog
      const result = await dialog.showMessageBox({
        type: 'warning',
        buttons: ['Wait for Jobs', 'Force Quit', 'Cancel'],
        defaultId: 0,
        message: 'Background jobs are still running',
        detail: `${status.runningJobs.length} jobs are currently executing. Quitting now may interrupt ongoing operations.`
      });

      if (result.response === 0) {
        // Wait for jobs
        return { shouldQuit: false, message: 'Waiting for jobs to complete' };
      } else if (result.response === 1) {
        // Force quit
        (app as any).isQuitting = true;
        app.quit();
        return { shouldQuit: true, forced: true };
      } else {
        // Cancel
        return { shouldQuit: false };
      }
    } catch (error) {
      console.error('[SystemTray] Error in quit confirmation:', error);
      return { shouldQuit: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  "systemTray:cancelJob": async (event: any, data: { jobId: string }) => {
    if (!global.__jobQueue) {
      return { success: false, error: 'Job queue not running' };
    }

    try {
      const success = await global.__jobQueue.cancelJob(data.jobId);
      return { success };
    } catch (error) {
      console.error('[SystemTray] Error cancelling job:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  "systemTray:getAvailableJobTypes": async () => {
    if (!global.__jobQueue) {
      return { types: [] };
    }

    try {
      const types = global.__jobQueue.getAvailableJobTypes();
      return { types };
    } catch (error) {
      console.error('[SystemTray] Error getting job types:', error);
      return { types: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};

// Register all system tray handlers
export function registerSystemTrayHandlers() {
  Object.entries(systemTrayHandlers).forEach(([channel, handler]) => {
    ipcMain.handle(channel, async (event: any, ...args: any[]) => {
      try {
        return await (handler as any).apply(null, [event, ...args]);
      } catch (error) {
        console.error(`[SystemTray] Error in handler ${channel}:`, error);
        throw error;
      }
    });
  });
}