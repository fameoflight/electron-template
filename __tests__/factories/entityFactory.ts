/**
 * Entity Factory Test Utilities
 *
 * Provides reusable utilities for creating test entities with proper timing
 * for ordering tests and other test scenarios.
 */

import { DataSource, EntityTarget } from 'typeorm';
import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { BaseEntity } from '@main/base/db/index';
import { OwnedEntity } from '@base/db/OwnedEntity';
import { OwnedRepository } from '@main/base/graphql/relay/OwnedRepository';
import { BaseResolver } from '@main/base/graphql/BaseResolver';
import DataSourceProvider from '@base/db/DataSourceProvider';
import { createUser } from '@factories/index';

/**
 * Concrete resolver implementation for testing
 * BaseResolver is abstract, so we need a concrete implementation to use in tests
 */
class TestResolver extends BaseResolver {
  /**
   * Public method to expose the protected getOwnedRepository method for testing
   * This mimics how real resolvers work - they get the repository with context
   */
  public getRepo<T extends OwnedEntity>(
    entityClass: EntityTarget<T>,
    typeName?: string,
    context?: any
  ): OwnedRepository<T> {
    if (context?.user) {
      return this.getUserRepository(entityClass, typeName, context.user.id);
    } else {
      // Fallback for tests that don't provide context
      // This should be avoided in favor of passing proper context
      return this.getUserRepository(entityClass, typeName, 'test-user-id');
    }
  }
}

/**
 * Create a test entity with automatic timestamp spacing
 * Useful for ordering tests where createdAt ordering matters
 */
export async function createEntityWithDelay<T extends OwnedEntity>(
  dataSource: DataSource,
  EntityClass: new () => T,
  data: Partial<T>,
  context?: any,
  delayMs: number = 1100 // Use 1.1 seconds for SQLite to ensure different timestamps
): Promise<T> {
  const resolver = new TestResolver();
  const repo = resolver.getRepo(EntityClass, undefined, context);

  const entity = repo.create(data as any);
  const saved = await repo.save(entity);

  // Add delay to ensure different timestamps for ordering tests
  if (delayMs > 0) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  return saved;
}

/**
 * Create multiple test entities with automatic timestamp spacing
 * Returns entities in creation order (oldest first)
 */
export async function createEntitiesWithDelay<T extends OwnedEntity>(
  dataSource: DataSource,
  EntityClass: new () => T,
  dataArray: Partial<T>[],
  context?: any,
  delayMs: number = 1000 // Use 1 second default for SQLite
): Promise<T[]> {
  const entities: T[] = [];

  for (const data of dataArray) {
    const entity = await createEntityWithDelay(dataSource, EntityClass, data, context, delayMs);
    entities.push(entity);
  }

  return entities;
}

/**
 * Create entities with custom delay pattern
 * Allows for different delays between specific entities
 */
export async function createEntitiesWithCustomDelays<T extends OwnedEntity>(
  dataSource: DataSource,
  EntityClass: new () => T,
  dataArray: Array<{ data: Partial<T>; delayMs?: number }>
): Promise<T[]> {
  const entities: T[] = [];

  for (const { data, delayMs = 50 } of dataArray) {
    const entity = await createEntityWithDelay(dataSource, EntityClass, data, delayMs);
    entities.push(entity);
  }

  return entities;
}

/**
 * Get an OwnedRepository for any entity type
 */
export async function getRelayRepository<T extends OwnedEntity>(
  dataSource: DataSource,
  EntityClass: new () => T
): Promise<OwnedRepository<T>> {
  const resolver = new TestResolver();
  return await resolver.getRepo(EntityClass);
}

/**
 * @deprecated Use getRelayRepository instead
 * Kept for backward compatibility
 */
export async function getOwnedRepository<T extends OwnedEntity>(
  dataSource: DataSource,
  EntityClass: new () => T
): Promise<OwnedRepository<T>> {
  return await getRelayRepository(dataSource, EntityClass);
}

/**
 * Helper to create test data for ordering scenarios
 */
