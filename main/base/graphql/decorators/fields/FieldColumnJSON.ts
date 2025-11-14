import { z } from 'zod';
import { BaseFieldJSON, BaseFieldJSONOptions } from './BaseFieldJSON.js';
import { PropertyDecorator } from './types.js';
import { FieldColumnOptions } from './types.js';

/**
 * Options for FieldColumnJSON decorator
 */
interface FieldColumnJSONOptions extends Omit<FieldColumnOptions, 'columnType' | 'enumType' | 'isJSON' | 'transformer'>, BaseFieldJSONOptions {
  // No additional options needed - schema provides everything automatically
}

/**
 * Specialized decorator for JSON columns that automatically handles:
 * - GraphQL Field with proper JSON type resolution
 * - TypeORM Column with JSON storage
 * - JSON validation via class-validator
 *
 * This is optimized for fields that store complex data as JSON in the database
 * but expose them as structured types in GraphQL.
 *
 * Now uses unified BaseFieldJSON to eliminate code duplication while maintaining
 * all existing functionality and backward compatibility.
 *
 * **RECOMMENDED:** Schema-based approach with auto-generation
 * @param schema - Zod schema for auto-generating GraphQL type and transformer
 * @param options - Configuration for JSON field, column, and validation
 *
 * @example
 * ```typescript
 * // Object schema
 * const UserMetadataSchema = z.object({
 *   views: z.number(),
 *   likes: z.number()
 * }).describe('UserMetadata: User engagement metrics');
 *
 * @FieldColumnJSON(UserMetadataSchema, {
 *   description: 'User metadata and preferences',
 *   required: false
 * })
 * metadata?: UserMetadata;
 * ```
 *
 * @example
 * ```typescript
 * // Simple array schema
 * const TagsSchema = z.array(z.string()).describe('Tags: Array of string tags');
 *
 * @FieldColumnJSON(TagsSchema, {
 *   description: 'Array of tags',
 *   required: false
 * })
 * tags?: string[];
 * ```
 *
 * @example
 * ```typescript
 * // Object array schema - generates nested GraphQL types
 * const ModelSchema = z.object({
 *   id: z.string(),
 *   name: z.string(),
 *   version: z.string()
 * }).describe('Model: AI model information');
 *
 * const ModelsSchema = z.array(ModelSchema).describe('ModelArray: Array of AI models');
 *
 * @FieldColumnJSON(ModelsSchema, {
 *   description: 'Array of AI models used in this post',
 *   required: false,
 *   defaultValue: []
 * })
 * models?: Array<{id: string, name: string, version: string}>;
 * ```
 */
export function FieldColumnJSON(
  schema: z.ZodObject<any> | z.ZodArray<any> | z.ZodRecord<any> | z.ZodAny | z.ZodDefault<any> | z.ZodOptional<any>,
  options: FieldColumnJSONOptions = {}
): PropertyDecorator {
  // Simply delegate to unified BaseFieldJSON with 'entity' context
  // All schema processing, GraphQL type generation, and validation logic is now centralized
  return BaseFieldJSON('entity', schema, options);
}