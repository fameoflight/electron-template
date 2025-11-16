
import { Ctx } from 'type-graphql';
import { DataSourceProvider } from '@base/db/index.js';
import { OwnedEntity } from '@base/db/OwnedEntity.js';
import { User } from '@main/base/db/User.js';
import { CustomRepository } from '../CustomRepository.js';
import { OwnedRepository } from './relay/OwnedRepository.js';
import { EntityTarget, Repository, FindOneOptions, FindManyOptions, FindOptionsWhere, DeepPartial, ObjectLiteral } from 'typeorm';
import type { GraphQLContext } from '@shared/types';
import { DataLoaderFactory } from './DataLoaderFactory.js';
import DataLoader from 'dataloader';
import { IdConverterService } from './services/relay/IdConverterService.js';
import { AuthenticationService } from './services/auth/AuthenticationService.js';
import { validate } from 'class-validator';

export abstract class BaseResolver {
  /**
   * Get a CustomRepository for non-owned entities (like User)
   * Use this for entities that don't have userId field
   *
   * Usage:
   *   const repo = this.getBaseRepository(User); // For User entity
   */
  protected getBaseRepository<T extends { id: string; __typename?: string }>(
    entityClass: EntityTarget<T>,
    typeName?: string
  ): CustomRepository<T> {
    const repository = DataSourceProvider.get().getRepository(entityClass);
    const finalTypeName = typeName ?? this.getEntityTypeName(entityClass);
    return new CustomRepository(repository, finalTypeName);
  }

  /**
   * @deprecated Use getBaseRepository instead
   * This method is kept for backward compatibility
   */
  protected getRawRepository<T extends { id: string; __typename?: string }>(
    entityClass: EntityTarget<T>
  ): Repository<T> {
    return DataSourceProvider.get().getRepository(entityClass);
  }

  /**
   * Get a user-owned repository with automatic ownership enforcement
   * Use this for entities that have userId field (everything except User entity)
   *
   * Automatically enforces:
   * - All queries filter by current user's userId
   * - Auto-attaches userId on create
   * - Verifies ownership on update/delete
   * - Never exposes userId to clients
   *
   * Usage:
   *   const repo = this.getUserRepository(Connection); // Auto-infers type name 'Connection'
   *   const repo = this.getUserRepository(Connection, 'CustomName'); // Override type name
   */
  protected getUserRepository<T extends OwnedEntity>(
    entityClass: EntityTarget<T>,
    typeName?: string,
    userId?: string
  ): OwnedRepository<T> {
    const repository = DataSourceProvider.get().getRepository(entityClass);

    // Use provided type name, or auto-infer from entity class
    const finalTypeName = typeName ?? this.getEntityTypeName(entityClass);

    // Use provided userId or get from context
    const finalUserId = userId ?? 'current-user-context-needed';

    return new OwnedRepository(repository, finalTypeName, finalUserId);
  }

  /**
   * Get a user-owned repository with current user context
   * This method requires GraphQL context to extract current user ID
   *
   * Usage in resolvers:
   *   const repo = this.getOwnedRepository(Connection, @Ctx() ctx);
   */
  protected getOwnedRepository<T extends OwnedEntity>(
    entityClass: EntityTarget<T>,
    ctx: GraphQLContext,
    typeName?: string
  ): OwnedRepository<T> {
    const repository = DataSourceProvider.get().getRepository(entityClass);

    // Use provided type name, or auto-infer from entity class
    const finalTypeName = typeName ?? this.getEntityTypeName(entityClass);

    // Extract current user ID from context
    const currentUserId = ctx?.user?.id;
    if (!currentUserId) {
      throw new Error('Authentication required for this operation');
    }

    return new OwnedRepository(repository, finalTypeName, currentUserId);
  }

  /**
   * @deprecated Use getOwnedRepository instead
   * This method is kept for backward compatibility
   */
  protected getRelayRepository<T extends OwnedEntity>(
    entityClass: EntityTarget<T>,
    ctx: GraphQLContext,
    typeName?: string
  ): OwnedRepository<T> {
    return this.getOwnedRepository(entityClass, ctx, typeName);
  }


  /**
   * Extract the type name from an entity class
   */
  private getEntityTypeName<T>(entityClass: EntityTarget<T>): string {
    if (typeof entityClass === 'function') {
      return entityClass.name;
    }
    // Fallback for edge cases
    return String(entityClass);
  }
  /**
   * Decode a Relay global ID to a local database ID
   * Delegates to IdConverterService for consistent ID handling
   */
  protected decodeGlobalId(globalId: string): string {
    return IdConverterService.decodeId(globalId);
  }

  /**
   * Decode multiple global IDs at once
   * Delegates to IdConverterService for consistent ID handling
   */
  protected decodeIds<T extends Record<string, string>>(ids: T): T {
    return IdConverterService.decodeIds(ids);
  }

