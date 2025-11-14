/**
 * Array Options Validation Test
 *
 * Tests if FieldColumnJSON can handle the Chat.tags array options:
 * - maxLength: 10 (maximum 10 items)
 * - minLength: 1 (minimum 1 item)
 * - itemMaxLength: 25 (max 25 chars per item)
 * - uniqueItems: true (items must be unique)
 */

import { DataSource, Entity, Column } from 'typeorm';
import { ObjectType, Field } from 'type-graphql';
import { FieldColumnJSON } from '@main/base/graphql/decorators/fields/FieldColumnJSON';
import { z } from 'zod';
import { cleanupTestDatabase, createTestDatabase } from '../../__tests__/base/testDatabase';

// Create a schema that matches the real ChatTagsSchema exactly
const ChatTagsSchema = z.array(z.string().max(25)).min(1).max(10).describe('ChatTagsSchema: Array of strings');

// Test entity using FieldColumnJSON with proper validation
@Entity()
@ObjectType({ description: 'Array options validation test' })
class ArrayOptionsTest {

  @Field(() => String, { description: 'Entity ID' })
  @Column({ primary: true, type: 'varchar' })
  id!: string;

  @Field(() => String, { description: 'Entity title' })
  @Column({ type: 'varchar' })
  title!: string;

  // Using FieldColumnJSON with validation schema that includes array constraints
  @FieldColumnJSON(ChatTagsSchema, {
    required: false,
    description: 'Chat tags for organization with validation'
  })
  tags?: string[];

  constructor() {
    this.id = crypto.randomUUID();
  }
}

describe('Array Options Validation Test', () => {
  let dataSource: DataSource;
  let repository: any;

  beforeAll(async () => {
    dataSource = await createTestDatabase([ArrayOptionsTest]);
    repository = dataSource.getRepository(ArrayOptionsTest);
  });

  afterAll(async () => {
    if (dataSource) {
      await cleanupTestDatabase(dataSource);
    }
  });

  test('should save valid tags array', async () => {
    const entity = new ArrayOptionsTest();
    entity.title = 'Valid Tags Test';
    entity.tags = ['tag1', 'tag2', 'tag3'];

    const saved = await repository.save(entity);
    const found = await repository.findOne({ where: { id: saved.id } });

    expect(found?.tags).toEqual(['tag1', 'tag2', 'tag3']);
    expect(Array.isArray(found?.tags)).toBe(true);
  });

  test('should reject empty array (violates minLength)', async () => {
    const entity = new ArrayOptionsTest();
    entity.title = 'Empty Array Test';
    entity.tags = [];

    // Should throw validation error for empty array
    await expect(repository.save(entity)).rejects.toThrow('Validation failed');
  });

  test('should handle null/undefined tags', async () => {
    const entity1 = new ArrayOptionsTest();
    entity1.title = 'Null Tags Test';
    entity1.tags = undefined;

    const saved1 = await repository.save(entity1);
    const found1 = await repository.findOne({ where: { id: saved1.id } });

    expect(found1?.tags).toBeUndefined();

    const entity2 = new ArrayOptionsTest();
    entity2.title = 'Undefined Tags Test';
    // entity2.tags is undefined by default

    const saved2 = await repository.save(entity2);
    const found2 = await repository.findOne({ where: { id: saved2.id } });

    expect(found2?.tags).toBeNull();
  });

  test('should save maximum allowed tags (10 items)', async () => {
    const entity = new ArrayOptionsTest();
    entity.title = 'Max Tags Test';
    entity.tags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7', 'tag8', 'tag9', 'tag10'];

    const saved = await repository.save(entity);
    const found = await repository.findOne({ where: { id: saved.id } });

    expect(found?.tags).toHaveLength(10);
    expect(Array.isArray(found?.tags)).toBe(true);
  });

  test('should save tags with maximum item length (25 chars)', async () => {
    const longTag = 'a'.repeat(25); // 25 characters
    const entity = new ArrayOptionsTest();
    entity.title = 'Long Item Test';
    entity.tags = [longTag, 'normal'];

    const saved = await repository.save(entity);
    const found = await repository.findOne({ where: { id: saved.id } });

    expect(found?.tags).toContain(longTag);
    expect(found?.tags).toContain('normal');
    expect(Array.isArray(found?.tags)).toBe(true);
  });

  test('should maintain array structure through save/retrieve cycle', async () => {
    const testCases = [
      ['single'],
      ['multiple', 'tags', 'here'],
      ['with-numbers-123', 'special-chars!@#'],
    ];

    for (const tags of testCases) {
      const entity = new ArrayOptionsTest();
      entity.title = `Test Case: ${JSON.stringify(tags)}`;
      entity.tags = tags;

      const saved = await repository.save(entity);
      const found = await repository.findOne({ where: { id: saved.id } });

      expect(found?.tags).toEqual(tags);
      expect(Array.isArray(found?.tags)).toBe(true);

      // Check raw database storage
      const raw = await dataSource.query(
        'SELECT tags FROM array_options_test WHERE id = ?',
        [saved.id]
      );

      console.log(`Test case ${JSON.stringify(tags)}:`);
      console.log('- Raw DB value:', raw[0].tags);
      console.log('- Raw DB type:', typeof raw[0].tags);
      console.log('- Retrieved value:', found?.tags);
      console.log('- Is array:', Array.isArray(found?.tags));
    }
  });

  test('should show table schema', async () => {
    const tableInfo = await dataSource.query(`PRAGMA table_info(array_options_test)`);
    console.log('Table schema:');
    console.table(tableInfo);

    // Check that tags column is JSON type
    const tagsColumn = tableInfo.find((col: any) => col.name === 'tags');
    expect(tagsColumn?.type).toBe('json');
  });
});