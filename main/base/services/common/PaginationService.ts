/**
 * PaginationService - Provides generic pagination functionality for different entity types
 *
 * This service abstracts pagination logic that can be reused across different services
 * like documents, users, chats, etc. Supports both cursor-based and offset-based pagination.
 */

import { In } from 'typeorm';

export interface PaginationEdge<T> {
  /** The node/item data */
  node: T;
  /** Cursor for this edge (used in cursor-based pagination) */
  cursor: string;
}

export interface PageInfo {
  /** Whether there's a next page */
  hasNextPage: boolean;
  /** Whether there's a previous page */
  hasPreviousPage: boolean;
  /** Cursor of the first item in the current page */
  startCursor: string | null;
  /** Cursor of the last item in the current page */
  endCursor: string | null;
}

export interface PaginationConnection<T> {
  /** Array of edges with nodes and cursors */
  edges: Array<PaginationEdge<T>>;
  /** Page metadata */
  pageInfo: PageInfo;
  /** Total number of items across all pages */
  totalCount: number;
}

export interface PaginationOptions {
  /** Number of items to fetch (alias for limit) */
  first?: number;
  /** Cursor to fetch items after (cursor-based pagination) */
  after?: string;
  /** Page offset for traditional pagination */
  offset?: number;
  /** Page size (alias for first) */
  limit?: number;
  /** Optional filter by specific IDs */
  ids?: string[];
  /** Optional filter by specific document IDs (alias for ids) */
  documentIds?: string[];
}

export interface PaginationResult<T> {
  /** The paginated connection */
  connection: PaginationConnection<T>;
  /** Pagination options used */
  options: {
    first: number;
    offset: number;
    hasAfterCursor: boolean;
    hasIdFilter: boolean;
  };
}

/**
 * Repository interface for pagination operations
 */
export interface PaginableRepository<T, TWhere = any> {
  /** Count items matching where clause */
  count(where?: TWhere): Promise<number>;
  /** Find items with pagination */
  find(options: {
    where?: TWhere;
    order?: any;
    skip?: number;
    take?: number;
    relations?: string[];
  }): Promise<T[]>;
}

/**
 * Cursor encoding/decoding utilities
 */
export class CursorUtils {
  /**
   * Encode cursor from index and timestamp
   */
  static encode(index: number, timestamp?: string): string {
    const data = {
      i: index,
      t: timestamp || Date.now().toString()
    };
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  /**
   * Decode cursor to extract index and timestamp
   */
  static decode(cursor: string): { index: number; timestamp?: string } {
    try {
      const data = JSON.parse(Buffer.from(cursor, 'base64').toString());
      return {
        index: data.i || 0,
        timestamp: data.t
      };
    } catch (error) {
      console.error('Failed to decode cursor:', cursor, error);
      return { index: 0 };
    }
  }

  /**
   * Extract index from cursor
   */
  static extractIndex(cursor: string): number {
    return this.decode(cursor).index;
  }
}

/**
 * PaginationService provides reusable pagination functionality
 */
export class PaginationService {
  /**
   * Paginate items from a repository
   *
   * @param repository - Repository that implements PaginableRepository interface
   * @param userId - User ID for filtering
   * @param options - Pagination options
   * @param additionalWhere - Additional where clause conditions
   * @param order - Order by clause
   * @param relations - Relations to load
   * @returns Paginated connection
   */
  async paginate<T>(
    repository: PaginableRepository<T>,
    userId: string,
    options: PaginationOptions,
    additionalWhere: any = {},
    order: any = { createdAt: 'DESC' },
    relations: string[] = []
  ): Promise<PaginationResult<T>> {
    const { first = 20, after, offset = 0, limit = 20, ids } = options;

    // Normalize pagination options
    const take = first || limit;
    const hasAfterCursor = !!after;
    const hasIdFilter = !!(ids && ids.length > 0);

    // Build where clause
    const where: any = { userId, ...additionalWhere };

    // Handle ID filtering
    if (hasIdFilter) {
      where.id = In(ids);
    }

    // Calculate offset based on cursor or explicit offset
    let skip = offset;
    if (hasAfterCursor) {
      const cursorIndex = CursorUtils.extractIndex(after);
      skip = Math.max(0, cursorIndex);
    }

    // Get total count (with ID filter if present)
    const totalCount = await repository.count(where);

    // Fetch items
    const items = await repository.find({
      where,
      order,
      skip,
      take: take + 1, // Fetch one extra to determine if there's a next page
      relations
    });

    // Determine if there's a next page
    const hasNextPage = items.length > take;
    if (hasNextPage) {
      items.pop(); // Remove the extra item
    }

    const hasPreviousPage = skip > 0 || hasAfterCursor;

    // Create edges with cursors
    const edges: Array<PaginationEdge<T>> = items.map((item, index) => {
      const absoluteIndex = skip + index;
      const cursor = CursorUtils.encode(absoluteIndex);
      return {
        node: item,
        cursor
      };
    });

    // Create page info
    const pageInfo: PageInfo = {
      hasNextPage,
      hasPreviousPage,
      startCursor: edges.length > 0 ? edges[0].cursor : null,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
    };

    const connection: PaginationConnection<T> = {
      edges,
      pageInfo,
      totalCount,
    };

    return {
      connection,
      options: {
        first: take,
        offset: skip,
        hasAfterCursor,
        hasIdFilter,
      },
    };
  }

