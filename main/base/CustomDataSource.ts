import { DataSource, Repository, ObjectLiteral } from 'typeorm';
import { EntityTarget } from 'typeorm';
import { CustomRepository } from './CustomRepository.js';

/**
 * CustomDataSource - Smart DataSource with automatic CustomRepository wrapping
 *
 * This DataSource ensures that ALL repositories returned by getRepository()
 * are CustomRepository instances with smart loading capabilities.
 *
 * Benefits:
 * - 100% transparent - existing code works without changes
 * - 100% automatic - smart loading always happens
 * - Zero cognitive load - developers don't need to think about it
 * - Consistent behavior everywhere
 *
 * Usage:
 * const dataSource = new CustomDataSource(options);
 * const repo = dataSource.getRepository(Message); // Returns CustomRepository<Message>
 * const result = await repo.save(message); // Smart loading happens automatically
 */
export class CustomDataSource extends DataSource {

  static fromDataSource(dataSource: DataSource): CustomDataSource {
    const customDataSource = new CustomDataSource({
      ...dataSource.options
    });

    return customDataSource;
  }

  /**
   * Override getRepository to always return CustomRepository instances
   * This ensures smart loading happens automatically for all entities
   */
  override getRepository<Entity extends ObjectLiteral>(target: EntityTarget<Entity>): Repository<Entity> {
    const rawRepository = super.getRepository(target);
    const typeName = typeof target === 'function' ? target.name : String(target);
    // Cast to CustomRepository but return as Repository<Entity> for type compatibility
    return new CustomRepository(rawRepository as any, typeName) as unknown as Repository<Entity>;
  }

  /**
   * Typed getRepository for entities with id and __typename (our standard entities)
   */
  getBaseRepository<Entity extends { id: string; __typename?: string }>(target: EntityTarget<Entity>): CustomRepository<Entity> {
    const rawRepository = super.getRepository(target);
    const typeName = typeof target === 'function' ? target.name : String(target);
    return new CustomRepository(rawRepository as any, typeName);
  }
}