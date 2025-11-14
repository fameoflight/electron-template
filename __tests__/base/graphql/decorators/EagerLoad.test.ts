import { describe, it, expect, beforeAll } from 'vitest';
import 'reflect-metadata';
import {
  EagerLoad,
  getEagerLoadRelations,
  getEagerLoadConfig,
  shouldEagerLoad,
} from '@base/graphql/decorators/EagerLoad';
import { OneToMany } from 'typeorm';

// Test entities
class TestPost {
  @EagerLoad()
  @OneToMany(() => TestComment, (comment) => comment.post)
  comments!: TestComment[];

  @EagerLoad({ operations: ['show'] })
  @OneToMany(() => TestLike, (like) => like.post)
  likes!: TestLike[];

  @EagerLoad({
    operations: ['show', 'list'],
    where: { isPublished: true },
    order: { createdAt: 'DESC' },
  })
  @OneToMany(() => TestTag, (tag) => tag.post)
  tags!: TestTag[];

  @EagerLoad({ depth: 2, path: 'comments.author' })
  @OneToMany(() => TestComment, (comment) => comment.post)
  commentsWithAuthor!: TestComment[];
}

class TestComment {
  post!: TestPost;
  author!: TestUser;
}

class TestLike {
  post!: TestPost;
}

class TestTag {
  post!: TestPost;
}

class TestUser {
  // No eager loads
}

describe('@EagerLoad Decorator', () => {
  describe('Basic Functionality', () => {
    it('should store eager load metadata on entity class', () => {
      const config = getEagerLoadConfig(TestPost, 'comments');

      expect(config).toBeDefined();
      expect(config?.operations).toEqual(['show', 'list']);
      expect(config?.depth).toBe(1);
      expect(config?.path).toBe('comments');
    });

    it('should use default operations when not specified', () => {
      const config = getEagerLoadConfig(TestPost, 'comments');

      expect(config?.operations).toEqual(['show', 'list']);
    });

    it('should respect custom operations', () => {
      const config = getEagerLoadConfig(TestPost, 'likes');

      expect(config?.operations).toEqual(['show']);
    });

    it('should store where and order options', () => {
      const config = getEagerLoadConfig(TestPost, 'tags');

      expect(config?.where).toEqual({ isPublished: true });
      expect(config?.order).toEqual({ createdAt: 'DESC' });
    });

    it('should support custom paths for nested relations', () => {
      const config = getEagerLoadConfig(TestPost, 'commentsWithAuthor');

      expect(config?.path).toBe('comments.author');
      expect(config?.depth).toBe(2);
    });
  });

  describe('getEagerLoadRelations()', () => {
    it('should return all relations for "show" operation', () => {
      const relations = getEagerLoadRelations(TestPost, 'show');

      expect(relations).toContain('comments');
      expect(relations).toContain('likes');
      expect(relations).toContain('tags');
      expect(relations).toContain('comments.author');
      expect(relations).toHaveLength(4);
    });

    it('should return only list-enabled relations for "list" operation', () => {
      const relations = getEagerLoadRelations(TestPost, 'list');

      expect(relations).toContain('comments');
      expect(relations).toContain('tags');
      expect(relations).toContain('comments.author');
      expect(relations).not.toContain('likes'); // Only for 'show'
      expect(relations).toHaveLength(3);
    });

    it('should return empty array for operation with no eager loads', () => {
      const relations = getEagerLoadRelations(TestPost, 'array');

      expect(relations).toEqual([]);
    });

    it('should return empty array for entity with no eager loads', () => {
      const relations = getEagerLoadRelations(TestUser, 'show');

      expect(relations).toEqual([]);
    });
  });

  describe('shouldEagerLoad()', () => {
    it('should return true when operation is enabled', () => {
      expect(shouldEagerLoad(TestPost, 'comments', 'show')).toBe(true);
      expect(shouldEagerLoad(TestPost, 'comments', 'list')).toBe(true);
    });

    it('should return false when operation is not enabled', () => {
      expect(shouldEagerLoad(TestPost, 'likes', 'list')).toBe(false);
      expect(shouldEagerLoad(TestPost, 'likes', 'array')).toBe(false);
    });

    it('should return false for non-existent relation', () => {
      expect(shouldEagerLoad(TestPost, 'nonExistent', 'show')).toBe(false);
    });

    it('should return false for entity without eager loads', () => {
      expect(shouldEagerLoad(TestUser, 'posts', 'show')).toBe(false);
    });
  });

  describe('Multiple Eager Loads on Same Entity', () => {
    it('should handle multiple relations with different configurations', () => {
      const commentsConfig = getEagerLoadConfig(TestPost, 'comments');
      const likesConfig = getEagerLoadConfig(TestPost, 'likes');
      const tagsConfig = getEagerLoadConfig(TestPost, 'tags');

      expect(commentsConfig?.operations).toEqual(['show', 'list']);
      expect(likesConfig?.operations).toEqual(['show']);
      expect(tagsConfig?.operations).toEqual(['show', 'list']);

      expect(tagsConfig?.where).toBeDefined();
      expect(tagsConfig?.order).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should return undefined for non-decorated property', () => {
      const config = getEagerLoadConfig(TestPost, 'nonExistent');

      expect(config).toBeUndefined();
    });

    it('should handle entity without any decorators', () => {
      const relations = getEagerLoadRelations(TestUser, 'show');

      expect(relations).toEqual([]);
      expect(getEagerLoadConfig(TestUser, 'anything')).toBeUndefined();
    });
  });
});

