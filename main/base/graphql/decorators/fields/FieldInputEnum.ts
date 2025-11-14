import { registerEnumType } from 'type-graphql';
import { BaseFieldEnum, BaseFieldEnumOptions } from './BaseFieldEnum.js';
import { PropertyDecorator } from './types.js';
import { FieldInputOptions } from './types.js';

/**
 * Options for FieldInputEnum decorator
 */
interface FieldInputEnumOptions extends Omit<FieldInputOptions, 'enumType'>, BaseFieldEnumOptions {
  // Inherit all options from BaseFieldEnumOptions
}

/**
 * Magical decorator that handles enum input fields automatically:
 * - Registers enum type with GraphQL if not already registered
 * - Applies @Field decorator with enum type
 * - Applies enum validation
 * - Context-aware behavior for create/update/createUpdate inputs
 *
 * Now uses unified BaseFieldEnum to eliminate code duplication while maintaining
 * all existing functionality and backward compatibility.
 *
 * @param enumType - The enum type to use
 * @param options - Optional configuration for the enum input field
 *
 * @example
 * ```typescript
 * enum PostStatus {
 *   DRAFT = 'draft',
 *   PUBLISHED = 'published',
 *   ARCHIVED = 'archived'
 * }
 *
 * enum PostTag {
 *   TECH = 'tech',
 *   DESIGN = 'design',
 *   BUSINESS = 'business'
 * }
 *
 * // Simple usage - auto-generates everything
 * @FieldInputEnum(PostStatus)
 * status!: PostStatus;
 *
 * // With options for create input
 * @FieldInputEnum(PostStatus, {
 *   enumName: 'PostStatus',
 *   description: 'Status of a blog post',
 *   required: true,
 *   inputType: 'create'
 * })
 * status!: PostStatus;
 *
 * // Update input - automatically optional
 * @FieldInputEnum(PostStatus, {
 *   description: 'Status of a blog post (optional for update)',
 *   inputType: 'update'
 * })
 * status?: PostStatus;
 *
 * // Array usage - enum array field
 * @FieldInputEnum(PostTag, {
 *   array: true,
 *   description: 'Tags for categorizing posts',
 *   required: false,
 *   inputType: 'create'
 * })
 * tags!: PostTag[];
 * ```
 *
 * ## Auto-Generated Features
 * - **Enum Registration**: Automatically registers enum with GraphQL
 * - **Smart Names**: Auto-detects enum name from context
 * - **Context Awareness**: Adjusts nullability based on input type
 * - **Validation**: Applies enum validation automatically
 * - **Descriptions**: Generates smart descriptions if not provided
 *
 * ## Input Context Behavior
 * - **create inputs**: Required by default (unless explicitly set to optional)
 * - **update inputs**: Optional by default (for partial updates)
 * - **createUpdate inputs**: Optional by default (for upsert operations)
 */
export function FieldInputEnum(enumType: any, options: FieldInputEnumOptions = {}): PropertyDecorator {
  // Simply delegate to unified BaseFieldEnum with 'input' context
  // All enum registration, GraphQL field creation, and validation logic is now centralized
  return BaseFieldEnum('input', enumType, options);
}