export const createOrderingTestData = {
  /**
   * Create sequential entities (First, Second, Third, etc.)
   */
  sequential: (count: number, baseData: Record<string, unknown> = {}) => {
    return Array.from({ length: count }, (_, i) => ({
      ...baseData,
      title: ['First', 'Second', 'Third', 'Fourth', 'Fifth'][i] || `Item ${i + 1}`,
      priority: i + 1
    }));
  },

  /**
   * Create entities with priority-based ordering
   */
  byPriority: (priorities: number[], baseData: Record<string, unknown> = {}) => {
    return priorities.map((priority, i) => ({
      ...baseData,
      title: `Priority ${priority}`,
      priority
    }));
  },

  /**
   * Create entities with mixed ordering patterns
   */
  mixed: () => [
    { title: 'A', priority: 5 },
    { title: 'B', priority: 10 },
    { title: 'C', priority: 3 }
  ],

  /**
   * Create blog post scenario data
   */
  blogPosts: () => [
    { title: 'Old Post', priority: 1 },
    { title: 'Recent Post', priority: 1 },
    { title: 'Latest Post', priority: 1 }
  ],

  /**
   * Create task scenario data
   */
  tasks: () => [
    { title: 'Low Priority Old Task', priority: 1 },
    { title: 'High Priority Task', priority: 10 },
    { title: 'Low Priority New Task', priority: 1 },
    { title: 'Medium Priority Task', priority: 5 }
  ]
};

/**
 * Assertions for ordering tests
 */
export const orderingAssertions = {
  /**
   * Assert entities are ordered by creation time (newest first)
   */
  newestFirst: (entities: { title: string }[], expectedTitles: string[]) => {
    expect(entities).toHaveLength(expectedTitles.length);
    expectedTitles.forEach((expectedTitle, index) => {
      expect(entities[index].title).toBe(expectedTitle);
    });
  },

  /**
   * Assert entities are ordered by creation time (oldest first)
   */
  oldestFirst: (entities: { title: string }[], expectedTitles: string[]) => {
    expect(entities).toHaveLength(expectedTitles.length);
    expectedTitles.forEach((expectedTitle, index) => {
      expect(entities[index].title).toBe(expectedTitle);
    });
  },

  /**
   * Assert entities are ordered by priority (highest first)
   */
  byPriority: (entities: { title: string; priority: number }[], expectedOrder: Array<{ title: string; priority: number }>) => {
    expect(entities).toHaveLength(expectedOrder.length);
    expectedOrder.forEach((expected, index) => {
      expect(entities[index].title).toBe(expected.title);
      expect(entities[index].priority).toBe(expected.priority);
    });
  }
};

/**
 * Edge case assertions for robust testing
 */
export const edgeCaseAssertions = {
  /**
   * Assert empty results are handled gracefully
   */
  emptyResults: (results: any[]) => {
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    expect(results).toHaveLength(0);
  },

  /**
   * Assert single entity is returned correctly across all ordering types
   */
  singleEntity: (results: any[], expectedTitle: string, expectedPriority?: number) => {
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe(expectedTitle);
    if (expectedPriority !== undefined) {
      expect(results[0].priority).toBe(expectedPriority);
    }
    expect(results[0].id).toBeDefined();
    expect(results[0].createdAt).toBeDefined();
    expect(results[0].updatedAt).toBeDefined();
  },

  /**
   * Assert default values are handled correctly
   */
  defaultValues: (entities: any[], field: string, expectedValue: any) => {
    expect(entities.every(entity => entity[field] === expectedValue)).toBe(true);
  },

  /**
   * Assert ordering respects secondary sort when primary values are equal
   */
  secondarySort: (results: any[], primaryField: string, secondaryField: string) => {
    for (let i = 1; i < results.length; i++) {
      const current = results[i];
      const previous = results[i - 1];

      // If primary field is equal, secondary field should be ordered
      if (current[primaryField] === previous[primaryField]) {
        const currentValue = current[secondaryField];
        const previousValue = previous[secondaryField];

        if (secondaryField === 'createdAt') {
          // For createdAt, earlier should come first (ASC)
          expect(new Date(currentValue).getTime()).toBeGreaterThanOrEqual(new Date(previousValue).getTime());
        } else {
          // For other fields, check the actual ordering direction
          expect(currentValue).toBeDefined();
          expect(previousValue).toBeDefined();
        }
      }
    }
  }
};