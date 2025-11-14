import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
import { Resolver, FieldResolver, Root, Ctx, Query } from 'type-graphql';
import { BaseResolver } from '@base/graphql';
import { DataSourceProvider } from '@base/db';
import { createQueryCounter, QueryCounter } from '@tests/helpers/queryCounter';
import { createTestDatabase, cleanupTestDatabase, clearDatabase } from '@tests/base/testDatabase';
import type { GraphQLContext } from '@shared/types';
import { BaseEntity } from '@base/db/BaseEntity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  EntityTarget,
} from 'typeorm';

// Test entities
@Entity('test_blogs')
class TestBlog extends BaseEntity {
  @Column('varchar')
  title!: string;

  @OneToMany(() => TestArticle, (article) => article.blog)
  articles!: TestArticle[];
}

@Entity('test_articles')
class TestArticle extends BaseEntity {
  @Column('varchar')
  title!: string;

  @Column('varchar')
  blogId!: string;

  @ManyToOne(() => TestBlog, (blog) => blog.articles)
  @JoinColumn({ name: 'blogId' })
  blog!: TestBlog;

  @OneToMany(() => TestReview, (review) => review.article)
  reviews!: TestReview[];
}

@Entity('test_reviews')
class TestReview extends BaseEntity {
  @Column('integer')
  rating!: number;

  @Column('varchar')
  articleId!: string;

  @ManyToOne(() => TestArticle, (article) => article.reviews)
  @JoinColumn({ name: 'articleId' })
  article!: TestArticle;
}

// Test resolver using BaseResolver helpers
@Resolver(() => TestBlog)
class TestBlogResolver extends BaseResolver {
  @FieldResolver(() => [TestArticle])
  async articles(
    @Root() blog: TestBlog,
    @Ctx() ctx: GraphQLContext
  ): Promise<TestArticle[]> {
    return this.loadRelated(ctx, blog.id, TestArticle, 'blogId', {
      order: { title: 'ASC' },
    });
  }
}

@Resolver(() => TestArticle)
class TestArticleResolver extends BaseResolver {
  @FieldResolver(() => TestBlog)
  async blog(
    @Root() article: TestArticle,
    @Ctx() ctx: GraphQLContext
  ): Promise<TestBlog | null> {
    return this.loadById(ctx, article.blogId, TestBlog);
  }

  @FieldResolver(() => [TestReview])
  async reviews(
    @Root() article: TestArticle,
    @Ctx() ctx: GraphQLContext
  ): Promise<TestReview[]> {
    return this.loadRelated(ctx, article.id, TestReview, 'articleId', {
      order: { rating: 'DESC' },
    });
  }
}

// Test-specific resolvers that expose protected methods for testing
class TestableBlogResolver extends TestBlogResolver {
  // Expose protected methods as public for testing
  public testLoadRelated<T extends { id: string }>(
    ctx: GraphQLContext,
    parentId: string,
    entityClass: EntityTarget<T>,
    foreignKey: keyof T,
    options?: {
      relations?: string[];
      order?: Record<string, 'ASC' | 'DESC'>;
      where?: Record<string, any>;
    }
  ): Promise<T[]> {
    return this.loadRelated(ctx, parentId, entityClass, foreignKey, options);
  }

  public testGetOrCreateLoader<T extends { id: string }>(
    ctx: GraphQLContext,
    entityClass: EntityTarget<T>,
    foreignKey: keyof T,
    loaderKey: string,
    options?: {
      relations?: string[];
      order?: Record<string, 'ASC' | 'DESC'>;
      where?: Record<string, any>;
    }
  ) {
    return this.getOrCreateLoader(ctx, entityClass, foreignKey, loaderKey, options);
  }
}

