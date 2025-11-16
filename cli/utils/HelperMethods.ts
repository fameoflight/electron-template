/**
 * Helper Methods - Common utilities following refactor.md principles
 *
 * DRY utilities extracted from repeated patterns:
 * - Error message extraction
 * - Timestamp formatting for filenames
 * - File size formatting
 * - Duration formatting
 *
 * Following refactor.md DRY principle
 */

/**
 * Extract error message safely from unknown error type
 * Eliminates repeated error extraction pattern
 */
export function extractErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Format timestamp for filename (YYYY-MM-DD-HHMMSS)
 * Extracted from multiple database and build commands
 */
export function formatTimestampForFilename(date: Date = new Date()): string {
  return date.toISOString()
    .replace(/[:.]/g, '-')
    .slice(0, 19) // Remove milliseconds and Z
    .replace('T', '-');
}

/**
 * Format timestamp for human-readable display
 */
export function formatTimestampForDisplay(date: Date = new Date()): string {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * Format file size for display (B, KB, MB, GB)
 * Used in multiple commands for consistent formatting
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  const rounded = Math.round(value * 100) / 100;

  return `${rounded} ${sizes[i]}`;
}

/**
 * Format duration for display (ms, s, m, h)
 * Commonly needed in build and database operations
 */
export function formatDuration(milliseconds: number): string {
  const absMs = Math.abs(milliseconds);

  if (absMs < 1000) {
    return `${milliseconds}ms`;
  } else if (absMs < 60000) {
    const seconds = Math.round(milliseconds / 1000 * 100) / 100;
    return `${seconds}s`;
  } else if (absMs < 3600000) {
    const minutes = Math.round(milliseconds / 60000 * 100) / 100;
    return `${minutes}m`;
  } else {
    const hours = Math.round(milliseconds / 3600000 * 100) / 100;
    return `${hours}h`;
  }
}

/**
 * Format duration as human-readable "X minutes Y seconds"
 */
export function formatDurationDetailed(milliseconds: number): string {
  const absMs = Math.abs(milliseconds);
  const sign = milliseconds < 0 ? '-' : '';

  const hours = Math.floor(absMs / 3600000);
  const minutes = Math.floor((absMs % 3600000) / 60000);
  const seconds = Math.round((absMs % 60000) / 1000);

  const parts: string[] = [];

  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return sign + parts.join(' ');
}

/**
 * Pad string to specified width
 * Useful for table formatting in CLI output
 */
export function padString(str: string, width: number, align: 'left' | 'right' = 'left'): string {
  if (str.length >= width) return str;

  const padding = ' '.repeat(width - str.length);
  return align === 'left' ? str + padding : padding + str;
}

/**
 * Create a simple progress bar for CLI
 */
export function createProgressBar(current: number, total: number, width: number = 20): string {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));
  const filled = Math.round((width * percentage) / 100);
  const empty = width - filled;

  const filledBar = '█'.repeat(filled);
  const emptyBar = '░'.repeat(empty);
  const percentageStr = padString(`${Math.round(percentage)}%`, 4, 'right');

  return `[${filledBar}${emptyBar}] ${percentageStr}`;
}

/**
 * Mask sensitive data for logging
 * Used in notarization and configuration commands
 */
export function maskSensitiveData(data?: string, visibleChars: number = 2): string {
  if (!data) return 'Not configured';
  if (data.length <= visibleChars * 2) return '****';

  const start = data.substring(0, visibleChars);
  const end = data.substring(data.length - visibleChars);
  const middle = '*'.repeat(Math.max(4, data.length - visibleChars * 2));

  return `${start}${middle}${end}`;
}

/**
 * Generate a unique ID
 * Replaces ad-hoc ID generation across commands
 */
export function generateId(prefix?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const id = `${timestamp}-${random}`;
  return prefix ? `${prefix}-${id}` : id;
}

/**
 * Validate that required options are present
 * Common validation pattern for command options
 */
export function validateRequiredOptions<T extends Record<string, any>>(
  options: T,
  required: (keyof T)[]
): { valid: boolean; missing: (keyof T)[] } {
  const missing = required.filter(key => !options[key]);
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Convert camelCase to kebab-case
 * Used for command argument processing
 */
export function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Convert kebab-case to camelCase
 * Used for command argument processing
 */
export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}