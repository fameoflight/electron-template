/**
 * Tests for array field support in entity generation
 */

import { EntityJsonParser } from '@cli/parsers/EntityJsonParser';
import { EntityGenerator } from '@cli/generators/EntityGenerator';
import { GeneratorFactory } from '@cli/generators/GeneratorFactory';
import { getProjectRoot, getTempDir } from '@tests/base/utils';
import * as fs from 'fs';
import * as path from 'path';

describe('Entity Generator - Array Fields', () => {
  const tempDir = getTempDir('array-fields');
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

  describe('String Array Fields', () => {
    it('should generate string array fields correctly', async () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'Tag',
        fields: {
          name: { type: 'string', required: true },
          tags: {
            type: 'string',
            array: true,
            required: false,
            arrayOptions: {
              maxLength: 10,
              minLength: 1,
              itemMaxLength: 25,
              uniqueItems: true
            }
          }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      const generator = new EntityGenerator(parsed, projectRoot, tempDir);
      const result = await generator.generate();

      expect(fs.existsSync(result.basePath)).toBe(true);

      const generatedContent = fs.readFileSync(result.basePath, 'utf8');

      // Check for string array field generation
      expect(generatedContent).toContain('@FieldColumnJSON(TagTagsSchema, { nullable: true })');
      expect(generatedContent).toContain('tags?: string[]');
    });

    it('should generate required string arrays', async () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'Category',
        fields: {
          name: { type: 'string', required: true },
          keywords: {
            type: 'string',
            array: true,
            required: true
          }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      const generator = new EntityGenerator(parsed, projectRoot, tempDir);
      const result = await generator.generate();

      const generatedContent = fs.readFileSync(result.basePath, 'utf8');

      // Check for required string array
      expect(generatedContent).toContain('@FieldColumnJSON(CategoryKeywordsSchema)');
      expect(generatedContent).toContain('keywords!: string[]');
    });
  });

  describe('Number Array Fields', () => {
    it('should generate number array fields correctly', async () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'Metrics',
        fields: {
          name: { type: 'string', required: true },
          scores: {
            type: 'number',
            array: true,
            required: false,
            arrayOptions: {
              maxLength: 5,
              minLength: 1
            }
          }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      const generator = new EntityGenerator(parsed, projectRoot, tempDir);
      const result = await generator.generate();

      const generatedContent = fs.readFileSync(result.basePath, 'utf8');

      // Check for number array field generation
      expect(generatedContent).toContain('@FieldColumnJSON(MetricsScoresSchema, { nullable: true })');
      expect(generatedContent).toContain('scores?: number[]');
    });
  });

  describe('Boolean Array Fields', () => {
    it('should generate boolean array fields correctly', async () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'Feature',
        fields: {
          name: { type: 'string', required: true },
          flags: {
            type: 'boolean',
            array: true,
            required: false
          }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      const generator = new EntityGenerator(parsed, projectRoot, tempDir);
      const result = await generator.generate();

      const generatedContent = fs.readFileSync(result.basePath, 'utf8');

      // Check for boolean array field generation
      expect(generatedContent).toContain('@FieldColumnJSON(FeatureFlagsSchema, { nullable: true })');
      expect(generatedContent).toContain('flags?: boolean[]');
    });
  });

  describe('Date Array Fields', () => {
    it('should generate date array fields correctly', async () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'Event',
        fields: {
          title: { type: 'string', required: true },
          reminders: {
            type: 'date',
            array: true,
            required: false,
            arrayOptions: {
              maxLength: 3
            }
          }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      const generator = new EntityGenerator(parsed, projectRoot, tempDir);
      const result = await generator.generate();

      const generatedContent = fs.readFileSync(result.basePath, 'utf8');

      // Check for date array field generation
      expect(generatedContent).toContain('@FieldColumn(Date, { required: false, array: true })');
      expect(generatedContent).toContain('reminders?: Date[]');
    });
  });

  describe('Enum Array Fields', () => {
    it('should generate enum array fields correctly', async () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'Task',
        fields: {
          title: { type: 'string', required: true },
          priorities: {
            type: 'enum',
            enum: ['low', 'medium', 'high'],
            array: true,
            required: false
          }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      const generator = new EntityGenerator(parsed, projectRoot, tempDir);
      const result = await generator.generate();

      const generatedContent = fs.readFileSync(result.basePath, 'utf8');

      // Check for enum array field generation
      expect(generatedContent).toContain('@FieldColumnEnum(TaskPriority, { nullable: true, array: true })');
      expect(generatedContent).toContain('export enum TaskPriority');
      expect(generatedContent).toContain('low = \'low\'');
      expect(generatedContent).toContain('medium = \'medium\'');
      expect(generatedContent).toContain('high = \'high\'');
    });
  });

  describe('Array Options Validation', () => {
    it('should handle arrayOptions in the parsed entity', () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'TestEntity',
        fields: {
          name: { type: 'string', required: true },
          items: {
            type: 'string',
            array: true,
            required: false,
            arrayOptions: {
              maxLength: 10,
              minLength: 1,
              itemMaxLength: 50,
              uniqueItems: true
            }
          }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      const itemsField = parsed.fields.find(f => f.name === 'items');
      expect(itemsField).toBeDefined();
      expect(itemsField!.array).toBe(true);
      expect(itemsField!.arrayOptions).toEqual({
        maxLength: 10,
        minLength: 1,
        itemMaxLength: 50,
        uniqueItems: true
      });
    });

    it('should handle fields without array options', () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'SimpleEntity',
        fields: {
          name: { type: 'string', required: true },
          tags: {
            type: 'string',
            array: true,
            required: false
          }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      const tagsField = parsed.fields.find(f => f.name === 'tags');
      expect(tagsField).toBeDefined();
      expect(tagsField!.array).toBe(true);
      expect(tagsField!.arrayOptions).toBeUndefined();
    });
  });
});