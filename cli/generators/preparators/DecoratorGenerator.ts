/**
 * DecoratorGenerator - Creates type-safe decorator strings using actual decorator functions
 *
 * Refactored to use Fluent Builder Pattern:
 * - Eliminates repetitive option building code
 * - Uses FieldColumnBuilder for clean, self-documenting decorator creation
 * - Reduced from 307 → ~200 lines by extracting builder logic
 */

import { ParsedEntity, EntityField } from '../../parsers/EntityJsonParser.js';
import { TypeMapper } from '../utils/TypeMapper.js';
import { FieldColumnOptions } from '../../../main/base/graphql/decorators/fields/types.js';
import { FieldColumnBuilder } from '../builders/decorators/FieldColumnBuilder.js';
import { FieldColumnEnumBuilder } from '../builders/decorators/FieldColumnEnumBuilder.js';
import { FieldColumnJSONBuilder } from '../builders/decorators/FieldColumnJSONBuilder.js';

export class DecoratorGenerator {
  /**
   * Creates a FieldColumn decorator string for regular fields
   * Uses fluent builder for clean decorator creation
   */
  static createFieldColumn(field: EntityField, entityName: string): string {
    if (field.relationship) {
      throw new Error('Use createForeignKeyFieldColumn for relationship foreign keys');
    }

    let builder: FieldColumnBuilder;

    // Select builder based on field type
    switch (field.type) {
      case 'text':
      case 'string':
        builder = FieldColumnBuilder.String();
        // Handle email as a special string type
        if (field.name.toLowerCase().includes('email')) {
          builder.email(true);
        }
        break;

      case 'number':
        builder = FieldColumnBuilder.Number();
        if (field.min !== undefined) builder.min(field.min);
        if (field.max !== undefined) builder.max(field.max);
        break;

      case 'boolean':
        builder = FieldColumnBuilder.Boolean();
        break;

      case 'date':
        builder = FieldColumnBuilder.Date();
        break;

      case 'uuid':
        builder = FieldColumnBuilder.String().isUUID(true);
        break;

      case 'json':
        throw new Error('JSON fields should be handled separately with schemas');

      case 'enum':
        throw new Error('Enum fields should be handled by FieldColumnEnum');

      default:
        throw new Error(`Unsupported field type: ${field.type}`);
    }

    // Apply common options using fluent API
    if (field.graphql === false) builder.graphql(false);
    if (field.required !== undefined) builder.required(field.required);
    if (field.description) builder.description(field.description);
    if (field.unique) builder.unique(true);
    if (field.defaultValue !== undefined) builder.defaultValue(field.defaultValue);
    if (field.maxLength !== undefined) builder.maxLength(field.maxLength);
    if (field.minLength !== undefined) builder.minLength(field.minLength);
    if (field.pattern) builder.pattern(new RegExp(field.pattern));
    if (field.array) builder.array(true);

    return builder.build();
  }

  /**
   * Creates a FieldColumn decorator for foreign key fields
   * Uses fluent builder for clean decorator creation
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

    const builder = FieldColumnBuilder.String()
      .graphql(includeGraphQL)
      .description(description);

    // Foreign keys: use required to control GraphQL nullability
    // If field.required is false/undefined, make it optional
    if (!field.required) {
      builder.required(false);
    }

    return builder.build();
  }

  /**
   * DEPRECATED: Use FieldColumnBuilder instead
   * Kept for backward compatibility but delegates to builder
   */
  private static createFieldColumnDecorator(
    typeName: string,
    options: FieldColumnOptions
  ): string {
    const builder = new FieldColumnBuilder(typeName);

    if (options.graphql === false) builder.graphql(false);
    if (options.required !== undefined) builder.required(options.required);
    if (options.description) builder.description(options.description);
    if (options.unique) builder.unique(true);
    if (options.maxLength !== undefined) builder.maxLength(options.maxLength);
    if (options.minLength !== undefined) builder.minLength(options.minLength);
    if (options.min !== undefined) builder.min(options.min);
    if (options.max !== undefined) builder.max(options.max);
    if (options.defaultValue !== undefined) builder.defaultValue(options.defaultValue);
    if (options.email) builder.email(true);
    if (options.isUUID) builder.isUUID(true);
    if (options.pattern) builder.pattern(options.pattern);
    if (options.array) builder.array(true);

    return builder.build();
  }

  /**
   * Creates a FieldColumnEnum decorator string
   * Uses fluent builder for clean decorator creation
   *
   * @param field - Enum field definition
   * @param entityName - Name of the entity
   * @returns Decorator string for enum field
   */
  static createFieldColumnEnum(field: EntityField, entityName: string): string {
    const fieldName = TypeMapper.singularizeFieldName(field.name);
    const enumName = TypeMapper.getEnumName(entityName, fieldName);

    const builder = FieldColumnEnumBuilder.create(enumName);

    if (field.description) builder.description(field.description);
    if (!field.required) builder.required(false);
    if (field.array) builder.array(true);
    if (field.defaultValue !== undefined) builder.defaultValue(String(field.defaultValue));

    return builder.build();
  }

  /**
   * Creates a FieldColumnJSON decorator string
   * Uses fluent builder for clean decorator creation
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

    const builder = FieldColumnJSONBuilder.create(schemaName);

    if (field.description) builder.description(field.description);
    if (field.defaultValue !== undefined) builder.defaultValue(field.defaultValue);
    if (!field.required) builder.required(false);

    return builder.build();
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