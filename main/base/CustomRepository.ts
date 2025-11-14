import { Repository as TypeORMRepository, FindOneOptions, FindManyOptions, FindOptionsWhere, DeepPartial, ObjectLiteral, EntityTarget, In } from 'typeorm';
import { IdConverterService } from './graphql/services/relay/IdConverterService.js';

/**
 * CustomRepository with automatic smart loading and transparent TypeORM integration
 *
 * This repository combines all the functionality from the consolidated repositories:
 * - Smart loading support (triggers SmartLoadingSubscriber after save)
 * - Plain object handling (transparent conversion to entity instances)
 * - Constructor preservation (no spread operators that destroy constructors)
 * - Relay ID conversion (for entities with global IDs)
 * - Entity marking (automatic __typename attachment)
 *
 * Used by CustomDataSource to ensure ALL repositories have smart loading capabilities
 * automatically without developers needing to think about it.
 *
 * This is now the single repository for all entities - replacing the old Repository class.
 */
export class CustomRepository<T extends { id: string; __typename?: string }> {
  constructor(
    protected repository: TypeORMRepository<T>,
    protected typeName: string
  ) { }

  /**
   * Get the underlying TypeORM repository for advanced operations
   */
  get raw(): TypeORMRepository<T> {
    return this.repository;
  }

  async findByIds(ids: string[], withDeleted: boolean = false): Promise<T[]> {
    const localIds = ids.map(id => this.decodeId(id));
    return await this.repository.find({
      where: { id: In(localIds) } as FindOptionsWhere<T>,
      withDeleted
    });
  }

  /**
   * Decode a global ID to local ID
   */
  protected decodeId(id: string): string {
    return IdConverterService.decodeId(id);
  }

  /**
   * Set __typename on an entity
   */
  protected markEntity(entity: T | null): T | null {
    if (entity && '__typename' in entity) {
      (entity as any).__typename = this.typeName;
    }
    return entity;
  }

  /**
   * Set __typename on multiple entities
   */
  protected markEntities(entities: T[]): T[] {
    entities.forEach(entity => {
      if ('__typename' in entity) {
        (entity as any).__typename = this.typeName;
      }
    });
    return entities;
  }

  /**
   * Convert global IDs to local IDs in query options
   */
  protected updateOptions(options: any): any {
    if (options?.where && 'id' in options.where) {
      const where = options.where as FindOptionsWhere<T>;
      const localId = this.decodeId(where.id as string);
      options.where = { ...where, id: localId } as FindOptionsWhere<T>;
    }
    return options;
  }

  // =======================================================================
  // Internal Utility Functions (DRY Pattern)
  // =======================================================================

  /**
   * Detect if input is an entity instance or plain object
   */
  private detectEntityType(input: any): boolean {
    return (
      input &&
      typeof input === 'object' &&
      'constructor' in input &&
      input.constructor.name !== 'Object' &&
      this.repository.target === (input as any).constructor
    );
  }

  /**
   * Convert plain object to entity instance
   */
  private createEntityFromPlain(input: DeepPartial<T>): T {
    return this.repository.create(input);
  }

  /**
   * Reload entity by ID to trigger SmartLoadingSubscriber and mark with __typename
   */
  private async reloadAndMark(id: string | number): Promise<T | null> {
    const localId = typeof id === 'string' && id.includes('-')
      ? this.decodeId(id)
      : id;

    // Use the raw repository but explicitly ask for entity instances
    const reloaded = await this.repository.findOne({
      where: { id: localId } as FindOptionsWhere<T>
    });

    // If we got a plain object, try to create a proper entity instance
    if (reloaded && reloaded.constructor === Object) {
      const entityInstance = this.repository.create(reloaded as DeepPartial<T>);
      return this.markEntity(entityInstance);
    }

    return this.markEntity(reloaded);
  }

  /**
   * Extract ID from criteria object (handles various TypeORM criteria formats)
   */
  private extractIdFromCriteria(criteria: any): string | number | null {
    // Direct ID
    if (criteria.id) return criteria.id;

    // Where clause with ID
    if (criteria.where?.id) return criteria.where.id;

    // Simple object where criteria IS the where clause
    if (typeof criteria === 'object' && !criteria.where && criteria.id) {
      return criteria.id;
    }

    return null;
  }

  // =======================================================================
  // Core TypeORM Methods with Smart Loading Support
  // =======================================================================

  /**
   * Create entity instance from plain object
   */
  create(entityLike: DeepPartial<T>): T {
    return this.repository.create(entityLike);
  }

