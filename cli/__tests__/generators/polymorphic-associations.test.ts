/**
 * Tests for polymorphic association support in entity generation
 */

import { EntityJsonParser } from '@cli/parsers/EntityJsonParser';
import { EntityGenerator } from '@cli/generators/EntityGenerator';
import { TypeMapper } from '@cli/generators/utils/TypeMapper';
import { FieldPreparator } from '@cli/generators/preparators/FieldPreparator';
import { getProjectRoot, getTempDir } from '@tests/base/utils';
import * as fs from 'fs';
import * as path from 'path';

describe('Entity Generator - Polymorphic Associations', () => {
  const tempDir = getTempDir('polymorphic-associations');
  const projectRoot = getProjectRoot();

  beforeEach(() => {
    // Create temp directory
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Basic Polymorphic Fields', () => {
    it('should generate polymorphic columns and methods correctly', () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'Comment',
        fields: {
          content: {
            type: 'text',
            required: true,
            description: 'Comment content'
          },
          commentable: {
            type: 'polymorphic',
            required: true,
            description: 'Polymorphic association to any entity'
          }
        },
        indexes: [
          'commentableId',
          ['commentableId', 'commentableType']
        ]
      };

      const schemaPath = path.join(tempDir, 'Comment.json');
      fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));

      // Parse and generate entity
      const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
      const entity = EntityJsonParser.parseFile(schemaContent);

      const generator = new EntityGenerator(entity, projectRoot, tempDir);
      const result = generator.generate();

      // Verify files were created
      expect(fs.existsSync(result.basePath)).toBe(true);
      expect(fs.existsSync(result.extensionPath)).toBe(true);

      // Read generated base entity
      const baseContent = fs.readFileSync(result.basePath, 'utf-8');

      // Verify both polymorphic columns are generated
      expect(baseContent).toContain('commentableId!: string;');
      expect(baseContent).toContain('commentableType!: string;');

      // Verify proper FieldColumn decorators (using unified decorator system)
      expect(baseContent).toContain("@FieldColumn(String, { required: true, description: 'Polymorphic association to any entity ID', maxLength: 36 })");
      expect(baseContent).toContain("@FieldColumn(String, { required: true, description: 'Polymorphic association to any entity type' })");

      // Verify polymorphic getter method
      expect(baseContent).toContain('async getCommentable<T extends ObjectLiteral>(): Promise<T | null>');
      expect(baseContent).toContain('DataSourceProvider.get()');
      expect(baseContent).toContain('getRepository(this.commentableType)');
      expect(baseContent).toContain('findOne({ where: { id: this.commentableId } })');

      // Verify method handles null values
      expect(baseContent).toContain('if (!this.commentableId || !this.commentableType)');
    });
  });

  describe('Optional Polymorphic Fields', () => {
    it('should generate optional polymorphic fields correctly', () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'Activity',
        fields: {
          description: {
            type: 'text',
            required: true,
            description: 'Activity description'
          },
          subject: {
            type: 'polymorphic',
            required: false,
            description: 'Optional polymorphic subject'
          }
        }
      };

      const schemaPath = path.join(tempDir, 'Activity.json');
      fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));

      const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
      const entity = EntityJsonParser.parseFile(schemaContent);

      const generator = new EntityGenerator(entity, projectRoot, tempDir);
      const result = generator.generate();

      const baseContent = fs.readFileSync(result.basePath, 'utf-8');

      // Verify optional polymorphic columns
      expect(baseContent).toContain('subjectId?: string;');
      expect(baseContent).toContain('subjectType?: string;');
    });
  });

  describe('Multiple Polymorphic Fields', () => {
    it('should handle multiple polymorphic fields in one entity', () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'Notification',
        fields: {
          message: {
            type: 'text',
            required: true,
            description: 'Notification message'
          },
          recipient: {
            type: 'polymorphic',
            required: true,
            description: 'Polymorphic recipient'
          },
          actor: {
            type: 'polymorphic',
            required: false,
            description: 'Optional polymorphic actor'
          }
        }
      };

      const schemaPath = path.join(tempDir, 'Notification.json');
      fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));

      const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
      const entity = EntityJsonParser.parseFile(schemaContent);

      const generator = new EntityGenerator(entity, projectRoot, tempDir);
      const result = generator.generate();

      const baseContent = fs.readFileSync(result.basePath, 'utf-8');

      // Verify both polymorphic associations
      expect(baseContent).toContain('recipientId!: string;');
      expect(baseContent).toContain('recipientType!: string;');
      expect(baseContent).toContain('actorId?: string;');
      expect(baseContent).toContain('actorType?: string;');

      // Verify both getter methods
      expect(baseContent).toContain('async getRecipient<T extends ObjectLiteral>()');
      expect(baseContent).toContain('async getActor<T extends ObjectLiteral>()');

      // Verify method names are correct
      expect(baseContent).toContain('getRepository(this.recipientType)');
      expect(baseContent).toContain('getRepository(this.actorType)');
    });
  });

  describe('Integration with Regular Fields', () => {
    it('should work alongside regular fields and relationships', () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'Like',
        fields: {
          user: {
            type: 'relation',
            relation: {
              entity: 'User',
              type: 'many-to-one'
            },
            required: true,
            description: 'User who liked'
          },
          likeable: {
            type: 'polymorphic',
            required: true,
            description: 'Polymorphic target'
          }
        }
      };

      const schemaPath = path.join(tempDir, 'Like.json');
      fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));

      const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
      const entity = EntityJsonParser.parseFile(schemaContent);

      const generator = new EntityGenerator(entity, projectRoot, tempDir);
      const result = generator.generate();

      const baseContent = fs.readFileSync(result.basePath, 'utf-8');

      // Verify relationship foreign key
      expect(baseContent).toContain('userId!: string;');

      // Verify polymorphic columns
      expect(baseContent).toContain('likeableId!: string;');
      expect(baseContent).toContain('likeableType!: string;');

      // Verify relationship method
      expect(baseContent).toContain('async getLikeable<T extends ObjectLiteral>()');

      // Verify proper imports for ObjectLiteral and DataSourceProvider
      expect(baseContent).toContain('ObjectLiteral');
      expect(baseContent).toContain('DataSourceProvider');
    });
  });

  describe('TypeMapper Integration', () => {
    it('should correctly map polymorphic field types', () => {
      const polymorphicField = {
        name: 'commentable',
        type: 'polymorphic',
        required: true
      };

      // Test TypeScript type mapping
      expect(TypeMapper.getTsType(polymorphicField, 'Comment')).toBe('string');

      // Test GraphQL type mapping
      expect(TypeMapper.getGraphQLType(polymorphicField, 'Comment')).toBe('String');

      // Test column name generation
      const columns = TypeMapper.getPolymorphicColumns('commentable');
      expect(columns.idColumn).toBe('commentableId');
      expect(columns.typeColumn).toBe('commentableType');

      // Test method name generation
      const methodName = TypeMapper.getPolymorphicGetterName('commentable');
      expect(methodName).toBe('getCommentable');
    });
  });

  describe('FieldPreparator Integration', () => {
    it('should prepare polymorphic fields correctly', () => {
      const entity = {
        name: 'Comment',
        fields: [
          {
            name: 'commentable',
            type: 'polymorphic',
            required: true,
            description: 'Polymorphic association'
          },
          {
            name: 'content',
            type: 'text',
            required: true
          }
        ]
      };

      const preparator = new FieldPreparator(entity);
      const fields = preparator.prepareEntityFields();
      const polymorphicMethods = preparator.getPolymorphicFields();

      // Should have polymorphic columns + regular fields
      expect(fields.length).toBe(3); // commentableId, commentableType, content

      const idField = fields.find(f => f.name === 'commentableId');
      const typeField = fields.find(f => f.name === 'commentableType');

      expect(idField).toBeDefined();
      expect(typeField).toBeDefined();
      expect(idField?.isPolymorphicId).toBe(true);
      expect(typeField?.isPolymorphicType).toBe(true);

      // Test polymorphic methods generation
      expect(polymorphicMethods.length).toBe(1);
      expect(polymorphicMethods[0]).toEqual({
        fieldName: 'commentable',
        methodName: 'getCommentable',
        idColumn: 'commentableId',
        typeColumn: 'commentableType',
        required: true
      });
    });
  });
});