/**
 * Tests for cascade options in relationship generation
 */

import { EntityJsonParser } from '@cli/parsers/EntityJsonParser';
import { EntityGenerator } from '@cli/generators/EntityGenerator';
import { getProjectRoot, getTempDir } from '@tests/base/utils';
import * as fs from 'fs';
import * as path from 'path';

describe('Entity Generator - Cascade Options', () => {
  const tempDir = getTempDir('cascade-options');
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

  describe('ManyToOne Relationships with Cascade', () => {
    it('should generate ManyToOne relationships with cascade options', async () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'Comment',
        fields: {
          content: { type: 'text', required: true },
          postId: {
            type: 'string',
            required: true,
            relation: {
              entity: 'Post',
              type: 'many-to-one',
              cascade: ['insert', 'update'],
              onDelete: 'CASCADE',
              onUpdate: 'CASCADE'
            }
          }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      const generator = new EntityGenerator(parsed, projectRoot, tempDir);
      const result = await generator.generate();

      const generatedContent = fs.readFileSync(result.basePath, 'utf8');

      // Check for cascade options in ManyToOne decorator
      expect(generatedContent).toContain('@ManyToOne(() => Post, { cascade: ["insert", "update"], onDelete: "CASCADE", onUpdate: "CASCADE" })');
      expect(generatedContent).toContain('@JoinColumn({ name: \'postId\' })');
    });

    it('should generate ManyToOne relationships with full cascade', async () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'LineItem',
        fields: {
          quantity: { type: 'number', required: true },
          orderId: {
            type: 'string',
            required: true,
            relation: {
              entity: 'Order',
              type: 'many-to-one',
              cascade: ['insert', 'update', 'remove', 'soft-remove', 'recover']
            }
          }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      const generator = new EntityGenerator(parsed, projectRoot, tempDir);
      const result = await generator.generate();

      const generatedContent = fs.readFileSync(result.basePath, 'utf8');

      // Check for full cascade options
      expect(generatedContent).toContain('@ManyToOne(() => Order, { cascade: ["insert", "update", "remove", "soft-remove", "recover"] })');
    });
  });

  describe('OneToMany Relationships with Cascade', () => {
    it('should generate OneToMany relationships with cascade options', async () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'Post',
        fields: {
          title: { type: 'string', required: true },
          commentIds: {
            type: 'string',
            array: true,
            required: false,
            relation: {
              entity: 'Comment',
              type: 'one-to-many',
              cascade: ['remove']
            }
          }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      const generator = new EntityGenerator(parsed, projectRoot, tempDir);
      const result = await generator.generate();

      const generatedContent = fs.readFileSync(result.basePath, 'utf8');

      // Check for cascade options in OneToMany decorator
      expect(generatedContent).toContain('@OneToMany(() => Comment, { cascade: ["remove"] })');
    });
  });

  describe('ManyToMany Relationships with Cascade', () => {
    it('should generate ManyToMany relationships with cascade options', async () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'Post',
        fields: {
          title: { type: 'string', required: true },
          tagIds: {
            type: 'string',
            array: true,
            required: false,
            relation: {
              entity: 'Tag',
              type: 'many-to-many',
              cascade: ['insert', 'update', 'remove']
            }
          }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      const generator = new EntityGenerator(parsed, projectRoot, tempDir);
      const result = await generator.generate();

      const generatedContent = fs.readFileSync(result.basePath, 'utf8');

      // Check for cascade options in ManyToMany decorator
      expect(generatedContent).toContain('@ManyToMany(() => Tag, { cascade: ["insert", "update", "remove"] })');
    });
  });

  describe('OneToOne Relationships with Cascade', () => {
    it('should generate OneToOne relationships with cascade options', async () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'AppUser',
        fields: {
          name: { type: 'string', required: true },
          profileId: {
            type: 'string',
            required: false,
            relation: {
              entity: 'Profile',
              type: 'one-to-one',
              cascade: ['insert', 'update', 'remove']
            }
          }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      const generator = new EntityGenerator(parsed, projectRoot, tempDir);
      const result = await generator.generate();

      const generatedContent = fs.readFileSync(result.basePath, 'utf8');

      // Check for cascade options in OneToOne decorator
      expect(generatedContent).toContain('@OneToOne(() => Profile, { cascade: ["insert", "update", "remove"] })');
      expect(generatedContent).toContain('@JoinColumn({ name: \'profileId\' })');
    });
  });

  describe('Relationship Options Parsing', () => {
    it('should parse cascade options correctly', () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'TestEntity',
        fields: {
          name: { type: 'string', required: true },
          relatedId: {
            type: 'string',
            required: true,
            relation: {
              entity: 'Related',
              type: 'many-to-one',
              cascade: ['insert', 'update'],
              onDelete: 'SET NULL',
              onUpdate: 'RESTRICT'
            }
          }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      const relatedField = parsed.fields.find(f => f.name === 'relatedId');
      expect(relatedField).toBeDefined();
      expect(relatedField!.relationship).toEqual({
        targetEntity: 'Related',
        type: 'ManyToOne',
        cascade: ['insert', 'update'],
        onDelete: 'SET NULL',
        onUpdate: 'RESTRICT'
      });
    });

    it('should handle relationships without cascade options', () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'SimpleEntity',
        fields: {
          name: { type: 'string', required: true },
          relatedId: {
            type: 'string',
            required: true,
            relation: {
              entity: 'Related',
              type: 'many-to-one'
            }
          }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      const relatedField = parsed.fields.find(f => f.name === 'relatedId');
      expect(relatedField).toBeDefined();
      expect(relatedField!.relationship).toEqual({
        targetEntity: 'Related',
        type: 'ManyToOne'
      });
    });

    it('should handle relationships with eager loading and cascade', async () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'EntityWithEagerAndCascade',
        fields: {
          name: { type: 'string', required: true },
          relatedId: {
            type: 'string',
            required: true,
            relation: {
              entity: 'Related',
              type: 'many-to-one',
              eager: true,
              cascade: ['insert', 'update'],
              onDelete: 'CASCADE'
            }
          }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      const generator = new EntityGenerator(parsed, projectRoot, tempDir);
      const result = await generator.generate();

      const generatedContent = fs.readFileSync(result.basePath, 'utf8');

      // Check for both eager and cascade options
      expect(generatedContent).toContain('@ManyToOne(() => Related, { eager: true, cascade: ["insert", "update"], onDelete: "CASCADE" })');
    });
  });

  describe('Foreign Key Constraints', () => {
    it('should include onDelete and onUpdate in relationship decorators', async () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'Child',
        fields: {
          name: { type: 'string', required: true },
          parentId: {
            type: 'string',
            required: true,
            relation: {
              entity: 'Parent',
              type: 'many-to-one',
              onDelete: 'CASCADE',
              onUpdate: 'CASCADE'
            }
          }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      const generator = new EntityGenerator(parsed, projectRoot, tempDir);
      const result = await generator.generate();

      const generatedContent = fs.readFileSync(result.basePath, 'utf8');

      // Check for foreign key constraint options
      expect(generatedContent).toContain('@ManyToOne(() => Parent, { onDelete: "CASCADE", onUpdate: "CASCADE" })');
      expect(generatedContent).toContain('@JoinColumn({ name: \'parentId\' })');
    });
  });
});