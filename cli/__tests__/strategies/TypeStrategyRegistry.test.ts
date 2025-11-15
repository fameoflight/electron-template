/**
 * TypeStrategyRegistry Tests
 *
 * Example tests demonstrating how to test the Strategy + Registry pattern
 * Applied in Phase 1 of CLI refactoring
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TypeStrategyRegistry } from '../../generators/strategies/types/TypeStrategyRegistry.js';
import { EntityField } from '../../parsers/EntityJsonParser.js';

describe('TypeStrategyRegistry', () => {
  let registry: TypeStrategyRegistry;

  beforeEach(() => {
    registry = new TypeStrategyRegistry();
  });

  describe('Strategy Selection', () => {
    it('should select RelationshipTypeStrategy for relationship fields', () => {
      const field: EntityField = {
        name: 'user',
        type: 'string',
        relationship: {
          type: 'manyToOne',
          targetEntity: 'User'
        }
      };

      const strategy = registry.findStrategy(field);
      expect(strategy).toBeDefined();
      expect(strategy?.constructor.name).toBe('RelationshipTypeStrategy');
    });

    it('should select PolymorphicTypeStrategy for polymorphic fields', () => {
      const field: EntityField = {
        name: 'owner',
        type: 'polymorphic',
        polymorphicTypes: ['User', 'Organization']
      };

      const strategy = registry.findStrategy(field);
      expect(strategy).toBeDefined();
      expect(strategy?.constructor.name).toBe('PolymorphicTypeStrategy');
    });

    it('should select EnumTypeStrategy for enum fields', () => {
      const field: EntityField = {
        name: 'status',
        type: 'enum',
        values: ['pending', 'active', 'completed']
      };

      const strategy = registry.findStrategy(field);
      expect(strategy).toBeDefined();
      expect(strategy?.constructor.name).toBe('EnumTypeStrategy');
    });

    it('should select JsonArrayTypeStrategy for JSON array fields', () => {
      const field: EntityField = {
        name: 'tags',
        type: 'json',
        array: true
      };

      const strategy = registry.findStrategy(field);
      expect(strategy).toBeDefined();
      expect(strategy?.constructor.name).toBe('JsonArrayTypeStrategy');
    });

    it('should select JsonTypeStrategy for JSON fields', () => {
      const field: EntityField = {
        name: 'metadata',
        type: 'json'
      };

      const strategy = registry.findStrategy(field);
      expect(strategy).toBeDefined();
      expect(strategy?.constructor.name).toBe('JsonTypeStrategy');
    });

    it('should select ScalarTypeStrategy for scalar fields', () => {
      const field: EntityField = {
        name: 'name',
        type: 'string'
      };

      const strategy = registry.findStrategy(field);
      expect(strategy).toBeDefined();
      expect(strategy?.constructor.name).toBe('ScalarTypeStrategy');
    });
  });

  describe('TypeScript Type Generation', () => {
    it('should generate string type for relationship fields', () => {
      const field: EntityField = {
        name: 'userId',
        type: 'string',
        relationship: {
          type: 'manyToOne',
          targetEntity: 'User'
        }
      };

      const tsType = registry.getTsType('Post', 'user', field);
      expect(tsType).toBe('string');
    });

    it('should generate enum type for enum fields', () => {
      const field: EntityField = {
        name: 'status',
        type: 'enum',
        values: ['pending', 'active']
      };

      const tsType = registry.getTsType('Task', 'status', field);
      expect(tsType).toBe('TaskStatus');
    });

    it('should generate array type for enum arrays', () => {
      const field: EntityField = {
        name: 'tags',
        type: 'enum',
        values: ['work', 'personal'],
        array: true
      };

      const tsType = registry.getTsType('Task', 'tags', field);
      expect(tsType).toBe('TaskTag[]');
    });

    it('should generate Record<string, any> type for JSON fields', () => {
      const field: EntityField = {
        name: 'metadata',
        type: 'json'
      };

      const tsType = registry.getTsType('User', 'metadata', field);
      expect(tsType).toBe('Record<string, any>');
    });

    it('should generate number type for number fields', () => {
      const field: EntityField = {
        name: 'age',
        type: 'number'
      };

      const tsType = registry.getTsType('User', 'age', field);
      expect(tsType).toBe('number');
    });

    it('should generate boolean type for boolean fields', () => {
      const field: EntityField = {
        name: 'isActive',
        type: 'boolean'
      };

      const tsType = registry.getTsType('User', 'isActive', field);
      expect(tsType).toBe('boolean');
    });

    it('should generate Date type for date fields', () => {
      const field: EntityField = {
        name: 'createdAt',
        type: 'date'
      };

      const tsType = registry.getTsType('User', 'createdAt', field);
      expect(tsType).toBe('Date');
    });
  });

  describe('GraphQL Type Generation', () => {
    it('should generate String type for relationship fields', () => {
      const field: EntityField = {
        name: 'userId',
        type: 'string',
        relationship: {
          type: 'manyToOne',
          targetEntity: 'User'
        }
      };

      const graphqlType = registry.getGraphQLType('Post', 'user', field);
      expect(graphqlType).toBe('String');
    });

    it('should generate enum GraphQL type', () => {
      const field: EntityField = {
        name: 'status',
        type: 'enum',
        values: ['pending', 'active']
      };

      const graphqlType = registry.getGraphQLType('Task', 'status', field);
      expect(graphqlType).toBe('TaskStatus');
    });

    it('should generate [enum] for enum arrays', () => {
      const field: EntityField = {
        name: 'tags',
        type: 'enum',
        values: ['work', 'personal'],
        array: true
      };

      const graphqlType = registry.getGraphQLType('Task', 'tags', field);
      expect(graphqlType).toBe('[TaskTag!]');
    });

    it('should generate GraphQLJSONObject for JSON fields', () => {
      const field: EntityField = {
        name: 'metadata',
        type: 'json'
      };

      const graphqlType = registry.getGraphQLType('User', 'metadata', field);
      expect(graphqlType).toBe('GraphQLJSONObject');
    });

    it('should generate Number for number fields', () => {
      const field: EntityField = {
        name: 'age',
        type: 'number'
      };

      const graphqlType = registry.getGraphQLType('User', 'age', field);
      expect(graphqlType).toBe('Number');
    });

    it('should generate Boolean for boolean fields', () => {
      const field: EntityField = {
        name: 'isActive',
        type: 'boolean'
      };

      const graphqlType = registry.getGraphQLType('User', 'isActive', field);
      expect(graphqlType).toBe('Boolean');
    });

    it('should generate Date for date fields', () => {
      const field: EntityField = {
        name: 'createdAt',
        type: 'date'
      };

      const graphqlType = registry.getGraphQLType('User', 'createdAt', field);
      expect(graphqlType).toBe('Date');
    });
  });

  describe('Column Type Generation', () => {
    it('should generate varchar for string fields', () => {
      const field: EntityField = {
        name: 'name',
        type: 'string'
      };

      const columnType = registry.getColumnType(field);
      expect(columnType).toBe('varchar');
    });

    it('should generate text for text fields', () => {
      const field: EntityField = {
        name: 'description',
        type: 'text'
      };

      const columnType = registry.getColumnType(field);
      expect(columnType).toBe('text');
    });

    it('should generate integer for number fields', () => {
      const field: EntityField = {
        name: 'count',
        type: 'number'
      };

      const columnType = registry.getColumnType(field);
      expect(columnType).toBe('integer');
    });

    it('should generate boolean for boolean fields', () => {
      const field: EntityField = {
        name: 'isActive',
        type: 'boolean'
      };

      const columnType = registry.getColumnType(field);
      expect(columnType).toBe('boolean');
    });

    it('should generate datetime for date fields', () => {
      const field: EntityField = {
        name: 'createdAt',
        type: 'date'
      };

      const columnType = registry.getColumnType(field);
      expect(columnType).toBe('datetime');
    });

    it('should generate varchar for enum fields', () => {
      const field: EntityField = {
        name: 'status',
        type: 'enum',
        values: ['pending', 'active']
      };

      const columnType = registry.getColumnType(field);
      expect(columnType).toBe('varchar');
    });

    it('should generate json for JSON fields', () => {
      const field: EntityField = {
        name: 'metadata',
        type: 'json'
      };

      const columnType = registry.getColumnType(field);
      expect(columnType).toBe('json');
    });
  });

  describe('Priority Ordering', () => {
    it('should prioritize RelationshipTypeStrategy over ScalarTypeStrategy', () => {
      // Even though the field type is 'string', relationship should take precedence
      const field: EntityField = {
        name: 'userId',
        type: 'string',
        relationship: {
          type: 'manyToOne',
          targetEntity: 'User'
        }
      };

      const strategy = registry.findStrategy(field);
      expect(strategy?.constructor.name).toBe('RelationshipTypeStrategy');
      expect(strategy?.getPriority()).toBe(100);
    });

    it('should prioritize PolymorphicTypeStrategy over all others', () => {
      const field: EntityField = {
        name: 'owner',
        type: 'polymorphic',
        polymorphicTypes: ['User', 'Organization']
      };

      const strategy = registry.findStrategy(field);
      expect(strategy?.constructor.name).toBe('PolymorphicTypeStrategy');
      expect(strategy?.getPriority()).toBe(90);
    });

    it('should use ScalarTypeStrategy as fallback', () => {
      const field: EntityField = {
        name: 'name',
        type: 'string'
      };

      const strategy = registry.findStrategy(field);
      expect(strategy?.constructor.name).toBe('ScalarTypeStrategy');
      expect(strategy?.getPriority()).toBe(10); // Lowest priority
    });
  });

  describe('Edge Cases', () => {
    it('should handle field with no type', () => {
      const field: EntityField = {
        name: 'unknown',
        type: undefined as any
      };

      const strategy = registry.findStrategy(field);
      // Should still find a strategy (ScalarTypeStrategy)
      expect(strategy).toBeDefined();
    });

    it('should handle empty string type', () => {
      const field: EntityField = {
        name: 'field',
        type: '' as any
      };

      const strategy = registry.findStrategy(field);
      expect(strategy).toBeDefined();
    });

    it('should handle field with multiple matching conditions', () => {
      // Polymorphic field that also looks like it could be enum
      const field: EntityField = {
        name: 'owner',
        type: 'polymorphic',
        polymorphicTypes: ['User', 'Organization']
      };

      const strategy = registry.findStrategy(field);
      // Should select highest priority match (Polymorphic)
      expect(strategy?.constructor.name).toBe('PolymorphicTypeStrategy');
    });
  });
});
