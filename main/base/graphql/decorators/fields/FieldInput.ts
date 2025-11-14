import 'reflect-metadata';
import { BaseFieldInput } from './BaseFieldInput.js';
import { FieldInputOptions, ScalarType, PropertyDecorator } from './types.js';

/**
 * Magical FieldInput decorator that applies @Field and validation for GraphQL input types
 *
 * This combines GraphQL @Field decorator with class-validator validation decorators,
 * significantly reducing decorator stacking while maintaining full compatibility.
 *
 * @param type - The GraphQL/TypeScript type (String, Number, Boolean, Date)
 * @param options - Field and validation configuration
 *
 * ## Magical API - Type First
 * ```typescript
 * // Simple with defaults (auto-detects validation)
 * @FieldInput(String)          // -> @Field, string validation, required: true, nullable: false
 * name!: string;
 *
 * @FieldInput(Number)          // -> @Field, number validation, required: true, nullable: false
 * age!: number;
 *
 * @FieldInput(Boolean)         // -> @Field, boolean validation, required: true, nullable: false
 * isActive!: boolean;
 *
 * @FieldInput(Date)            // -> @Field, date validation, required: true, nullable: false
 * createdAt!: Date;
 *
 * // With common options
 * @FieldInput(String, { required: true, maxLength: 255 })
 * title!: string;
 *
 * @FieldInput(String, { required: false, inputType: 'update' })
 * email?: string;
 *
 * @FieldInput(Number, { min: 0, max: 100, default: 0 })
 * score!: number;
 *
 * @FieldInput(Boolean, { default: false })
 * published!: boolean;
 *
 * @FieldInput(Date, { required: false, nullable: true })
 * deletedAt?: Date;
 *
 * // Input-specific validation (overrides entity validation)
 * @FieldInput(String, {
 *   required: true,
 *   inputOnlyValidations: { maxLength: 100 }, // Only for inputs, not entities
 *   description: 'Short title for display'
 * })
 * shortTitle!: string;
 *
 * // Special types
 * @FieldInput(String, { email: true, required: false })
 * email?: string;
 *
 * @FieldInput(String, { isUrl: true, required: false })
 * website?: string;
 *
 * @FieldInput(String, { isUUID: true, required: true })
 * id!: string;
 *
 * @FieldInput(String, { isJSON: true, required: false })
 * metadata?: string;
 *
 * // Context-aware behavior (create vs update)
 * @FieldInput(String, { inputType: 'create' })     // Required for create
 * title!: string;
 *
 * @FieldInput(String, { inputType: 'update' })     // Optional for updates
 * title?: string;
 *
 * @FieldInput(String, { inputType: 'createUpdate' }) // Optional for upsert
 * title?: string;
 * ```
 *
 * ## Auto-Detection
 * - **String** → @Field(String) with string validation
 * - **Number** → @Field(Number) with number validation
 * - **Boolean** → @Field(Boolean) with boolean validation
 * - **Date** → @Field(Date) with date validation
 * - **inputType: 'create'** → required by default, nullable: false
 * - **inputType: 'update'** → optional by default, nullable: true
 * - **inputType: 'createUpdate'** → optional by default, nullable: true
 * - **Smart descriptions** based on field name and class context
 *
 * ## Input Context Awareness
 * The decorator automatically adjusts behavior based on input type:
 * - **Create inputs**: Fields are required by default
 * - **Update inputs**: Fields are optional to support partial updates
 * - **CreateUpdate inputs**: Fields are optional for upsert operations
 *
 * This eliminates the need to manually configure nullability for different input variants.
 */
export function FieldInput(type: ScalarType, options: FieldInputOptions = {}): PropertyDecorator {
  const finalType = options.enumType || type;
  return BaseFieldInput(options, finalType);
}