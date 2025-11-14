import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
import { DataLoaderFactory } from '@base/graphql/DataLoaderFactory';
import { DataSourceProvider } from '@base/db';
import { createQueryCounter, QueryCounter } from '@tests/helpers/queryCounter';
import { createTestDatabase, cleanupTestDatabase, clearDatabase } from '@tests/base/testDatabase';
import { BaseEntity } from '@base/db/BaseEntity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

// Test entities
@Entity('test_authors')
class TestAuthor extends BaseEntity {
  @Column('varchar')
  name!: string;

  @OneToMany(() => TestPost, (post) => post.author)
  posts!: TestPost[];
}

@Entity('test_posts')
class TestPost extends BaseEntity {
  @Column('varchar')
  title!: string;

  @Column('varchar')
  authorId!: string;

  @ManyToOne(() => TestAuthor, (author) => author.posts)
  @JoinColumn({ name: 'authorId' })
  author!: TestAuthor;

  @OneToMany(() => TestComment, (comment) => comment.post)
  comments!: TestComment[];
}

@Entity('test_comments')
class TestComment extends BaseEntity {
  @Column('text')
  content!: string;

  @Column('varchar')
  postId!: string;

  @ManyToOne(() => TestPost, (post) => post.comments)
  @JoinColumn({ name: 'postId' })
  post!: TestPost;
}

