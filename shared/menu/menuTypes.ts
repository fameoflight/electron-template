import { MenuItemConstructorOptions } from 'electron';

// Shared menu item interfaces that work across processes
export interface MenuAction {
  id: string;
  label: string;
  accelerator?: string;
  description?: string;
  category: 'file' | 'edit' | 'view' | 'window' | 'app' | 'global' | 'settings';
  enabled?: boolean;
  visible?: boolean;
  platform?: 'darwin' | 'win32' | 'linux' | 'all';
}

export interface MenuSeparator {
  type: 'separator';
}

export interface MenuRole {
  role: string; // Built-in Electron role
  label?: string; // Optional label override
}

export interface MenuSubmenu {
  label: string;
  submenu: (MenuAction | MenuSeparator | MenuRole)[];
  role?: string; // For built-in Electron roles
}

export type MenuItem = MenuAction | MenuSeparator | MenuSubmenu | MenuRole;

export interface MenuCategory {
  label: string;
  submenu: (MenuAction | MenuSeparator | MenuSubmenu | MenuRole)[];
  platform?: 'darwin' | 'win32' | 'linux' | 'all';
}

export interface MenuConfig {
  categories: MenuCategory[];
  globalShortcuts: MenuAction[];
}

// Helper to determine if item is an action
export function isMenuAction(item: MenuItem): item is MenuAction {
  return 'id' in item && typeof item.id === 'string';
}

// Helper to determine if item is a separator
export function isMenuSeparator(item: MenuItem): item is MenuSeparator {
  return 'type' in item && item.type === 'separator';
}

// Helper to determine if item is a submenu
export function isMenuSubmenu(item: MenuItem): item is MenuSubmenu {
  return 'submenu' in item && Array.isArray(item.submenu);
}

// Helper to determine if item is a role-based menu item
export function isMenuRole(item: MenuItem): item is MenuRole {
  return 'role' in item && !('submenu' in item) && !('id' in item);
}

// Helper to check if menu item should be shown on current platform
export function isMenuItemVisibleForPlatform(item: MenuItem | MenuCategory, platform: NodeJS.Platform = process.platform): boolean {
  const itemPlatform = (item as any).platform;
  if (!itemPlatform || itemPlatform === 'all') return true;

  switch (platform) {
    case 'darwin':
      return itemPlatform === 'darwin' || itemPlatform === 'all';
    case 'win32':
      return itemPlatform === 'win32' || itemPlatform === 'all';
    default:
      return itemPlatform === 'linux' || itemPlatform === 'all';
  }
}