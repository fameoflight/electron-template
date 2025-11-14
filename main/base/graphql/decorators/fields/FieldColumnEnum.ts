import { registerEnumType } from 'type-graphql';
import { BaseFieldEnum, BaseFieldEnumOptions } from './BaseFieldEnum.js';
import { PropertyDecorator } from './types.js';
import { FieldColumnOptions } from './types.js';


/**
 * Options for FieldColumnEnum decorator
 */
interface FieldColumnEnumOptions extends Omit<FieldColumnOptions, 'enumType' | 'transformer' | 'columnType'>, BaseFieldEnumOptions {
  // Inherit all options from BaseFieldEnumOptions
}

/**
 * Magical decorator that handles enum fields automatically:
 * - Registers enum type with GraphQL if not already registered
 * - Applies @Field decorator with enum type
 * - Applies @Column decorator with enum storage
 * - Applies enum validation
 *
 * Now uses unified BaseFieldEnum to eliminate code duplication while maintaining
 * all existing functionality and backward compatibility.
 *
 * @param enumType - The enum type to use
 * @param options - Optional configuration for the enum field
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
 * @FieldColumnEnum(PostStatus)
 * status!: PostStatus;
 *
 * // With options
 * @FieldColumnEnum(PostStatus, {
 *   enumName: 'PostStatus',
 *   description: 'Status of a blog post',
 *   required: true,
 *   defaultValue: PostStatus.DRAFT
 * })
 * status!: PostStatus;
 *
 * // Array usage - enum array field
 * @FieldColumnEnum(PostTag, {
 *   array: true,
 *   description: 'Tags for categorizing posts',
 *   required: false,
 *   defaultValue: [PostTag.TECH]
 * })
 * tags!: PostTag[];
 * ```
 */
export function FieldColumnEnum(enumType: any, options: FieldColumnEnumOptions = {}): PropertyDecorator {
  // Simply delegate to unified BaseFieldEnum with 'entity' context
  // All enum registration, GraphQL field creation, and validation logic is now centralized
  return BaseFieldEnum('entity', enumType, options);
}