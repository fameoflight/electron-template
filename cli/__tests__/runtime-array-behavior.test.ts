/**
 * Runtime Array Behavior Tests
 *
 * Tests how different array configurations actually behave at runtime
 * with TypeORM and SQLite, focusing on the actual serialization/deserialization
 * issues that cause the "Expected Iterable" error.
 */

import { DataSource, Entity, Column } from 'typeorm';
import { ObjectType, Field } from 'type-graphql';
import { FieldColumn } from '@main/base/graphql/decorators/index';
import { FieldColumnJSON } from '@main/base/graphql/decorators/fields/FieldColumnJSON';
import { FieldColumnEnum } from '@main/base/graphql/decorators/fields/FieldColumnEnum';
import { z } from 'zod';
import { cleanupTestDatabase, createTestDatabase } from '../../__tests__/base/testDatabase';

// Test enum for enum arrays
enum TestStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending'
}

// Schemas for JSON fields
const StringArraySchema = z.array(z.string()).describe('StringArray: Array of strings');

// Test entity with different array approaches
@Entity()
@ObjectType({ description: 'Runtime array behavior test entity' })
class RuntimeArrayTest {

  @Field(() => String, { description: 'Entity ID' })
  @Column({ primary: true, type: 'varchar' })
  id!: string;

  @Field(() => String, { description: 'Entity title' })
  @Column({ type: 'varchar' })
  title!: string;

  // Approach 1: FieldColumn with array: true (NOW FIXED!)
  @FieldColumn(String, { required: false, description: 'String array with FieldColumn array: true', array: true })
  fieldColumnArray?: string[];

  // Approach 2: FieldColumnJSON for string arrays (POTENTIAL FIX)
  @FieldColumnJSON(StringArraySchema, { required: false, description: 'String array with FieldColumnJSON' })
  fieldColumnJSONArray?: string[];

  // Approach 3: FieldColumnEnum with array: true
  @FieldColumnEnum(TestStatus, { required: false, array: true, description: 'Enum array with FieldColumnEnum' })
  enumArray?: TestStatus[];

  constructor() {
    this.id = crypto.randomUUID();
  }
}

