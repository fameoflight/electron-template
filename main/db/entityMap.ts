/**
 * Entity Map - Static Entity Access
 *
 * Purpose: Simple static access to all entity classes.
 * This is now a thin compatibility layer over the static entityClasses from entityPaths.ts.
 *
 * Benefits:
 * - Static: All entities available at import time
 * - Simple: No loading or caching complexity
 * - Type-safe: Full TypeScript support
 * - Compatible: Maintains existing API
 *
 * Usage:
 * ```typescript
 * // Direct access (preferred)
 * import { entityClasses } from './entityPaths.js';
 * const { User, Chat, Job } = entityClasses;
 *
 * // Legacy API (still supported)
 * import { getEntity, getEntities } from './entityMap.js';
 * const User = getEntity('User');
 * const allEntities = getEntities();
 * ```
 */

import { EntityTarget } from 'typeorm';
import {
  entityClasses,
  EntityName,
  EntityClasses as ImportedEntityClasses,
  getEntityClass as getPathEntityClass,
  getAllEntityClasses,
  getEntitiesArray as getPathEntitiesArray
} from './entityPaths.js';

// Re-export EntityClasses for backward compatibility
export type EntityClasses = ImportedEntityClasses;

// Type to get all entity classes as a union type
export type EntityClass = EntityClasses[EntityName];

/**
 * Get all entities (static access)
 *
 * Returns all entity classes without any loading required.
 * This is the primary method for accessing entities.
 *
 * @returns Map of entity classes
 *
 * @example
 * ```typescript
 * const entities = getEntities();
 * const { User, Chat, Job } = entities;
 * ```
 */
export function getEntities(): EntityClasses {
  return getAllEntityClasses();
}

/**
 * Get single entity by name (static access)
 *
 * Convenience method to get a specific entity without destructuring.
 *
 * @param name - Entity name ('User', 'Chat', 'Job')
 * @returns Entity class
 * @throws Error if entity not found
 *
 * @example
 * ```typescript
 * const User = getEntity('User');
 * const user = new User();
 * ```
 */
export function getEntity<K extends keyof EntityClasses>(name: K): EntityClasses[K] {
  return getPathEntityClass(name);
}

/**
 * Load all entities (legacy compatibility)
 *
 * Maintains backward compatibility with the old async API.
 * Now simply returns the static entities.
 *
 * @returns Promise resolving to map of entity classes
 *
 * @example
 * ```typescript
 * const { User, Chat, Job } = await loadEntities();
 * ```
 */
export async function loadEntities(): Promise<EntityClasses> {
  // Return static entities directly (no async loading needed)
  return getAllEntityClasses();
}

/**
 * Get entities as array (for TypeORM DataSource)
 *
 * TypeORM's DataSource expects entities as an array.
 * This method provides that format with static access.
 *
 * @returns Array of entity classes
 *
 * @example
 * ```typescript
 * const dataSource = new DataSource({
 *   entities: getEntitiesArray(),
 *   // ... other config
 * });
 * ```
 */
export function getEntitiesArray(): EntityTarget<any>[] {
  return getPathEntitiesArray();
}

/**
 * Get entities as array (async version for compatibility)
 *
 * Maintains backward compatibility with the old async API.
 *
 * @returns Promise resolving to array of entity classes
 */
export async function getEntitiesArrayAsync(): Promise<EntityTarget<any>[]> {
  return getEntitiesArray();
}

/**
 * Check if entities are loaded (legacy compatibility)
 *
 * With static loading, entities are always "loaded".
 * Maintains backward compatibility with existing code.
 *
 * @returns true (entities are always available with static loading)
 */
export function areEntitiesLoaded(): boolean {
  return true;
}

/**
 * Clear cached entities (no-op for compatibility)
 *
 * With static loading, there's no cache to clear.
 * Maintains backward compatibility with existing code.
 */
export function clearEntityCache(): void {
  // No-op: static entities don't need cache clearing
}
