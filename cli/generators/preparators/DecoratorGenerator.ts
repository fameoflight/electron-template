/**
 * DecoratorGenerator - Creates type-safe decorator strings using actual decorator functions
 *
 * Instead of manually building decorator strings, this uses the actual decorator functions
 * to ensure type safety and consistency across generated and manual code.
 */

import { ParsedEntity, EntityField } from '../../parsers/EntityJsonParser.js';
import { TypeMapper } from '../utils/TypeMapper.js';
import { FieldColumnOptions } from '../../../main/base/graphql/decorators/fields/types.js';

export class DecoratorGenerator {
  /**
   * Creates a FieldColumn decorator string for regular fields
   *
   * @param field - Field definition from entity schema
   * @param entityName - Name of the entity (for context)
   * @returns Decorator string for the field
   */
  static createFieldColumn(field: EntityField, entityName: string): string {
    if (field.relationship) {
      throw new Error('Use createForeignKeyFieldColumn for relationship foreign keys');
    }

    const options: FieldColumnOptions = {
      graphql: field.graphql !== false, // Default to true unless explicitly false
      required: field.required,
      description: field.description,
      unique: field.unique,
      defaultValue: field.defaultValue,
      maxLength: field.maxLength,
      minLength: field.minLength,
      pattern: field.pattern ? new RegExp(field.pattern) : undefined,
      array: field.array, // Add array support
    };

    // Handle special field types
    switch (field.type) {
      case 'text':
        return this.createFieldColumnDecorator('String', options);

      case 'string':
        // Handle email as a special string type
        if (field.name.toLowerCase().includes('email')) {
          return this.createFieldColumnDecorator('String', {
            ...options,
            email: true,
          });
        }
        return this.createFieldColumnDecorator('String', options);

      case 'number':
        return this.createFieldColumnDecorator('Number', {
          ...options,
          min: field.min,
          max: field.max,
        });

      case 'boolean':
        return this.createFieldColumnDecorator('Boolean', options);

      case 'date':
        return this.createFieldColumnDecorator('Date', options);

      case 'uuid':
        return this.createFieldColumnDecorator('String', {
          ...options,
          isUUID: true,
        });

      case 'json':
        // For JSON fields, we'll handle separately in the template
        // since they need schema-based generation
        throw new Error('JSON fields should be handled separately with schemas');

      case 'enum':
        // Enum fields are handled separately by FieldColumnEnum
        throw new Error('Enum fields should be handled by FieldColumnEnum');

      default:
        throw new Error(`Unsupported field type: ${field.type}`);
    }
  }

  /**
   * Creates a FieldColumn decorator for foreign key fields
   *
   * @param field - Relationship field definition
   * @returns Decorator string for the foreign key field
   */
  static createForeignKeyFieldColumn(field: EntityField): string {
    let includeGraphQL = true;

    // Check fine-grained GraphQL control
    if (field.graphql === false) {
      includeGraphQL = false;
    } else if (Array.isArray(field.graphql) && !field.graphql.includes('foreignKey')) {
      includeGraphQL = false;
    }

    // Combine foreign key description with field description
    const foreignKeyDesc = `Foreign key for ${field.name}`;
    const description = field.description
      ? `${field.description} (${foreignKeyDesc})`
      : foreignKeyDesc;

    const options: FieldColumnOptions = {
      graphql: includeGraphQL,
      required: field.required,
      description,
    };

    return this.createFieldColumnDecorator('String', {
      ...options,
      nullable: true, // Foreign keys are often nullable in the database
    });
  }

  /**
   * Creates a FieldColumn decorator string with proper TypeScript types
   *
   * @param typeName - TypeScript scalar type name ('String', 'Number', 'Boolean', 'Date')
   * @param options - FieldColumn options
   * @returns Decorator string that can be used in templates
   */
  private static createFieldColumnDecorator(
    typeName: string,
    options: FieldColumnOptions
  ): string {

    // Build options object string
    const optionPairs: string[] = [];

    if (options.graphql === false) {
      optionPairs.push('graphql: false');
    }

    if (options.required !== undefined) {
      optionPairs.push(`required: ${options.required}`);
    }

    if (options.description) {
      optionPairs.push(`description: '${options.description}'`);
    }

    if (options.unique) {
      optionPairs.push(`unique: ${options.unique}`);
    }

    if (options.maxLength !== undefined) {
      optionPairs.push(`maxLength: ${options.maxLength}`);
    }

    if (options.minLength !== undefined) {
      optionPairs.push(`minLength: ${options.minLength}`);
    }

    if (options.min !== undefined) {
      optionPairs.push(`min: ${options.min}`);
    }

    if (options.max !== undefined) {
      optionPairs.push(`max: ${options.max}`);
    }

    if (options.defaultValue !== undefined) {
      const value = typeof options.defaultValue === 'string'
        ? `'${options.defaultValue}'`
        : options.defaultValue;
      optionPairs.push(`defaultValue: ${value}`);
    }

    if (options.email) {
      optionPairs.push('email: true');
    }

    if (options.isUUID) {
      optionPairs.push('isUUID: true');
    }

    if (options.pattern) {
      optionPairs.push(`pattern: ${options.pattern}`);
    }

    if (options.array) {
      optionPairs.push(`array: ${options.array}`);
    }

    const optionsStr = optionPairs.length > 0 ? `{ ${optionPairs.join(', ')} }` : '';

    return `@FieldColumn(${typeName}${optionsStr ? ', ' + optionsStr : ''})`;
  }