describe('Runtime Array Behavior Tests', () => {
  let dataSource: DataSource;
  let repository: any;

  beforeAll(async () => {
    dataSource = await createTestDatabase([RuntimeArrayTest]);
    repository = dataSource.getRepository(RuntimeArrayTest);
  });

  afterAll(async () => {
    if (dataSource) {
      await cleanupTestDatabase(dataSource);
    }
  });

  describe('Database Schema Analysis', () => {
    test('should show how different array types are stored', async () => {
      const tableInfo = await dataSource.query(`PRAGMA table_info(runtime_array_test)`);
      console.log('Table schema:');
      console.table(tableInfo);
    });
  });

  describe('FieldColumn with array: true (Now Fixed!)', () => {
    test('should verify the fix works correctly', async () => {
      const entity = new RuntimeArrayTest();
      entity.title = 'FieldColumn Array Test';
      entity.fieldColumnArray = ['tag1', 'tag2', 'tag3'];
      entity.enumArray = [TestStatus.ACTIVE]; // Add required enumArray field

      console.log('\n=== FieldColumn with array: true ===');
      console.log('Before save:');
      console.log('- Value:', entity.fieldColumnArray);
      console.log('- Type:', typeof entity.fieldColumnArray);
      console.log('- IsArray:', Array.isArray(entity.fieldColumnArray));

      const saved = await repository.save(entity);

      console.log('After save:');
      console.log('- Value:', saved.fieldColumnArray);
      console.log('- Type:', typeof saved.fieldColumnArray);
      console.log('- IsArray:', Array.isArray(saved.fieldColumnArray));

      // Check raw database content
      const raw = await dataSource.query(
        'SELECT fieldColumnArray FROM runtime_array_test WHERE id = ?',
        [saved.id]
      );
      console.log('Raw database value:', raw[0].fieldColumnArray);
      console.log('Raw database type:', typeof raw[0].fieldColumnArray);

      // Try to retrieve
      const found = await repository.findOne({ where: { id: saved.id } });
      console.log('After retrieve:');
      console.log('- Value:', found?.fieldColumnArray);
      console.log('- Type:', typeof found?.fieldColumnArray);
      console.log('- IsArray:', Array.isArray(found?.fieldColumnArray));

      // Verify the fix works correctly
      expect(found?.fieldColumnArray).toEqual(['tag1', 'tag2', 'tag3']);
      expect(Array.isArray(found?.fieldColumnArray)).toBe(true);
      expect(typeof found?.fieldColumnArray).toBe('object');

      // Check that it's not the broken "[object Object]" string
      expect(found?.fieldColumnArray).not.toBe('[object Object]');
      expect(typeof found?.fieldColumnArray).not.toBe('string');

      console.log('✅ FieldColumn with array: true is now FIXED!');
    });
  });

  describe('FieldColumnJSON for String Arrays (Potential Fix)', () => {
    test('should test FieldColumnJSON approach', async () => {
      const entity = new RuntimeArrayTest();
      entity.title = 'FieldColumnJSON Test';
      entity.fieldColumnJSONArray = ['json1', 'json2', 'json3'];
      entity.enumArray = [TestStatus.ACTIVE]; // Add required enumArray field

      console.log('\n=== FieldColumnJSON ===');
      console.log('Before save:');
      console.log('- Value:', entity.fieldColumnJSONArray);
      console.log('- Type:', typeof entity.fieldColumnJSONArray);
      console.log('- IsArray:', Array.isArray(entity.fieldColumnJSONArray));

      const saved = await repository.save(entity);

      console.log('After save:');
      console.log('- Value:', saved.fieldColumnJSONArray);
      console.log('- Type:', typeof saved.fieldColumnJSONArray);
      console.log('- IsArray:', Array.isArray(saved.fieldColumnJSONArray));

      // Check raw database content
      const raw = await dataSource.query(
        'SELECT fieldColumnJSONArray FROM runtime_array_test WHERE id = ?',
        [saved.id]
      );
      console.log('Raw database value:', raw[0].fieldColumnJSONArray);
      console.log('Raw database type:', typeof raw[0].fieldColumnJSONArray);

      // Try to retrieve
      const found = await repository.findOne({ where: { id: saved.id } });
      console.log('After retrieve:');
      console.log('- Value:', found?.fieldColumnJSONArray);
      console.log('- Type:', typeof found?.fieldColumnJSONArray);
      console.log('- IsArray:', Array.isArray(found?.fieldColumnJSONArray));

      // Check if this approach works
      if (Array.isArray(found?.fieldColumnJSONArray)) {
        console.log('✅ FieldColumnJSON approach works correctly');
      }
    });
  });

  describe('FieldColumnEnum with array: true', () => {
    test('should test FieldColumnEnum approach', async () => {
      const entity = new RuntimeArrayTest();
      entity.title = 'FieldColumnEnum Test';
      entity.enumArray = [TestStatus.ACTIVE, TestStatus.PENDING];

      console.log('\n=== FieldColumnEnum ===');
      console.log('Before save:');
      console.log('- Value:', entity.enumArray);
      console.log('- Type:', typeof entity.enumArray);
      console.log('- IsArray:', Array.isArray(entity.enumArray));

      const saved = await repository.save(entity);

      console.log('After save:');
      console.log('- Value:', saved.enumArray);
      console.log('- Type:', typeof saved.enumArray);
      console.log('- IsArray:', Array.isArray(saved.enumArray));

      // Check raw database content
      const raw = await dataSource.query(
        'SELECT enumArray FROM runtime_array_test WHERE id = ?',
        [saved.id]
      );
      console.log('Raw database value:', raw[0].enumArray);
      console.log('Raw database type:', typeof raw[0].enumArray);

      // Try to retrieve
      const found = await repository.findOne({ where: { id: saved.id } });
      console.log('After retrieve:');
      console.log('- Value:', found?.enumArray);
      console.log('- Type:', typeof found?.enumArray);
      console.log('- IsArray:', Array.isArray(found?.enumArray));

      // Check if this approach works
      if (Array.isArray(found?.enumArray)) {
        console.log('✅ FieldColumnEnum approach works correctly');
      }
    });
  });

  describe('Edge Cases', () => {
    test('should test empty arrays and null values', async () => {
      const testCases: Array<{
        fieldColumnArray?: string[] | null;
        fieldColumnJSONArray?: string[] | null;
        enumArray?: TestStatus[] | undefined;
      }> = [
        { fieldColumnArray: [], fieldColumnJSONArray: [], enumArray: [] },
        { fieldColumnArray: null, fieldColumnJSONArray: null, enumArray: [TestStatus.ACTIVE] }, // Cannot be null due to constraint
        { fieldColumnArray: undefined, fieldColumnJSONArray: undefined, enumArray: undefined }
      ];

      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        const entity = new RuntimeArrayTest();
        entity.title = `Edge Case Test ${i + 1}`;

        if (testCase.fieldColumnArray !== undefined) {
          entity.fieldColumnArray = testCase.fieldColumnArray || undefined;
        }
        if (testCase.fieldColumnJSONArray !== undefined) {
          entity.fieldColumnJSONArray = testCase.fieldColumnJSONArray || undefined;
        }
        if (testCase.enumArray !== undefined) {
          entity.enumArray = testCase.enumArray;
        } else {
          entity.enumArray = [TestStatus.ACTIVE]; // Required field - provide default
        }

        const saved = await repository.save(entity);
        const found = await repository.findOne({ where: { id: saved.id } });

        console.log(`\n=== Edge Case ${i + 1}: ${JSON.stringify(testCase)} ===`);
        console.log('FieldColumnArray - Found:', found?.fieldColumnArray, 'Type:', typeof found?.fieldColumnArray);
        console.log('FieldColumnJSONArray - Found:', found?.fieldColumnJSONArray, 'Type:', typeof found?.fieldColumnJSONArray);
        console.log('EnumArray - Found:', found?.enumArray, 'Type:', typeof found?.enumArray);
      }
    });
  });
});