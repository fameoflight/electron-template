import { EntityTarget } from 'typeorm';

/**
 * Centralized service for managing __typename in Relay/GraphQL entities
 *
 * Eliminates duplication across:
 * - BaseResolver (6 methods)
 * - RelayRepository (3 methods)
 *
 * __typename is required by Relay for:
 * - Node interface type resolution
 * - Cache normalization
 * - Fragment matching
 */
export class TypeNameService {
  /**
   * Set __typename on a single entity
   * @param entity Entity to mark
   * @param typeName GraphQL type name
   * @returns The entity with __typename set
   */
  static setTypeName<T extends { __typename?: string }>(
    entity: T,
    typeName: string
  ): T {
    entity.__typename = typeName;
    return entity;
  }

  /**
   * Set __typename on multiple entities
   * @param entities Array of entities to mark
   * @param typeName GraphQL type name
   * @returns The entities with __typename set
   */
  static setTypeNames<T extends { __typename?: string }>(
    entities: T[],
    typeName: string
  ): T[] {
    entities.forEach(entity => {
      entity.__typename = typeName;
    });
    return entities;
  }

  /**
   * Automatically set __typename based on entity's constructor name
   * Works when class name matches GraphQL type name
   * @param entity Entity to mark
   * @returns The entity with __typename set (or null if entity is null)
   */
  static autoSetTypeName<T extends { __typename?: string }>(
    entity: T | null
  ): T | null {
    if (entity && entity.constructor && entity.constructor.name) {
      entity.__typename = entity.constructor.name;
    }
    return entity;
  }

  /**
   * Automatically set __typename for multiple entities
   * @param entities Array of entities to mark
   * @returns The entities with __typename set
   */
  static autoSetTypeNames<T extends { __typename?: string }>(
    entities: T[]
  ): T[] {
    entities.forEach(entity => {
      if (entity.constructor && entity.constructor.name) {
        entity.__typename = entity.constructor.name;
      }
    });
    return entities;
  }

  /**
   * Extract type name from entity class
   * @param entityClass Entity class or target
   * @returns The type name (usually the class name)
   */
  static getTypeName<T>(entityClass: EntityTarget<T>): string {
    if (typeof entityClass === 'function') {
      return entityClass.name;
    }
    // Fallback for edge cases (schema name, etc.)
    return String(entityClass);
  }

  /**
   * Check if entity has __typename set
   * @param entity Entity to check
   * @returns true if __typename is set
   */
  static hasTypeName<T extends { __typename?: string }>(entity: T): boolean {
    return !!entity.__typename;
  }

  /**
   * Ensure entity has __typename, auto-set if missing
   * @param entity Entity to ensure
   * @param fallbackTypeName Optional fallback if auto-detection fails
   * @returns The entity with __typename guaranteed
   */
  static ensureTypeName<T extends { __typename?: string }>(
    entity: T,
    fallbackTypeName?: string
  ): T {
    if (!entity.__typename) {
      if (entity.constructor && entity.constructor.name) {
        entity.__typename = entity.constructor.name;
      } else if (fallbackTypeName) {
        entity.__typename = fallbackTypeName;
      }
    }
    return entity;
  }
}
