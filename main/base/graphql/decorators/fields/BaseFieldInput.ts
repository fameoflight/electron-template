import { FieldInputOptions, PropertyDecorator } from './types.js';
import { BaseField } from './BaseField.js';

/**
 * Core field input decorator that provides common functionality
 * for all field input decorators (FieldInput, FieldInputEnum, FieldInputJSON)
 *
 * Now uses unified BaseField to eliminate code duplication while maintaining
 * all existing functionality and backward compatibility.
 *
 * @param options - Configuration options for the input field
 * @param type - GraphQL/TypeScript type override
 *
 * @example
 * ```typescript
 * // Usage in FieldInput
 * export function FieldInput(type: ScalarType, options: FieldInputOptions = {}) {
 *   return BaseFieldInput(options, type);
 * }
 * ```
 */
export function BaseFieldInput(
  options: FieldInputOptions = {},
  type?: any,
): PropertyDecorator {
  // Simply delegate to unified BaseField with 'input' context
  // All GraphQL field creation and validation logic is now centralized
  return BaseField('input', options, type);
}