  /**
   * Save entity with automatic smart loading and plain object handling
   *
   * This is the critical method that ensures SmartLoadingSubscriber.afterLoad() fires
   * by reloading the entity after save. This enables smart relationship loading.
   *
   * Features:
   * - Plain objects automatically converted to entity instances
   * Entity instances saved normally
   - Post-save reload triggers SmartLoadingSubscriber for smart relationships
   - Constructor information preserved throughout the process
   */
  async save<Entity extends DeepPartial<T>>(
    entity: Entity | Entity[]
  ): Promise<Entity> {

    // Handle arrays recursively
    if (Array.isArray(entity)) {
      const promises = entity.map(item => this.save(item));
      return (await Promise.all(promises)) as Entity;
    }

    // Check if it's already an entity instance using utility
    if (this.detectEntityType(entity)) {
      // Entity instance - save normally
      const saved = await this.repository.save(entity as any);

      // Reload to trigger SmartLoadingSubscriber.afterLoad() for smart relationships
      const reloaded = await this.reloadAndMark((saved as any).id);
      return (reloaded || this.markEntity(saved)) as Entity;
    }

    // Plain object - create entity instance first, then save
    const entityInstance = this.createEntityFromPlain(entity as DeepPartial<T>);
    const saved = await this.repository.save(entityInstance as any);

    // Reload to trigger SmartLoadingSubscriber.afterLoad()
    const reloaded = await this.reloadAndMark((saved as any).id);
    return (reloaded || this.markEntity(saved)) as Entity;
  }

  /**
   * Find one entity by ID (triggers smart loading)
   */
  async findById(id: string, withDeleted: boolean = false): Promise<T | null> {
    const localId = this.decodeId(id);
    const entity = await this.repository.findOne({
      where: { id: localId } as FindOptionsWhere<T>,
      withDeleted
    });
    return this.markEntity(entity);
  }