  /**
   * Creates a FieldColumnEnum decorator string
   *
   * @param field - Enum field definition
   * @param entityName - Name of the entity
   * @returns Decorator string for enum field
   */
  static createFieldColumnEnum(field: EntityField, entityName: string): string {
    const fieldName = TypeMapper.singularizeFieldName(field.name);
    const enumName = TypeMapper.getEnumName(entityName, fieldName);

    const options: string[] = [];

    if (field.description) {
      options.push(`description: '${field.description}'`);
    }

    if (!field.required) {
      options.push('nullable: true');
    }

    if (field.array) {
      options.push('array: true');
    }

    if (field.defaultValue !== undefined) {
      const defaultValue = field.array
        ? `[${enumName}.${field.defaultValue}]`
        : `${enumName}.${field.defaultValue}`;
      options.push(`defaultValue: ${defaultValue}`);
    }

    const optionsStr = options.length > 0 ? `, { ${options.join(', ')} }` : '';

    return `@FieldColumnEnum(${enumName}${optionsStr})`;
  }

  /**
   * Creates a FieldColumnJSON decorator string
   *
   * @param field - JSON field definition
   * @param entityName - Name of the entity
   * @returns Decorator string for JSON field
   */
  static createFieldColumnJSON(field: EntityField, entityName: string): string {
    // Check if the field has a schema, itemSchema, or is a scalar array (which generates a schema)
    const hasSchema = !!(
      field.schema ||
      (field.array && field.itemSchema) ||
      (field.array && (field.type === 'string' || field.type === 'number' || field.type === 'boolean'))
    );

    let schemaName: string;
    if (hasSchema) {
      // Use the generated schema name
      schemaName = `${entityName}${field.name.charAt(0).toUpperCase() + field.name.slice(1)}Schema`;
    } else {
      // Fall back to z.any() for fields without schemas
      schemaName = 'z.any()';
    }

    const options: string[] = [];

    if (field.description) {
      options.push(`description: '${field.description}'`);
    }

    if (!field.required) {
      options.push('nullable: true');
    }

    if (field.defaultValue !== undefined) {
      options.push(`defaultValue: ${JSON.stringify(field.defaultValue)}`);
    }

    const optionsStr = options.length > 0 ? `, { ${options.join(', ')} }` : '';

    return `@FieldColumnJSON(${schemaName}${optionsStr})`;
  }

  /**
   * Creates a FieldColumn decorator for polymorphic ID columns
   *
   * @param field - Polymorphic field definition from entity schema
   * @param entityName - Name of the entity (for context)
   * @returns Decorator string for the polymorphic ID column
   */
  static createPolymorphicIdFieldColumn(field: EntityField, entityName: string): string {
    const options: FieldColumnOptions = {
      graphql: field.graphql !== false,
      required: field.required,
      description: field.description ? `${field.description} ID` : 'Polymorphic association to any entity ID',
      maxLength: 36, // UUID length
    };

    return this.createFieldColumnDecorator('String', options);
  }

  /**
   * Creates a FieldColumn decorator for polymorphic type columns
   *
   * @param field - Polymorphic field definition from entity schema
   * @param entityName - Name of the entity (for context)
   * @returns Decorator string for the polymorphic type column
   */
  static createPolymorphicTypeFieldColumn(field: EntityField, entityName: string): string {
    const options: FieldColumnOptions = {
      graphql: field.graphql !== false,
      required: field.required,
      description: field.description ? `${field.description} type` : 'Polymorphic association to any entity type',
    };

    return this.createFieldColumnDecorator('String', options);
  }
}