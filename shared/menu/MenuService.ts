import { menuConfig } from './menuConfig';
import { MenuAction, MenuCategory, isMenuItemVisibleForPlatform, isMenuAction, isMenuSeparator, isMenuSubmenu } from './menuTypes';
import { MENU_IPC_CHANNELS } from './menuActions';

// Shared MenuService - provides utilities for both main and renderer processes
export class SharedMenuService {
  /**
   * Get menu configuration filtered for current platform
   */
  getMenuConfigForPlatform(platform: NodeJS.Platform = process.platform): typeof menuConfig {
    return {
      categories: menuConfig.categories
        .filter(category => isMenuItemVisibleForPlatform(category, platform))
        .map(category => ({
          ...category,
          submenu: category.submenu.filter(item => isMenuItemVisibleForPlatform(item, platform))
        })),
      globalShortcuts: menuConfig.globalShortcuts
        .filter(shortcut => isMenuItemVisibleForPlatform(shortcut, platform))
    };
  }

  /**
   * Convert shared menu configuration to Electron MenuItemConstructorOptions
   * This is used by the main process to build Electron menus
   */
  createElectronMenuTemplate(platform: NodeJS.Platform = process.platform) {
    const config = this.getMenuConfigForPlatform(platform);

    return config.categories.map(category => this.convertCategoryToElectron(category));
  }

  /**
   * Convert a menu category to Electron format
   */
  private convertCategoryToElectron(category: MenuCategory) {
    return {
      label: category.label,
      submenu: category.submenu.map(item => this.convertItemToElectron(item))
    };
  }

  /**
   * Convert a menu item to Electron format
   */
  private convertItemToElectron(item: any): any {
    if (isMenuSeparator(item)) {
      return { type: 'separator' };
    }

    if (isMenuSubmenu(item)) {
      return {
        label: item.label,
        role: item.role,
        submenu: item.submenu.map(subItem => this.convertItemToElectron(subItem))
      };
    }

    if (isMenuAction(item)) {
      return {
        id: item.id, // Include the action ID for click handler identification
        label: item.label,
        accelerator: item.accelerator,
        enabled: item.enabled !== false,
        visible: item.visible !== false
      };
    }

    // Fallback for items with roles (built-in Electron behaviors)
    if ('role' in item) {
      return {
        label: item.label,
        role: item.role
      };
    }

    return item;
  }

  /**
   * Get all menu actions (filtered by platform)
   */
  getAllMenuActions(platform: NodeJS.Platform = process.platform): MenuAction[] {
    const config = this.getMenuConfigForPlatform(platform);
    const actions: MenuAction[] = [];

    config.categories.forEach(category => {
      category.submenu.forEach(item => {
        if (isMenuAction(item)) {
          actions.push(item);
        }
      });
    });

    actions.push(...config.globalShortcuts);

    return actions;
  }

  /**
   * Find a specific menu action by ID
   */
  findMenuAction(id: string, platform: NodeJS.Platform = process.platform): MenuAction | undefined {
    return this.getAllMenuActions(platform).find(action => action.id === id);
  }

  /**
   * Get all global shortcuts (filtered by platform)
   */
  getGlobalShortcuts(platform: NodeJS.Platform = process.platform): MenuAction[] {
    const config = this.getMenuConfigForPlatform(platform);
    return config.globalShortcuts;
  }

  /**
   * Check if a menu action should be enabled
   * Can be overridden for dynamic enable/disable logic
   */
  isMenuActionEnabled(actionId: string): boolean {
    // Default implementation - can be extended
    return true;
  }

  /**
   * Check if a menu action should be visible
   * Can be overridden for dynamic visibility logic
   */
  isMenuActionVisible(actionId: string): boolean {
    // Default implementation - can be extended
    return true;
  }

  /**
   * Create menu click handler for main process
   * Sends IPC message to renderer process
   */
  createMainProcessClickHandler(mainWindow: any) {
    return (menuItem: any) => {
      // Get the action ID from the menu item (set during template creation)
      const actionId = menuItem.id;

      if (actionId) {
        console.log(`🍽️ Menu clicked: ${actionId}`);
        mainWindow.webContents.send(MENU_IPC_CHANNELS.MENU_ACTION, {
          actionId,
          timestamp: Date.now()
        });
      } else {
        console.warn('🍽️ Menu clicked but no action ID found:', menuItem);
      }
    };
  }

  /**
   * Create global shortcut handler for main process
   * Sends IPC message to renderer process
   */
  createGlobalShortcutHandler(mainWindow: any, action: MenuAction) {
    return () => {
      console.log(`🌐 Global shortcut triggered: ${action.id} (${action.description})`);
      mainWindow.webContents.send(MENU_IPC_CHANNELS.MENU_ACTION, {
        actionId: action.id,
        timestamp: Date.now(),
        isGlobalShortcut: true
      });
    };
  }
}

// Export singleton instance
export const sharedMenuService = new SharedMenuService();