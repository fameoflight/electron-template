import { useState, useEffect } from 'react';

interface JobQueueStatus {
  isRunning: boolean;
  runningJobs: number;
  pendingJobs: number;
  completedJobs: number;
  failedJobs: number;
  availableJobTypes?: string[];
  error?: string;
}

interface SystemTrayReturn {
  jobQueueStatus: JobQueueStatus | null;
  isLoading: boolean;
  refreshStatus: () => Promise<void>;
  forceQuit: () => Promise<{ success: boolean; error?: string }>;
  quitWithConfirmation: () => Promise<{ shouldQuit: boolean; forced?: boolean; error?: string }>;
  cancelJob: (jobId: string) => Promise<{ success: boolean; error?: string }>;
}

export function useSystemTray(): SystemTrayReturn {
  const [jobQueueStatus, setJobQueueStatus] = useState<JobQueueStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshStatus = async () => {
    try {
      setIsLoading(true);
      const result = await window.electron['systemTray:getJobQueueStatus'](undefined);

      if (result.isRunning && result.status) {
        setJobQueueStatus({
          isRunning: true,
          runningJobs: result.status.runningJobs?.length || 0,
          pendingJobs: result.status.pending || 0,
          completedJobs: result.status.completed || 0,
          failedJobs: result.status.failed || 0,
          error: undefined
        });
      } else {
        setJobQueueStatus({
          isRunning: false,
          runningJobs: 0,
          pendingJobs: 0,
          completedJobs: 0,
          failedJobs: 0,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Failed to get job queue status:', error);
      setJobQueueStatus({
        isRunning: false,
        runningJobs: 0,
        pendingJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const forceQuit = async () => {
    try {
      await window.electron['systemTray:forceQuit'](undefined);
      return { success: true };
    } catch (error) {
      console.error('Failed to force quit:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const quitWithConfirmation = async () => {
    try {
      const result = await window.electron['systemTray:quitWithConfirmation'](undefined);
      return result;
    } catch (error) {
      console.error('Failed to quit with confirmation:', error);
      return {
        shouldQuit: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const cancelJob = async (jobId: string) => {
    try {
      const result = await window.electron['systemTray:cancelJob']({ jobId });
      return result;
    } catch (error) {
      console.error('Failed to cancel job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // Listen for tray-related events from main process
  useEffect(() => {
    const handleTrayNavigate = (event: any, path: string) => {
      console.log('Tray navigation request:', path);
      // You could implement routing logic here
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    };

    const handleTrayQuickAction = (event: any, action: string) => {
      console.log('Tray quick action:', action);
      // Handle quick actions like creating new jobs
      switch (action) {
        case 'new-job':
          // Navigate to job creation page or show modal
          window.history.pushState({}, '', '/jobs/new');
          window.dispatchEvent(new PopStateEvent('popstate'));
          break;
        default:
          console.warn('Unknown tray quick action:', action);
      }
    };

    const handleQuitWithActiveJobs = () => {
      // Show confirmation dialog to user
      quitWithConfirmation();
    };

    // Register event listeners - access via the ipcRenderer property
    (window.electron as any).ipcRenderer.on('tray:navigate', handleTrayNavigate);
    (window.electron as any).ipcRenderer.on('tray:quick-action', handleTrayQuickAction);
    (window.electron as any).ipcRenderer.on('tray:quit-with-active-jobs', handleQuitWithActiveJobs);

    // Initial status fetch
    refreshStatus();

    // Set up periodic refresh
    const refreshInterval = setInterval(refreshStatus, 3000); // Every 3 seconds

    return () => {
      // Clean up event listeners
      (window.electron as any).ipcRenderer.removeListener('tray:navigate', handleTrayNavigate);
      (window.electron as any).ipcRenderer.removeListener('tray:quick-action', handleTrayQuickAction);
      (window.electron as any).ipcRenderer.removeListener('tray:quit-with-active-jobs', handleQuitWithActiveJobs);

      clearInterval(refreshInterval);
    };
  }, []);

  return {
    jobQueueStatus,
    isLoading,
    refreshStatus,
    forceQuit,
    quitWithConfirmation,
    cancelJob
  };
}