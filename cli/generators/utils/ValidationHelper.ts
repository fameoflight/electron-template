/**
 * ValidationHelper - Handles validation decorator generation and imports
 *
 * Centralizes all validation logic for consistency across templates
 */

import { EntityField } from '../../parsers/EntityJsonParser.js';
import { TypeMapper } from './TypeMapper.js';

export class ValidationHelper {
  /**
   * Gets required validator imports based on entity fields
   */
  static getRequiredValidators(fields: EntityField[]): string[] {
    const validators = new Set<string>();

    validators.add('IsString'); // Always needed for string fields

    for (const field of fields) {
      if (!field.required) {
        validators.add('IsOptional');
      }

      if (field.relationship) {
        validators.add('ValidateNested');
        continue;
      }

      switch (field.type) {
        case 'string':
        case 'text':
          validators.add('IsString');
          if (field.minLength) validators.add('MinLength');
          if (field.maxLength) validators.add('MaxLength');
          if (field.pattern) validators.add('Matches');
          break;
        case 'number':
          validators.add('IsNumber');
          break;
        case 'boolean':
          validators.add('IsBoolean');
          break;
        case 'date':
          validators.add('IsDate');
          break;
        case 'uuid':
          validators.add('IsUUID');
          break;
        case 'json':
          // Only add IsObject for JSON objects, not arrays
          if (!field.array) {
            validators.add('IsObject');
          }
          break;
      }
    }

    return Array.from(validators).sort();
  }

  /**
   * Generates validation decorators for a specific field
   */
  static getValidationDecorators(field: EntityField): string[] {
    const decorators: string[] = [];

    if (!field.required) {
      decorators.push('@IsOptional()');
    }

    switch (field.type) {
      case 'string':
      case 'text':
        decorators.push('@IsString()');
        if (field.minLength) {
          decorators.push(`@MinLength(${field.minLength})`);
        }
        if (field.maxLength) {
          decorators.push(`@MaxLength(${field.maxLength})`);
        }
        if (field.pattern) {
          decorators.push(`@Matches(/${field.pattern}/)`);
        }
        break;
      case 'number':
        decorators.push('@IsNumber()');
        break;
      case 'boolean':
        decorators.push('@IsBoolean()');
        break;
      case 'date':
        decorators.push('@IsDate()');
        break;
      case 'uuid':
        decorators.push('@IsUUID()');
        break;
      case 'json':
        // Only add IsObject for JSON objects, not arrays
        if (!field.array) {
          decorators.push('@IsObject()');
        }
        break;
    }

    return decorators;
  }

  /**
   * Generates column options for TypeORM @Column decorator
   */
  static getColumnOptions(field: EntityField): string[] {
    const options: string[] = [];

    // Type
    const columnType = TypeMapper.getColumnType(field);
    if (columnType) {
      options.push(`type: '${columnType}'`);
    }

    // Nullable
    if (!field.required) {
      options.push('required: false');
    }

    // Unique
    if (field.unique) {
      options.push('unique: true');
    }

    // Default value
    if (field.defaultValue !== undefined) {
      const defaultStr =
        typeof field.defaultValue === 'string'
          ? `'${field.defaultValue}'`
          : field.defaultValue;
      options.push(`default: ${defaultStr}`);
    }

    // Length
    if (field.maxLength) {
      options.push(`length: ${field.maxLength}`);
    }

    return options;
  }

  /**
   * Generates field options for GraphQL @Field decorator
   */
  static getFieldOptions(field: EntityField): string[] {
    const options: string[] = [];

    if (field.description) {
      options.push(`description: '${field.description}'`);
    }

    if (!field.required) {
      options.push('nullable: true');
    }

    return options;
  }
}