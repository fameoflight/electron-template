/**
 * EntityJsonParser - Parse entity JSON schema files
 *
 * Converts JSON entity definitions into structured format for code generation.
 * Much simpler than DSL parsing - just parse JSON and transform!
 */

export interface EntityFieldJson {
  type?: 'string' | 'text' | 'number' | 'boolean' | 'date' | 'uuid' | 'json' | 'enum' | 'relation' | 'polymorphic' | 'key';
  required?: boolean;
  unique?: boolean;
  default?: string | number | boolean | string[] | number[] | boolean[];
  description?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  enum?: string[];
  array?: boolean;
  graphql?: boolean | string[]; // Control GraphQL exposure (default: true)
  key?: string; // Custom foreign key field name
  arrayOptions?: {
    maxLength?: number; // Maximum number of items in array
    minLength?: number; // Minimum number of items in array
    itemMaxLength?: number; // Max length per item (for string arrays)
    itemMinLength?: number; // Min length per item (for string arrays)
    uniqueItems?: boolean; // Whether array items must be unique
  };
  itemSchema?: {
    type: 'object';
    properties: Record<string, { type: string }>;
    required: string[];
  };
  schema?: {
    type: 'object';
    properties: Record<string, { type: string; format?: string; examples?: string[] }>;
    required: string[];
  };
  relation?: {
    entity: string;
    type: 'many-to-one' | 'one-to-many' | 'many-to-many' | 'one-to-one';
    eager?: boolean;
    cascade?: ('insert' | 'update' | 'remove' | 'soft-remove' | 'recover')[];
    onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
    onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
    joinColumn?: string;
  };
  foreignKey?: {
    targetEntity: string;
  };
}

export interface EntitySchemaJson {
  name: string;
  description?: string;
  indexes?: (string | string[])[];
  graphql?: boolean | ('create' | 'createUpdate' | 'update' | 'delete' | 'destroy' | 'list' | 'array' | 'single')[];
  fields: Record<string, EntityFieldJson>;
}

export interface EntityField {
  name: string;
  type?: 'string' | 'text' | 'number' | 'boolean' | 'date' | 'uuid' | 'json' | 'enum' | 'relation' | 'polymorphic' | 'key';
  required: boolean;
  unique?: boolean;
  defaultValue?: string | number | boolean | string[] | number[] | boolean[];
  description?: string;
  maxLength?: number;
  minLength?: number;
  min?: number; // For number fields
  max?: number; // For number fields
  pattern?: string;
  enum?: string[];
  array?: boolean;
  graphql?: boolean | string[]; // Control GraphQL exposure (default: true)
  key?: string; // Custom foreign key field name
  arrayOptions?: {
    maxLength?: number; // Maximum number of items in array
    minLength?: number; // Minimum number of items in array
    itemMaxLength?: number; // Max length per item (for string arrays)
    itemMinLength?: number; // Min length per item (for string arrays)
    uniqueItems?: boolean; // Whether array items must be unique
  };
  itemSchema?: {
    type: 'object';
    properties: Record<string, { type: string }>;
    required: string[];
  };
  schema?: {
    type: 'object';
    properties: Record<string, { type: string; format?: string; examples?: string[] }>;
    required: string[];
  };
  relationship?: {
    targetEntity: string;
    type: 'ManyToOne' | 'OneToMany' | 'ManyToMany' | 'OneToOne';
    eager?: boolean;
    cascade?: ('insert' | 'update' | 'remove' | 'soft-remove' | 'recover')[];
    onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
    onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
    joinColumn?: string;
  };
  foreignKey?: {
    targetEntity: string;
  };
}

export interface ParsedEntity {
  name: string;
  fields: EntityField[];
  indexes: (string | string[])[]; // Single field or composite
  description?: string;
  graphql?: boolean | ('create' | 'createUpdate' | 'update' | 'delete' | 'destroy' | 'list' | 'array' | 'single')[];
}

export class EntityJsonParser {
  /**
   * Parse entity JSON file with validation
   */
  static parseFile(content: string): ParsedEntity {
    // Parse JSON
    const schema: EntitySchemaJson = JSON.parse(content);


    // Validate against schema
    const validationError = this.validateSchema(schema);
    if (validationError) {
      throw new Error(`Schema validation failed: ${validationError}`);
    }

    return {
      name: schema.name,
      description: schema.description,
      indexes: schema.indexes || [],
      graphql: schema.graphql,
      fields: Object.entries(schema.fields).map(([fieldName, fieldDef]) =>
        this.transformField(fieldName, fieldDef)
      ),
    };
  }

