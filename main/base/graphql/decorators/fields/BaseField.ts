import 'reflect-metadata';
import { Field } from 'type-graphql';
import { BaseFieldOptions, FieldContext, PropertyDecorator } from './types.js';
import {
  applyValidationDecorators,
  createFieldDescription,
  getDefaultColumnType
} from './utils.js';

/**
 * Core unified field decorator that provides common functionality
 * for both entity fields (FieldColumn) and input fields (FieldInput)
 *
 * This eliminates ~200 lines of duplication between BaseFieldColumn and BaseFieldInput
 * by handling the shared GraphQL + validation logic in a single place.
 *
 * @param context - The context: 'entity' for database fields, 'input' for input types
 * @param options - Configuration options (context-aware)
 * @param type - GraphQL/TypeScript type override
 * @param columnTypeOverride - Column type override (only used for entity context)
 *
 * @example
 * ```typescript
 * // Usage for entity fields (FieldColumn)
 * export function FieldColumn(type: ScalarType, options: FieldColumnOptions = {}) {
 *   return BaseField('entity', options, type, getDefaultColumnType(type));
 * }
 *
 * // Usage for input fields (FieldInput)
 * export function FieldInput(type: ScalarType, options: FieldInputOptions = {}) {
 *   return BaseField('input', options, type);
 * }
 * ```
 */
export function BaseField(
  context: FieldContext = 'entity',
  options: BaseFieldOptions = {},
  type?: any,
  columnTypeOverride?: string,
): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    // ──────────────────────────────────────────────────────────────────────────
    // 1. Determine Types and Description
    // ──────────────────────────────────────────────────────────────────────────
    const finalType = type || options.enumType || String;
    const smartDescription = options.description || createFieldDescription(String(propertyKey), finalType, target);

    // ──────────────────────────────────────────────────────────────────────────
    // 2. Determine Nullable Behavior (Context-Aware)
    // ──────────────────────────────────────────────────────────────────────────
    let finalNullable: boolean;

    if (options.nullable !== undefined) {
      // Explicit nullable takes precedence
      finalNullable = options.nullable;
    } else if (context === 'input' && options.contextRequired !== undefined) {
      // Input context with explicit contextRequired
      finalNullable = !options.contextRequired;
    } else if (options.required !== undefined) {
      // Explicit required behavior
      finalNullable = !options.required;
    } else {
      // Default behavior based on context
      if (context === 'input') {
        // Input context: check inputType for defaults
        if (options.inputType === 'update' || options.inputType === 'createUpdate') {
          finalNullable = true; // Update inputs are typically optional
        } else {
          finalNullable = false; // Create inputs default to required
        }
      } else {
        // Entity context: default to required
        finalNullable = false;
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. Apply GraphQL @Field Decorator
    // ──────────────────────────────────────────────────────────────────────────
    // For entity context, respect options.graphql setting
    // For input context, always apply GraphQL field
    const shouldApplyGraphQL = context === 'input' || options.graphql !== false;

    if (shouldApplyGraphQL) {
      const fieldOptions: any = {
        nullable: finalNullable,
        description: smartDescription
      };

      if (options.deprecationReason) {
        fieldOptions.deprecationReason = options.deprecationReason;
      }

      if (options.defaultValue !== undefined) {
        fieldOptions.defaultValue = options.defaultValue;
      }

      if (options.array !== undefined) {
        fieldOptions.array = options.array;
      }

      // 💾 Store default value in metadata for BaseInput.applyDefaultValues() to read during validation
      if (context === 'input' && options.defaultValue !== undefined) {
        Reflect.defineMetadata('field:default', options.defaultValue, target, propertyKey);
      }

      // Create type function for GraphQL
      const typeFunction = () => {
        const baseType = () => {
          if (finalType === String) return String;
          if (finalType === Number) return Number;
          if (finalType === Boolean) return Boolean;
          if (finalType === Date) return Date;
          return finalType;
        };

        // Handle arrays by returning array type
        return options.array ? [baseType()] : baseType();
      };

      Field(typeFunction, fieldOptions)(target, propertyKey);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 4. Apply Validation Decorators (Context-Aware)
    // ──────────────────────────────────────────────────────────────────────────
    if (options.validations !== false) {
      let validationRequired = options.required;

      if (context === 'input') {
        // For input fields, apply input-specific validation overrides
        const finalValidationOptions = {
          ...options,
          // Override validation settings with input-specific ones
          required: options.inputOnlyValidations?.required ?? options.required,
          minLength: options.inputOnlyValidations?.minLength ?? options.minLength,
          maxLength: options.inputOnlyValidations?.maxLength ?? options.maxLength,
          pattern: options.inputOnlyValidations?.pattern ?? options.pattern,
        };

        // For input fields, determine if @IsOptional should be applied based on context
        const isFieldOptional = finalNullable ||
                               options.inputType === 'update' ||
                               options.inputType === 'createUpdate';

        validationRequired = isFieldOptional ? false : finalValidationOptions.required;

        // Apply validation decorators with input-specific options
        applyValidationDecorators(target, propertyKey, {
          graphqlType: finalType,
          required: validationRequired,
          email: finalValidationOptions.email,
          minLength: finalValidationOptions.minLength,
          maxLength: finalValidationOptions.maxLength,
          min: finalValidationOptions.min,
          max: finalValidationOptions.max,
          enumType: finalValidationOptions.enumType,
          pattern: finalValidationOptions.pattern,
          isUrl: finalValidationOptions.isUrl,
          isUUID: finalValidationOptions.isUUID,
          isJSON: finalValidationOptions.isJSON,
          array: finalValidationOptions.array,
          customValidators: finalValidationOptions.customValidators
        });
      } else {
        // Entity context - apply validation with original options
        applyValidationDecorators(target, propertyKey, {
          graphqlType: finalType,
          required: validationRequired !== undefined ? validationRequired : true,
          email: options.email,
          minLength: options.minLength,
          maxLength: options.maxLength,
          min: options.min,
          max: options.max,
          enumType: options.enumType,
          pattern: options.pattern,
          isUrl: options.isUrl,
          isUUID: options.isUUID,
          isJSON: options.isJSON,
          customValidators: options.customValidators
        });
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 5. Return Context-Specific Configuration for Further Processing
    // ──────────────────────────────────────────────────────────────────────────
    // For entity context, callers can use the returned configuration to apply TypeORM decorators
    // For input context, no further processing is needed
    if (context === 'entity') {
      const databaseNullable = finalNullable ||
                               (options.defaultValue !== undefined) ||
                               (options.default !== undefined);

      const columnConfig: any = {
        type: columnTypeOverride || options.columnType || getDefaultColumnType(finalType),
        nullable: databaseNullable
      };

      // Set default value with precedence: options.default > options.defaultValue
      const finalDefault = options.default ?? options.defaultValue;
      if (finalDefault !== undefined) {
        columnConfig.default = finalDefault;
      }

      // Add optional column properties
      if (options.unique !== undefined) columnConfig.unique = options.unique;
      if (options.transformer !== undefined) columnConfig.transformer = options.transformer;
      if (options.length !== undefined) columnConfig.length = options.length;
      if (options.precision !== undefined) columnConfig.precision = options.precision;
      if (options.scale !== undefined) columnConfig.scale = options.scale;
      if (options.enum !== undefined) columnConfig.enum = options.enum;
      if (options.comment !== undefined) columnConfig.comment = options.comment;
      if (options.select !== undefined) columnConfig.select = options.select;

      // Store column configuration for entity decorators to use
      Reflect.defineMetadata('basefield:columnconfig', columnConfig, target, propertyKey);
    }
  };
}