import { MenuConfig } from './menuTypes';

// Simplified menu configuration - single source of truth
export const menuConfig: MenuConfig = {
  categories: [
    // File menu
    {
      label: 'File',
      submenu: [
        {
          id: 'new-post',
          label: 'New Post',
          category: 'file',
          accelerator: 'CmdOrCtrl+N',
          description: 'Create a new blog post'
        }
      ]
    },

    // Edit menu with standard copy/paste functionality
    {
      label: 'Edit',
      submenu: [
        { role: 'undo', label: 'Undo' },
        { role: 'redo', label: 'Redo' },
        { type: 'separator' },
        { role: 'cut', label: 'Cut' },
        { role: 'copy', label: 'Copy' },
        { role: 'paste', label: 'Paste' },
        { role: 'pasteAndMatchStyle', label: 'Paste and Match Style' },
        { role: 'delete', label: 'Delete' },
        { role: 'selectAll', label: 'Select All' },
        { type: 'separator' },
        { role: 'toggleSpellChecker', label: 'Toggle Spell Checker' }
      ]
    },

    // Settings menu
    {
      label: 'Settings',
      submenu: [
        {
          id: 'profile',
          label: 'Profile',
          category: 'settings',
          description: 'View and edit user profile'
        }
      ]
    }
  ],

  // Global shortcuts (available even when app is not focused)
  globalShortcuts: []
};

// Helper function to get all menu actions (flattened)
export function getAllMenuActions(): Array<{ action: any; category: string }> {
  const actions: Array<{ action: any; category: string }> = [];

  menuConfig.categories.forEach(category => {
    category.submenu.forEach(item => {
      if (typeof item === 'object' && 'id' in item) {
        actions.push({ action: item, category: category.label });
      }
    });
  });

  menuConfig.globalShortcuts.forEach(action => {
    actions.push({ action, category: 'global' });
  });

  return actions;
}

// Helper function to find menu action by ID
export function findMenuAction(id: string): { action: any; category: string } | undefined {
  return getAllMenuActions().find(({ action }) => action.id === id);
}