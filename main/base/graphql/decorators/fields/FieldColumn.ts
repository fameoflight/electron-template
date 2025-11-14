import 'reflect-metadata';
import { BaseFieldColumn } from './BaseFieldColumn';
import { FieldColumnOptions, ScalarType } from './types.js';
import { getDefaultColumnType } from './utils';

/**
 * Magical FieldColumn decorator that applies @Field, @Column, and validation
 *
 * This combines all three decorators: Type-GraphQL Field, TypeORM Column, and class-validator.
 * Significantly reduces decorator stacking while maintaining full compatibility.
 *
 * @param type - The GraphQL/TypeScript type (String, Number, Boolean, Date)
 * @param options - Field, column, and validation configuration
 *
 * ## Magical API - Type First
 * ```typescript
 * // Simple with defaults (auto-detects column type and validation)
 * @FieldColumn(String)          // -> text column, string validation, required: true, nullable: false
 * name!: string;
 *
 * @FieldColumn(Number)          // -> integer column, number validation, required: true, nullable: false
 * age!: number;
 *
 * @FieldColumn(Boolean)         // -> boolean column, boolean validation, required: true, nullable: false
 * isActive!: boolean;
 *
 * @FieldColumn(Date)            // -> datetime column, date validation, required: true, nullable: false
 * createdAt!: Date;
 *
 * // With common options
 * @FieldColumn(String, { required: true, maxLength: 255 })
 * title!: string;
 *
 * @FieldColumn(String, { required: false, unique: true })
 * email!: string;
 *
 * @FieldColumn(Number, { min: 0, max: 100, default: 0 })
 * score!: number;
 *
 * @FieldColumn(Boolean, { default: false })
 * published!: boolean;
 *
 * @FieldColumn(Date, { required: false, nullable: true })
 * deletedAt!: Date;
 *
 * // Special types
 * @FieldColumn(String, { email: true, required: false })
 * email?: string;
 *
 * @FieldColumn(String, { isUrl: true, required: false })
 * website?: string;
 *
 * @FieldColumn(String, { isUUID: true, required: true })
 * id!: string;
 *
 * @FieldColumn(String, { isJSON: true, required: false })
 * metadata?: string;
 *
 * // GraphQL exposure control
 * @FieldColumn(String, { graphql: false, required: true })
 * internalId!: string;     // Only @Column, no @Field decorator
 * ```
 *
 * ## Auto-Detection
 * - **String** → TEXT column with string validation
 * - **Number** → INTEGER column with number validation
 * - **Boolean** → BOOLEAN column with boolean validation
 * - **Date** → DATETIME column with date validation
 * - **required: true** by default
 * - **nullable: false** by default
 * - **Smart descriptions** based on field name and class context
 */
export function FieldColumn(type: ScalarType, options: FieldColumnOptions = {}): PropertyDecorator {
  const finalType = options.enumType || type;
  return BaseFieldColumn(options, finalType, options.columnType || getDefaultColumnType(finalType));
}
