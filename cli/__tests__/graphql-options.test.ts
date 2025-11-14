/**
 * Tests for enhanced GraphQL options functionality
 */

import { describe, test, expect } from 'vitest';
import { EntityJsonParser, EntityField } from '../parsers/EntityJsonParser.js';
import { GraphQLOptions } from '../generators/utils/GraphQLOptions.js';

describe('GraphQLOptions', () => {
  describe('Default behavior (graphql: true)', () => {
    test('should generate all applicable GraphQL by default', () => {
      const field: EntityField = {
        name: 'title',
        type: 'string',
        required: true,
        graphql: true
      };

      const options = new GraphQLOptions(field);

      expect(options.shouldGenerateObject()).toBe(true);
      expect(options.shouldGenerateInputs()).toBe(true);
      expect(options.shouldGenerateForeignKey()).toBe(false); // Not a relation field
      expect(options.shouldGenerateRelation()).toBe(false); // Not a relation field
      expect(options.shouldGenerateAny()).toBe(true);
    });

    test('should generate foreign key and relation for relation fields by default', () => {
      const field: EntityField = {
        name: 'author',
        type: 'relation',
        required: true,
        graphql: true,
        relationship: {
          targetEntity: 'User',
          type: 'ManyToOne'
        }
      };

      const options = new GraphQLOptions(field);

      expect(options.shouldGenerateObject()).toBe(true);
      expect(options.shouldGenerateInputs()).toBe(true);
      expect(options.shouldGenerateForeignKey()).toBe(true);
      expect(options.shouldGenerateRelation()).toBe(true);
      expect(options.shouldGenerateAny()).toBe(true);
    });
  });

  describe('No GraphQL (graphql: false)', () => {
    test('should not generate any GraphQL when explicitly disabled', () => {
      const field: EntityField = {
        name: 'title',
        type: 'string',
        required: true,
        graphql: false
      };

      const options = new GraphQLOptions(field);

      expect(options.shouldGenerateObject()).toBe(false);
      expect(options.shouldGenerateInputs()).toBe(false);
      expect(options.shouldGenerateForeignKey()).toBe(false);
      expect(options.shouldGenerateRelation()).toBe(false);
      expect(options.shouldGenerateAny()).toBe(false);
    });

    test('should not generate any GraphQL for relation fields when explicitly disabled', () => {
      const field: EntityField = {
        name: 'author',
        type: 'relation',
        required: true,
        graphql: false,
        relationship: {
          targetEntity: 'User',
          type: 'ManyToOne'
        }
      };

      const options = new GraphQLOptions(field);

      expect(options.shouldGenerateObject()).toBe(false);
      expect(options.shouldGenerateInputs()).toBe(false);
      expect(options.shouldGenerateForeignKey()).toBe(false);
      expect(options.shouldGenerateRelation()).toBe(false);
      expect(options.shouldGenerateAny()).toBe(false);
    });
  });

  describe('Granular control (graphql: array)', () => {
    test('should generate only object types when specified', () => {
      const field: EntityField = {
        name: 'title',
        type: 'string',
        required: true,
        graphql: ['object']
      };

      const options = new GraphQLOptions(field);

      expect(options.shouldGenerateObject()).toBe(true);
      expect(options.shouldGenerateInputs()).toBe(false);
      expect(options.shouldGenerateForeignKey()).toBe(false);
      expect(options.shouldGenerateRelation()).toBe(false);
      expect(options.shouldGenerateAny()).toBe(true);
    });

    test('should generate only input types when specified', () => {
      const field: EntityField = {
        name: 'password',
        type: 'string',
        required: true,
        graphql: ['inputs']
      };

      const options = new GraphQLOptions(field);

      expect(options.shouldGenerateObject()).toBe(false);
      expect(options.shouldGenerateInputs()).toBe(true);
      expect(options.shouldGenerateForeignKey()).toBe(false);
      expect(options.shouldGenerateRelation()).toBe(false);
      expect(options.shouldGenerateAny()).toBe(true);
    });

    test('should generate foreign key only for relation fields when specified', () => {
      const field: EntityField = {
        name: 'author',
        type: 'relation',
        required: true,
        graphql: ['foreignKey'],
        relationship: {
          targetEntity: 'User',
          type: 'ManyToOne'
        }
      };

      const options = new GraphQLOptions(field);

      expect(options.shouldGenerateObject()).toBe(false);
      expect(options.shouldGenerateInputs()).toBe(false);
      expect(options.shouldGenerateForeignKey()).toBe(true);
      expect(options.shouldGenerateRelation()).toBe(false);
      expect(options.shouldGenerateAny()).toBe(true);
    });

    test('should generate relation only for relation fields when specified', () => {
      const field: EntityField = {
        name: 'author',
        type: 'relation',
        required: true,
        graphql: ['relation'],
        relationship: {
          targetEntity: 'User',
          type: 'ManyToOne'
        }
      };

      const options = new GraphQLOptions(field);

      expect(options.shouldGenerateObject()).toBe(false);
      expect(options.shouldGenerateInputs()).toBe(false);
      expect(options.shouldGenerateForeignKey()).toBe(false);
      expect(options.shouldGenerateRelation()).toBe(true);
      expect(options.shouldGenerateAny()).toBe(true);
    });

    test('should generate multiple options when specified', () => {
      const field: EntityField = {
        name: 'author',
        type: 'relation',
        required: true,
        graphql: ['object', 'foreignKey'],
        relationship: {
          targetEntity: 'User',
          type: 'ManyToOne'
        }
      };

      const options = new GraphQLOptions(field);

      expect(options.shouldGenerateObject()).toBe(true);
      expect(options.shouldGenerateInputs()).toBe(false);
      expect(options.shouldGenerateForeignKey()).toBe(true);
      expect(options.shouldGenerateRelation()).toBe(false);
      expect(options.shouldGenerateAny()).toBe(true);
    });

    test('should generate all options when all are specified', () => {
      const field: EntityField = {
        name: 'author',
        type: 'relation',
        required: true,
        graphql: ['object', 'inputs', 'foreignKey', 'relation'],
        relationship: {
          targetEntity: 'User',
          type: 'ManyToOne'
        }
      };

      const options = new GraphQLOptions(field);

      expect(options.shouldGenerateObject()).toBe(true);
      expect(options.shouldGenerateInputs()).toBe(true);
      expect(options.shouldGenerateForeignKey()).toBe(true);
      expect(options.shouldGenerateRelation()).toBe(true);
      expect(options.shouldGenerateAny()).toBe(true);
    });
  });

  describe('Default behavior (undefined)', () => {
    test('should use default behavior when graphql is undefined', () => {
      const field: EntityField = {
        name: 'title',
        type: 'string',
        required: true
        // graphql: undefined
      };

      const options = new GraphQLOptions(field);

      expect(options.shouldGenerateObject()).toBe(true);
      expect(options.shouldGenerateInputs()).toBe(true);
      expect(options.shouldGenerateForeignKey()).toBe(false);
      expect(options.shouldGenerateRelation()).toBe(false);
      expect(options.shouldGenerateAny()).toBe(true);
    });
  });

  describe('getEnabledOptions method', () => {
    test('should return enabled options', () => {
      const field: EntityField = {
        name: 'author',
        type: 'relation',
        required: true,
        graphql: ['object', 'foreignKey'],
        relationship: {
          targetEntity: 'User',
          type: 'ManyToOne'
        }
      };

      const options = new GraphQLOptions(field);
      const enabledOptions = options.getEnabledOptions();

      expect(enabledOptions).toEqual(['object', 'foreignKey']);
    });

    test('should return empty array when no options are enabled', () => {
      const field: EntityField = {
        name: 'title',
        type: 'string',
        required: true,
        graphql: false
      };

      const options = new GraphQLOptions(field);
      const enabledOptions = options.getEnabledOptions();

      expect(enabledOptions).toEqual([]);
    });
  });

  describe('Legacy compatibility', () => {
    test('shouldIncludeGraphQL should work for foreign key', () => {
      const field: EntityField = {
        name: 'author',
        type: 'relation',
        required: true,
        graphql: ['foreignKey'],
        relationship: {
          targetEntity: 'User',
          type: 'ManyToOne'
        }
      };

      const options = new GraphQLOptions(field);

      expect(options.shouldIncludeGraphQL('foreignKey')).toBe(true);
      expect(options.shouldIncludeGraphQL('relation')).toBe(false);
    });

    test('shouldIncludeGraphQL should work for relation', () => {
      const field: EntityField = {
        name: 'author',
        type: 'relation',
        required: true,
        graphql: ['relation'],
        relationship: {
          targetEntity: 'User',
          type: 'ManyToOne'
        }
      };

      const options = new GraphQLOptions(field);

      expect(options.shouldIncludeGraphQL('foreignKey')).toBe(false);
      expect(options.shouldIncludeGraphQL('relation')).toBe(true);
    });
  });
});

