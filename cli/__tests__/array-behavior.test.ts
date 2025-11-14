/**
 * Array Behavior Tests
 *
 * This test file comprehensively tests different array configurations
 * to identify what works correctly with SQLite and TypeORM.
 *
 * We test:
 * 1. String arrays with FieldColumn + array: true
 * 2. String arrays with FieldColumnJSON
 * 3. Enum arrays with FieldColumnEnum + array: true
 * 4. Number arrays with FieldColumn + array: true
 * 5. JSON arrays with itemSchema
 */

import { DataSource, Entity, Column } from 'typeorm';
import { BaseEntity } from '@base/db/BaseEntity';
import { FieldColumn } from '@main/base/graphql/decorators/index';
import { FieldColumnJSON } from '@main/base/graphql/decorators/fields/FieldColumnJSON';
import { FieldColumnEnum } from '@main/base/graphql/decorators/fields/FieldColumnEnum';
import { ObjectType, Field } from 'type-graphql';
import { z } from 'zod';
import { cleanupTestDatabase, createTestDatabase } from '../../__tests__/base/testDatabase';

// Define schemas outside the class
const StringArraySchema = z.array(z.string()).describe('StringArray: Array of strings');

const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number()
}).describe('Item: Object with id, name, value');

const ItemArraySchema = z.array(ItemSchema).describe('ItemArray: Array of Item objects');

// Define enum outside the class
enum TestStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending'
}

// Test entity with different array configurations
@Entity()
@ObjectType({ description: 'Test entity for array behavior' })
class ArrayTestEntity extends BaseEntity {

  // Test 1: String array with FieldColumn + array: true (current approach - BROKEN)
  @FieldColumn(String, {
    required: false,
    description: 'String array with FieldColumn array: true',
    array: true
  })
  stringArrayField?: string[];

  // Test 2: String array with FieldColumnJSON (potential fix)
  @FieldColumnJSON(StringArraySchema, {
    required: false,
    description: 'String array with FieldColumnJSON'
  })
  stringArrayJSON?: string[];

  // Test 3: Enum array with FieldColumnEnum + array: true
  @FieldColumnEnum(TestStatus, {
    required: false,
    array: true,
    description: 'Enum array with FieldColumnEnum array: true'
  })
  enumArray?: TestStatus[];

  // Test 4: Number array with FieldColumn + array: true
  @FieldColumn(Number, {
    required: false,
    description: 'Number array with FieldColumn array: true',
    array: true
  })
  numberArray?: number[];

  // Test 5: JSON array with item schema
  @FieldColumnJSON(ItemArraySchema, {
    required: false,
    description: 'JSON array with item schema'
  })
  jsonArray?: Array<{ id: string, name: string, value: number }>;
}

