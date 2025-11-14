import { findMenuAction } from './menuConfig';

// Type definition for menu action handlers
export type MenuActionHandler = (data?: any) => void | Promise<void>;

// Registry for menu action handlers (used by renderer process)
class MenuActionRegistry {
  private handlers = new Map<string, MenuActionHandler>();

  // Register a handler for a specific menu action
  register(actionId: string, handler: MenuActionHandler): void {
    this.handlers.set(actionId, handler);
  }

  // Unregister a handler for a specific menu action
  unregister(actionId: string): void {
    this.handlers.delete(actionId);
  }

  // Execute a menu action handler
  async execute(actionId: string, data?: any): Promise<void> {
    const handler = this.handlers.get(actionId);
    if (handler) {
      try {
        await handler(data);
      } catch (error) {
        console.error(`Error executing menu action '${actionId}':`, error);
      }
    } else {
      console.warn(`No handler registered for menu action: ${actionId}`);
    }
  }

  // Check if a handler exists for an action
  hasHandler(actionId: string): boolean {
    return this.handlers.has(actionId);
  }

  // Get all registered action IDs
  getRegisteredActions(): string[] {
    return Array.from(this.handlers.keys());
  }

  // Clear all handlers
  clear(): void {
    this.handlers.clear();
  }
}

// Global registry instance
export const menuActionRegistry = new MenuActionRegistry();

// IPC message types for menu communication
export const MENU_IPC_CHANNELS = {
  // From main to renderer: menu action triggered
  MENU_ACTION: 'menu:action',

  // From renderer to main: menu state updates
  MENU_UPDATE: 'menu:update',
  MENU_ENABLE: 'menu:enable',
  MENU_DISABLE: 'menu:disable'
} as const;

// Helper function to create a menu action handler with common logging
export function createMenuActionHandler(
  actionId: string,
  handler: MenuActionHandler,
  options?: {
    logExecution?: boolean;
    preventDefault?: boolean;
  }
): MenuActionHandler {
  return async (data?: any) => {
    if (options?.logExecution !== false) {
      const actionInfo = findMenuAction(actionId);
      const description = actionInfo?.action?.description || actionId;
      console.log(`🍽️ Menu action triggered: ${description}`);
    }

    await handler(data);
  };
}

// Utility functions for common menu actions
export const commonMenuActions = {
  // Navigation helpers
  navigateTo: (path: string) => {
    window.location.hash = path;
  },

  // Modal helpers
  openModal: (modalId: string, data?: any) => {
    // This would integrate with your modal system
    console.log(`Opening modal: ${modalId}`, data);
  },

  // Settings helpers
  openSettings: (section?: string) => {
    commonMenuActions.navigateTo(section ? `/settings/${section}` : '/settings');
  }
};