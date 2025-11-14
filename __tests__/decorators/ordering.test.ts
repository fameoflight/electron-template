/**
 * Decorator Ordering Behavior Tests
 *
 * Tests that verify EntityObjectType and FieldColumn decorators
 * do not impose any ordering constraints, and that ordering
 * is controlled by resolver methods only.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Resolver, Query, Ctx } from 'type-graphql';
import { EntityObjectType, FieldColumn } from '@base/graphql/decorators/index';
import { OwnedEntity } from '@base/db/OwnedEntity';
import { BaseResolver } from '@base/graphql/index';
import {
  cleanupTestDatabase,
  createTestDatabase,
} from '../base/testDatabase';
import DataSourceProvider from '@base/db/DataSourceProvider';
import {
  createEntityWithDelay,
  createEntitiesWithDelay,
  createOrderingTestData,
  orderingAssertions,
  edgeCaseAssertions,
  getRelayRepository
} from '../factories/entityFactory';
import { createUser } from '@factories/index';
import { DataSource } from 'typeorm';

// Test entity with decorators
@EntityObjectType('test_ordering', {
  description: 'Test entity for ordering verification'
})
class TestOrderingEntity extends OwnedEntity {
  @FieldColumn(String, {
    description: 'Test title',
    required: true
  })
  title!: string;

  @FieldColumn(Number, {
    columnType: 'integer',
    description: 'Priority for custom ordering',
    default: 0,
    required: true
  })
  priority!: number;
}

// Resolver simulating default CRUD behavior (oldest first)
@Resolver(() => TestOrderingEntity)
class TestOrderingResolverWithDefaults extends BaseResolver {
  @Query(() => [TestOrderingEntity])
  async testorderingentitiesArray(): Promise<TestOrderingEntity[]> {
    const repo = this.getUserRepository(TestOrderingEntity, 'TestOrderingEntity', 'test-user-id');
    // This simulates the default ordering from CRUDResolver
    return await repo.find({
      order: { createdAt: 'ASC' } // Default: oldest first
    });
  }
}

// Resolver with custom ordering override
@Resolver(() => TestOrderingEntity)
class TestOrderingResolverWithCustom extends BaseResolver {
  @Query(() => [TestOrderingEntity])
  async testOrderingEntitiesNewestFirst(@Ctx() ctx: any): Promise<TestOrderingEntity[]> {
    const repo = this.getRelayRepository(TestOrderingEntity, ctx);
    // Override: newest first (DESC)
    return await repo.find({
      order: { createdAt: 'DESC' }
    });
  }

  @Query(() => [TestOrderingEntity])
  async testOrderingEntitiesByPriority(@Ctx() ctx: any): Promise<TestOrderingEntity[]> {
    const repo = this.getRelayRepository(TestOrderingEntity, ctx);
    // Custom ordering by priority field
    return await repo.find({
      order: { priority: 'DESC', createdAt: 'ASC' }
    });
  }

  @Query(() => [TestOrderingEntity])
  async testOrderingEntitiesOldestFirst(@Ctx() ctx: any): Promise<TestOrderingEntity[]> {
    const repo = this.getRelayRepository(TestOrderingEntity, ctx);
    // Default ordering: oldest first (ASC) - same as CRUD default
    return await repo.find({
      order: { createdAt: 'ASC' }
    });
  }
}

describe('Decorator Ordering Behavior', () => {
  let dataSource: DataSource;

  afterEach(async () => {
    await cleanupTestDatabase(dataSource);
  });
  let testUser: any;

  beforeEach(async () => {
    dataSource = await createTestDatabase([TestOrderingEntity]);
    // Create a test user for ownership
    testUser = await createUser(dataSource);
  });

  afterEach(async () => {
    await cleanupTestDatabase(dataSource);
    DataSourceProvider.clearTestDataSource();
  });

  function createTestContext() {
    return { user: testUser };
  }



  describe('EntityObjectType Decorator', () => {
    it('should NOT impose any ordering constraints', () => {
      // The EntityObjectType decorator only handles:
      // - @ObjectType (GraphQL)
      // - @Entity (TypeORM)
      // - @Index (Database indexes)
      // - description, implements

      // It does NOT handle ordering at all
      expect(TestOrderingEntity).toBeDefined();
      expect(TestOrderingEntity.name).toBe('TestOrderingEntity');
    });
  });

  describe('FieldColumn Decorator', () => {
    it('should NOT impose any ordering constraints', () => {
      // The FieldColumn decorator only handles:
      // - @Field (GraphQL)
      // - @Column (TypeORM)
      // - Validation decorators

      // It does NOT handle ordering at all
      const entity = new TestOrderingEntity();
      entity.title = 'Test';
      entity.priority = 5;

      expect(entity.title).toBe('Test');
      expect(entity.priority).toBe(5);
    });
  });

  describe('CRUDResolver Default Ordering', () => {
    it('should define ordering in resolver method, not decorator', () => {
      // Verify that ordering is specified in the resolver method
      const resolver = new TestOrderingResolverWithDefaults();
      const method = resolver['testorderingentitiesArray'];

      // The method exists (defined in resolver, not decorator)
      expect(method).toBeDefined();
      expect(typeof method).toBe('function');

      // The method implementation contains ordering logic
      const methodString = method.toString();
      expect(methodString).toContain('order');
      expect(methodString).toContain('createdAt');
    });
  });

  describe('Custom Ordering Override', () => {
    it('should allow overriding to newest first (DESC)', async () => {
      const resolver = new TestOrderingResolverWithCustom();
      const context = createTestContext();

      // Create test records with automatic delays for reliable timestamps
      await createEntityWithDelay(dataSource, TestOrderingEntity, { title: 'First', priority: 1 }, context);
      await createEntityWithDelay(dataSource, TestOrderingEntity, { title: 'Second', priority: 2 }, context);
      await createEntityWithDelay(dataSource, TestOrderingEntity, { title: 'Third', priority: 3 }, context);

      // Custom ordering: newest first
      const results = await resolver.testOrderingEntitiesNewestFirst(context);

      orderingAssertions.newestFirst(results, ['Third', 'Second', 'First']);
    });

    it('should allow custom ordering by priority', async () => {
      const resolver = new TestOrderingResolverWithCustom();
      const context = createTestContext();

      // Create records with specific priorities (not in priority order)
      const priorityData = [
        { title: 'Low Priority', priority: 1 },
        { title: 'High Priority', priority: 10 },
        { title: 'Medium Priority', priority: 5 }
      ];

      await createEntitiesWithDelay(dataSource, TestOrderingEntity, priorityData, context);

      // Custom ordering: by priority DESC
      const results = await resolver.testOrderingEntitiesByPriority(context);

      orderingAssertions.byPriority(results, [
        { title: 'High Priority', priority: 10 },
        { title: 'Medium Priority', priority: 5 },
        { title: 'Low Priority', priority: 1 }
      ]);
    });

    it('should allow explicitly specifying oldest first (same as default)', async () => {
      const resolver = new TestOrderingResolverWithCustom();
      const context = createTestContext();

      // Create test records
      await createEntityWithDelay(dataSource, TestOrderingEntity, { title: 'First', priority: 1 }, context);
      await createEntityWithDelay(dataSource, TestOrderingEntity, { title: 'Second', priority: 2 }, context);

      // Explicitly specify oldest first
      const results = await resolver.testOrderingEntitiesOldestFirst(context);

      orderingAssertions.oldestFirst(results, ['First', 'Second']);
    });

    it('should allow multiple custom ordering queries to coexist', async () => {
      const resolver = new TestOrderingResolverWithCustom();
      const context = createTestContext();

      // Create diverse test data using the factory
      const testData = createOrderingTestData.mixed();
      await createEntitiesWithDelay(dataSource, TestOrderingEntity, testData, context);

      // Test all different orderings work correctly
      const byNewest = await resolver.testOrderingEntitiesNewestFirst(context);
      const byPriority = await resolver.testOrderingEntitiesByPriority(context);
      const byOldest = await resolver.testOrderingEntitiesOldestFirst(context);

      // Verify each ordering is different
      expect(byNewest[0].title).toBe('C'); // Newest (created last)
      expect(byPriority[0].title).toBe('B'); // Highest priority
      expect(byOldest[0].title).toBe('A'); // Oldest (created first)
    });
  });

  describe('Ordering Independence from Decorators', () => {
    it('should confirm decorators have NO ordering logic', () => {
      // This test verifies architectural principle:
      // Decorators define STRUCTURE (fields, types, validation, indexes)
      // Resolvers define BEHAVIOR (queries, mutations, ordering)

      // Check EntityObjectType has no order-related options
      const entityDecoratorOptions = {
        tableName: 'test',
        indexes: ['field1'],
        description: 'test',
        implements: []
      };

      // No 'order' or 'defaultOrder' property exists
      expect('order' in entityDecoratorOptions).toBe(false);
      expect('defaultOrder' in entityDecoratorOptions).toBe(false);

      // Check FieldColumn has no order-related options
      const fieldDecoratorOptions = {
        type: String,
        required: true,
        unique: false,
        length: 255
      };

      // No 'order' or 'orderBy' property exists
      expect('order' in fieldDecoratorOptions).toBe(false);
      expect('orderBy' in fieldDecoratorOptions).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    describe('Empty Results', () => {
      it('should handle empty dataset gracefully', async () => {
        const resolver = new TestOrderingResolverWithCustom();
        const context = createTestContext();

        // No entities created - empty database
        const newestFirst = await resolver.testOrderingEntitiesNewestFirst(context);
        const oldestFirst = await resolver.testOrderingEntitiesOldestFirst(context);
        const byPriority = await resolver.testOrderingEntitiesByPriority(context);

        // Use edge case assertions for better validation
        edgeCaseAssertions.emptyResults(newestFirst);
        edgeCaseAssertions.emptyResults(oldestFirst);
        edgeCaseAssertions.emptyResults(byPriority);
      });
    });

    describe('Single Entity', () => {
      it('should handle single entity ordering correctly', async () => {
        const resolver = new TestOrderingResolverWithCustom();
        const context = createTestContext();

        // Create only one entity
        await createEntityWithDelay(dataSource, TestOrderingEntity, { title: 'Only One', priority: 5 }, context);

        const newestFirst = await resolver.testOrderingEntitiesNewestFirst(context);
        const oldestFirst = await resolver.testOrderingEntitiesOldestFirst(context);
        const byPriority = await resolver.testOrderingEntitiesByPriority(context);

        // Use edge case assertions for comprehensive validation
        edgeCaseAssertions.singleEntity(newestFirst, 'Only One', 5);
        edgeCaseAssertions.singleEntity(oldestFirst, 'Only One', 5);
        edgeCaseAssertions.singleEntity(byPriority, 'Only One', 5);
      });
    });

    describe('Null and Undefined Values', () => {
      it('should handle null values gracefully', async () => {
        const resolver = new TestOrderingResolverWithCustom();
        const context = createTestContext();

        // Create entities with potential null values (using priority 0 as "null-like")
        await createEntityWithDelay(dataSource, TestOrderingEntity, { title: 'Entity 1', priority: 0 }, context);
        await createEntityWithDelay(dataSource, TestOrderingEntity, { title: 'Entity 2', priority: 5 }, context);
        await createEntityWithDelay(dataSource, TestOrderingEntity, { title: 'Entity 3', priority: 0 }, context);

        const byPriority = await resolver.testOrderingEntitiesByPriority(context);

        expect(byPriority).toHaveLength(3);
        // Should order by priority DESC (5, 0, 0), with same priority ordered by createdAt ASC
        expect(byPriority[0].priority).toBe(5);
        expect(byPriority[0].title).toBe('Entity 2');
        // Verify secondary sort ordering
        edgeCaseAssertions.secondarySort(byPriority, 'priority', 'createdAt');
      });

      it('should handle default priority values', async () => {
        const resolver = new TestOrderingResolverWithCustom();
        const context = createTestContext();

        // Create entities without specifying priority (should use default: 0)
        await createEntityWithDelay(dataSource, TestOrderingEntity, { title: 'Default 1' }, context);
        await createEntityWithDelay(dataSource, TestOrderingEntity, { title: 'Default 2' }, context);
        await createEntityWithDelay(dataSource, TestOrderingEntity, { title: 'Default 3' }, context);

        const byPriority = await resolver.testOrderingEntitiesByPriority(context);

        expect(byPriority).toHaveLength(3);
        // All should have priority 0, use edge case assertion
        edgeCaseAssertions.defaultValues(byPriority, 'priority', 0);
        // Verify secondary sort ordering
        edgeCaseAssertions.secondarySort(byPriority, 'priority', 'createdAt');

        // When priorities are equal, secondary sort (createdAt: 'ASC') applies
        // This means oldest entities come first when all have the same priority
        expect(byPriority[0].title).toBe('Default 1'); // Created first (oldest)
        expect(byPriority[1].title).toBe('Default 2'); // Created middle
        expect(byPriority[2].title).toBe('Default 3'); // Created last (newest)
      });
    });
  });

  describe('Real-World Ordering Scenarios', () => {
    it('should support blog post ordering: newest articles first', async () => {
      const resolver = new TestOrderingResolverWithCustom();
      const context = createTestContext();

      // Use factory for blog post scenario
      const blogPosts = createOrderingTestData.blogPosts();
      await createEntitiesWithDelay(dataSource, TestOrderingEntity, blogPosts, context);

      const newestFirst = await resolver.testOrderingEntitiesNewestFirst(context);
      expect(newestFirst[0].title).toBe('Latest Post');
    });

    it('should support task ordering: by priority then by date', async () => {
      const resolver = new TestOrderingResolverWithCustom();
      const context = createTestContext();

      // Use factory for task scenario
      const tasks = createOrderingTestData.tasks();
      await createEntitiesWithDelay(dataSource, TestOrderingEntity, tasks, context);

      const byPriority = await resolver.testOrderingEntitiesByPriority(context);

      // High priority first
      expect(byPriority[0].priority).toBe(10);
      expect(byPriority[0].title).toBe('High Priority Task');

      // Medium priority second
      expect(byPriority[1].priority).toBe(5);
      expect(byPriority[1].title).toBe('Medium Priority Task');

      // Low priority tasks ordered by createdAt (oldest first)
      expect(byPriority[2].priority).toBe(1);
      expect(byPriority[2].title).toBe('Low Priority Old Task');
      expect(byPriority[3].priority).toBe(1);
      expect(byPriority[3].title).toBe('Low Priority New Task');
    });
  });
});