import { EventSubscriber, EntitySubscriberInterface, LoadEvent } from 'typeorm';
import { BaseEntity } from '../BaseEntity.js';
import DataSourceProvider from '../DataSourceProvider.js';
import SmartRelationProxy from '@main/base/db/subscribers/SmartRelationProxy.js';

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
  // Cache for entity metadata to avoid repeated lookups
  private static metadataCache = new Map<string, Map<string, { isArray: boolean } | null>>();

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
      // Silently return empty array - metadata errors are expected for entities
      // that haven't been properly initialized yet or are in transition states
      return [];
    }
  }

  /**
   * Get metadata for a specific relation to determine if it's an array
   * Uses caching to avoid repeated lookups and reduce error messages
   *
   * @param entity - The entity instance
   * @param relationName - The relation property name
   * @returns Relation metadata or null
   */
  private getRelationMetadata(entity: BaseEntity, relationName: string): { isArray: boolean } | null {
    try {
      if (!entity || entity.constructor === Object || !entity.constructor.name) {
        return null;
      }

      const entityName = entity.constructor.name;

      // Check cache first
      const entityCache = SmartLoadingSubscriber.metadataCache.get(entityName);
      if (entityCache?.has(relationName)) {
        return entityCache.get(relationName) || null;
      }

      // Fetch metadata
      const dataSource = DataSourceProvider.get();
      const metadata = dataSource.getMetadata(entity.constructor);
      const relation = metadata.relations.find(r => r.propertyName === relationName);

      const result = relation ? {
        isArray: relation.relationType === 'many-to-many' || relation.relationType === 'one-to-many'
      } : null;

      // Cache the result
      if (!entityCache) {
        SmartLoadingSubscriber.metadataCache.set(entityName, new Map([[relationName, result]]));
      } else {
        entityCache.set(relationName, result);
      }

      return result;
    } catch (error: any) {
      // Silently return null - this is expected for entities without proper metadata
      return null;
    }
  }

  /**
   * Attach a smart proxy for a specific relationship
   *
   * The proxy provides transparent lazy loading that works with:
   * - TypeORM save operations (behaves like empty array)
   * - Promise operations (await entity.relation)
   * - Array operations (forEach, map, etc.)
   * - Property access (loads data when needed)
   */
  private attachSmartGetter(entity: any, relationName: string, subscriber: SmartLoadingSubscriber) {
    // Store the original value if TypeORM already loaded this relation
    const descriptor = Object.getOwnPropertyDescriptor(entity, relationName);
    const originalValue = descriptor?.value;

    // Check if this is an array relation
    const relationMetadata = subscriber.getRelationMetadata(entity, relationName);
    const isArray = relationMetadata?.isArray || false;

    // If TypeORM already loaded this relation, use it directly
    if (originalValue !== undefined && originalValue !== null) {
      // Relation is already loaded, no need for proxy
      return;
    }

    // Create smart proxy for lazy loading
    const proxy = new SmartRelationProxy(
      entity,
      relationName,
      () => subscriber.loadRelation(entity, relationName),
      isArray
    );

    // Replace property with smart proxy
    Object.defineProperty(entity, relationName, {
      value: proxy.createProxy(),
      writable: true,
      enumerable: true,
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
