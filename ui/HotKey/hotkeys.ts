/**
 * Hotkey system types and definitions
 */

export type HotKeyCategory = 'navigation' | 'chat' | 'editor' | 'global' | 'settings';

export interface HotKeyDependencies {
  navigate: (path: string) => void;
  goBack?: () => void;
  goForward?: () => void;
}

export interface HotKeyDefinition {
  id: string;
  category: HotKeyCategory;
  keys: string | string[];
  description: string;
  enabled: boolean;
  action?: () => void | Promise<void>;
  // Optional event that will be fired alongside the action
  eventName?: string;
  // Whether this hotkey should work even when user is typing in input fields
  global?: boolean;
}

export interface HotKeyHelpItem {
  category: HotKeyCategory;
  keys: string | string[];
  description: string;
  enabled: boolean;
}

/**
 * Utility functions for converting between different hotkey formats
 */

/**
 * Convert Electron-style accelerator string to is-hotkey format
 * Examples: 'CmdOrCtrl+N' → 'mod+n', 'Cmd+Shift+R' → 'mod+shift+r'
 */
export function acceleratorToHotkey(accelerator: string): string {
  return accelerator
    .toLowerCase()
    .replace(/cmdorctrl/g, 'mod')
    .replace(/\+/g, '+');
}

/**
 * Convert Electron-style accelerator string to array of is-hotkey formats
 * Supports alternative key combinations
 */
export function acceleratorToHotkeyArray(accelerator: string | string[]): string[] {
  if (Array.isArray(accelerator)) {
    return accelerator.map(acc => acceleratorToHotkey(acc));
  }
  return [acceleratorToHotkey(accelerator)];
}

/**
 * Format hotkey string for display
 * Examples: 'mod+n' → '⌘+N', 'mod+shift+r' → '⌘+⇧+R', 'mod+plus' → '⌘+plus'
 */
export function formatHotkeyForDisplay(hotkey: string): string {
  return hotkey
    .replace(/mod/g, '⌘')
    .replace(/shift/g, '⇧')
    .replace(/alt/g, '⌥')
    // Keep plus/minus as readable text, then format separators
    .replace(/\+/g, ' + ')
    .toUpperCase();
}

/**
 * Key mapping table for human-readable key names to actual key codes
 * Used internally by hotkey processing to translate semantic names to technical implementations
 */
export const KEY_MAPPINGS: Record<string, string> = {
  'plus': '=',   // Plus functionality is on the '=' key
  'minus': '-',  // Minus functionality is on the '-' key
  // Future mappings can be added here as needed
  // 'slash': '/',
  // 'asterisk': '*',
  // 'semicolon': ';',
};

/**
 * Process hotkey key strings by replacing semantic names with actual key codes
 * Example: 'mod+plus' → 'mod+='
 */
export function processHotkeyKey(key: string): string {
  let processedKey = key;
  Object.entries(KEY_MAPPINGS).forEach(([semantic, actual]) => {
    processedKey = processedKey.replace(semantic, actual);
  });
  return processedKey;
}

/**
 * Helper function to focus chat input
 */
function focusChatInput() {
  // Find and focus the chat input textarea
  const chatInput = document.querySelector(
    'textarea[placeholder*="message"], textarea[placeholder*="Type"], .message-input textarea'
  ) as HTMLTextAreaElement;
  if (chatInput) {
    chatInput.focus();
  }
}

/**
 * Get default hotkey definitions with dependencies injected
 */
export function getDefaultHotKeys(dependencies: HotKeyDependencies): Record<string, HotKeyDefinition> {
  const { navigate, goBack, goForward } = dependencies;

  return {
    'zoom-in': {
      id: 'zoom-in',
      category: 'settings',
      keys: 'mod+plus',
      description: 'Zoom in',
      enabled: true,
    },
    'zoom-out': {
      id: 'zoom-out',
      category: 'settings',
      keys: 'mod+minus',
      description: 'Zoom out',
      enabled: true,
    },
    'dashboard': {
      id: 'dashboard',
      category: 'navigation',
      keys: 'mod+d',
      description: 'Go to Dashboard',
      enabled: true,
      action: () => {
        navigate('/');
      },
      eventName: 'hotkey:dashboard',
    },
    'new-chat': {
      id: 'new-chat',
      category: 'navigation',
      keys: 'mod+n',
      description: 'Start a new chat',
      enabled: true,
      action: () => {
        navigate('/chat/new');
      },
      eventName: 'hotkey:new-chat',
    },
    'navigate-back': {
      id: 'navigate-back',
      category: 'navigation',
      keys: 'mod+left',
      description: 'Navigate back',
      enabled: true,
      global: true,
      action: () => {
        goBack?.();
      },
      eventName: 'hotkey:navigate-back',
    },
    'navigate-forward': {
      id: 'navigate-forward',
      category: 'navigation',
      keys: 'mod+right',
      description: 'Navigate forward',
      enabled: true,
      global: true,
      action: () => {
        goForward?.();
      },
      eventName: 'hotkey:navigate-forward',
    },
    'show-help': {
      id: 'show-help',
      category: 'global',
      keys: ['?', 'shift+/'], // Support both direct ? and shifted /
      description: 'Show keyboard shortcuts',
      enabled: true,
      eventName: 'hotkey:show-help',
    },
    'toggle-settings': {
      id: 'toggle-settings',
      category: 'global',
      keys: 'mod+,',
      description: 'Open settings',
      enabled: true,
      action: () => {
        navigate('/settings');
      },
      eventName: 'hotkey:toggle-settings',
    },
    'hide': {
      id: 'hide',
      category: 'global',
      keys: 'mod+h',
      description: 'Hide App',
      enabled: false,
    },
    'quit-app': {
      id: 'quit-app',
      category: 'global',
      keys: 'mod+q',
      description: 'Quit application',
      enabled: true,
    },
  };
}