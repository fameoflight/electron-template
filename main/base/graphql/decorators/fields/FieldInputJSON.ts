import { z } from 'zod';
import { BaseFieldJSON, BaseFieldJSONOptions } from './BaseFieldJSON.js';
import { PropertyDecorator } from './types.js';
import { FieldInputOptions } from './types.js';

/**
 * Options for FieldInputJSON decorator
 */
interface FieldInputJSONOptions extends Omit<FieldInputOptions, 'enumType' | 'isJSON'>, BaseFieldJSONOptions {
  // No additional options needed - schema provides everything automatically
}

/**
 * Specialized decorator for JSON input fields that automatically handles:
 * - GraphQL Field with proper JSON type resolution
 * - JSON validation via Zod schema
 * - Context-aware behavior for create/update/createUpdate inputs
 *
 * This is optimized for input fields that accept complex data as JSON
 * but expose them as structured types in GraphQL.
 *
 * Now uses unified BaseFieldJSON to eliminate code duplication while maintaining
 * all existing functionality and backward compatibility.
 *
 * **RECOMMENDED:** Schema-based approach with auto-generation
 * @param schema - Zod schema for auto-generating GraphQL type and validation
 * @param options - Configuration for JSON input field and validation
 *
 * @example
 * ```typescript
 * // Object schema
 * const UserMetadataSchema = z.object({
 *   views: z.number(),
 *   likes: z.number()
 * }).describe('UserMetadata: User engagement metrics');
 *
 * @FieldInputJSON(UserMetadataSchema, {
 *   description: 'User metadata and preferences',
 *   required: false,
 *   inputType: 'create'
 * })
 * metadata?: UserMetadata;
 * ```
 *
 * @example
 * ```typescript
 * // Simple array schema
 * const TagsSchema = z.array(z.string()).describe('Tags: Array of string tags');
 *
 * @FieldInputJSON(TagsSchema, {
 *   description: 'Array of tags',
 *   required: false,
 *   inputType: 'create'
 * })
 * tags?: string[];
 * ```
 *
 * @example
 * ```typescript
 * // Object array schema - accepts nested structured input
 * const ModelSchema = z.object({
 *   id: z.string(),
 *   name: z.string(),
 *   version: z.string()
 * }).describe('Model: AI model information');
 *
 * const ModelsSchema = z.array(ModelSchema).describe('ModelArray: Array of AI models');
 *
 * @FieldInputJSON(ModelsSchema, {
 *   description: 'Array of AI models used in this post',
 *   required: false,
 *   defaultValue: [],
 *   inputType: 'create'
 * })
 * models?: Array<{id: string, name: string, version: string}>;
 * ```
 *
 * ## Input Context Behavior
 * - **create inputs**: Required by default (unless explicitly set to optional)
 * - **update inputs**: Optional by default (for partial updates)
 * - **createUpdate inputs**: Optional by default (for upsert operations)
 *
 * ## Schema Validation
 * - Input data is validated against the Zod schema
 * - Invalid JSON will throw validation errors
 * - Schema descriptions are automatically used for GraphQL field descriptions
 */
export function FieldInputJSON(
  schema: z.ZodObject<any> | z.ZodArray<any> | z.ZodRecord<any> | z.ZodAny | z.ZodDefault<any> | z.ZodOptional<any>,
  options: FieldInputJSONOptions = {}
): PropertyDecorator {
  // Simply delegate to unified BaseFieldJSON with 'input' context
  // All schema processing, GraphQL type generation, and validation logic is now centralized
  return BaseFieldJSON('input', schema, options);
}