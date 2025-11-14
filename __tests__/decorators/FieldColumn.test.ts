import { describe, it, expect, beforeEach } from 'vitest';
import { validate } from 'class-validator';
import { getMetadataArgsStorage } from 'typeorm';
import { getMetadataStorage } from 'type-graphql';
import { z } from 'zod';
import { EntityObjectType, FieldColumn, FieldColumnJSON } from '@base/graphql/decorators/index';
import { BaseEntity } from '@base/db/index';

describe('FieldColumn Decorator', () => {
  describe('Basic Functionality', () => {
    @EntityObjectType('test_basic')
    class TestBasicEntity extends BaseEntity {
      @FieldColumn(String)
      name!: string;

      @FieldColumn(Number, { columnType: 'integer', required: true })
      age!: number;

      @FieldColumn(Boolean, { required: false, nullable: true })
      isActive?: boolean;
    }

    it('should apply TypeORM Column decorator', () => {
      const storage = getMetadataArgsStorage();
      const columns = storage.columns.filter(
        (col) => col.target === TestBasicEntity
      );

      expect(columns.length).toBeGreaterThan(0);
      const nameColumn = columns.find((col) => col.propertyName === 'name');
      expect(nameColumn).toBeDefined();
      expect(nameColumn?.options.type).toBe('text');
    });

    it('should apply Type-GraphQL Field decorator', () => {
      const storage = getMetadataStorage();
      const fields = storage.fields.filter(
        (field: any) => field.target === TestBasicEntity
      );

      expect(fields.length).toBeGreaterThan(0);
      const nameField = fields.find((field: any) => field.name === 'name');
      expect(nameField).toBeDefined();
    });

    it('should apply validation decorators', async () => {
      const entity = new TestBasicEntity();
      entity.name = '';
      entity.age = 25;

      const errors = await validate(entity);
      const nameError = errors.find((err) => err.property === 'name');
      expect(nameError).toBeDefined();
      expect(nameError?.constraints).toHaveProperty('isNotEmpty');
    });
  });

  describe('Default Values', () => {
    @EntityObjectType('test_defaults')
    class TestDefaultEntity extends BaseEntity {
      @FieldColumn(Number, {
        columnType: 'integer',
        default: 0,
        required: true
      })
      count!: number;

      @FieldColumn(String, {
        default: 'pending',
        required: true
      })
      status!: string;
    }

    it('should set default value in TypeORM column options', () => {
      const storage = getMetadataArgsStorage();
      const columns = storage.columns.filter(
        (col) => col.target === TestDefaultEntity
      );

      const countColumn = columns.find((col) => col.propertyName === 'count');
      expect(countColumn?.options.default).toBe(0);

      const statusColumn = columns.find((col) => col.propertyName === 'status');
      expect(statusColumn?.options.default).toBe('pending');
    });
  });

  describe('Unique Constraint', () => {
    @EntityObjectType('test_unique')
    class TestUniqueEntity extends BaseEntity {
      @FieldColumn(String, { unique: true, required: true })
      email!: string;
    }

    it('should set unique constraint on column', () => {
      const storage = getMetadataArgsStorage();
      const columns = storage.columns.filter(
        (col) => col.target === TestUniqueEntity
      );

      const emailColumn = columns.find((col) => col.propertyName === 'email');
      expect(emailColumn?.options.unique).toBe(true);
    });
  });

  describe('Length and Precision', () => {
    @EntityObjectType('test_length')
    class TestLengthEntity extends BaseEntity {
      @FieldColumn(String, {
        columnType: 'varchar',
        length: 255,
        required: true
      })
      title!: string;

      @FieldColumn(Number, {
        columnType: 'decimal',
        precision: 10,
        scale: 2,
        required: true
      })
      price!: number;
    }

    it('should set length on varchar column', () => {
      const storage = getMetadataArgsStorage();
      const columns = storage.columns.filter(
        (col) => col.target === TestLengthEntity
      );

      const titleColumn = columns.find((col) => col.propertyName === 'title');
      expect(titleColumn?.options.length).toBe(255);
    });

    it('should set precision and scale on decimal column', () => {
      const storage = getMetadataArgsStorage();
      const columns = storage.columns.filter(
        (col) => col.target === TestLengthEntity
      );

      const priceColumn = columns.find((col) => col.propertyName === 'price');
      expect(priceColumn?.options.precision).toBe(10);
      expect(priceColumn?.options.scale).toBe(2);
    });
  });

  describe('Comment', () => {
    @EntityObjectType('test_comment')
    class TestCommentEntity extends BaseEntity {
      @FieldColumn(String, {
        comment: 'User email address',
        required: true
      })
      email!: string;
    }

    it('should set comment on column', () => {
      const storage = getMetadataArgsStorage();
      const columns = storage.columns.filter(
        (col) => col.target === TestCommentEntity
      );

      const emailColumn = columns.find((col) => col.propertyName === 'email');
      expect(emailColumn?.options.comment).toBe('User email address');
    });
  });

  describe('Select Option', () => {
    @EntityObjectType('test_select')
    class TestSelectEntity extends BaseEntity {
      @FieldColumn(String)
      username!: string;

      @FieldColumn(String, { select: false, required: true })
      password!: string;
    }

    it('should set select false on sensitive column', () => {
      const storage = getMetadataArgsStorage();
      const columns = storage.columns.filter(
        (col) => col.target === TestSelectEntity
      );

      const passwordColumn = columns.find((col) => col.propertyName === 'password');
      expect(passwordColumn?.options.select).toBe(false);
    });
  });

  describe('Validation Options', () => {
    describe('Email Validation', () => {
      @EntityObjectType('test_email')
      class TestEmailEntity extends BaseEntity {
        @FieldColumn(String, { email: true, required: true })
        email!: string;
      }

      it('should validate email format', async () => {
        const entity = new TestEmailEntity();
        entity.email = 'invalid-email';

        const errors = await validate(entity);
        const emailError = errors.find((err) => err.property === 'email');
        expect(emailError).toBeDefined();
        expect(emailError?.constraints).toHaveProperty('isEmail');
      });
    });

    describe('URL Validation', () => {
      @EntityObjectType('test_url')
      class TestUrlEntity extends BaseEntity {
        @FieldColumn(String, { isUrl: true, required: true })
        website!: string;
      }

      it('should validate URL format', async () => {
        const entity = new TestUrlEntity();
        entity.website = 'not-a-url';

        const errors = await validate(entity);
        const urlError = errors.find((err) => err.property === 'website');
        expect(urlError).toBeDefined();
        expect(urlError?.constraints).toHaveProperty('isUrl');
      });
    });

    describe('UUID Validation', () => {
      @EntityObjectType('test_uuid')
      class TestUuidEntity extends BaseEntity {
        @FieldColumn(String, { isUUID: true, required: true })
        externalId!: string;
      }

      it('should validate UUID format', async () => {
        const entity = new TestUuidEntity();
        entity.externalId = 'not-a-uuid';

        const errors = await validate(entity);
        const uuidError = errors.find((err) => err.property === 'externalId');
        expect(uuidError).toBeDefined();
        expect(uuidError?.constraints).toHaveProperty('isUuid');
      });
    });

    describe('Pattern Validation', () => {
      @EntityObjectType('test_pattern')
      class TestPatternEntity extends BaseEntity {
        @FieldColumn(String, {
          pattern: /^[A-Z]{3}$/,
          required: true
        })
        code!: string;
      }

      it('should validate regex pattern', async () => {
        const entity = new TestPatternEntity();
        entity.code = 'abc'; // lowercase, should fail

        const errors = await validate(entity);
        const patternError = errors.find((err) => err.property === 'code');
        expect(patternError).toBeDefined();
        expect(patternError?.constraints).toHaveProperty('matches');
      });
    });

    describe('Min/Max Length', () => {
      @EntityObjectType('test_length_validation')
      class TestLengthValidationEntity extends BaseEntity {
        @FieldColumn(String, {
          minLength: 3,
          maxLength: 10,
          required: true
        })
        username!: string;
      }

      it('should validate min length', async () => {
        const entity = new TestLengthValidationEntity();
        entity.username = 'ab'; // too short

        const errors = await validate(entity);
        const lengthError = errors.find((err) => err.property === 'username');
        expect(lengthError).toBeDefined();
        expect(lengthError?.constraints).toHaveProperty('minLength');
      });

      it('should validate max length', async () => {
        const entity = new TestLengthValidationEntity();
        entity.username = 'a'.repeat(11); // too long

        const errors = await validate(entity);
        const lengthError = errors.find((err) => err.property === 'username');
        expect(lengthError).toBeDefined();
        expect(lengthError?.constraints).toHaveProperty('maxLength');
      });
    });

    describe('Min/Max Number', () => {
      @EntityObjectType('test_number_validation')
      class TestNumberValidationEntity extends BaseEntity {
        @FieldColumn(Number, {
          columnType: 'integer',
          min: 0,
          max: 100,
          required: true
        })
        score!: number;
      }

      it('should validate min value', async () => {
        const entity = new TestNumberValidationEntity();
        entity.score = -1;

        const errors = await validate(entity);
        const minError = errors.find((err) => err.property === 'score');
        expect(minError).toBeDefined();
        expect(minError?.constraints).toHaveProperty('min');
      });

      it('should validate max value', async () => {
        const entity = new TestNumberValidationEntity();
        entity.score = 101;

        const errors = await validate(entity);
        const maxError = errors.find((err) => err.property === 'score');
        expect(maxError).toBeDefined();
        expect(maxError?.constraints).toHaveProperty('max');
      });
    });
  });

  describe('GraphQL Field Options', () => {
    @EntityObjectType('test_graphql_options')
    class TestGraphQLOptionsEntity extends BaseEntity {
      @FieldColumn(String, {
        description: 'User full name',
        required: true
      })
      fullName!: string;

      @FieldColumn(String, {
        description: 'Legacy field',
        deprecationReason: 'Use fullName instead',
        required: false,
        nullable: true
      })
      oldName?: string;
    }

    it('should set field description', () => {
      const storage = getMetadataStorage();
      const fields = storage.fields.filter(
        (field: any) => field.target === TestGraphQLOptionsEntity
      );

      const fullNameField = fields.find((field: any) => field.name === 'fullName');
      expect(fullNameField?.description).toBe('User full name');
    });

    it('should set field deprecation reason', () => {
      const storage = getMetadataStorage();
      const fields = storage.fields.filter(
        (field: any) => field.target === TestGraphQLOptionsEntity
      );

      const oldNameField = fields.find((field: any) => field.name === 'oldName');
      expect(oldNameField?.deprecationReason).toBe('Use fullName instead');
    });
  });

  describe('SQL Type to GraphQL Type Mapping', () => {
    @EntityObjectType('test_type_mapping')
    class TestTypeMappingEntity extends BaseEntity {
      // String types
      @FieldColumn(String, { columnType: 'text', required: true })
      textField!: string;

      @FieldColumn(String, { columnType: 'varchar', required: true })
      varcharField!: string;

      // Number types
      @FieldColumn(Number, { columnType: 'integer', required: true })
      integerField!: number;

      @FieldColumn(Number, { columnType: 'float', required: true })
      floatField!: number;

      // Boolean type
      @FieldColumn(Boolean, { columnType: 'boolean', required: true })
      booleanField!: boolean;

      // Date types
      @FieldColumn(Date, { columnType: 'datetime', required: true })
      datetimeField!: Date;

      // JSON type
      @FieldColumn(String, { columnType: 'json', required: false, nullable: true })
      jsonField?: any;
    }

    it('should map SQL types to GraphQL types correctly', () => {
      const storage = getMetadataStorage();
      const fields = storage.fields.filter(
        (field: any) => field.target === TestTypeMappingEntity
      );

      expect(fields.length).toBeGreaterThan(0);

      // All fields should have a type function
      fields.forEach((field: any) => {
        expect(field.getType).toBeDefined();
        expect(typeof field.getType).toBe('function');
      });
    });
  });

  describe('FieldColumnJSON with z.any()', () => {
    @EntityObjectType('test_any_json')
    class TestAnyJsonEntity extends BaseEntity {
      @FieldColumnJSON(z.any().describe('ArbitraryData: Any JSON data'), {
        description: 'Arbitrary JSON data that can be any type',
        required: false
      })
      arbitraryData?: any;

      @FieldColumnJSON(z.any().optional().describe('OptionalData: Optional any data'), {
        description: 'Optional any data'
      })
      optionalData?: any;
    }

    it('should apply TypeORM JSON column decorator', () => {
      const storage = getMetadataArgsStorage();
      const columns = storage.columns.filter(
        (col) => col.target === TestAnyJsonEntity
      );

      expect(columns.length).toBeGreaterThan(0);

      const arbitraryDataColumn = columns.find((col) => col.propertyName === 'arbitraryData');
      expect(arbitraryDataColumn).toBeDefined();
      expect(arbitraryDataColumn?.options.type).toBe('json');
    });

    it('should apply Type-GraphQL Field decorator', () => {
      const storage = getMetadataStorage();
      const fields = storage.fields.filter(
        (field: any) => field.target === TestAnyJsonEntity
      );

      expect(fields.length).toBeGreaterThan(0);

      const arbitraryDataField = fields.find((field: any) => field.name === 'arbitraryData');
      expect(arbitraryDataField).toBeDefined();
      expect(arbitraryDataField?.description).toBe('Arbitrary JSON data that can be any type');
    });

    it('should handle optional z.any() fields', () => {
      const storage = getMetadataStorage();
      const fields = storage.fields.filter(
        (field: any) => field.target === TestAnyJsonEntity
      );

      const optionalDataField = fields.find((field: any) => field.name === 'optionalData');
      expect(optionalDataField).toBeDefined();
      expect(optionalDataField?.description).toBe('Optional any data');
    });

    it('should create entity instances without errors', () => {
      const entity = new TestAnyJsonEntity();
      expect(entity).toBeDefined();

      // Should be able to set any type of data
      entity.arbitraryData = { key: 'value', number: 123, array: [1, 2, 3] };
      entity.optionalData = 'any string value';

      expect(entity.arbitraryData).toEqual({ key: 'value', number: 123, array: [1, 2, 3] });
      expect(entity.optionalData).toBe('any string value');
    });
  });
});
