/**
 * Tests to validate the core implementation without file generation
 */

import { EntityJsonParser } from '@cli/parsers/EntityJsonParser';
import { InputPreparator } from '@cli/generators/preparators/InputPreparator';
import { FieldPreparator } from '@cli/generators/preparators/FieldPreparator';

describe('Entity Generator - Implementation Validation', () => {
  describe('Array Fields Parser Validation', () => {
    it('should parse string array fields with arrayOptions', () => {
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
      const tagsField = parsed.fields.find(f => f.name === 'tags');

      expect(tagsField).toBeDefined();
      expect(tagsField!.array).toBe(true);
      expect(tagsField!.arrayOptions).toEqual({
        maxLength: 10,
        minLength: 1,
        itemMaxLength: 25,
        uniqueItems: true
      });
    });

    it('should parse number array fields', () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'Metrics',
        fields: {
          name: { type: 'string', required: true },
          scores: {
            type: 'number',
            array: true,
            required: true,
            arrayOptions: {
              maxLength: 5,
              minLength: 1
            }
          }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));
      const scoresField = parsed.fields.find(f => f.name === 'scores');

      expect(scoresField).toBeDefined();
      expect(scoresField!.array).toBe(true);
      expect(scoresField!.required).toBe(true);
      expect(scoresField!.arrayOptions).toEqual({
        maxLength: 5,
        minLength: 1
      });
    });

    it('should parse boolean array fields', () => {
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
      const flagsField = parsed.fields.find(f => f.name === 'flags');

      expect(flagsField).toBeDefined();
      expect(flagsField!.array).toBe(true);
      expect(flagsField!.required).toBe(false);
      expect(flagsField!.arrayOptions).toBeUndefined();
    });

    it('should parse date array fields', () => {
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
      const remindersField = parsed.fields.find(f => f.name === 'reminders');

      expect(remindersField).toBeDefined();
      expect(remindersField!.array).toBe(true);
      expect(remindersField!.required).toBe(false);
      expect(remindersField!.arrayOptions).toEqual({
        maxLength: 3
      });
    });

    it('should parse enum array fields', () => {
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
      const prioritiesField = parsed.fields.find(f => f.name === 'priorities');

      expect(prioritiesField).toBeDefined();
      expect(prioritiesField!.array).toBe(true);
      expect(prioritiesField!.enum).toEqual(['low', 'medium', 'high']);
      expect(prioritiesField!.required).toBe(false);
    });
  });

  describe('Cascade Options Parser Validation', () => {
    it('should parse ManyToOne relationships with cascade options', () => {
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
      const postIdField = parsed.fields.find(f => f.name === 'postId');

      expect(postIdField).toBeDefined();
      expect(postIdField!.relationship).toEqual({
        targetEntity: 'Post',
        type: 'ManyToOne',
        cascade: ['insert', 'update'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
    });

    it('should parse OneToMany relationships with cascade options', () => {
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
      const commentIdsField = parsed.fields.find(f => f.name === 'commentIds');

      expect(commentIdsField).toBeDefined();
      expect(commentIdsField!.relationship).toEqual({
        targetEntity: 'Comment',
        type: 'OneToMany',
        cascade: ['remove']
      });
    });

    it('should parse ManyToMany relationships with cascade options', () => {
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
      const tagIdsField = parsed.fields.find(f => f.name === 'tagIds');

      expect(tagIdsField).toBeDefined();
      expect(tagIdsField!.relationship).toEqual({
        targetEntity: 'Tag',
        type: 'ManyToMany',
        cascade: ['insert', 'update', 'remove']
      });
    });

    it('should parse relationships with eager loading and cascade', () => {
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
      const relatedIdField = parsed.fields.find(f => f.name === 'relatedId');

      expect(relatedIdField).toBeDefined();
      expect(relatedIdField!.relationship).toEqual({
        targetEntity: 'Related',
        type: 'ManyToOne',
        eager: true,
        cascade: ['insert', 'update'],
        onDelete: 'CASCADE'
      });
    });
  });

  describe('GraphQL Operations Parser Validation', () => {
    it('should parse graphql array correctly', () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'ReadOnlyEntity',
        graphql: ['create', 'update', 'delete'],
        fields: {
          title: { type: 'string', required: true },
          content: { type: 'text', required: false }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      expect(parsed.graphql).toEqual(['create', 'update', 'delete']);
      expect(parsed.name).toBe('ReadOnlyEntity');
    });

    it('should handle empty graphql array', () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'TestEntity',
        graphql: [],
        fields: {
          name: { type: 'string', required: true }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      expect(parsed.graphql).toEqual([]);
    });

    it('should handle missing graphql field', () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'TestEntity',
        fields: {
          name: { type: 'string', required: true }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      expect(parsed.graphql).toBeUndefined();
    });

    it('should handle multiple graphql operations', () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'UpsertOnlyEntity',
        graphql: ['create', 'update', 'destroy', 'delete'],
        fields: {
          name: { type: 'string', required: true }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      expect(parsed.graphql).toEqual(['create', 'update', 'destroy', 'delete']);
    });
  });

  describe('Combined Features Validation', () => {
    it('should parse entity with all new features', () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'AdvancedEntity',
        graphql: ['delete'],  // Only delete operation allowed
        fields: {
          name: { type: 'string', required: true },
          tags: {
            type: 'string',
            array: true,
            required: false,
            arrayOptions: {
              maxLength: 10,
              uniqueItems: true
            }
          },
          categoryId: {
            type: 'string',
            required: true,
            relation: {
              entity: 'Category',
              type: 'many-to-one',
              eager: true,
              cascade: ['insert'],
              onDelete: 'CASCADE'
            }
          }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      // Check graphql
      expect(parsed.graphql).toEqual(['delete']);

      // Check array field
      const tagsField = parsed.fields.find(f => f.name === 'tags');
      expect(tagsField?.array).toBe(true);
      expect(tagsField?.arrayOptions?.maxLength).toBe(10);
      expect(tagsField?.arrayOptions?.uniqueItems).toBe(true);

      // Check relationship
      const categoryIdField = parsed.fields.find(f => f.name === 'categoryId');
      expect(categoryIdField?.relationship).toEqual({
        targetEntity: 'Category',
        type: 'ManyToOne',
        eager: true,
        cascade: ['insert'],
        onDelete: 'CASCADE'
      });
    });
  });

  describe('Field Type Filtering Validation', () => {
    it('should filter out fields without types from input generation', () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'TestEntity',
        fields: {
          validField: { type: 'string', required: true },
          fieldWithoutType: { required: false }, // No type specified
          anotherValidField: { type: 'number', required: false },
          relationshipField: {
            type: 'string',
            required: true,
            relation: {
              entity: 'OtherEntity',
              type: 'many-to-one'
            }
          }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      // Test InputPreparator
      const inputPreparator = new InputPreparator(parsed);
      const inputData = inputPreparator.prepareAllInputsData();

      // Should only include fields with types (validField, anotherValidField, relationshipFieldId)
      expect(inputData.createFields).toHaveLength(3);
      expect(inputData.createFields.map(f => f.name)).toEqual(expect.arrayContaining([
        'validField',
        'anotherValidField',
        'relationshipFieldId'
      ]));
      expect(inputData.createFields.some(f => f.name === 'fieldWithoutType')).toBe(false);

      // Test FieldPreparator
      const fieldPreparator = new FieldPreparator(parsed);
      const entityFields = fieldPreparator.prepareEntityFields();

      // Should only include fields with types or relationships with types
      expect(entityFields).toHaveLength(3);
      expect(entityFields.map(f => f?.name)).toEqual(expect.arrayContaining([
        'validField',
        'anotherValidField',
        'relationshipFieldId'
      ]));
      expect(entityFields.some(f => f?.name === 'fieldWithoutType')).toBe(false);
    });

    it('should filter out pure relationship fields (relationships without types) from entity fields', () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'EntityWithPureRelationship',
        fields: {
          name: { type: 'string', required: true },
          relatedEntity: { // Pure relationship field without type
            relation: {
              entity: 'RelatedEntity',
              type: 'many-to-one'
            }
          },
          foreignKeyField: { // Relationship field with type (foreign key)
            type: 'string',
            required: true,
            relation: {
              entity: 'AnotherEntity',
              type: 'one-to-many'
            }
          }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));
      const fieldPreparator = new FieldPreparator(parsed);
      const entityFields = fieldPreparator.prepareEntityFields();

      // Should include name field and relatedEntityId (relationship with type)
      // Should exclude relatedEntity (pure relationship without type)
      expect(entityFields).toHaveLength(2);
      expect(entityFields.map(f => f?.name)).toEqual(['name', 'relatedEntityId']);
      expect(entityFields.some(f => f?.name === 'relatedEntity')).toBe(false);

      // Test that relationships are still processed separately
      const relationshipFields = fieldPreparator.prepareRelationshipFields();
      expect(relationshipFields).toHaveLength(2);
      const relationshipNames = relationshipFields.map(f => f?.name);
      expect(relationshipNames).toContain('relatedEntity');
      expect(relationshipNames).toContain('foreignKeyField');
    });

    it('should handle empty entity with mixed field types correctly', () => {
      const schema = {
        $schema: './entity-schema.json',
        name: 'MinimalEntity',
        fields: {
          onlyValidField: { type: 'string', required: true },
          onlyInvalidField: { description: 'No type here' }, // No type
          anotherValidField: { type: 'boolean', required: false }
        }
      };

      const parsed = EntityJsonParser.parseFile(JSON.stringify(schema));

      const inputPreparator = new InputPreparator(parsed);
      const inputData = inputPreparator.prepareAllInputsData();

      // Should only include fields with types
      expect(inputData.createFields).toHaveLength(2);
      const createNames = inputData.createFields.map(f => f.name);
      expect(createNames).toHaveLength(2);
      expect(createNames).toEqual(expect.arrayContaining([
        'onlyValidField',
        'anotherValidField'
      ]));

      const fieldPreparator = new FieldPreparator(parsed);
      const entityFields = fieldPreparator.prepareEntityFields();

      // Should also only include fields with types
      expect(entityFields).toHaveLength(2);
      expect(entityFields.map(f => f?.name)).toEqual(
        expect.arrayContaining(['onlyValidField', 'anotherValidField'])
      );
    });
  });
});