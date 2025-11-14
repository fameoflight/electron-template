import 'reflect-metadata';
import { z } from 'zod';
import { Column } from 'typeorm';
import { BaseField, BaseFieldOptions, FieldContext, PropertyDecorator } from './types.js';
import { ZodJSONTransformer } from '@base/utils/index.js';
import { zodToGraphQL } from '@shared/utils/zodToGraphQL.js';

/**
 * Unified base field JSON options that works for both entity and input contexts
 */
export interface BaseFieldJSONOptions extends BaseFieldOptions {
  // No additional JSON-specific options needed - schema provides everything
}

/**
 * Core unified JSON field decorator that provides common functionality
 * for both entity JSON fields (FieldColumnJSON) and input JSON fields (FieldInputJSON)
 *
 * This eliminates duplication between JSON decorators while handling:
 * - Zod schema validation and GraphQL type generation
 * - Context-aware behavior (entity vs input)
 * - Database transformers for entity context
 * - JSON validation for input context
 *
 * @param context - The context: 'entity' for database fields, 'input' for input types
 * @param schema - Zod schema for validation and GraphQL type generation
 * @param options - Configuration options (context-aware)
 *
 * @example
 * ```typescript
 * // Usage for entity JSON fields (FieldColumnJSON)
 * export function FieldColumnJSON(schema: z.ZodSchema, options: FieldColumnJSONOptions = {}) {
 *   return BaseFieldJSON('entity', schema, options);
 * }
 *
 * // Usage for input JSON fields (FieldInputJSON)
 * export function FieldInputJSON(schema: z.ZodSchema, options: FieldInputJSONOptions = {}) {
 *   return BaseFieldJSON('input', schema, options);
 * }
 * ```
 */
export function BaseFieldJSON(
  context: FieldContext = 'entity',
  schema: z.ZodObject<any> | z.ZodArray<any> | z.ZodRecord<any> | z.ZodAny | z.ZodDefault<any> | z.ZodOptional<any>,
  options: BaseFieldJSONOptions = {}
): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    // Auto-detect field name for error messages
    const fieldName = options.fieldName || (typeof propertyKey === 'string' ? propertyKey : 'field');

    // Use zodToGraphQL directly - it handles unwrapping internally
    const finalType = zodToGraphQL(schema);
    const autoDescription = options.description || schema.description;

    // Configure context-specific options
    let finalOptions: BaseFieldOptions = {
      ...options,
      description: autoDescription,
      isJSON: true
    };

    // Entity-specific configuration
    if (context === 'entity') {
      // Create transformer for JSON schema validation
      const finalTransformer = new ZodJSONTransformer(schema, fieldName);

      finalOptions = {
        ...finalOptions,
        columnType: 'json',
        transformer: finalTransformer,
        validations: false, // Disable validation for JSON fields (handled by transformer)
        // Set appropriate default value - only if explicitly provided
        defaultValue: options.defaultValue
      };
    } else {
      // Input-specific configuration
      finalOptions = {
        ...finalOptions,
        validations: true, // Enable validation for JSON input fields
        isJSON: true // Enable JSON validation
      };
    }

    // Apply unified BaseField with JSON-specific configuration
    BaseField(context, finalOptions, finalType)(target, propertyKey);

    // ──────────────────────────────────────────────────────────────────────────
    // 3. Apply TypeORM @Column Decorator (entity-specific only)
    // ──────────────────────────────────────────────────────────────────────────
    if (context === 'entity') {
      // Get the column configuration stored by BaseField
      const columnConfig = Reflect.getMetadata('basefield:columnconfig', target, propertyKey) || {};

      // Create final transformer for JSON schema validation
      const finalTransformer = new ZodJSONTransformer(schema, fieldName);

      const finalColumnConfig: any = {
        type: 'json',
        nullable: columnConfig.nullable || (options.defaultValue !== undefined),
        transformer: finalTransformer,
        ...(options.defaultValue !== undefined && { default: options.defaultValue }),
        ...(options.columnOptions && { ...options.columnOptions })
      };

      // Merge with explicit columnOptions (columnOptions takes precedence)
      const mergedColumnConfig = { ...finalColumnConfig, ...options.columnOptions };

      Column(mergedColumnConfig)(target, propertyKey);
    }
  };
}