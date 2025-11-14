import { EventSubscriber, EntitySubscriberInterface, LoadEvent } from 'typeorm';
import { BaseEntity } from '../BaseEntity.js';
import DataSourceProvider from '../DataSourceProvider.js';

// Disable SmartLoadingSubscriber in CLI processes
const CLI = process.env.CLI || 'false';

/**
 * Smart Loading Subscriber - Transparent relationship loading via TypeORM lifecycle hooks
 *
 * Automatically attaches smart getters to entities after they're loaded from the database.
 * This enables transparent relationship access like `await message.versions` without
 * needing to manually specify `relations: ['versions']` in every query.
 *
 * How it works:
 * 1. TypeORM loads entity from database
 * 2. afterLoad() hook fires (this subscriber)
 * 3. We auto-detect all relationships from TypeORM metadata
 * 4. For each relation, we replace the property with a getter that:
 *    - Returns already-loaded data if available
 *    - Returns a Promise that loads via SmartEntityLoader (DataLoader batching)
 * 5. Entity is passed to TypeGraphQL with smart getters already attached
 *
 * Benefits:
 * - Zero configuration (no decorators needed - auto-detects all relationships)
 * - Works with TypeGraphQL field resolvers (receives entities with smart getters)
 * - Works with custom queries (RelayRepository, raw TypeORM)
 * - Works in services (DataSource.getRepository)
 * - DataLoader batching prevents N+1 queries
 * - Instance-level caching avoids duplicate loads
 * - Zero breaking changes (existing relations: [...] queries still work)
 */
@EventSubscriber()
export class SmartLoadingSubscriber implements EntitySubscriberInterface<BaseEntity> {
  /**
   * Listen to all entities that extend BaseEntity
   */
  listenTo() {
    return BaseEntity;
  }

  /**
   * Called after an entity is loaded from the database
   * This is where we attach smart relationship getters
   */
  afterLoad(entity: BaseEntity, event?: LoadEvent<BaseEntity>) {
    // Skip smart loading in CLI processes
    if (CLI === 'true') {
      return;
    }
    this.attachSmartGetters(entity);
  }

  /**
   * Called after an entity is inserted into the database
   * This ensures newly created entities also get smart getters
   */
  afterInsert(event: any) {
    // Skip smart loading in CLI processes
    if (CLI === 'true') {
      return;
    }
    const entity = event.entity as BaseEntity;
    this.attachSmartGetters(entity);
  }

  /**
   * Called after an entity is updated in the database
   * This ensures updated entities also get smart getters
   */
  afterUpdate(event: any) {
    // Skip smart loading in CLI processes
    if (CLI === 'true') {
      return;
    }
    const entity = event.entity as BaseEntity;
    if (!entity) return;
    this.attachSmartGetters(entity);
  }

  /**
   * Attach smart getters to all relationships on an entity
   */
  private attachSmartGetters(entity: BaseEntity) {
    // Auto-detect relationships from TypeORM metadata
    const relations = this.getEntityRelations(entity);
    if (relations.length === 0) return;

    // Attach smart getter for each relationship
    relations.forEach(relationName => {
      this.attachSmartGetter(entity, relationName, this);
    });
  }

  /**
   * Extract relationship property names from TypeORM metadata
   *
   * @param entity - The entity instance
   * @returns Array of relationship property names
   */
  private getEntityRelations(entity: BaseEntity): string[] {
    try {
      // Skip if entity constructor is Object (means entity is not properly instantiated)
      if (!entity || entity.constructor === Object || !entity.constructor.name) {
        // This is normal during TypeORM's internal save/reload cycle
        // Just return empty array - no need to log warnings for this common case
        return [];
      }

      const dataSource = DataSourceProvider.get();

      const metadata = dataSource.getMetadata(entity.constructor);
      // Extract property names from all relationship types
      return metadata.relations.map(relation => relation.propertyName);
    } catch (error: any) {
      console.warn('SmartLoadingSubscriber: Failed to get entity metadata for smart loading:', entity, error);
      return [];
    }
  }

  /**
   * Attach a smart getter for a specific relationship
   *
   * The getter returns:
   * - Already loaded data if the relation was eagerly loaded (synchronously)
   * - Cached data if previously loaded (synchronously)
   * - A Promise that loads the relation on-demand (only when needed)
   *
   * IMPORTANT: TypeGraphQL needs synchronous values when available.
   * Only return promises for unloaded relations.
   */
  private attachSmartGetter(entity: any, relationName: string, subscriber: SmartLoadingSubscriber) {
    // Store the original value if TypeORM already loaded this relation
    const descriptor = Object.getOwnPropertyDescriptor(entity, relationName);
    const originalValue = descriptor?.value;

    // Cache keys for tracking loaded state
    const cacheKey = `__loaded_${relationName}`;
    const promiseKey = `__promise_${relationName}`;

    // Replace property with smart getter
    Object.defineProperty(entity, relationName, {
      get() {
        // 1. If TypeORM already loaded this relation (via relations: [...]), return it SYNCHRONOUSLY
        // This is critical for TypeGraphQL non-nullable fields
        if (originalValue !== undefined) {
          return originalValue;
        }

        // 2. If we already loaded and cached this relation, return cached value SYNCHRONOUSLY
        if (this[cacheKey] !== undefined) {
          return this[cacheKey];
        }

        // 3. If we have a pending promise, return it (avoid duplicate loads)
        if (this[promiseKey]) {
          return this[promiseKey];
        }

        // 4. Create new promise to load relation directly from database
        // This is the ONLY case where we return a promise
        this[promiseKey] = subscriber.loadRelation(this, relationName).then((result: any) => {
          // Cache the result for future access
          this[cacheKey] = result;
          // Clear the promise (no longer needed)
          delete this[promiseKey];
          return result;
        });

        return this[promiseKey];
      },
      // Make the property enumerable so it shows up in JSON.stringify, etc.
      enumerable: true,
      // Allow reconfiguration (for testing or edge cases)
      configurable: true
    });
  }

  /**
   * Load a relationship for an entity from the database
   *
   * @param entity - The entity instance
   * @param relationName - The relationship property name
   * @returns Promise resolving to the relationship data
   */
  private async loadRelation(entity: BaseEntity, relationName: string): Promise<any> {
    try {
      const dataSource = DataSourceProvider.get();
      const metadata = dataSource.getMetadata(entity.constructor);
      const repository = dataSource.getRepository(entity.constructor);

      // Reload the entity with the specific relation
      const reloaded = await repository.findOne({
        where: { id: entity.id } as any,
        relations: [relationName]
      });

      if (!reloaded) {
        return null;
      }

      // Return the loaded relationship
      return (reloaded as any)[relationName];
    } catch (error) {
      console.error(`Failed to load relation '${relationName}':`, error);
      return null;
    }
  }
}