  /**
   * Helper to decode an ID in a where clause
   * Delegates to IdConverterService for consistent ID handling
   */
  protected decodeWhereId<T extends { id?: string }>(where: T): T {
    return IdConverterService.decodeWhereId(where);
  }

  /**
   * Encode a local database ID to a Relay global ID
   * Delegates to IdConverterService for consistent ID handling
   */
  protected encodeGlobalId(typeName: string, localId: string): string {
    return IdConverterService.encodeId(typeName, localId);
  }

  /**
   * Set the __typename property on an entity for Relay
   * This ensures proper type resolution in the Node interface
   * @param entity The entity to mark
   * @param typeName The GraphQL type name
   */
  protected setTypeName<T extends { __typename?: string }>(entity: T, typeName: string): T {
    entity.__typename = typeName;
    return entity;
  }

  /**
   * Set the __typename property on multiple entities for Relay
   * @param entities Array of entities to mark
   * @param typeName The GraphQL type name
   */
  protected setTypeNames<T extends { __typename?: string }>(entities: T[], typeName: string): T[] {
    entities.forEach(entity => {
      entity.__typename = typeName;
    });
    return entities;
  }

  /**
   * Automatically set __typename based on the entity's constructor name
   * Works for entities where the class name matches the GraphQL type name
   * @param entity The entity to mark
   * @returns The entity with __typename set
   */
  protected autoSetTypeName<T extends { __typename?: string }>(entity: T | null): T | null {
    if (entity && entity.constructor && entity.constructor.name) {
      entity.__typename = entity.constructor.name;
    }
    return entity;
  }

  /**
   * Automatically set __typename for multiple entities based on their constructor names
   * @param entities Array of entities to mark
   * @returns The entities with __typename set
   */
  protected autoSetTypeNames<T extends { __typename?: string }>(entities: T[]): T[] {
    entities.forEach(entity => {
      if (entity.constructor && entity.constructor.name) {
        entity.__typename = entity.constructor.name;
      }
    });
    return entities;
  }

  /**
   * Get the current user from context using sessionKey
   * Delegates to AuthenticationService for consistent auth handling
   */
  protected async getCurrentUser(@Ctx() ctx: GraphQLContext): Promise<User> {
    return AuthenticationService.getCurrentUser(ctx);
  }

  /**
   * Get the current user ID from context
   * Delegates to AuthenticationService for consistent auth handling
   */
  protected async getCurrentUserId(@Ctx() ctx: GraphQLContext): Promise<string> {
    return AuthenticationService.getCurrentUserId(ctx);
  }

  /**
   * Get the current user from context, but return null if not authenticated
   * Delegates to AuthenticationService for consistent auth handling
   */
  protected async getCurrentUserOrNull(@Ctx() ctx: GraphQLContext): Promise<User | null> {
    return AuthenticationService.getCurrentUserOrNull(ctx);
  }

  /**
   * Soft delete an entity with ownership verification
   * @param repository Entity repository
   * @param id Entity ID
   * @param userId Current user ID
   * @param entityName Name of the entity for error messages
   * @returns true if deleted, false otherwise
   */
  protected async softDeleteWithOwnership<T extends { id: string; userId: string }>(
    repository: Repository<T>,
    id: string,
    userId: string,
    entityName: string
  ): Promise<boolean> {
    // Verify ownership before deletion (excluding soft-deleted records)
    const existingEntity = await repository.findOne({
      where: { id, userId } as FindOptionsWhere<T>,
      withDeleted: false
    });

    if (!existingEntity) {
      throw new Error(`${entityName} with id ${id} not found or you don't have permission to delete it`);
    }

    // Use soft delete
    const result = await repository.softDelete(id);
    return result.affected ? result.affected > 0 : false;
  }

  /**
   * Find entities with soft delete filtering
   * @param repository Entity repository
   * @param where Where conditions
   * @returns Array of entities (excluding soft-deleted ones)
   */
  protected async findWithoutSoftDeletes<T extends ObjectLiteral>(
    repository: Repository<T>,
    where: FindManyOptions<T>['where']
  ): Promise<T[]> {
    return await repository.find({
      where,
      withDeleted: false
    });
  }

  /**
   * Find one entity with soft delete filtering
   * @param repository Entity repository
   * @param where Where conditions
   * @returns Entity or null (excluding soft-deleted ones)
   */
  protected async findOneWithoutSoftDeletes<T extends ObjectLiteral>(
    repository: Repository<T>,
    where: FindOneOptions<T>['where']
  ): Promise<T | null> {
    return await repository.findOne({
      where,
      withDeleted: false
    });
  }