describe('EntityJsonParser GraphQL options validation', () => {
  test('should validate graphql: false', () => {
    const schema = {
      name: 'TestEntity',
      fields: {
        title: {
          type: 'string',
          required: true,
          graphql: false
        }
      }
    };

    expect(() => {
      EntityJsonParser.parseFile(JSON.stringify(schema));
    }).not.toThrow();
  });

  test('should validate graphql: true', () => {
    const schema = {
      name: 'TestEntity',
      fields: {
        title: {
          type: 'string',
          required: true,
          graphql: true
        }
      }
    };

    expect(() => {
      EntityJsonParser.parseFile(JSON.stringify(schema));
    }).not.toThrow();
  });

  test('should validate graphql array with valid options', () => {
    const schema = {
      name: 'TestEntity',
      fields: {
        title: {
          type: 'string',
          required: true,
          graphql: ['object', 'inputs']
        }
      }
    };

    expect(() => {
      EntityJsonParser.parseFile(JSON.stringify(schema));
    }).not.toThrow();
  });

  test('should reject graphql array with invalid options', () => {
    const schema = {
      name: 'TestEntity',
      fields: {
        title: {
          type: 'string',
          required: true,
          graphql: ['invalid', 'options']
        }
      }
    };

    expect(() => {
      EntityJsonParser.parseFile(JSON.stringify(schema));
    }).toThrow(/graphql array has invalid options: invalid, options/);
  });

  test('should reject relation fields using foreignKey/relation options without relation type', () => {
    const schema = {
      name: 'TestEntity',
      fields: {
        title: {
          type: 'string',
          required: true,
          graphql: ['foreignKey', 'relation']
        }
      }
    };

    expect(() => {
      EntityJsonParser.parseFile(JSON.stringify(schema));
    }).toThrow(/cannot use 'foreignKey' or 'relation' options because it's not a relation field/);
  });

  test('should reject non-boolean, non-array graphql values', () => {
    const schema = {
      name: 'TestEntity',
      fields: {
        title: {
          type: 'string',
          required: true,
          graphql: { object: true } // Object format is no longer supported
        }
      }
    };

    expect(() => {
      EntityJsonParser.parseFile(JSON.stringify(schema));
    }).toThrow(/graphql property must be boolean or array/);
  });
});