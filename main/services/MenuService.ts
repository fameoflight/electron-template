import { Menu, BrowserWindow, globalShortcut } from 'electron';
import { sharedMenuService } from '@shared/menu/index.js';

export class MenuService {
  private mainWindow: BrowserWindow;
  private registeredShortcuts: string[] = [];

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  createApplicationMenu() {
    // Get menu template from shared configuration
    const template = sharedMenuService.createElectronMenuTemplate();

    // Add click handlers to menu items that have IDs (custom actions)
    const templateWithHandlers = template.map(category => ({
      ...category,
      submenu: category.submenu.map(item => {
        if (item.type === 'separator' || item.role || !item.id) {
          return item; // Keep separators, role-based items, and items without IDs as-is
        }

        // Add click handler for custom actions that have IDs
        return {
          ...item,
          click: sharedMenuService.createMainProcessClickHandler(this.mainWindow)
        };
      })
    }));

    const menu = Menu.buildFromTemplate(templateWithHandlers);
    Menu.setApplicationMenu(menu);

    console.log('🍽️ Application menu created from shared configuration');
  }

  registerGlobalShortcuts() {
    // Clear any existing shortcuts
    this.unregisterGlobalShortcuts();

    // Get global shortcuts from shared configuration
    const shortcuts = sharedMenuService.getGlobalShortcuts();

    shortcuts.forEach(shortcut => {
      const success = globalShortcut.register(
        shortcut.accelerator!,
        sharedMenuService.createGlobalShortcutHandler(this.mainWindow, shortcut)
      );

      if (success) {
        this.registeredShortcuts.push(shortcut.accelerator!);
        console.log(`✅ Registered global shortcut: ${shortcut.accelerator} (${shortcut.description})`);
      } else {
        console.warn(`❌ Failed to register global shortcut: ${shortcut.accelerator} (${shortcut.description})`);
      }
    });

    console.log(`🌐 Global shortcuts registered: ${this.registeredShortcuts.length} shortcuts`);
  }

  unregisterGlobalShortcuts() {
    this.registeredShortcuts.forEach(accelerator => {
      globalShortcut.unregister(accelerator);
    });
    this.registeredShortcuts = [];

    console.log('🌐 All global shortcuts unregistered');
  }

  // Method to check if a shortcut is registered
  isShortcutRegistered(accelerator: string): boolean {
    return globalShortcut.isRegistered(accelerator);
  }

  // Helper method to show the main window
  showMainWindow() {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  // Method to get menu configuration info (useful for debugging)
  getMenuInfo() {
    return {
      categories: sharedMenuService.getMenuConfigForPlatform().categories.length,
      globalShortcuts: sharedMenuService.getGlobalShortcuts().length,
      registeredShortcuts: this.registeredShortcuts.length
    };
  }
}