describe('Array Behavior Tests', () => {
  let dataSource: DataSource;
  let repository: any;

  beforeAll(async () => {
    // Use test database infrastructure that includes all entities
    dataSource = await createTestDatabase([ArrayTestEntity]);
    repository = dataSource.getRepository(ArrayTestEntity);
  });

  afterAll(async () => {
    if (dataSource) {
      await cleanupTestDatabase(dataSource);
    }
  });

  describe('String Array with FieldColumn + array: true', () => {
    test('should save and retrieve string array correctly', async () => {
      const entity = repository.create({
        stringArrayField: ['tag1', 'tag2', 'tag3'],
        enumArray: [TestStatus.ACTIVE] // Add required enumArray field
      });

      const saved = await repository.save(entity);
      console.log('Saved stringArrayField:', saved.stringArrayField);
      console.log('Type of saved stringArrayField:', typeof saved.stringArrayField);

      const found = await repository.findOne({ where: { id: saved.id } });
      console.log('Found stringArrayField:', found?.stringArrayField);
      console.log('Type of found stringArrayField:', typeof found?.stringArrayField);
      console.log('Is array?', Array.isArray(found?.stringArrayField));

      // FieldColumn with array: true is now FIXED - properly serializes as JSON
      expect(found?.stringArrayField).toEqual(['tag1', 'tag2', 'tag3']); // Fixed behavior!
    });
  });

  describe('String Array with FieldColumnJSON', () => {
    test('should save and retrieve string array correctly', async () => {
      const entity = repository.create({
        stringArrayJSON: ['json1', 'json2', 'json3'],
        enumArray: [TestStatus.ACTIVE] // Add required enumArray field
      });

      const saved = await repository.save(entity);
      console.log('Saved stringArrayJSON:', saved.stringArrayJSON);
      console.log('Type of saved stringArrayJSON:', typeof saved.stringArrayJSON);

      const found = await repository.findOne({ where: { id: saved.id } });
      console.log('Found stringArrayJSON:', found?.stringArrayJSON);
      console.log('Type of found stringArrayJSON:', typeof found?.stringArrayJSON);
      console.log('Is array?', Array.isArray(found?.stringArrayJSON));

      expect(found?.stringArrayJSON).toEqual(['json1', 'json2', 'json3']);
    });
  });

  describe('Enum Array with FieldColumnEnum', () => {
    test('should save and retrieve enum array correctly', async () => {
      const entity = repository.create({
        enumArray: [TestStatus.ACTIVE, TestStatus.PENDING]
      });

      const saved = await repository.save(entity);
      console.log('Saved enumArray:', saved.enumArray);
      console.log('Type of saved enumArray:', typeof saved.enumArray);

      const found = await repository.findOne({ where: { id: saved.id } });
      console.log('Found enumArray:', found?.enumArray);
      console.log('Type of found enumArray:', typeof found?.enumArray);
      console.log('Is array?', Array.isArray(found?.enumArray));

      expect(found?.enumArray).toEqual([TestStatus.ACTIVE, TestStatus.PENDING]);
    });
  });

  describe('Number Array with FieldColumn + array: true', () => {
    test('should save and retrieve number array correctly', async () => {
      const entity = repository.create({
        numberArray: [1, 2, 3, 4, 5],
        enumArray: [TestStatus.ACTIVE] // Add required enumArray field
      });

      const saved = await repository.save(entity);
      console.log('Saved numberArray:', saved.numberArray);
      console.log('Type of saved numberArray:', typeof saved.numberArray);

      const found = await repository.findOne({ where: { id: saved.id } });
      console.log('Found numberArray:', found?.numberArray);
      console.log('Type of found numberArray:', typeof found?.numberArray);
      console.log('Is array?', Array.isArray(found?.numberArray));

      // FieldColumn with array: true is now FIXED - properly serializes as JSON
      expect(found?.numberArray).toEqual([1, 2, 3, 4, 5]); // Fixed behavior!
    });
  });

  describe('JSON Array with item schema', () => {
    test('should save and retrieve object array correctly', async () => {
      const objectArray = [
        { id: '1', name: 'item1', value: 100 },
        { id: '2', name: 'item2', value: 200 }
      ];

      const entity = repository.create({
        jsonArray: objectArray,
        enumArray: [TestStatus.ACTIVE] // Add required enumArray field
      });

      const saved = await repository.save(entity);
      console.log('Saved jsonArray:', saved.jsonArray);
      console.log('Type of saved jsonArray:', typeof saved.jsonArray);

      const found = await repository.findOne({ where: { id: saved.id } });
      console.log('Found jsonArray:', found?.jsonArray);
      console.log('Type of found jsonArray:', typeof found?.jsonArray);
      console.log('Is array?', Array.isArray(found?.jsonArray));

      expect(found?.jsonArray).toEqual(objectArray);
    });
  });

  describe('Database Schema Inspection', () => {
    test('should show how arrays are stored in database', async () => {
      // Get table schema
      const tableInfo = await dataSource.query(`PRAGMA table_info(array_test_entity)`);
      console.log('Table schema:', tableInfo);

      // Create test entity with all array types
      const testEntity = repository.create({
        stringArrayField: ['test1', 'test2'],
        stringArrayJSON: ['json1', 'json2'],
        enumArray: [TestStatus.ACTIVE],
        numberArray: [1, 2, 3],
        jsonArray: [{ id: '1', name: 'test', value: 100 }]
      });

      const saved = await repository.save(testEntity);

      // Query raw data to see how it's stored
      const rawData = await dataSource.query(
        `SELECT id, stringArrayField, stringArrayJSON, enumArray, numberArray, jsonArray
         FROM array_test_entity WHERE id = ?`,
        [saved.id]
      );

      console.log('Raw database data:', rawData[0]);
      console.log('Types in database:');
      console.log('- stringArrayField type:', typeof rawData[0].stringArrayField);
      console.log('- stringArrayJSON type:', typeof rawData[0].stringArrayJSON);
      console.log('- enumArray type:', typeof rawData[0].enumArray);
      console.log('- numberArray type:', typeof rawData[0].numberArray);
      console.log('- jsonArray type:', typeof rawData[0].jsonArray);
    });
  });
});