/**
 * Utility helper for ID encoding/decoding operations
 * Extracted from BaseResolver to avoid circular dependencies
 */

export class IdHelper {
  /**
   * Encode a local database ID to a global GraphQL ID
   */
  static encodeGlobalId(typeName: string, localId: string): string {
    return Buffer.from(`${typeName}:${localId}`).toString('base64');
  }

  /**
   * Decode a global GraphQL ID to local database ID
   */
  static decodeGlobalId(globalId: string): string {
    try {
      const decoded = Buffer.from(globalId, 'base64').toString('utf8');
      const parts = decoded.split(':');
      return parts[parts.length - 1];
    } catch (error) {
      console.warn('Failed to decode global ID:', globalId);
      return globalId;
    }
  }

  /**
   * Decode a global GraphQL ID to local database ID, throwing an error if invalid
   */
  static decodeOrThrow(globalId: string): string {
    try {
      const decoded = Buffer.from(globalId, 'base64').toString('utf8');
      if (!decoded.includes(':')) {
        throw new Error('Invalid ID format: missing type separator');
      }
      const parts = decoded.split(':');
      if (parts.length < 2) {
        throw new Error('Invalid ID format: insufficient parts');
      }
      return parts[parts.length - 1];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Invalid global ID format');
    }
  }

  /**
   * Check if a string is a valid global ID format
   */
  static isValidGlobalId(globalId: string): boolean {
    try {
      const decoded = Buffer.from(globalId, 'base64').toString('utf8');
      return decoded.includes(':') && decoded.split(':').length >= 2;
    } catch (error) {
      return false;
    }
  }

  /**
   * Decode multiple IDs at once
   */
  static decodeIds(ids: Record<string, string>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(ids)) {
      result[key] = this.decodeGlobalId(value);
    }
    return result;
  }
}