import { useEffect } from 'react';
import { menuActionRegistry, MENU_IPC_CHANNELS, createMenuActionHandler } from '@shared/menu/index.js';

// Get electron API from the exposed window.electron object
interface IpcRendererExposed {
  on: (channel: string, callback: (...args: any[]) => void) => void;
  removeListener: (channel: string, callback: (...args: any[]) => void) => void;
  removeAllListeners: (channel: string) => void;
}

// Type guard to check if window.electron has ipcRenderer
function hasIpcRenderer(electron: any): electron is { ipcRenderer: IpcRendererExposed } {
  return electron && typeof electron.ipcRenderer === 'object';
}

/**
 * React hook to set up menu action listeners in the renderer process
 * This should be called once in the main App component
 */
export function useMenuActions() {
  useEffect(() => {
    // Set up IPC listener for menu actions from main process
    const handleMenuAction = (_event: any, data: { actionId: string; timestamp: number; isGlobalShortcut?: boolean }) => {
      const { actionId, isGlobalShortcut } = data;

      // Log the action (with different icons for regular vs global shortcuts)
      const icon = isGlobalShortcut ? '🌐' : '🍽️';
      console.log(`${icon} Menu action received: ${actionId}`);

      // Execute the registered action handler
      menuActionRegistry.execute(actionId, data);
    };

    // Register the IPC listener through the exposed electron API
    if (window.electron && hasIpcRenderer(window.electron)) {
      window.electron.ipcRenderer.on(MENU_IPC_CHANNELS.MENU_ACTION, handleMenuAction);
    } else {
      // Fallback for development or when preload script isn't loaded yet
      console.warn('⚠️ window.electron.ipcRenderer not available, menu actions will not work');
    }

    // Cleanup on unmount
    return () => {
      if (window.electron && hasIpcRenderer(window.electron)) {
        window.electron.ipcRenderer.removeListener(MENU_IPC_CHANNELS.MENU_ACTION, handleMenuAction);
      }
      menuActionRegistry.clear();
    };
  }, []);

  // Return the registry so components can register their own handlers
  return {
    register: menuActionRegistry.register.bind(menuActionRegistry),
    unregister: menuActionRegistry.unregister.bind(menuActionRegistry),
    createHandler: createMenuActionHandler
  };
}