import { fromGlobalId, toGlobalId } from '../../relay/Node.js';

/**
 * Centralized service for Relay global/local ID conversion
 * Eliminates duplication across BaseResolver and RelayRepository
 */
export class IdConverterService {
  private static readonly UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  /**
   * Check if a string is already a UUID
   */
  static isUUID(id: string): boolean {
    return this.UUID_REGEX.test(id);
  }

  /**
   * Decode a Relay global ID to a local database ID
   * Smart enough to handle both global IDs and already-decoded local UUIDs
   * @param id The Relay global ID or local UUID
   * @returns The local database ID
   */
  static decodeId(id: string): string {
    // Already a local UUID?
    if (this.isUUID(id)) {
      return id;
    }

    // Try to decode as a global ID
    try {
      const decoded = fromGlobalId(id);
      return decoded.id!;
    } catch {
      // If it fails to decode and isn't a UUID, return as-is
      return id;
    }
  }

  /**
   * Encode a local database ID to a Relay global ID
   * @param typeName The GraphQL type name (e.g., 'User', 'Connection')
   * @param localId The local database ID
   * @returns The Relay global ID
   */
  static encodeId(typeName: string, localId: string): string {
    return toGlobalId(typeName, localId);
  }

  /**
   * Decode multiple global IDs at once
   * Useful when you have multiple ID parameters that need decoding
   * @param ids Object with ID fields to decode
   * @returns Object with decoded local IDs
   *
   * @example
   * const { documentId, embeddingModelId } = IdConverterService.decodeIds({ documentId, embeddingModelId });
   */
  static decodeIds<T extends Record<string, string>>(ids: T): T {
    const decoded = {} as T;
    for (const [key, value] of Object.entries(ids)) {
      decoded[key as keyof T] = this.decodeId(value) as T[keyof T];
    }
    return decoded;
  }

  /**
   * Helper to decode an ID in a where clause
   * Automatically decodes the 'id' field if present
   * @param where Where clause that may contain a global ID
   * @returns Where clause with decoded local ID
   *
   * @example
   * const where = IdConverterService.decodeWhereId({ id: globalId, userId });
   */
  static decodeWhereId<T extends { id?: string }>(where: T): T {
    if (where.id) {
      return { ...where, id: this.decodeId(where.id) };
    }
    return where;
  }

  /**
   * Batch decode multiple IDs
   * @param ids Array of global or local IDs
   * @returns Array of local IDs
   */
  static decodeBatch(ids: string[]): string[] {
    return ids.map(id => this.decodeId(id));
  }

  /**
   * Batch encode multiple IDs
   * @param typeName The GraphQL type name
   * @param ids Array of local IDs
   * @returns Array of global IDs
   */
  static encodeBatch(typeName: string, ids: string[]): string[] {
    return ids.map(id => this.encodeId(typeName, id));
  }
}