  /**
   * Validate entity schema against business rules
   */
  private static validateSchema(schema: EntitySchemaJson): string | null {
    // Basic structure validation
    if (!schema.name || typeof schema.name !== 'string') {
      return 'Entity name is required and must be a string';
    }

    if (!/^[A-Z][a-zA-Z0-9]*$/.test(schema.name)) {
      return 'Entity name must be PascalCase (e.g., "User", "BlogPost")';
    }

    if (!schema.fields || typeof schema.fields !== 'object') {
      return 'Fields are required and must be an object';
    }

    // Validate each field
    for (const [fieldName, fieldDef] of Object.entries(schema.fields)) {
      const fieldError = this.validateField(fieldName, fieldDef);
      if (fieldError) return fieldError;
    }

    // Validate graphql configuration
    if (schema.graphql !== undefined) {
      if (typeof schema.graphql !== 'boolean' && !Array.isArray(schema.graphql)) {
        return 'Entity graphql property must be boolean or array';
      }

      if (Array.isArray(schema.graphql)) {
        const validOptions = ['create', 'createUpdate', 'update', 'delete', 'destroy', 'list', 'array', 'single'];
        const invalidOptions = schema.graphql.filter(option => !validOptions.includes(option));
        if (invalidOptions.length > 0) {
          return `Entity graphql array has invalid options: ${invalidOptions.join(', ')}. Allowed: ${validOptions.join(', ')}`;
        }
      }
    }

    return null;
  }

  /**
   * Validate individual field definition
   */
  private static validateField(fieldName: string, field: EntityFieldJson): string | null {
    // Field name validation
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(fieldName)) {
      return `Field name "${fieldName}" must be a valid JavaScript identifier (camelCase)`;
    }

    // Type validation
    if (field.type && field.type === 'relation') {
      if (!field.relation) {
        return `Field "${fieldName}" has type "relation" but missing "relation" configuration`;
      }

      if (!field.relation.entity || !field.relation.type) {
        return `Field "${fieldName}" relation must specify both "entity" and "type"`;
      }

      const validTypes = ['many-to-one', 'one-to-many', 'many-to-many', 'one-to-one'];
      if (!validTypes.includes(field.relation.type)) {
        return `Field "${fieldName}" has invalid relation type "${field.relation.type}". Must be one of: ${validTypes.join(', ')}`;
      }
    }

    // Enum validation
    if (field.type === 'enum') {
      if (!field.enum || !Array.isArray(field.enum) || field.enum.length === 0) {
        return `Field "${fieldName}" has type "enum" but no enum values defined`;
      }
    }

    // GraphQL configuration validation
    if (field.graphql !== undefined) {
      if (typeof field.graphql !== 'boolean' && !Array.isArray(field.graphql)) {
        return `Field "${fieldName}" graphql property must be boolean or array`;
      }

      if (Array.isArray(field.graphql)) {
        const validOptions = ['object', 'inputs', 'foreignKey', 'relation'];
        const invalidOptions = field.graphql.filter(option => !validOptions.includes(option));
        if (invalidOptions.length > 0) {
          return `Field "${fieldName}" graphql array has invalid options: ${invalidOptions.join(', ')}. Allowed: ${validOptions.join(', ')}`;
        }

        // 'foreignKey' and 'relation' can only be used with 'relation' type fields
        if (field.graphql.includes('foreignKey') || field.graphql.includes('relation')) {
          if (field.type !== 'relation') {
            return `Field "${fieldName}" cannot use 'foreignKey' or 'relation' options because it's not a relation field`;
          }
        }
      }
    }

    // Key validation
    if (field.key !== undefined) {
      if (typeof field.key !== 'string') {
        return `Field "${fieldName}" key property must be a string`;
      }

      if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(field.key)) {
        return `Field "${fieldName}" key "${field.key}" must be a valid JavaScript identifier`;
      }
    }

    return null;
  }

  private static transformField(
    name: string,
    def: EntityFieldJson
  ): EntityField {
    const field: EntityField = {
      name,
      type: def.type,
      required: def.required ?? true, // Required by default
    };

    // Copy optional properties from JSON schema to EntityField
    if (def.unique) field.unique = def.unique;
    // 🎯 Map JSON 'default' to EntityField 'defaultValue' for input field generation
    if (def.default !== undefined) field.defaultValue = def.default;
    if (def.description) field.description = def.description;
    if (def.maxLength) field.maxLength = def.maxLength;
    if (def.minLength) field.minLength = def.minLength;
    if (def.pattern) field.pattern = def.pattern;
    if (def.enum) field.enum = def.enum;
    if (def.array) field.array = def.array;
    if (def.arrayOptions) field.arrayOptions = def.arrayOptions;
    if (def.itemSchema) field.itemSchema = def.itemSchema;
    if (def.schema) field.schema = def.schema;
    if (def.graphql !== undefined) field.graphql = def.graphql;
    if (def.key) field.key = def.key;

    // Transform relationship
    if (def.relation) {
      field.relationship = {
        targetEntity: def.relation.entity,
        type: this.normalizeRelationType(def.relation.type),
        eager: def.relation.eager,
        cascade: def.relation.cascade,
        onDelete: def.relation.onDelete,
        onUpdate: def.relation.onUpdate,
        joinColumn: def.relation.joinColumn,
      };
    }

    // Transform foreign key
    if (def.foreignKey) {
      field.foreignKey = {
        targetEntity: def.foreignKey.targetEntity,
      };
    }

    return field;
  }

  private static normalizeRelationType(
    type: string
  ): 'ManyToOne' | 'OneToMany' | 'ManyToMany' | 'OneToOne' {
    const mapping: Record<string, any> = {
      'many-to-one': 'ManyToOne',
      'one-to-many': 'OneToMany',
      'many-to-many': 'ManyToMany',
      'one-to-one': 'OneToOne',
    };
    return mapping[type] || 'ManyToOne';
  }
}