  /**
   * Save an entity and automatically set __typename for Relay
   * @param repository Entity repository
   * @param entity Entity to save
   * @returns Saved entity with __typename set
   */
  protected async saveWithTypeName<T extends { __typename?: string }>(
    repository: Repository<T>,
    entity: T
  ): Promise<T> {
    const saved = await repository.save(entity);
    return this.autoSetTypeName(saved)!;
  }

  /**
   * Find one entity and automatically set __typename for Relay
   * @param repository Entity repository
   * @param options Find options
   * @returns Entity with __typename set or null
   */
  protected async findOneWithTypeName<T extends { __typename?: string }>(
    repository: Repository<T>,
    options: FindOneOptions<T>
  ): Promise<T | null> {
    const entity = await repository.findOne(options);
    return this.autoSetTypeName(entity);
  }

  /**
   * Find multiple entities and automatically set __typename for Relay
   * @param repository Entity repository
   * @param options Find options
   * @returns Array of entities with __typename set
   */
  protected async findWithTypeName<T extends { __typename?: string }>(
    repository: Repository<T>,
    options?: FindManyOptions<T>
  ): Promise<T[]> {
    const entities = await repository.find(options);
    return this.autoSetTypeNames(entities);
  }

  /**
   * Update an entity and fetch it back with __typename set for Relay
   * @param repository Entity repository
   * @param id Entity ID
   * @param updateData Data to update
   * @returns Updated entity with __typename set
   */
  protected async updateAndFetchWithTypeName<T extends { __typename?: string; id: string }>(
    repository: Repository<T>,
    id: string,
    updateData: Partial<T>
  ): Promise<T> {
    await repository.update(id, updateData as any);
    const updated = await repository.findOne({ where: { id } as FindOptionsWhere<T> });
    if (!updated) {
      throw new Error(`Entity with id ${id} not found after update`);
    }
    return this.autoSetTypeName(updated)!;
  }