describe('@EagerLoad Options', () => {
  describe('operations option', () => {
    class TestEntity1 {
      @EagerLoad({ operations: ['show'] })
      relation1!: any[];

      @EagerLoad({ operations: ['list', 'array'] })
      relation2!: any[];

      @EagerLoad({ operations: ['show', 'list', 'array'] })
      relation3!: any[];
    }

    it('should filter by show operation', () => {
      const relations = getEagerLoadRelations(TestEntity1, 'show');
      expect(relations).toContain('relation1');
      expect(relations).toContain('relation3');
      expect(relations).not.toContain('relation2');
    });

    it('should filter by list operation', () => {
      const relations = getEagerLoadRelations(TestEntity1, 'list');
      expect(relations).toContain('relation2');
      expect(relations).toContain('relation3');
      expect(relations).not.toContain('relation1');
    });

    it('should filter by array operation', () => {
      const relations = getEagerLoadRelations(TestEntity1, 'array');
      expect(relations).toContain('relation2');
      expect(relations).toContain('relation3');
      expect(relations).not.toContain('relation1');
    });
  });

  describe('depth option', () => {
    class TestEntity2 {
      @EagerLoad({ depth: 1 })
      shallow!: any[];

      @EagerLoad({ depth: 3 })
      deep!: any[];
    }

    it('should store depth value', () => {
      const shallowConfig = getEagerLoadConfig(TestEntity2, 'shallow');
      const deepConfig = getEagerLoadConfig(TestEntity2, 'deep');

      expect(shallowConfig?.depth).toBe(1);
      expect(deepConfig?.depth).toBe(3);
    });
  });

  describe('path option', () => {
    class TestEntity3 {
      @EagerLoad({ path: 'custom.nested.path' })
      customPath!: any[];
    }

    it('should use custom path instead of property name', () => {
      const relations = getEagerLoadRelations(TestEntity3, 'show');

      expect(relations).toContain('custom.nested.path');
      expect(relations).not.toContain('customPath');
    });
  });

  describe('where option', () => {
    class TestEntity4 {
      @EagerLoad({ where: { status: 'active', deleted: false } })
      filteredRelation!: any[];
    }

    it('should store where clause', () => {
      const config = getEagerLoadConfig(TestEntity4, 'filteredRelation');

      expect(config?.where).toEqual({
        status: 'active',
        deleted: false,
      });
    });
  });

  describe('order option', () => {
    class TestEntity5 {
      @EagerLoad({ order: { createdAt: 'DESC', priority: 'ASC' } })
      orderedRelation!: any[];
    }

    it('should store order clause', () => {
      const config = getEagerLoadConfig(TestEntity5, 'orderedRelation');

      expect(config?.order).toEqual({
        createdAt: 'DESC',
        priority: 'ASC',
      });
    });
  });

  describe('combined options', () => {
    class TestEntity6 {
      @EagerLoad({
        operations: ['show'],
        depth: 2,
        path: 'messages.versions',
        where: { isCurrent: true },
        order: { version: 'DESC' },
      })
      complexRelation!: any[];
    }

    it('should handle all options together', () => {
      const config = getEagerLoadConfig(TestEntity6, 'complexRelation');

      expect(config?.operations).toEqual(['show']);
      expect(config?.depth).toBe(2);
      expect(config?.path).toBe('messages.versions');
      expect(config?.where).toEqual({ isCurrent: true });
      expect(config?.order).toEqual({ version: 'DESC' });
    });

    it('should include complex relation only for show operation', () => {
      const showRelations = getEagerLoadRelations(TestEntity6, 'show');
      const listRelations = getEagerLoadRelations(TestEntity6, 'list');

      expect(showRelations).toContain('messages.versions');
      expect(listRelations).not.toContain('messages.versions');
    });
  });
});
