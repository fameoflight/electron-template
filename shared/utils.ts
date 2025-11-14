type ModelInfo = {
  id: string;
  name: string;
  [key: string]: any;
};

export async function fetchModels(
  baseURL: string,
  apiKey: string,
  kind: string,
  customHeaders?: Record<string, string>
): Promise<ModelInfo[]> {
  try {
    // Validate input parameters
    if (!baseURL || baseURL.trim() === '') {
      throw new Error('Base URL is required and cannot be empty');
    }

    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API key is required and cannot be empty');
    }

    // Validate that baseURL is a proper URL
    try {
      new URL(baseURL);
    } catch {
      throw new Error(`Invalid base URL: ${baseURL}`);
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...customHeaders
    };

    // Add provider-specific headers
    if (kind && kind.toLowerCase() === 'anthropic') {
      headers['anthropic-dangerous-direct-browser-access'] = 'true';
    }

    // Ensure baseURL doesn't end with trailing slash to avoid double slashes
    const cleanBaseURL = baseURL.replace(/\/+$/, '');
    const response = await fetch(`${cleanBaseURL}/models`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Handle different response formats
    if (data && data.data && Array.isArray(data.data)) {
      // OpenAI-compatible format
      return data.data.map((model: Record<string, unknown>) => ({
        id: String(model.id),
        name: String(model.id), // Fallback to ID if name not available
        version: '1.0.0', // Default version
        provider: 'unknown', // Default provider
        ...model
      }));
    } else if (data && Array.isArray(data)) {
      // Direct array format
      return data.map((model: Record<string, unknown>) => ({
        id: String(model.id || model.model),
        name: String(model.name || model.id || model.model),
        version: '1.0.0', // Default version
        provider: 'unknown', // Default provider
        ...model
      }));
    } else {
      console.warn('Unexpected model response format:', data);
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch models:', error);
    throw new Error(`Failed to fetch models: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}


export function humanize(text: string): string {
  if (typeof text !== 'string' || text.trim() === '') return '';

  return text
    .replace(/[-_]+/g, ' ')               // Replace one or more dashes/underscores with a single space
    .replace(/\s+/g, ' ')                 // Replace multiple spaces with a single space
    .replace(/\b\w/g, char => char.toUpperCase()) // Capitalize the first letter of each word
    .trim();
}

export function getPlatform(): 'windows' | 'mac' | 'linux' {
  try {
    // Prefer Node/Electron process.platform if available (works in main and in renderer with nodeIntegration)
    const proc = (globalThis as { process?: { platform?: string } }).process;
    const nodePlatform = proc && typeof proc.platform === 'string' ? String(proc.platform).toLowerCase() : undefined;
    if (nodePlatform) {
      if (nodePlatform.startsWith('win')) return 'windows';
      if (nodePlatform === 'darwin') return 'mac';
      return 'linux';
    }

    // Fallback to browser APIs (renderer without nodeIntegration)
    if (typeof navigator !== 'undefined') {
      const uaDataPlatform = (navigator as { userAgentData?: { platform?: string } }).userAgentData?.platform;
      const navPlatform = uaDataPlatform || (navigator as { platform?: string; userAgent?: string }).platform || navigator.userAgent || '';
      const p = String(navPlatform).toLowerCase();
      if (p.includes('win')) return 'windows';
      if (p.includes('mac') || p.includes('iphone') || p.includes('ipad') || p.includes('ipod')) return 'mac';
      if (p.includes('linux') || p.includes('android') || p.includes('x11')) return 'linux';
    }
  } catch {
    // ignore and fall through to default
  }

  return 'mac';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Simple pluralization utility
 * Handles common English pluralization patterns
 */
export function pluralize(str: string): string {
  const plural: Record<string, string> = {
    person: 'people',
    child: 'children',
    goose: 'geese',
    man: 'men',
    woman: 'women',
    tooth: 'teeth',
    foot: 'feet',
    mouse: 'mice',
    ox: 'oxen',
  };

  const lower = str.toLowerCase();
  if (plural[lower]) {
    return str.charAt(0) === str.charAt(0).toUpperCase()
      ? plural[lower].charAt(0).toUpperCase() + plural[lower].slice(1)
      : plural[lower];
  }

  // Handle common patterns
  if (lower.endsWith('y') && !['ay', 'ey', 'iy', 'oy', 'uy'].some(end => lower.endsWith(end))) {
    return str.slice(0, -1) + 'ies';
  }
  if (lower.endsWith('s') || lower.endsWith('x') || lower.endsWith('z') ||
    lower.endsWith('ch') || lower.endsWith('sh')) {
    return str + 'es';
  }
  if (lower.endsWith('f')) {
    return str.slice(0, -1) + 'ves';
  }
  if (lower.endsWith('fe')) {
    return str.slice(0, -2) + 'ves';
  }

  return str + 's';
}

/**
 * Simple singularization utility
 * Handles common English singularization patterns
 */
export function singularize(str: string): string {
  const singular: Record<string, string> = {
    people: 'person',
    children: 'child',
    geese: 'goose',
    men: 'man',
    women: 'woman',
    teeth: 'tooth',
    feet: 'foot',
    mice: 'mouse',
    oxen: 'ox',
  };

  const lower = str.toLowerCase();
  if (singular[lower]) {
    return str.charAt(0) === str.charAt(0).toUpperCase()
      ? singular[lower].charAt(0).toUpperCase() + singular[lower].slice(1)
      : singular[lower];
  }

  // Handle common patterns (reverse of pluralize)
  if (lower.endsWith('ies')) {
    return str.slice(0, -3) + 'y';
  }
  if (lower.endsWith('es') && ['s', 'x', 'z', 'ch', 'sh'].some(end => lower.slice(0, -2).endsWith(end))) {
    return str.slice(0, -2);
  }
  if (lower.endsWith('ves')) {
    return str.slice(0, -3) + 'f';
  }

  // Simple case: just remove 's'
  if (lower.endsWith('s') && lower.length > 1) {
    return str.slice(0, -1);
  }

  return str;
}

export function getTimeAgo(ts: string): string {
  const now = new Date();
  const past = new Date(ts);
  const diffMs = now.getTime() - past.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  }

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  }

  if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }

  return formatDateTime(ts, 'date');
}

export function formatDateTime(ts: string, type: string): string {
  const date = new Date(ts);

  switch (type) {
    case 'date':
      return date.toLocaleDateString();
    case 'datetime':
      return date.toLocaleString();
    case 'relative':
      return getTimeAgo(ts);
    case 'time':
    default:
      return date.toLocaleTimeString();
  }
};