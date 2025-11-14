import 'reflect-metadata';

/**
 * Metadata key for storing eager load relations on entity classes
 */
const EAGER_LOAD_KEY = 'EAGER_LOAD_RELATIONS';

/**
 * Configuration options for eager loading relations
 */
export interface EagerLoadOptions {
  /**
   * Which CRUD operations should eager load this relation
   * Default: ['show', 'list'] (loads for single queries and list queries)
   *
   * Operations:
   * - 'show': Single entity queries (e.g., chat(id: "123"))
   * - 'list': List queries with pagination (e.g., chats())
   * - 'array': Array queries without pagination (e.g., chatsArray())
   *
   * Use cases:
   * - ['show']: Only load for single entity queries (e.g., chat details with messages)
   * - ['list', 'show']: Load for both single and list queries (default)
   * - ['show', 'list', 'array']: Load for all query types
   */
  operations?: ('show' | 'list' | 'array')[];

  /**
   * Maximum depth to load nested relations
   * Default: 1 (only direct relations)
   *
   * Example:
   * - depth: 1 → Chat.messages
   * - depth: 2 → Chat.messages.versions
   * - depth: 3 → Chat.messages.versions.author
   */
  depth?: number;

  /**
   * Custom relation path (for nested relations)
   * Example: 'messages.versions' will load Chat → Message → MessageVersion
   */
  path?: string;

  /**
   * Condition to apply when loading this relation
   * Useful for loading only specific subsets (e.g., only current versions)
   *
   * Example:
   * @EagerLoad({ where: { isCurrent: true } })
   * versions: MessageVersion[]
   */
  where?: Record<string, any>;

  /**
   * Order to apply when loading this relation
   * Example: { createdAt: 'DESC' }
   */
  order?: Record<string, 'ASC' | 'DESC'>;
}

/**
 * Decorator to mark relations for automatic eager loading in CRUD operations
 * Prevents N+1 queries by auto-loading specified relations
 *
 * This decorator works seamlessly with @CRUDResolver to automatically include
 * relations in queries, eliminating the need for manual relation configuration.
 *
 * @param options - Configuration for eager loading behavior
 *
 * @example
 * // Basic usage - auto-loads for 'show' and 'list' operations
 * @EntityObjectType('chats')
 * export class Chat extends BaseEntity {
 *   @EagerLoad()
 *   @OneToMany(() => Message, message => message.chat)
 *   messages!: Message[];
 * }
 *
 * @example
 * // Load only for single entity queries
 * @EntityObjectType('chats')
 * export class Chat extends BaseEntity {
 *   @EagerLoad({ operations: ['show'] })
 *   @OneToMany(() => Message, message => message.chat)
 *   messages!: Message[];
 * }
 *
 * @example
 * // Load with custom order and filter
 * @EntityObjectType('messages')
 * export class Message extends BaseEntity {
 *   @EagerLoad({
 *     operations: ['show', 'list'],
 *     where: { isCurrent: true },
 *     order: { version: 'DESC' }
 *   })
 *   @OneToMany(() => MessageVersion, version => version.message)
 *   versions!: MessageVersion[];
 * }
 *
 * @example
 * // Nested relation loading (depth: 2)
 * @EntityObjectType('chats')
 * export class Chat extends BaseEntity {
 *   @EagerLoad({ depth: 2 }) // Loads Chat → Message → MessageVersion
 *   @OneToMany(() => Message, message => message.chat)
 *   messages!: Message[];
 * }
 *
 * @example
 * // Complex nested path
 * @EntityObjectType('chats')
 * export class Chat extends BaseEntity {
 *   @EagerLoad({ path: 'messages.versions', operations: ['show'] })
 *   @OneToMany(() => Message, message => message.chat)
 *   messages!: Message[];
 * }
 */
export function EagerLoad(options: EagerLoadOptions = {}): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    // Get existing eager load relations for this class
    const existingRelations = Reflect.getMetadata(EAGER_LOAD_KEY, target.constructor) || {};

    // Merge with new relation config
    const relationConfig = {
      operations: options.operations || ['show', 'list'],
      depth: options.depth || 1,
      path: options.path || String(propertyKey),
      where: options.where,
      order: options.order,
    };

    // Store updated metadata
    Reflect.defineMetadata(
      EAGER_LOAD_KEY,
      {
        ...existingRelations,
        [String(propertyKey)]: relationConfig,
      },
      target.constructor
    );
  };
}

/**
 * Get all eager load relations for a given entity class
 * Used internally by CRUDResolver to automatically load relations
 */
export function getEagerLoadRelations(
  entityClass: any,
  operation: 'show' | 'list' | 'array' = 'show'
): string[] {
  const relations = Reflect.getMetadata(EAGER_LOAD_KEY, entityClass) || {};

  return Object.entries(relations)
    .filter(([_, config]: [string, any]) => {
      return config.operations.includes(operation);
    })
    .map(([propertyKey, config]: [string, any]) => config.path);
}

/**
 * Get eager load configuration for a specific relation
 */
export function getEagerLoadConfig(
  entityClass: any,
  propertyKey: string
): EagerLoadOptions | undefined {
  const relations = Reflect.getMetadata(EAGER_LOAD_KEY, entityClass) || {};
  return relations[propertyKey];
}

/**
 * Check if a relation should be eager loaded for a specific operation
 */
export function shouldEagerLoad(
  entityClass: any,
  propertyKey: string,
  operation: 'show' | 'list' | 'array'
): boolean {
  const config = getEagerLoadConfig(entityClass, propertyKey);
  if (!config) return false;

  return config.operations?.includes(operation) ?? false;
}
