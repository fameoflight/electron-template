import { Repository as TypeORMRepository, FindOneOptions, FindManyOptions, FindOptionsWhere, DeepPartial } from 'typeorm';
import { CustomRepository } from '../../CustomRepository.js';
import { OwnedEntity } from '@base/db/OwnedEntity.js';

/**
 * OwnedRepository with user ownership enforcement and smart loading
 *
 * Extends CustomRepository with automatic user ownership filtering
 * while preserving all smart loading functionality.
 *
 * Core security features:
 * - All operations automatically filter by currentUserId
 * - Auto-attaches userId on entity creation
 * - Verifies ownership before update/delete operations
 * - Never exposes userId to GraphQL clients
 * - Preserves SmartLoadingSubscriber triggers for smart relationships
 *
 * Use this for all entities that extend OwnedEntity (Connection, Job, etc.)
 * For non-owned entities (User), use CustomRepository instead
 */
export class OwnedRepository<T extends OwnedEntity> extends CustomRepository<T> {
  constructor(
    repository: TypeORMRepository<T>,
    typeName: string,
    private currentUserId: string
  ) {
    super(repository, typeName);
  }

  /**
   * Create an entity with automatic userId attachment (matches BaseRepository signature)
   */
  create(entityLike: DeepPartial<T>): T {
    const entity = this.repository.create(entityLike);
    // Auto-attach userId directly to entity (preserve constructor)
    (entity as any).userId = this.currentUserId;
    return entity;
  }

  /**
   * Save entity with smart loading and automatic userId enforcement
   */
  async save<Entity extends DeepPartial<T>>(
    entity: Entity | Entity[]
  ): Promise<Entity> {
    // Handle arrays recursively
    if (Array.isArray(entity)) {
      const promises = entity.map(item => this.save(item));
      return (await Promise.all(promises)) as Entity;
    }

    // Auto-attach current user's userId for new entities (don't use spread operator!)
    if (!(entity as any).id) {
      (entity as any).userId = this.currentUserId;
    }

    // Use parent's save method which includes smart loading
    return await super.save(entity);
  }

  /**
   * Add userId filter to query options
   */
  private addUserFilter(options: any): any {
    if (!options) options = {};
    if (!options.where) options.where = {};

    // Add userId filter - users can only access their own data
    options.where.userId = this.currentUserId;

    return options;
  }

  /**
   * Find one entity by ID (verifies ownership automatically + smart loading)
   */
  async findById(id: string, withDeleted: boolean = false): Promise<T | null> {
    const localId = this.decodeId(id);
    const entity = await this.repository.findOne({
      where: { id: localId, userId: this.currentUserId } as FindOptionsWhere<T>,
      withDeleted
    });
    return this.markEntity(entity);
  }

  /**
   * Find one entity with automatic userId filtering + smart loading
   */
  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    let finalOptions = this.updateOptions(options);
    finalOptions = this.addUserFilter(finalOptions);

    const entity = await this.repository.findOne(finalOptions);
    return this.markEntity(entity);
  }

  /**
   * Find one entity or throw with automatic userId filtering + smart loading
   */
  async findOneOrFail(options: FindOneOptions<T>): Promise<T> {
    let finalOptions = this.updateOptions(options);
    finalOptions = this.addUserFilter(finalOptions);

    const entity = await this.repository.findOneOrFail(finalOptions);
    return this.markEntity(entity)!;
  }

  /**
   * Find multiple entities with automatic userId filtering + smart loading
   */
  async find(options?: FindManyOptions<T>): Promise<T[]> {
    let finalOptions = this.updateOptions(options);
    finalOptions = this.addUserFilter(finalOptions);

    const entities = await this.repository.find(finalOptions);
    return this.markEntities(entities);
  }

  /**
   * Update an entity with ownership verification + smart loading
   */
  async updateById(id: string, data: Partial<T>): Promise<T> {
    const localId = this.decodeId(id);

    // Prevent changing userId
    const updateData = { ...data };
    delete (updateData as any).userId;

    await this.repository.update(localId, updateData as any);

    // Reload to trigger SmartLoadingSubscriber.afterLoad() and verify ownership
    const updated = await this.repository.findOne({
      where: { id: localId, userId: this.currentUserId } as FindOptionsWhere<T>
    });

    if (!updated) {
      throw new Error(`Entity not found or access denied`);
    }

    return this.markEntity(updated)!;
  }

  /**
   * Soft delete with ownership verification
   */
  async softDeleteById(id: string): Promise<boolean> {
    const localId = this.decodeId(id);

    // Verify ownership before delete (include soft-deleted entities)
    const existing = await this.repository.findOne({
      where: { id: localId, userId: this.currentUserId } as FindOptionsWhere<T>,
      withDeleted: true
    });

    if (!existing) {
      throw new Error(`Entity not found or access denied`);
    }

    // If already soft-deleted, just return true
    if (existing.deletedAt) {
      return true;
    }

    const result = await this.repository.softDelete(localId);
    return result.affected ? result.affected > 0 : false;
  }

  /**
   * Hard delete with ownership verification
   */
  async hardDeleteById(id: string): Promise<boolean> {
    const localId = this.decodeId(id);

    // Verify ownership before delete
    const existing = await this.repository.findOne({
      where: { id: localId, userId: this.currentUserId } as FindOptionsWhere<T>
    });

    if (!existing) {
      throw new Error(`Entity not found or access denied`);
    }

    const result = await this.repository.delete(localId);
    return result.affected ? result.affected > 0 : false;
  }

  /**
   * Recover a soft-deleted entity with ownership verification
   */
  async recoverById(id: string): Promise<T> {
    const localId = this.decodeId(id);

    // Verify ownership before recover
    const existing = await this.repository.findOne({
      where: { id: localId, userId: this.currentUserId } as FindOptionsWhere<T>,
      withDeleted: true
    });

    if (!existing) {
      throw new Error(`Entity not found or access denied`);
    }

    return await this.repository.recover(existing);
  }

  /**
   * Find entities without soft-deleted records (with automatic userId filtering)
   */
  async findWithoutSoftDeletes(
    where: FindManyOptions<T>['where'],
    relations?: string[]
  ): Promise<T[]> {
    const finalWhere = { ...where, userId: this.currentUserId } as FindOptionsWhere<T>;

    const entities = await this.repository.find({
      where: finalWhere,
      withDeleted: false,
      relations
    });

    return this.markEntities(entities);
  }

  /**
   * Upsert with ownership verification
   * Creates new entity or updates existing (with ownership check)
   */
  async upsert(input: Partial<T> & { id?: string }): Promise<T> {
    if (input.id) {
      // Update existing entity - use updateById for ownership verification
      return await this.updateById(input.id, input);
    } else {
      // Create new entity
      const result = await this.save(input as DeepPartial<T>);
      return result as T;
    }
  }

  /**
   * @deprecated Use upsert() instead
   * This method is kept for backward compatibility with existing tests
   */
  async upsertWithOwnership(input: Partial<T> & { id?: string }): Promise<T> {
    return await this.upsert(input);
  }
}
