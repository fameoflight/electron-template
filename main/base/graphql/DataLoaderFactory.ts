import DataLoader from 'dataloader';
import { In, EntityTarget, FindOptionsWhere } from 'typeorm';
import { DataSourceProvider } from '@base/db/index.js';

/**
 * Factory for creating optimized DataLoader instances
 * Automatically batches N queries into 1 to prevent N+1 problems
 *
 * Usage in GraphQL context:
 * ```typescript
 * const loader = DataLoaderFactory.createForEntity(Message, 'chatId');
 * const messages = await loader.load(chatId);
 * ```
 */
export class DataLoaderFactory {
  /**
   * Create a DataLoader for loading entities by a foreign key
   * Batches multiple loads into a single database query
   *
   * @param entityClass - The entity class to load
   * @param foreignKey - The foreign key field name (e.g., 'chatId', 'messageId')
   * @param options - Additional options
   * @returns DataLoader instance that batches queries
   *
   * @example
   * // Create loader for messages by chatId
   * const messageLoader = DataLoaderFactory.createForEntity(Message, 'chatId');
   *
   * // These 100 calls will be batched into 1 SQL query:
   * const messagesPerChat = await Promise.all(
   *   chatIds.map(id => messageLoader.load(id))
   * );
   * // SQL: SELECT * FROM messages WHERE chatId IN (?, ?, ?, ...)
   */
  static createForEntity<T extends { id: string }>(
    entityClass: EntityTarget<T>,
    foreignKey: keyof T,
    options: {
      relations?: string[];
      order?: Record<string, 'ASC' | 'DESC'>;
      where?: Record<string, any>;
      withDeleted?: boolean;
    } = {}
  ): DataLoader<string, T[]> {
    return new DataLoader<string, T[]>(
      async (foreignKeyValues: readonly string[]) => {
        const repository = DataSourceProvider.get().getRepository(entityClass);

        // Build where clause
        const whereClause: any = {
          [foreignKey]: In([...foreignKeyValues]),
          ...options.where,
        };

        // Fetch all matching entities in one query
        // Default order by ID for deterministic results if no order specified
        const defaultOrder = options.order || { createdAt: 'ASC' };

        const entities = await repository.find({
          where: whereClause as FindOptionsWhere<T>,
          relations: options.relations,
          order: defaultOrder as any,
          withDeleted: options.withDeleted ?? false,
        });

        // Group by foreign key value
        const grouped = foreignKeyValues.map((fkValue) =>
          entities.filter((entity) => (entity as any)[foreignKey] === fkValue)
        );

        return grouped;
      },
      {
        cache: true, // Cache results within a single request
        maxBatchSize: 1000, // Limit batch size to prevent massive queries
      }
    );
  }

  /**
   * Create a DataLoader for loading single entities by ID
   * Batches multiple findById calls into a single query
   *
   * @param entityClass - The entity class to load
   * @param options - Additional options
   * @returns DataLoader instance that batches queries
   *
   * @example
   * // Create loader for users by ID
   * const userLoader = DataLoaderFactory.createById(User);
   *
   * // These 100 calls will be batched into 1 SQL query:
   * const users = await Promise.all(
   *   userIds.map(id => userLoader.load(id))
   * );
   * // SQL: SELECT * FROM users WHERE id IN (?, ?, ?, ...)
   */
  static createById<T extends { id: string }>(
    entityClass: EntityTarget<T>,
    options: {
      relations?: string[];
      withDeleted?: boolean;
    } = {}
  ): DataLoader<string, T | null> {
    return new DataLoader<string, T | null>(
      async (ids: readonly string[]) => {
        const repository = DataSourceProvider.get().getRepository(entityClass);

        const entities = await repository.find({
          where: {
            id: In([...ids]),
          } as FindOptionsWhere<T>,
          relations: options.relations,
          withDeleted: options.withDeleted ?? false,
        });

        // Create a map for O(1) lookup
        const entityMap = new Map(entities.map((e) => [e.id, e]));

        // Return in the same order as input IDs (null if not found)
        return ids.map((id) => entityMap.get(id) || null);
      },
      {
        cache: true,
        maxBatchSize: 1000,
      }
    );
  }

  /**
   * Create a DataLoader for loading a single related entity (ManyToOne)
   * Example: Load the chat for multiple messages
   *
   * @param entityClass - The related entity class to load
   * @param options - Additional options
   * @returns DataLoader instance that batches queries
   *
   * @example
   * // Create loader for chats by ID
   * const chatLoader = DataLoaderFactory.createForRelated(Chat);
   *
   * // In Message field resolver:
   * @FieldResolver(() => Chat)
   * async chat(@Root() message: Message, @Ctx() ctx: GraphQLContext) {
   *   return ctx.chatLoader.load(message.chatId);
   * }
   */
  static createForRelated<T extends { id: string }>(
    entityClass: EntityTarget<T>,
    options: {
      relations?: string[];
      withDeleted?: boolean;
    } = {}
  ): DataLoader<string, T | null> {
    // Same as createById, but semantically clearer for ManyToOne relations
    return this.createById(entityClass, options);
  }

  /**
   * Create a DataLoader that batches custom query logic
   * Most flexible option for complex use cases
   *
   * @param batchLoadFn - Custom function that receives an array of keys and returns results
   * @returns DataLoader instance
   *
   * @example
   * // Load latest version for multiple messages
   * const latestVersionLoader = DataLoaderFactory.createCustom(
   *   async (messageIds: readonly string[]) => {
   *     const versions = await MessageVersion.find({
   *       where: {
   *         messageId: In([...messageIds]),
   *         isCurrent: true
   *       }
   *     });
   *
   *     const versionMap = new Map(versions.map(v => [v.messageId, v]));
   *     return messageIds.map(id => versionMap.get(id) || null);
   *   }
   * );
   */
  static createCustom<K, V>(
    batchLoadFn: (keys: readonly K[]) => Promise<(V | Error)[]>,
    options: {
      cache?: boolean;
      maxBatchSize?: number;
    } = {}
  ): DataLoader<K, V> {
    return new DataLoader<K, V>(batchLoadFn, {
      cache: options.cache ?? true,
      maxBatchSize: options.maxBatchSize ?? 1000,
    });
  }
}
