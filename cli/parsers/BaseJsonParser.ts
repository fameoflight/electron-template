/**
 * BaseJsonParser - Common JSON parsing functionality
 *
 * Provides shared parsing utilities and error handling for all JSON parsers.
 * Each specific parser extends this to handle their particular file type.
 */

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export abstract class BaseJsonParser<T> {
  /**
   * Parse JSON file content with error handling
   */
  protected parseJson(content: string): ParseResult<any> {
    const parsed = JSON.parse(content);
    return { success: true, data: parsed };
  }

  /**
   * Main parsing method - implemented by each specific parser
   */
  abstract parseFile(content: string): ParseResult<T>;

  /**
   * Validate required fields exist
   */
  protected validateRequired(obj: any, requiredFields: string[]): string | null {
    for (const field of requiredFields) {
      if (!(field in obj)) {
        return `Missing required field: ${field}`;
      }
    }
    return null;
  }

  /**
   * Safe string transformation with fallback
   */
  protected safeString(value: any, fallback: string = ''): string {
    return typeof value === 'string' ? value : fallback;
  }

  /**
   * Safe boolean transformation with fallback
   */
  protected safeBoolean(value: any, fallback: boolean = false): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return fallback;
  }

  /**
   * Safe number transformation with fallback
   */
  protected safeNumber(value: any, fallback: number = 0): number {
    if (typeof value === 'number') return value;
    const parsed = Number(value);
    return isNaN(parsed) ? fallback : parsed;
  }
}