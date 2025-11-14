import { describe, it, expect } from 'vitest';
import { getMetadataArgsStorage } from 'typeorm';
import { getMetadataStorage } from 'type-graphql';
import { EntityObjectType, FieldColumn } from '@base/graphql/decorators/index';
import { BaseEntity, OwnedEntity } from '@base/db/index';
import { getAllFieldsForClass } from '@base/utils/index';

describe('EntityObjectType Decorator', () => {
  describe('Basic Functionality', () => {
    @EntityObjectType('test_basic_entity')
    class TestBasicEntity extends BaseEntity {
      @FieldColumn(String)
      name!: string;
    }

    it('should apply TypeORM Entity decorator', () => {
      const storage = getMetadataArgsStorage();
      const entities = storage.tables.filter(
        (table) => table.target === TestBasicEntity
      );

      expect(entities.length).toBe(1);
      expect(entities[0].name).toBe('test_basic_entity');
    });

    it('should apply Type-GraphQL ObjectType decorator', () => {
      const storage = getMetadataStorage();
      const objectTypes = storage.objectTypes.filter(
        (type: any) => type.target === TestBasicEntity
      );

      expect(objectTypes.length).toBe(1);
    });
  });

  describe('Description', () => {
    @EntityObjectType('test_with_description', {
      description: 'A test entity with description'
    })
    class TestDescriptionEntity extends BaseEntity {
      @FieldColumn(String)
      name!: string;
    }

    it('should set GraphQL type description', () => {
      const storage = getMetadataStorage();
      const objectTypes = storage.objectTypes.filter(
        (type: any) => type.target === TestDescriptionEntity
      );

      expect(objectTypes.length).toBe(1);
      expect(objectTypes[0].description).toBe('A test entity with description');
    });
  });

  describe('Indexes', () => {
    @EntityObjectType('test_with_indexes', {
      indexes: [
        'status',
        ['userId', 'createdAt'],
        'email'
      ]
    })
    class TestIndexEntity extends BaseEntity {
      @FieldColumn(String)
      status!: string;


      @FieldColumn(String)
      email!: string;
    }

    it('should create indexes on specified fields', () => {
      const storage = getMetadataArgsStorage();
      const indexes = storage.indices.filter(
        (index) => index.target === TestIndexEntity
      );

      expect(indexes.length).toBeGreaterThanOrEqual(3);

      // Check for single field index
      const statusIndex = indexes.find((idx) =>
        Array.isArray(idx.columns) && idx.columns.includes('status') && idx.columns.length === 1
      );
      expect(statusIndex).toBeDefined();

      // Check for composite index
      const compositeIndex = indexes.find((idx) =>
        Array.isArray(idx.columns) &&
        idx.columns.includes('userId') &&
        idx.columns.includes('createdAt')
      );
      expect(compositeIndex).toBeDefined();

      // Check for email index
      const emailIndex = indexes.find((idx) =>
        Array.isArray(idx.columns) && idx.columns.includes('email') && idx.columns.length === 1
      );
      expect(emailIndex).toBeDefined();
    });
  });

  describe('Combined Features', () => {
    @EntityObjectType('test_combined', {
      description: 'Job entity for background task processing',
      indexes: [
        ['status', 'type'],
        'userId',
        'nextRetryAt'
      ]
    })
    class TestCombinedEntity extends OwnedEntity {
      @FieldColumn(String, {
        description: 'Job status',
        required: true
      })
      status!: string;

      @FieldColumn(String, {
        description: 'Job type identifier',
        required: true
      })
      type!: string;

      @FieldColumn(Date, {
        columnType: 'datetime',
        description: 'Next retry timestamp',
        required: false,
        nullable: true
      })
      nextRetryAt?: Date;
    }

    it('should apply all decorators correctly', () => {
      // Check TypeORM Entity
      const ormStorage = getMetadataArgsStorage();
      const entities = ormStorage.tables.filter(
        (table) => table.target === TestCombinedEntity
      );
      expect(entities.length).toBe(1);
      expect(entities[0].name).toBe('test_combined');

      // Check Type-GraphQL ObjectType
      const gqlStorage = getMetadataStorage();
      const objectTypes = gqlStorage.objectTypes.filter(
        (type: any) => type.target === TestCombinedEntity
      );
      expect(objectTypes.length).toBe(1);
      expect(objectTypes[0].description).toBe('Job entity for background task processing');

      // Check Indexes
      const indexes = ormStorage.indices.filter(
        (index) => index.target === TestCombinedEntity
      );
      expect(indexes.length).toBeGreaterThanOrEqual(3);
    });

    it('should have field descriptions in GraphQL schema', () => {
      // Use helper function to get all fields including inherited ones
      const fields = getAllFieldsForClass(TestCombinedEntity);

      const statusField = fields.find((field: any) => field.name === 'status');
      expect(statusField?.description).toBe('Job status');

      const typeField = fields.find((field: any) => field.name === 'type');
      expect(typeField?.description).toBe('Job type identifier');

      const userIdField = fields.find((field: any) => field.name === 'userId');
      expect(userIdField?.description).toBe('User who owns this entity');
    });
  });

  describe('Without Options', () => {
    @EntityObjectType('test_minimal')
    class TestMinimalEntity extends BaseEntity {
      @FieldColumn(String)
      name!: string;
    }

    it('should work with minimal configuration', () => {
      const ormStorage = getMetadataArgsStorage();
      const entities = ormStorage.tables.filter(
        (table) => table.target === TestMinimalEntity
      );
      expect(entities.length).toBe(1);
      expect(entities[0].name).toBe('test_minimal');

      const gqlStorage = getMetadataStorage();
      const objectTypes = gqlStorage.objectTypes.filter(
        (type: any) => type.target === TestMinimalEntity
      );
      expect(objectTypes.length).toBe(1);
    });
  });

  describe('Complex Index Patterns', () => {
    @EntityObjectType('test_complex_indexes', {
      indexes: [
        // Single field as string
        'email',
        // Single field as array
        ['username'],
        // Composite index
        ['tenantId', 'userId'],
        // Three-field composite
        ['status', 'type', 'priority']
      ]
    })
    class TestComplexIndexEntity extends BaseEntity {
      @FieldColumn(String, { unique: true, required: true })
      email!: string;

      @FieldColumn(String, { unique: true, required: true })
      username!: string;

      @FieldColumn(String)
      tenantId!: string;


      @FieldColumn(String)
      status!: string;

      @FieldColumn(String)
      type!: string;

      @FieldColumn(Number, { columnType: 'integer', required: true })
      priority!: number;
    }

    it('should handle various index patterns', () => {
      const storage = getMetadataArgsStorage();
      const indexes = storage.indices.filter(
        (index) => index.target === TestComplexIndexEntity
      );

      // Should have at least 4 indexes
      expect(indexes.length).toBeGreaterThanOrEqual(4);

      // Check for three-field composite index
      const threeFieldIndex = indexes.find((idx) =>
        Array.isArray(idx.columns) &&
        idx.columns.includes('status') &&
        idx.columns.includes('type') &&
        idx.columns.includes('priority')
      );
      expect(threeFieldIndex).toBeDefined();
    });
  });

  describe('Real-World Example: Job Entity', () => {
    enum JobStatus {
      PENDING = 'pending',
      RUNNING = 'running',
      COMPLETED = 'completed',
      FAILED = 'failed'
    }

    @EntityObjectType('jobs_test', {
      description: 'Background job for async task execution',
      indexes: [
        ['status', 'type'],
        'userId',
        ['targetId', 'type'],
        'nextRetryAt',
        ['status', 'queuedAt']
      ]
    })
    class JobTestEntity extends BaseEntity {
      @FieldColumn(String, {
        description: 'Job handler class name',
        required: true
      })
      type!: string;

      @FieldColumn(String, {
        enumType: JobStatus,
        default: JobStatus.PENDING,
        description: 'Current job execution status',
        required: true
      })
      status!: string;

      @FieldColumn(String, {
        description: 'Target entity ID',
        required: true
      })
      targetId!: string;

      @FieldColumn(String, {
        description: 'User ID who created job',
        required: true
      })

      @FieldColumn(Date, {
        columnType: 'datetime',
        nullable: true,
        required: false,
        description: 'When job was queued'
      })
      queuedAt?: Date;

      @FieldColumn(Date, {
        columnType: 'datetime',
        nullable: true,
        required: false,
        description: 'When to retry next'
      })
      nextRetryAt?: Date;

      @FieldColumn(Number, {
        columnType: 'integer',
        default: 0,
        description: 'Number of retry attempts',
        required: true,
        min: 0
      })
      retryCount!: number;
    }

    it('should create all indexes for job entity', () => {
      const storage = getMetadataArgsStorage();
      const indexes = storage.indices.filter(
        (index) => index.target === JobTestEntity
      );

      expect(indexes.length).toBeGreaterThanOrEqual(5);

      // Check key performance indexes exist
      const statusTypeIndex = indexes.find((idx) =>
        Array.isArray(idx.columns) &&
        idx.columns.includes('status') &&
        idx.columns.includes('type') &&
        idx.columns.length === 2
      );
      expect(statusTypeIndex).toBeDefined();

      const userIdIndex = indexes.find((idx) =>
        Array.isArray(idx.columns) && idx.columns.includes('userId') && idx.columns.length === 1
      );
      expect(userIdIndex).toBeDefined();
    });

    it('should have correct field metadata', () => {
      const gqlStorage = getMetadataStorage();
      const fields = gqlStorage.fields.filter(
        (field: any) => field.target === JobTestEntity
      );

      expect(fields.length).toBeGreaterThan(0);

      const typeField = fields.find((field: any) => field.name === 'type');
      expect(typeField?.description).toBe('Job handler class name');

      const statusField = fields.find((field: any) => field.name === 'status');
      expect(statusField?.description).toBe('Current job execution status');
    });

    it('should have correct column defaults', () => {
      const ormStorage = getMetadataArgsStorage();
      const columns = ormStorage.columns.filter(
        (col) => col.target === JobTestEntity
      );

      const statusColumn = columns.find((col) => col.propertyName === 'status');
      expect(statusColumn?.options.default).toBe(JobStatus.PENDING);

      const retryCountColumn = columns.find((col) => col.propertyName === 'retryCount');
      expect(retryCountColumn?.options.default).toBe(0);
    });
  });
});
