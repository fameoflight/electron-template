import { ObjectType } from 'type-graphql';
import { Entity, EntityOptions, Index } from 'typeorm';

/**
 * Combined decorator that applies both @ObjectType and @Entity with optional indexes
 *
 * This reduces decorator stacking by applying both GraphQL ObjectType
 * and TypeORM Entity decorators in a single declaration, with support
 * for database indexes.
 *
 * @param tableName - The database table name for the entity
 * @param options - Configuration options
 * @param options.entityOptions - Optional TypeORM entity configuration
 * @param options.indexes - Optional array of field names or field arrays to index
 * @param options.description - GraphQL type description
 * @param options.implements - GraphQL interfaces to implement
 *
 * @example
 * ```typescript
 * // Simple usage without indexes
 * @EntityObjectType('posts')
 * export class Post extends BaseEntity {
 *   // ...fields
 * }
 *
 * // With indexes and description
 * @EntityObjectType('jobs', {
 *   description: 'Background job for async task execution',
 *   indexes: [
 *     'status',              // Single field index
 *     ['status', 'type'],    // Composite index
 *     ['userId'],            // Single field in array form
 *   ]
 * })
 * export class Job extends BaseEntity {
 *   // ...fields
 * }
 *
 * // With interface implementation
 * @EntityObjectType('users', {
 *   description: 'User account',
 *   implements: [NodeInterface]
 * })
 * export class User extends BaseEntity {
 *   // ...fields
 * }
 *
 * // Equivalent to:
 * @ObjectType({ description: 'Background job...', implements: [...] })
 * @Index(['status', 'type'])
 * @Index(['userId'])
 * @Entity('jobs')
 * export class Job extends BaseEntity {
 *   // ...fields
 * }
 * ```
 */
export function EntityObjectType(
  tableName: string,
  options?: {
    entityOptions?: EntityOptions;
    indexes?: (string | string[])[];
    description?: string;
    implements?: Function | Function[];
  }
): ClassDecorator {
  return function(target: any) {
    // Apply GraphQL ObjectType decorator with options
    const objectTypeOptions: any = {};
    if (options?.description) {
      objectTypeOptions.description = options.description;
    }
    if (options?.implements) {
      objectTypeOptions.implements = options.implements;
    }

    ObjectType(objectTypeOptions)(target);

    // Apply indexes if provided
    if (options?.indexes) {
      for (const index of options.indexes) {
        const fields = Array.isArray(index) ? index : [index];
        Index(fields)(target);
      }
    }

    // Apply TypeORM Entity decorator
    if (options?.entityOptions) {
      Entity(tableName, options.entityOptions)(target);
    } else {
      Entity(tableName)(target);
    }
  };
}