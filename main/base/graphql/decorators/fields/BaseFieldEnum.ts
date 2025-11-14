import 'reflect-metadata';
import { registerEnumType } from 'type-graphql';
import { Column } from 'typeorm';
import { BaseField, BaseFieldOptions, FieldContext, PropertyDecorator } from './types.js';
import { createEnumDescription, detectEnumName } from './utils.js';
import { createEnumTransformer } from './EnumTransformer.js';

/**
 * Unified base field enum options that works for both entity and input contexts
 */
export interface BaseFieldEnumOptions extends BaseFieldOptions {
  // Enum-specific options
  enumName?: string; // Auto-generated if not provided
  enumDescription?: string; // Auto-generated if not provided
}

/**
 * Core unified enum field decorator that provides common functionality
 * for both entity enum fields (FieldColumnEnum) and input enum fields (FieldInputEnum)
 *
 * This eliminates duplication between enum decorators while handling:
 * - Enum registration with GraphQL
 * - Context-aware behavior (entity vs input)
 * - Array handling for enum fields
 * - Enum transformers for database storage
 *
 * @param context - The context: 'entity' for database fields, 'input' for input types
 * @param enumType - The enum type to use
 * @param options - Configuration options (context-aware)
 *
 * @example
 * ```typescript
 * // Usage for entity enum fields (FieldColumnEnum)
 * export function FieldColumnEnum(enumType: any, options: FieldColumnEnumOptions = {}) {
 *   return BaseFieldEnum('entity', enumType, options);
 * }
 *
 * // Usage for input enum fields (FieldInputEnum)
 * export function FieldInputEnum(enumType: any, options: FieldInputEnumOptions = {}) {
 *   return BaseFieldEnum('input', enumType, options);
 * }
 * ```
 */
export function BaseFieldEnum(
  context: FieldContext = 'entity',
  enumType: any,
  options: BaseFieldEnumOptions = {}
): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    const {
      enumName,
      enumDescription,
      array,
      ...baseFieldOptions
    } = options;

    // Auto-detect field name for error messages
    const fieldName = baseFieldOptions.fieldName || (typeof propertyKey === 'string' ? propertyKey : 'field');
    const propertyName = String(propertyKey);

    // Auto-determine enum name if not provided
    const finalEnumName = enumName || detectEnumName(enumType, propertyName, target);

    // Create smart description if not provided
    const smartDescription = enumDescription || baseFieldOptions.description || createEnumDescription(finalEnumName, target);

    // Auto-register enum with GraphQL if not already registered
    try {
      registerEnumType(enumType, {
        name: finalEnumName,
        description: smartDescription
      });
    } catch (error) {
      // Enum already registered, which is fine
      console.debug(`Enum ${finalEnumName} already registered`);
    }

    // Determine GraphQL type (arrays handled by BaseField array option)
    const graphqlType = enumType;

    // Configure context-specific options
    let finalOptions: BaseFieldOptions = {
      ...baseFieldOptions,
      enumType: graphqlType,
      description: baseFieldOptions.description || enumDescription,
      array: array
    };

    // Entity-specific configuration
    if (context === 'entity') {
      // Determine database column type and transformer
      const columnType = array ? 'simple-json' : 'text';
      const enumTransformer = array ? undefined : createEnumTransformer(enumType);

      finalOptions = {
        ...finalOptions,
        columnType,
        transformer: enumTransformer,
        // Set appropriate default value - only if explicitly provided
        // SQLite doesn't support empty array defaults, so we skip defaults for nullable fields
        defaultValue: baseFieldOptions.defaultValue
      };
    }

    // Apply unified BaseField with enum-specific configuration
    BaseField(context, finalOptions, graphqlType)(target, propertyKey);

    // ──────────────────────────────────────────────────────────────────────────
    // 3. Apply TypeORM @Column Decorator (entity-specific only)
    // ──────────────────────────────────────────────────────────────────────────
    if (context === 'entity') {
      // Get the column configuration stored by BaseField
      const columnConfig = Reflect.getMetadata('basefield:columnconfig', target, propertyKey) || {};

      // Create enum transformer for string ↔ number conversion
      // Only for non-array enums (arrays use simple-json)
      const enumTransformer = array ? undefined : createEnumTransformer(enumType);

      const finalColumnConfig: any = {
        type: columnConfig.columnType || (array ? 'simple-json' : 'text'),
        nullable: columnConfig.nullable || (options.defaultValue !== undefined),
        ...(enumTransformer && { transformer: enumTransformer }),
        ...(options.defaultValue !== undefined && { default: options.defaultValue }),
        ...(options.columnOptions && { ...options.columnOptions })
      };

      // Merge with explicit columnOptions (columnOptions takes precedence)
      const mergedColumnConfig = { ...finalColumnConfig, ...options.columnOptions };

      Column(mergedColumnConfig)(target, propertyKey);
    }
  };
}