  /**
   * Create a pagination service instance
   */
  static create(): PaginationService {
    return new PaginationService();
  }

  /**
   * Helper to build cursor from entity ID and timestamp
   */
  static buildEntityCursor(entity: { id: string; createdAt?: string | Date }): string {
    const timestamp = entity.createdAt ?
      (entity.createdAt instanceof Date ? entity.createdAt.toISOString() : entity.createdAt) :
      undefined;
    return CursorUtils.encode(parseInt(entity.id.replace(/\D/g, ''), 10), timestamp);
  }

  /**
   * Validate pagination options
   */
  static validateOptions(options: PaginationOptions): PaginationOptions {
    const { first, limit, offset } = options;

    // Validate first/limit (max 100 items per page)
    const take = first || limit || 20;
    const validTake = Math.min(Math.max(1, take), 100);

    // Validate offset (must be non-negative)
    const validOffset = Math.max(0, offset || 0);

    return {
      ...options,
      first: validTake,
      offset: validOffset,
    };
  }

  /**
   * Get default pagination options
   */
  static getDefaultOptions(): PaginationOptions {
    return {
      first: 20,
      offset: 0,
    };
  }
}

/**
 * Adapter to convert generic PaginationConnection to existing Relay-style Connection types
 */
export class ConnectionAdapter {
  /**
   * Convert generic pagination connection to Relay-style connection
   */
  static toRelayConnection<T, TRelayEdge, TRelayConnection>(
    genericConnection: PaginationConnection<T>,
    createEdge: (node: T, cursor: string) => TRelayEdge,
    createConnection: (edges: TRelayEdge[], pageInfo: PageInfo, totalCount: number) => TRelayConnection
  ): TRelayConnection {
    const edges = genericConnection.edges.map(edge =>
      createEdge(edge.node, edge.cursor)
    );

    return createConnection(edges, genericConnection.pageInfo, genericConnection.totalCount);
  }

  /**
   * Create Relay-style cursor from ID
   */
  static toCursor(id: string): string {
    return Buffer.from(id).toString('base64');
  }

  /**
   * Decode Relay-style cursor to ID
   */
  static fromCursor(cursor: string): string {
    return Buffer.from(cursor, 'base64').toString('utf-8');
  }
}

/**
 * Default pagination service instance
 */
export const defaultPaginationService = PaginationService.create();