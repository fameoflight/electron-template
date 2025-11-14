import { formatHotkeyForDisplay, type HotKeyDefinition } from './hotkeys';

export const categoryNames: Record<string, string> = {
  navigation: 'Navigation',
  chat: 'Chat Controls',
  editor: 'Text Editor',
  global: 'Global Shortcuts',
  settings: 'Settings',
};

export function getCategoryColorClass(category: string): string {
  const colorMap: Record<string, string> = {
    navigation: 'bg-info text-info-foreground border-info-3',
    chat: 'bg-success text-success-foreground border-success-3',
    editor: 'bg-warning text-warning-foreground border-warning-3',
    global: 'bg-primary-2 text-primary border-primary-4',
    settings: 'bg-error text-error-foreground border-error-3',
  };

  return colorMap[category] || 'bg-surface-base text-secondary border-default';
}

export function formatKeysForDisplay(keys: string | string[]): string[] {
  if (Array.isArray(keys)) {
    return keys.map(key => formatHotkeyForDisplay(key));
  }
  return [formatHotkeyForDisplay(keys)];
}

export function filterHotkeys(hotkeys: Record<string, HotKeyDefinition>, searchText: string): Array<[string, HotKeyDefinition]> {
  return Object.entries(hotkeys).filter(([, hotkey]) => {
    if (!hotkey.enabled) return false;

    if (searchText) {
      const searchLower = searchText.toLowerCase();
      const keysString = Array.isArray(hotkey.keys)
        ? hotkey.keys.join(' ')
        : hotkey.keys;

      return (
        hotkey.description.toLowerCase().includes(searchLower) ||
        hotkey.id.toLowerCase().includes(searchLower) ||
        keysString.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });
}