  /**
   * Find one entity with custom options (triggers smart loading)
   */
  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    const finalOptions = this.updateOptions(options);
    const entity = await this.repository.findOne(finalOptions);
    return this.markEntity(entity);
  }

  /**
   * Find one entity or throw if not found (triggers smart loading)
   */
  async findOneOrFail(options: FindOneOptions<T>): Promise<T> {
    const finalOptions = this.updateOptions(options);
    const entity = await this.repository.findOneOrFail(finalOptions);
    return this.markEntity(entity)!;
  }

  /**
   * Find multiple entities (triggers smart loading)
   */
  async find(options?: FindManyOptions<T>): Promise<T[]> {
    const finalOptions = this.updateOptions(options);
    const entities = await this.repository.find(finalOptions);
    return this.markEntities(entities);
  }

  /**
   * Find multiple entities with count, for pagination support (triggers smart loading)
   */
  async findAndCount(options?: FindManyOptions<T>): Promise<[T[], number]> {
    const finalOptions = this.updateOptions(options);
    const [entities, count] = await this.repository.findAndCount(finalOptions);
    return [this.markEntities(entities), count];
  }

  /**
   * Update an entity by ID (triggers smart loading)
   */
  async updateById(id: string, data: Partial<T>): Promise<T> {
    const localId = this.decodeId(id);

    await this.repository.update(localId, data as any);

    // Reload to trigger SmartLoadingSubscriber.afterLoad()
    const updated = await this.repository.findOne({
      where: { id: localId } as FindOptionsWhere<T>
    });

    if (!updated) {
      throw new Error(`Entity not found after update`);
    }

    return this.markEntity(updated)!;
  }

  /**
   * Soft delete an entity by ID
   */
  async softDeleteById(id: string): Promise<boolean> {
    const localId = this.decodeId(id);
    const result = await this.repository.softDelete(localId);
    return result.affected ? result.affected > 0 : false;
  }

  /**
   * Hard delete an entity by ID
   */
  async hardDeleteById(id: string): Promise<boolean> {
    const localId = this.decodeId(id);
    const result = await this.repository.delete(localId);
    return result.affected ? result.affected > 0 : false;
  }

  /**
   * Recover a soft-deleted entity by ID (triggers smart loading)
   */
  async recoverById(id: string): Promise<T> {
    const localId = this.decodeId(id);

    const existing = await this.repository.findOne({
      where: { id: localId } as FindOptionsWhere<T>,
      withDeleted: true
    });

    if (!existing) {
      throw new Error(`Entity not found`);
    }

    return await this.repository.recover(existing);
  }

  /**
   * Find entities without soft-deleted records (triggers smart loading)
   */
  async findWithoutSoftDeletes(
    where: FindManyOptions<T>['where'],
    relations?: string[]
  ): Promise<T[]> {
    const entities = await this.repository.find({
      where: where as FindOptionsWhere<T>,
      withDeleted: false,
      relations
    });

    return this.markEntities(entities);
  }

  /**
   * Upsert: create or update an entity
   */
  async upsert(input: Partial<T> & { id?: string }): Promise<T> {
    if (input.id) {
      return await this.updateById(input.id, input);
    } else {
      const result = await this.save(input as DeepPartial<T>);
      return result as T;
    }
  }

  /**
   * Mark entities with __typename after manual raw repository operations
   */
  markWithTypename(entity: T | null): T | null;
  markWithTypename(entities: T[]): T[];
  markWithTypename(entityOrEntities: T | null | T[]): T | null | T[] {
    if (Array.isArray(entityOrEntities)) {
      return this.markEntities(entityOrEntities);
    }
    return this.markEntity(entityOrEntities);
  }

  // =======================================================================
  // Direct TypeORM Repository Methods (for advanced usage)
  // =======================================================================

  /**
   * Update entity with smart loading and plain object handling
   *
   * This method supports both:
   * - Entity instances: Updated directly and reloaded for smart loading
   * - Plain objects: Converted to entities, then updated with smart loading
   */
  async update(
    criteria: any,
    partialEntity: DeepPartial<T> | T
  ): Promise<any> {
    // Handle entity instances vs plain objects using utility
    if (this.detectEntityType(partialEntity)) {
      // Entity instance - update directly
      const result = await this.repository.update(criteria, partialEntity as any);

      // Reload the updated entity to trigger smart loading
      const id = this.extractIdFromCriteria(criteria);
      if (id) {
        await this.reloadAndMark(id);
      }

      return result;
    }

    // Plain object - convert to entity first, then update
    const entityInstance = this.createEntityFromPlain(partialEntity as DeepPartial<T>);
    const result = await this.repository.update(criteria, entityInstance as any);

    // Reload for smart loading
    const id = this.extractIdFromCriteria(criteria);
    if (id) {
      await this.reloadAndMark(id);
    }

    return result;
  }

  /**
   * Direct TypeORM soft delete method
   */
  async softDelete(criteria: any): Promise<any> {
    return await this.repository.softDelete(criteria);
  }

  /**
   * Direct TypeORM delete method
   */
  async delete(criteria: any): Promise<any> {
    return await this.repository.delete(criteria);
  }

  /**
   * Recover entity with smart loading and plain object handling
   *
   * This method supports both:
   * - Entity instances: Recovered directly and reloaded for smart loading
   * - Plain objects: Converted to entities, then recovered with smart loading
   */
  async recover(entity: T | DeepPartial<T>): Promise<T> {
    let entityToRecover: T;

    // Handle entity instances vs plain objects using utility
    if (this.detectEntityType(entity)) {
      // Entity instance - use directly
      entityToRecover = entity as T;
    } else {
      // Plain object - convert to entity first
      entityToRecover = this.createEntityFromPlain(entity as DeepPartial<T>);
    }

    // Perform the recovery
    const recovered = await this.repository.recover(entityToRecover);

    // Reload to trigger SmartLoadingSubscriber and mark with __typename
    const reloaded = await this.reloadAndMark((recovered as any).id);
    return reloaded || (this.markEntity(recovered) as T);
  }

  /**
   * Direct TypeORM findOneBy method
   */
  async findOneBy(criteria: any): Promise<T | null> {
    return await this.repository.findOneBy(criteria);
  }

  /**
   * Direct TypeORM findOneByOrFail method
   */
  async findOneByOrFail(criteria: any): Promise<T> {
    return await this.repository.findOneByOrFail(criteria);
  }

  /**
   * Direct TypeORM findBy method
   */
  async findBy(criteria: any): Promise<T[]> {
    return await this.repository.findBy(criteria);
  }

  /**
   * Direct TypeORM count method
   */
  async count(options?: any): Promise<number> {
    return await this.repository.count(options);
  }

  /**
   * Remove entity with smart loading and plain object handling
   *
   * This method supports both:
   * - Entity instances: Removed directly
   * - Plain objects: Converted to entities, then removed
   *
   * Note: remove() doesn't trigger smart loading since the entity is deleted
   */
  async remove(entity: T | DeepPartial<T>): Promise<T> {
    let entityToRemove: T;

    // Handle entity instances vs plain objects using utility
    if (this.detectEntityType(entity)) {
      // Entity instance - use directly
      entityToRemove = entity as T;
    } else {
      // Plain object - convert to entity first
      entityToRemove = this.createEntityFromPlain(entity as DeepPartial<T>);
    }

    // Perform the removal
    return await this.repository.remove(entityToRemove);
  }
}