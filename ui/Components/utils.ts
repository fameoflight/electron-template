export function classNames(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export function openInFinder(filePath: string): void {
  // Open the file in the system's file manager
  if (window.electron?.['open-in-finder']) {
    window.electron['open-in-finder'](filePath);
  } else {
    // Fallback for non-Electron environments
    console.warn('Electron API not available, cannot open in Finder');
  }
}

export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.electron;
}

export function copyToClipboard(text: string) {
  // Type assertion for the electron API with getPathForFile
  const electronWithClipboard = window.electron as unknown as {
    clipboard: {
      writeText: (text: string) => void;
      readText: () => string;
    };
  };
  if (electronWithClipboard?.clipboard) {
    // Use Electron's clipboard API if available
    electronWithClipboard.clipboard.writeText(text);
    return;
  }

  try {
    navigator.clipboard.writeText(text);
  } catch (err) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    } catch (fallbackErr) {
      console.error('Failed to copy text: ', fallbackErr);
    }
  }
}