class TestableArticleResolver extends TestArticleResolver {
  // Expose protected methods as public for testing
  public testLoadRelated<T extends { id: string }>(
    ctx: GraphQLContext,
    parentId: string,
    entityClass: EntityTarget<T>,
    foreignKey: keyof T,
    options?: {
      relations?: string[];
      order?: Record<string, 'ASC' | 'DESC'>;
      where?: Record<string, any>;
    }
  ): Promise<T[]> {
    return this.loadRelated(ctx, parentId, entityClass, foreignKey, options);
  }

  public testLoadById<T extends { id: string }>(
    ctx: GraphQLContext,
    id: string,
    entityClass: EntityTarget<T>,
    options?: {
      relations?: string[];
    }
  ): Promise<T | null> {
    return this.loadById(ctx, id, entityClass, options);
  }

  public testGetOrCreateLoader<T extends { id: string }>(
    ctx: GraphQLContext,
    entityClass: EntityTarget<T>,
    foreignKey: keyof T,
    loaderKey: string,
    options?: {
      relations?: string[];
      order?: Record<string, 'ASC' | 'DESC'>;
      where?: Record<string, any>;
    }
  ) {
    return this.getOrCreateLoader(ctx, entityClass, foreignKey, loaderKey, options);
  }
}

describe('BaseResolver DataLoader Helpers', () => {
  let queryCounter: QueryCounter;
  let ctx: GraphQLContext;
  let dataSource: any;

  beforeAll(async () => {
    // Initialize test database with test entities
    dataSource = await createTestDatabase([TestBlog, TestArticle, TestReview]);
  });

  beforeEach(async () => {
    // Clear data before each test
    await clearDatabase(dataSource);

    queryCounter = createQueryCounter(dataSource);
    queryCounter.start();

    // Create fresh context for each test
    ctx = { loaders: {}, user: null };
  });

  afterEach(() => {
    queryCounter.stop();
  });

  afterAll(async () => {
    await cleanupTestDatabase(dataSource);
  });

  describe('loadRelated()', () => {
    it('should load related entities using DataLoader', async () => {
      const blog = DataSourceProvider.get().getRepository(TestBlog).create({
        title: 'Tech Blog',
      });
      await DataSourceProvider.get().getRepository(TestBlog).save(blog);

      const articles = ['Article 1', 'Article 2'];
      const createdArticles = [];

      for (const title of articles) {
        const article = DataSourceProvider.get().getRepository(TestArticle).create({
          title,
          blogId: blog.id,
        });
        const savedArticle = await DataSourceProvider.get().getRepository(TestArticle).save(article);
        createdArticles.push(savedArticle);

        // Small delay to ensure distinct createdAt timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      queryCounter.reset();

      const resolver = new TestableBlogResolver();
      const result = await resolver.testLoadRelated(ctx, blog.id, TestArticle, 'blogId');

      // Should execute 1 query
      queryCounter.assertMaxCount(1);

      expect(result).toHaveLength(2);
      expect(result.map((a) => a.title)).toEqual(['Article 1', 'Article 2']);
    });

    it('should batch multiple loadRelated calls', async () => {
      const blogs = ['Blog 1', 'Blog 2', 'Blog 3'].map((title) =>
        DataSourceProvider.get().getRepository(TestBlog).create({ title })
      );
      await DataSourceProvider.get().getRepository(TestBlog).save(blogs);

      const articles = blogs.flatMap((blog) =>
        [1, 2].map((i) =>
          DataSourceProvider.get().getRepository(TestArticle).create({
            title: `${blog.title} - Article ${i}`,
            blogId: blog.id,
          })
        )
      );
      await DataSourceProvider.get().getRepository(TestArticle).save(articles);

      queryCounter.reset();

      const resolver = new TestableBlogResolver();

      // Load articles for all 3 blogs
      const results = await Promise.all(
        blogs.map((blog) => resolver.testLoadRelated(ctx, blog.id, TestArticle, 'blogId'))
      );

      // Should batch into 1 query instead of 3 (N+1 prevention!)
      queryCounter.assertMaxCount(1, 'N+1 detected in loadRelated!');

      expect(results).toHaveLength(3);
      expect(results[0]).toHaveLength(2);
      expect(results[1]).toHaveLength(2);
      expect(results[2]).toHaveLength(2);
    });

    it('should support order option', async () => {
      const blog = DataSourceProvider.get().getRepository(TestBlog).create({
        title: 'Test Blog',
      });
      await DataSourceProvider.get().getRepository(TestBlog).save(blog);

      const articles = ['C Article', 'A Article', 'B Article'].map((title) =>
        DataSourceProvider.get().getRepository(TestArticle).create({
          title,
          blogId: blog.id,
        })
      );
      await DataSourceProvider.get().getRepository(TestArticle).save(articles);

      const resolver = new TestableBlogResolver();
      const result = await resolver.testLoadRelated(ctx, blog.id, TestArticle, 'blogId', {
        order: { title: 'ASC' },
      });

      expect(result.map((a) => a.title)).toEqual(['A Article', 'B Article', 'C Article']);
    });

    it('should reuse loaders from context', async () => {
      const blog = DataSourceProvider.get().getRepository(TestBlog).create({
        title: 'Test Blog',
      });
      await DataSourceProvider.get().getRepository(TestBlog).save(blog);

      const article = DataSourceProvider.get().getRepository(TestArticle).create({
        title: 'Test Article',
        blogId: blog.id,
      });
      await DataSourceProvider.get().getRepository(TestArticle).save(article);

      queryCounter.reset();

      const resolver = new TestableBlogResolver();

      // Load twice - should reuse cached loader
      const result1 = await resolver.testLoadRelated(ctx, blog.id, TestArticle, 'blogId');
      const result2 = await resolver.testLoadRelated(ctx, blog.id, TestArticle, 'blogId');

      // Should only execute 1 query (second call uses cache)
      queryCounter.assertMaxCount(1);

      expect(result1).toEqual(result2);
    });
  });

  describe('loadById()', () => {
    it('should load entity by ID using DataLoader', async () => {
      const blog = DataSourceProvider.get().getRepository(TestBlog).create({
        title: 'Test Blog',
      });
      await DataSourceProvider.get().getRepository(TestBlog).save(blog);

      queryCounter.reset();

      const resolver = new TestableArticleResolver();
      const result = await resolver.testLoadById(ctx, blog.id, TestBlog);

      queryCounter.assertMaxCount(1);

      expect(result).toBeDefined();
      expect(result?.title).toBe('Test Blog');
    });

    it('should batch multiple loadById calls', async () => {
      const blogs = ['Blog 1', 'Blog 2', 'Blog 3'].map((title) =>
        DataSourceProvider.get().getRepository(TestBlog).create({ title })
      );
      await DataSourceProvider.get().getRepository(TestBlog).save(blogs);

      queryCounter.reset();

      const resolver = new TestableArticleResolver();

      // Load all 3 blogs by ID
      const results = await Promise.all(blogs.map((blog) => resolver.testLoadById(ctx, blog.id, TestBlog)));

      // Should batch into 1 query
      queryCounter.assertMaxCount(1, 'N+1 detected in loadById!');

      expect(results).toHaveLength(3);
      expect(results[0]?.title).toBe('Blog 1');
      expect(results[1]?.title).toBe('Blog 2');
      expect(results[2]?.title).toBe('Blog 3');
    });

    it('should return null for non-existent ID', async () => {
      const resolver = new TestableArticleResolver();
      const result = await resolver.testLoadById(ctx, 'non-existent-id', TestBlog);

      expect(result).toBeNull();
    });

    it('should reuse loaders from context', async () => {
      const blog = DataSourceProvider.get().getRepository(TestBlog).create({
        title: 'Test Blog',
      });
      await DataSourceProvider.get().getRepository(TestBlog).save(blog);

      queryCounter.reset();

      const resolver = new TestableArticleResolver();

      // Load twice
      const result1 = await resolver.testLoadById(ctx, blog.id, TestBlog);
      const result2 = await resolver.testLoadById(ctx, blog.id, TestBlog);

      // Should use cache
      queryCounter.assertMaxCount(1);

      expect(result1).toEqual(result2);
    });
  });

  describe('getOrCreateLoader()', () => {
    it('should create loader and cache it in context', async () => {
      const blog = DataSourceProvider.get().getRepository(TestBlog).create({
        title: 'Test Blog',
      });
      await DataSourceProvider.get().getRepository(TestBlog).save(blog);

      const resolver = new TestableBlogResolver();

      // Get loader
      const loader1 = resolver.testGetOrCreateLoader(
        ctx,
        TestArticle,
        'blogId',
        'articlesLoader'
      );

      // Get same loader again
      const loader2 = resolver.testGetOrCreateLoader(
        ctx,
        TestArticle,
        'blogId',
        'articlesLoader'
      );

      // Should be same instance
      expect(loader1).toBe(loader2);
      expect(ctx.loaders?.articlesLoader).toBe(loader1);
    });

    it('should create different loaders for different keys', async () => {
      const resolver = new TestableBlogResolver();

      const loader1 = resolver.testGetOrCreateLoader(
        ctx,
        TestArticle,
        'blogId',
        'loader1'
      );

      const loader2 = resolver.testGetOrCreateLoader(
        ctx,
        TestReview,
        'articleId',
        'loader2'
      );

      expect(loader1).not.toBe(loader2);
      expect(ctx.loaders?.loader1).toBe(loader1);
      expect(ctx.loaders?.loader2).toBe(loader2);
    });
  });

  describe('Field Resolver Integration', () => {
    it('should prevent N+1 in nested field resolvers', async () => {
      // Setup: 2 blogs, each with 2 articles, each with 2 reviews
      const blogs = ['Blog 1', 'Blog 2'].map((title) =>
        DataSourceProvider.get().getRepository(TestBlog).create({ title })
      );
      await DataSourceProvider.get().getRepository(TestBlog).save(blogs);

      const articles = blogs.flatMap((blog) =>
        [1, 2].map((i) =>
          DataSourceProvider.get().getRepository(TestArticle).create({
            title: `${blog.title} - Article ${i}`,
            blogId: blog.id,
          })
        )
      );
      await DataSourceProvider.get().getRepository(TestArticle).save(articles);

      const reviews = articles.flatMap((article) =>
        [5, 4].map((rating) =>
          DataSourceProvider.get().getRepository(TestReview).create({
            rating,
            articleId: article.id,
          })
        )
      );
      await DataSourceProvider.get().getRepository(TestReview).save(reviews);

      queryCounter.reset();

      // Simulate GraphQL query:
      // blogs {
      //   articles {
      //     reviews
      //   }
      // }

      const blogResolver = new TestBlogResolver();
      const articleResolver = new TestArticleResolver();

      // Load articles for all blogs
      const articlesPerBlog = await Promise.all(
        blogs.map((blog) => blogResolver.articles(blog, ctx))
      );

      // Load reviews for all articles
      const allArticles = articlesPerBlog.flat();
      const reviewsPerArticle = await Promise.all(
        allArticles.map((article) => articleResolver.reviews(article, ctx))
      );

      // Should execute:
      // 1. Batched articles query (1 query for 2 blogs)
      // 2. Batched reviews query (1 query for 4 articles)
      // Total: 2 queries instead of 1 + 2 + 4 = 7 (N+1+1 problem!)

      queryCounter.assertMaxCount(2, 'N+1 detected in nested field resolvers!');

      expect(reviewsPerArticle).toHaveLength(4);
      expect(reviewsPerArticle.every((reviews) => reviews.length === 2)).toBe(true);
    });

    it('should handle ManyToOne relations efficiently', async () => {
      const blogs = ['Blog A', 'Blog B'].map((title) =>
        DataSourceProvider.get().getRepository(TestBlog).create({ title })
      );
      await DataSourceProvider.get().getRepository(TestBlog).save(blogs);

      const articles = blogs.flatMap((blog) =>
        [1, 2, 3].map((i) =>
          DataSourceProvider.get().getRepository(TestArticle).create({
            title: `Article ${i}`,
            blogId: blog.id,
          })
        )
      );
      await DataSourceProvider.get().getRepository(TestArticle).save(articles);

      queryCounter.reset();

      // Simulate GraphQL query:
      // articles {
      //   blog
      // }

      const articleResolver = new TestArticleResolver();

      // Load blog for each article (6 articles total)
      const blogsForArticles = await Promise.all(
        articles.map((article) => articleResolver.blog(article, ctx))
      );

      // Should batch into 1 query instead of 6
      queryCounter.assertMaxCount(1, 'N+1 detected when loading parent entities!');

      expect(blogsForArticles).toHaveLength(6);
      expect(blogsForArticles.filter((b) => b?.title === 'Blog A')).toHaveLength(3);
      expect(blogsForArticles.filter((b) => b?.title === 'Blog B')).toHaveLength(3);
    });
  });

  describe('Context Isolation', () => {
    it('should isolate loaders between different contexts', async () => {
      const blog = DataSourceProvider.get().getRepository(TestBlog).create({
        title: 'Test Blog',
      });
      await DataSourceProvider.get().getRepository(TestBlog).save(blog);

      const ctx1: GraphQLContext = { loaders: {}, user: null };
      const ctx2: GraphQLContext = { loaders: {}, user: null };

      const resolver = new TestableBlogResolver();

      // Load in different contexts
      const loader1 = resolver.testGetOrCreateLoader(
        ctx1,
        TestArticle,
        'blogId',
        'articlesLoader'
      );

      const loader2 = resolver.testGetOrCreateLoader(
        ctx2,
        TestArticle,
        'blogId',
        'articlesLoader'
      );

      // Should be different instances
      expect(loader1).not.toBe(loader2);
      expect(ctx1.loaders?.articlesLoader).toBe(loader1);
      expect(ctx2.loaders?.articlesLoader).toBe(loader2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty results gracefully', async () => {
      const blog = DataSourceProvider.get().getRepository(TestBlog).create({
        title: 'Empty Blog',
      });
      await DataSourceProvider.get().getRepository(TestBlog).save(blog);

      const resolver = new TestableBlogResolver();
      const result = await resolver.testLoadRelated(ctx, blog.id, TestArticle, 'blogId');

      expect(result).toEqual([]);
    });

    it('should handle multiple entities with no relations', async () => {
      const blogs = ['Blog 1', 'Blog 2', 'Blog 3'].map((title) =>
        DataSourceProvider.get().getRepository(TestBlog).create({ title })
      );
      await DataSourceProvider.get().getRepository(TestBlog).save(blogs);

      queryCounter.reset();

      const resolver = new TestableBlogResolver();

      const results = await Promise.all(
        blogs.map((blog) => resolver.testLoadRelated(ctx, blog.id, TestArticle, 'blogId'))
      );

      // Should still batch efficiently
      queryCounter.assertMaxCount(1);

      expect(results.every((r) => r.length === 0)).toBe(true);
    });

    it('should handle context without loaders property', async () => {
      const ctxWithoutLoaders: GraphQLContext = { user: null }; // No loaders property

      const blog = DataSourceProvider.get().getRepository(TestBlog).create({
        title: 'Test Blog',
      });
      await DataSourceProvider.get().getRepository(TestBlog).save(blog);

      const resolver = new TestableBlogResolver();

      // Should initialize loaders automatically
      const result = await resolver.testLoadRelated(
        ctxWithoutLoaders,
        blog.id,
        TestArticle,
        'blogId'
      );

      expect(result).toBeDefined();
      expect(ctxWithoutLoaders.loaders).toBeDefined();
    });
  });
});