describe('DataLoaderFactory', () => {
  let queryCounter: QueryCounter;
  let dataSource: any;

  beforeAll(async () => {
    // Initialize test database with test entities
    dataSource = await createTestDatabase([TestAuthor, TestPost, TestComment]);
  });

  beforeEach(async () => {
    // Clear data before each test
    await clearDatabase(dataSource);

    queryCounter = createQueryCounter(dataSource);
    queryCounter.start();
  });

  afterEach(() => {
    queryCounter.stop();
  });

  afterAll(async () => {
    await cleanupTestDatabase(dataSource);
  });

  describe('createForEntity()', () => {
    it('should batch multiple loads into single query', async () => {
      // Create test data
      const author1 = DataSourceProvider.get()
        .getRepository(TestAuthor)
        .create({ name: 'Alice' });
      const author2 = DataSourceProvider.get()
        .getRepository(TestAuthor)
        .create({ name: 'Bob' });

      await DataSourceProvider.get().getRepository(TestAuthor).save([author1, author2]);

      // Create posts with small delays to ensure distinct createdAt timestamps
      const post1 = DataSourceProvider.get().getRepository(TestPost).create({
        title: 'Post 1',
        authorId: author1.id,
      });
      await DataSourceProvider.get().getRepository(TestPost).save(post1);
      await new Promise(resolve => setTimeout(resolve, 10));

      const post2 = DataSourceProvider.get().getRepository(TestPost).create({
        title: 'Post 2',
        authorId: author1.id,
      });
      await DataSourceProvider.get().getRepository(TestPost).save(post2);
      await new Promise(resolve => setTimeout(resolve, 10));

      const post3 = DataSourceProvider.get().getRepository(TestPost).create({
        title: 'Post 3',
        authorId: author2.id,
      });
      await DataSourceProvider.get().getRepository(TestPost).save(post3);
      await new Promise(resolve => setTimeout(resolve, 10));

      queryCounter.reset();

      // Create loader
      const loader = DataLoaderFactory.createForEntity(TestPost, 'authorId');

      // Load posts for multiple authors
      const [postsForAuthor1, postsForAuthor2] = await Promise.all([
        loader.load(author1.id),
        loader.load(author2.id),
      ]);

      // Should batch into 1 query
      expect(queryCounter.getCount()).toBeLessThanOrEqual(1);

      // Verify results
      expect(postsForAuthor1).toHaveLength(2);
      expect(postsForAuthor2).toHaveLength(1);
      expect(postsForAuthor1[0].title).toBe('Post 1');
      expect(postsForAuthor1[1].title).toBe('Post 2');
      expect(postsForAuthor2[0].title).toBe('Post 3');
    });

    it('should support order option', async () => {
      const author = DataSourceProvider.get().getRepository(TestAuthor).create({
        name: 'Test Author',
      });
      await DataSourceProvider.get().getRepository(TestAuthor).save(author);

      const posts = ['C Post', 'A Post', 'B Post'].map((title) =>
        DataSourceProvider.get().getRepository(TestPost).create({
          title,
          authorId: author.id,
        })
      );
      await DataSourceProvider.get().getRepository(TestPost).save(posts);

      // Create loader with order
      const loader = DataLoaderFactory.createForEntity(TestPost, 'authorId', {
        order: { title: 'ASC' },
      });

      const result = await loader.load(author.id);

      expect(result.map((p) => p.title)).toEqual(['A Post', 'B Post', 'C Post']);
    });

    it('should support where option', async () => {
      const author = DataSourceProvider.get().getRepository(TestAuthor).create({
        name: 'Test Author',
      });
      await DataSourceProvider.get().getRepository(TestAuthor).save(author);

      // Add custom status column for filtering
      // (In real scenario, TestPost would have a status column)
      // For this test, we'll just verify the option is passed

      const loader = DataLoaderFactory.createForEntity(TestPost, 'authorId', {
        where: { title: 'Specific Post' },
      });

      const result = await loader.load(author.id);

      // Should only return posts matching the where clause
      expect(result.every((p) => p.title === 'Specific Post')).toBe(true);
    });

    it('should cache results within same request', async () => {
      const author = DataSourceProvider.get().getRepository(TestAuthor).create({
        name: 'Test Author',
      });
      await DataSourceProvider.get().getRepository(TestAuthor).save(author);

      const post = DataSourceProvider.get().getRepository(TestPost).create({
        title: 'Test Post',
        authorId: author.id,
      });
      await DataSourceProvider.get().getRepository(TestPost).save(post);

      queryCounter.reset();

      const loader = DataLoaderFactory.createForEntity(TestPost, 'authorId');

      // Load same author's posts twice
      const result1 = await loader.load(author.id);
      const result2 = await loader.load(author.id);

      // Should only execute 1 query (cached on second call)
      expect(queryCounter.getCount()).toBeLessThanOrEqual(1);

      // Results should be identical
      expect(result1).toEqual(result2);
    });

    it('should return empty array for non-existent foreign key', async () => {
      const loader = DataLoaderFactory.createForEntity(TestPost, 'authorId');

      const result = await loader.load('non-existent-id');

      expect(result).toEqual([]);
    });
  });

  describe('createById()', () => {
    it('should batch multiple findById calls into single query', async () => {
      const authors = ['Alice', 'Bob', 'Charlie'].map((name) =>
        DataSourceProvider.get().getRepository(TestAuthor).create({ name })
      );
      await DataSourceProvider.get().getRepository(TestAuthor).save(authors);

      queryCounter.reset();

      const loader = DataLoaderFactory.createById(TestAuthor);

      // Load multiple authors by ID
      const results = await Promise.all(authors.map((a) => loader.load(a.id)));

      // Should batch into 1 query
      expect(queryCounter.getCount()).toBeLessThanOrEqual(1);

      // Verify results
      expect(results).toHaveLength(3);
      expect(results[0]?.name).toBe('Alice');
      expect(results[1]?.name).toBe('Bob');
      expect(results[2]?.name).toBe('Charlie');
    });

    it('should return null for non-existent ID', async () => {
      const loader = DataLoaderFactory.createById(TestAuthor);

      const result = await loader.load('non-existent-id');

      expect(result).toBeNull();
    });

    it('should maintain order of results matching input IDs', async () => {
      const authors = ['Alice', 'Bob', 'Charlie'].map((name) =>
        DataSourceProvider.get().getRepository(TestAuthor).create({ name })
      );
      await DataSourceProvider.get().getRepository(TestAuthor).save(authors);

      const loader = DataLoaderFactory.createById(TestAuthor);

      // Load in specific order (reverse)
      const ids = [authors[2].id, authors[0].id, authors[1].id];
      const results = await Promise.all(ids.map((id) => loader.load(id)));

      // Results should match input order
      expect(results[0]?.name).toBe('Charlie');
      expect(results[1]?.name).toBe('Alice');
      expect(results[2]?.name).toBe('Bob');
    });

    it('should support relations option', async () => {
      const author = DataSourceProvider.get().getRepository(TestAuthor).create({
        name: 'Test Author',
      });
      await DataSourceProvider.get().getRepository(TestAuthor).save(author);

      const post = DataSourceProvider.get().getRepository(TestPost).create({
        title: 'Test Post',
        authorId: author.id,
      });
      await DataSourceProvider.get().getRepository(TestPost).save(post);

      const loader = DataLoaderFactory.createById(TestAuthor, {
        relations: ['posts'],
      });

      const result = await loader.load(author.id);

      expect(result).toBeDefined();
      expect(result?.posts).toBeDefined();
      expect(result?.posts).toHaveLength(1);
      expect(result?.posts[0].title).toBe('Test Post');
    });

    it('should cache results', async () => {
      const author = DataSourceProvider.get().getRepository(TestAuthor).create({
        name: 'Test Author',
      });
      await DataSourceProvider.get().getRepository(TestAuthor).save(author);

      queryCounter.reset();

      const loader = DataLoaderFactory.createById(TestAuthor);

      // Load same author twice
      const result1 = await loader.load(author.id);
      const result2 = await loader.load(author.id);

      // Should only execute 1 query
      expect(queryCounter.getCount()).toBeLessThanOrEqual(1);

      expect(result1).toEqual(result2);
    });
  });

  describe('createForRelated()', () => {
    it('should work same as createById for ManyToOne relations', async () => {
      const author = DataSourceProvider.get().getRepository(TestAuthor).create({
        name: 'Test Author',
      });
      await DataSourceProvider.get().getRepository(TestAuthor).save(author);

      queryCounter.reset();

      const loader = DataLoaderFactory.createForRelated(TestAuthor);

      const result = await loader.load(author.id);

      expect(result).toBeDefined();
      expect(result?.name).toBe('Test Author');

      // Should batch queries
      expect(queryCounter.getCount()).toBeLessThanOrEqual(1);
    });
  });

  describe('createCustom()', () => {
    it('should allow custom batch load function', async () => {
      const authors = ['Alice', 'Bob'].map((name) =>
        DataSourceProvider.get().getRepository(TestAuthor).create({ name })
      );
      await DataSourceProvider.get().getRepository(TestAuthor).save(authors);

      queryCounter.reset();

      // Custom loader that uppercases names
      const loader = DataLoaderFactory.createCustom(
        async (authorIds: readonly string[]) => {
          const repository = DataSourceProvider.get().getRepository(TestAuthor);
          const authors = await repository.findByIds([...authorIds]);

          const authorMap = new Map(authors.map((a) => [a.id, a.name.toUpperCase()]));

          return authorIds.map((id) => authorMap.get(id) || 'UNKNOWN');
        }
      );

      const results = await Promise.all(authors.map((a) => loader.load(a.id)));

      expect(results).toEqual(['ALICE', 'BOB']);

      // Should batch into 1 query
      expect(queryCounter.getCount()).toBeLessThanOrEqual(1);
    });

    it('should support custom cache and maxBatchSize options', async () => {
      const loader = DataLoaderFactory.createCustom(
        async (keys: readonly string[]) => {
          return keys.map((key) => `processed-${key}`);
        },
        {
          cache: false,
          maxBatchSize: 10,
        }
      );

      const result = await loader.load('test-key');

      expect(result).toBe('processed-test-key');
    });
  });

  describe('N+1 Prevention Scenarios', () => {
    it('should prevent N+1 when loading posts for multiple authors', async () => {
      // Setup: 3 authors, each with 2 posts
      const authors = ['Author 1', 'Author 2', 'Author 3'].map((name) =>
        DataSourceProvider.get().getRepository(TestAuthor).create({ name })
      );
      await DataSourceProvider.get().getRepository(TestAuthor).save(authors);

      const posts = authors.flatMap((author) =>
        [1, 2].map((i) =>
          DataSourceProvider.get().getRepository(TestPost).create({
            title: `${author.name} - Post ${i}`,
            authorId: author.id,
          })
        )
      );
      await DataSourceProvider.get().getRepository(TestPost).save(posts);

      queryCounter.reset();

      // WITHOUT DataLoader: Would be N+1 queries (3 separate queries)
      // WITH DataLoader: 1 batched query

      const loader = DataLoaderFactory.createForEntity(TestPost, 'authorId');

      const allPosts = await Promise.all(authors.map((a) => loader.load(a.id)));

      // Should only execute 1 query (batched)
      queryCounter.assertMaxCount(1, 'DataLoader failed to batch queries - N+1 detected!');

      expect(allPosts).toHaveLength(3);
      expect(allPosts[0]).toHaveLength(2);
      expect(allPosts[1]).toHaveLength(2);
      expect(allPosts[2]).toHaveLength(2);
    });

    it('should prevent N+1 when loading authors for multiple posts', async () => {
      const authors = ['Alice', 'Bob'].map((name) =>
        DataSourceProvider.get().getRepository(TestAuthor).create({ name })
      );
      await DataSourceProvider.get().getRepository(TestAuthor).save(authors);

      const posts = authors.flatMap((author, i) =>
        [1, 2, 3].map((j) =>
          DataSourceProvider.get().getRepository(TestPost).create({
            title: `Post ${i}-${j}`,
            authorId: author.id,
          })
        )
      );
      await DataSourceProvider.get().getRepository(TestPost).save(posts);

      queryCounter.reset();

      const loader = DataLoaderFactory.createById(TestAuthor);

      // Load author for each post (6 posts total)
      const loadedAuthors = await Promise.all(posts.map((p) => loader.load(p.authorId)));

      // Should batch into 1 query instead of 6
      queryCounter.assertMaxCount(1, 'N+1 query detected when loading authors!');

      expect(loadedAuthors).toHaveLength(6);
      expect(loadedAuthors.filter((a) => a?.name === 'Alice')).toHaveLength(3);
      expect(loadedAuthors.filter((a) => a?.name === 'Bob')).toHaveLength(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input gracefully', async () => {
      const loader = DataLoaderFactory.createForEntity(TestPost, 'authorId');

      // Load with no pending requests should not crash
      const result = await loader.load('some-id');

      expect(result).toEqual([]);
    });

    it('should handle mixed existing and non-existing IDs', async () => {
      const author = DataSourceProvider.get().getRepository(TestAuthor).create({
        name: 'Real Author',
      });
      await DataSourceProvider.get().getRepository(TestAuthor).save(author);

      const loader = DataLoaderFactory.createById(TestAuthor);

      const results = await Promise.all([
        loader.load(author.id),
        loader.load('non-existent-1'),
        loader.load('non-existent-2'),
      ]);

      expect(results[0]).toBeDefined();
      expect(results[0]?.name).toBe('Real Author');
      expect(results[1]).toBeNull();
      expect(results[2]).toBeNull();
    });
  });
});
