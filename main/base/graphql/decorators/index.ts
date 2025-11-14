// Combined decorators for reducing decorator stacking
export { EntityObjectType } from './EntityObjectType.js';
export { FieldColumn } from './fields/FieldColumn.js';
export { FieldColumnJSON } from './fields/FieldColumnJSON.js';

// Magical decorators for automatic patterns
export { FieldColumnEnum } from './fields/FieldColumnEnum.js';
export {
  ComputedField,
  isComputedField,
  getComputedFields,
  getComputedFieldMetadata
} from './fields/ComputedField.js';

// Export unified interface for custom decorators
export type { FieldColumnOptions } from './fields/types.js';
export type { ComputedFieldOptions } from './fields/ComputedField.js';