  /**
   * Enhanced upsert with validation and logging
   * @param repo OwnedRepository instance
   * @param input Input data
   * @param userId Current user ID
   * @param validator Validation function
   * @param errorMessage Error message for validation failures
   * @returns Created/updated entity
   */
  protected async upsertWithValidation<T extends OwnedEntity, TInput extends Record<string, unknown>>(
    repo: OwnedRepository<T>,
    input: TInput,
    userId: string,
    validator: () => Promise<boolean>,
    errorMessage?: string
  ): Promise<T> {
    const entityName = this.constructor.name.replace('Resolver', '');

    try {
      // Run validation
      await validator();

      // Create enriched input with user ID
      const enrichedInput = { ...input, userId };

      // Perform upsert via OwnedRepository
      const result = await repo.upsert(enrichedInput as Partial<T> & { id?: string });

      return result;

    } catch (error) {
      console.error(`🔴 ${entityName}: Upsert failed -`, error);
      if (errorMessage) {
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Get entity class from input data for determining repository type
   * This should be overridden in specific resolvers if needed
   */
  protected getEntityFromInput<T>(input: Record<string, unknown>): EntityTarget<T> {
    // This is a basic implementation - should be overridden in specific resolvers
    throw new Error('getEntityFromInput must be implemented in specific resolver');
  }

  // =======================================================================
  // DataLoader Helpers (N+1 Prevention)
  // =======================================================================

  /**
   * Get or create a DataLoader for loading entities by a foreign key
   * Automatically caches in GraphQL context to reuse across resolvers
   *
   * @param ctx - GraphQL context
   * @param entityClass - Entity class to load
   * @param foreignKey - Foreign key field name
   * @param loaderKey - Unique key for caching this loader in context
   * @param options - Additional options (relations, order, where)
   * @returns DataLoader instance
   *
   * @example
   * // In field resolver
   * @FieldResolver(() => [Message])
   * async messages(@Root() chat: Chat, @Ctx() ctx: GraphQLContext) {
   *   const loader = this.getOrCreateLoader(
   *     ctx,
   *     Message,
   *     'chatId',
   *     'messagesByChatId'
   *   );
   *   return loader.load(chat.id);
   * }
   */
  protected getOrCreateLoader<T extends { id: string }>(
    ctx: GraphQLContext,
    entityClass: EntityTarget<T>,
    foreignKey: keyof T,
    loaderKey: string,
    options: {
      relations?: string[];
      order?: Record<string, 'ASC' | 'DESC'>;
      where?: Record<string, any>;
    } = {}
  ): DataLoader<string, T[]> {
    // Initialize loaders map if not exists
    if (!ctx.loaders) {
      ctx.loaders = {};
    }

    // Return existing loader or create new one
    if (!ctx.loaders[loaderKey]) {
      ctx.loaders[loaderKey] = DataLoaderFactory.createForEntity(
        entityClass,
        foreignKey,
        options
      );
    }

    return ctx.loaders[loaderKey] as DataLoader<string, T[]>;
  }

  /**
   * Get or create a DataLoader for loading single entities by ID
   * Batches multiple findById calls into a single query
   *
   * @example
   * @FieldResolver(() => User)
   * async author(@Root() post: Post, @Ctx() ctx: GraphQLContext) {
   *   const loader = this.getOrCreateByIdLoader(ctx, User, 'userById');
   *   return loader.load(post.userId);
   * }
   */
  protected getOrCreateByIdLoader<T extends { id: string }>(
    ctx: GraphQLContext,
    entityClass: EntityTarget<T>,
    loaderKey: string,
    options: {
      relations?: string[];
    } = {}
  ): DataLoader<string, T | null> {
    if (!ctx.loaders) {
      ctx.loaders = {};
    }

    if (!ctx.loaders[loaderKey]) {
      ctx.loaders[loaderKey] = DataLoaderFactory.createById(entityClass, options);
    }

    return ctx.loaders[loaderKey] as DataLoader<string, T | null>;
  }

  /**
   * Convenience method to load related entities with DataLoader
   * Automatically creates and caches loader
   *
   * @example
   * @FieldResolver(() => [Message])
   * async messages(@Root() chat: Chat, @Ctx() ctx: GraphQLContext) {
   *   return this.loadRelated(ctx, chat.id, Message, 'chatId', {
   *     order: { createdAt: 'ASC' }
   *   });
   * }
   */
  protected async loadRelated<T extends { id: string }>(
    ctx: GraphQLContext,
    parentId: string,
    entityClass: EntityTarget<T>,
    foreignKey: keyof T,
    options: {
      relations?: string[];
      order?: Record<string, 'ASC' | 'DESC'>;
      where?: Record<string, any>;
    } = {}
  ): Promise<T[]> {
    const entityName = typeof entityClass === 'function' ? entityClass.name : String(entityClass);
    const loaderKey = `${entityName}By${String(foreignKey)}`;

    const loader = this.getOrCreateLoader(ctx, entityClass, foreignKey, loaderKey, options);
    return loader.load(parentId);
  }

  /**
   * Convenience method to load a single related entity with DataLoader
   *
   * @example
   * @FieldResolver(() => Chat)
   * async chat(@Root() message: Message, @Ctx() ctx: GraphQLContext) {
   *   return this.loadById(ctx, message.chatId, Chat);
   * }
   */
  protected async loadById<T extends { id: string }>(
    ctx: GraphQLContext,
    id: string,
    entityClass: EntityTarget<T>,
    options: {
      relations?: string[];
    } = {}
  ): Promise<T | null> {
    const entityName = typeof entityClass === 'function' ? entityClass.name : String(entityClass);
    const loaderKey = `${entityName}ById`;

    const loader = this.getOrCreateByIdLoader(ctx, entityClass, loaderKey, options);
    return loader.load(id);
  }

  // =======================================================================
  // Validation & Ownership Helpers (for Code Generation)
  // =======================================================================

  /**
   * Check if entity class has userId field for ownership tracking
   */
  protected hasUserIdField<T>(entityClass: new () => T): boolean {
    const entityInstance = Object.create(entityClass.prototype);
    return 'userId' in entityInstance;
  }

  /**
   * Validate input using class-validator
   * Supports both BaseInput instances and plain objects
   * Throws error if validation fails
   */
  protected async validateInput<T>(input: T): Promise<T> {
    // If input extends BaseInput, use its validate method
    if (input && typeof input === 'object' && 'validate' in input &&
      typeof (input as any).validate === 'function') {
      await (input as any).validate();
      return input;
    }

    // Otherwise, use class-validator directly
    const errors = await validate(input as object);
    if (errors.length > 0) {
      const messages = errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; ');
      throw new Error(`Validation failed: ${messages}`);
    }

    return input;
  }


  // remove undefined fields from input object
  protected async filterInputs(inputs: object): Promise<object> {
    const filtered: any = {};
    for (const [key, value] of Object.entries(inputs)) {
      if (value !== undefined) {
        filtered[key] = value;
      }
    }
    return filtered;
  }

  /**
   * Safely update an entity by assigning only defined, updatable fields
   * Excludes protected fields like 'id' and 'userId' from being overwritten
   * Removes undefined values to prevent clearing existing data
   *
   * @param entity The entity to update
   * @param input The input object containing updates
   * @param excludeFields Additional fields to exclude from updates (defaults to ['id', 'userId'])
   */
  protected safeAssignUpdate<T>(
    entity: T,
    input: any,
    excludeFields: string[] = ['id', 'userId']
  ): T {
    const excludeSet = new Set(excludeFields);

    for (const [key, value] of Object.entries(input)) {
      // Skip excluded fields and undefined values
      if (!excludeSet.has(key) && value !== undefined) {
        (entity as any)[key] = value;
      }
    }

    return entity;
  }
}