import 'reflect-metadata';
import { Column } from 'typeorm';
import { FieldColumnOptions, PropertyDecorator } from './types.js';
import { BaseField } from './BaseField.js';
import { getDefaultColumnType } from './utils.js';
import { ArrayTransformer } from '../../../utils/ArrayTransformer.js';

/**
 * Core field column decorator that provides common functionality
 * for all field decorators (FieldColumn, FieldColumnEnum, FieldColumnJSON)
 *
 * Now uses unified BaseField to eliminate code duplication while maintaining
 * all existing functionality and backward compatibility.
 *
 * @param options - Configuration options
 * @param type - GraphQL/TypeScript type override
 * @param columnTypeOverride - Column type override
 *
 * @example
 * ```typescript
 * // Usage in FieldColumn
 * export function FieldColumn(type: ScalarType, options: FieldColumnOptions = {}) {
 *   return BaseFieldColumn(options, type, getDefaultColumnType(type));
 * }
 * ```
 */
export function BaseFieldColumn(
  options: FieldColumnOptions = {},
  type?: any,
  columnTypeOverride?: string,
): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    // ──────────────────────────────────────────────────────────────────────────
    // 1. Apply unified BaseField for GraphQL + validation logic
    // ──────────────────────────────────────────────────────────────────────────
    BaseField('entity', options, type, columnTypeOverride)(target, propertyKey);

    // ──────────────────────────────────────────────────────────────────────────
    // 2. Apply TypeORM @Column Decorator (entity-specific logic)
    // ──────────────────────────────────────────────────────────────────────────
    // Get the column configuration stored by BaseField
    const columnConfig = Reflect.getMetadata('basefield:columnconfig', target, propertyKey) || {};

    // Final type determination
    const finalType = type || options.enumType || String;
    const finalColumnType = columnTypeOverride || options.columnType || getDefaultColumnType(finalType);

    // For database columns: if there's a default value, the column can be nullable
    // even if the GraphQL field is required
    const databaseNullable = columnConfig.nullable ||
                             (options.defaultValue !== undefined) ||
                             (options.default !== undefined);

    const finalColumnConfig: any = {
      type: finalColumnType,
      nullable: databaseNullable
    };

    // Set default value with precedence: options.default > options.defaultValue
    const finalDefault = options.default ?? options.defaultValue;
    if (finalDefault !== undefined) {
      finalColumnConfig.default = finalDefault;
    }

    // Add optional column properties
    if (options.unique !== undefined) finalColumnConfig.unique = options.unique;
    if (options.transformer !== undefined) finalColumnConfig.transformer = options.transformer;
    if (options.length !== undefined) finalColumnConfig.length = options.length;
    if (options.precision !== undefined) finalColumnConfig.precision = options.precision;
    if (options.scale !== undefined) finalColumnConfig.scale = options.scale;
    if (options.enum !== undefined) finalColumnConfig.enum = options.enum;
    if (options.comment !== undefined) finalColumnConfig.comment = options.comment;
    if (options.select !== undefined) finalColumnConfig.select = options.select;

    // Handle array fields with automatic ArrayTransformer for SQLite compatibility
    if (options.array === true) {
      // For SQLite, we need to store arrays as JSON using ArrayTransformer
      // We don't pass array: true to TypeORM since SQLite doesn't support it natively
      // Instead, we use JSON column type with ArrayTransformer
      finalColumnConfig.type = 'json';

      // Only set transformer if not explicitly provided
      if (options.transformer === undefined) {
        // Don't pass a schema to ArrayTransformer - let it handle the basic array serialization
        // The transformer will work without validation for simple types
        finalColumnConfig.transformer = new ArrayTransformer(undefined, String(propertyKey));
      }
    }

    // Merge with explicit columnOptions (columnOptions takes precedence)
    const mergedColumnConfig = { ...finalColumnConfig, ...options.columnOptions };

    Column(mergedColumnConfig)(target, propertyKey);
  };
}