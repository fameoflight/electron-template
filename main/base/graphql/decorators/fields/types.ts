import { ValueTransformer } from 'typeorm';
/**
 * Base configuration options for all field column decorators
 * Consolidates all field, column, and validation options in a single interface
 */
export interface FieldColumnOptions {
  // GraphQL Field options
  graphql?: boolean; // Set to false to exclude from GraphQL schema
  description?: string;
  deprecationReason?: string;
  defaultValue?: any;

  // TypeORM Column options
  columnType?: string;
  columnOptions?: any;
  default?: any;
  unique?: boolean;
  transformer?: ValueTransformer;
  length?: number;
  precision?: number;
  scale?: number;
  enum?: any;
  array?: boolean;
  comment?: string;
  select?: boolean;

  // Validation options
  required?: boolean;
  email?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  enumType?: any;
  pattern?: RegExp;
  isUrl?: boolean;
  isUUID?: boolean;
  isJSON?: boolean;
  customValidators?: any[];

  validations?: boolean;

  // Field name for error messages (auto-detected if not provided)
  fieldName?: string;
}
/**
 * Configuration for field decorator application
 */
export interface FieldDecoratorConfig {
  type: any;
  nullable?: boolean;
  description?: string;
  deprecationReason?: string;
  defaultValue?: any;
}

/**
 * Configuration for column decorator application
 */
export interface ColumnDecoratorConfig {
  columnType: string;
  nullable?: boolean;
  columnOptions?: any;
}

/**
 * Configuration for validation decorators application
 */
export interface ValidationDecoratorConfig {
  required?: boolean;
  email?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  enumType?: any;
  pattern?: RegExp;
  isUrl?: boolean;
  isUUID?: boolean;
  isJSON?: boolean;
  customValidators?: any[];
}

/**
 * Scalar types supported by FieldColumn
 */
export type ScalarType = typeof String | typeof Number | typeof Boolean | typeof Date;

/**
 * Configuration options for FieldInput decorators
 * Extends FieldColumnOptions but excludes database-specific options
 */
export interface FieldInputOptions extends Omit<FieldColumnOptions, 'columnType' | 'columnOptions' | 'default' | 'unique' | 'transformer' | 'length' | 'precision' | 'scale' | 'enum' | 'comment' | 'select'> {
  // Input-specific context (create vs update vs createUpdate)
  inputType?: 'create' | 'update' | 'createUpdate';

  // Override required behavior for specific input contexts
  contextRequired?: boolean;

  // Default value for input validation and auto-population
  default?: any;

  // Input-specific validation that differs from entity validation
  inputOnlyValidations?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  };
}

/**
 * Context type for field decoration - determines behavior and capabilities
 */
export type FieldContext = 'entity' | 'input';

/**
 * Unified base field options that works for both entity and input contexts
 * This provides the foundation for both FieldColumnOptions and FieldInputOptions
 */
export interface BaseFieldOptions {
  // GraphQL Field options (shared between entity and input)
  nullable?: boolean;
  description?: string;
  deprecationReason?: string;
  defaultValue?: any;
  array?: boolean;

  // Core validation options (shared)
  required?: boolean;
  email?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  enumType?: any;
  pattern?: RegExp;
  isUrl?: boolean;
  isUUID?: boolean;
  isJSON?: boolean;
  customValidators?: any[];
  validations?: boolean;
  fieldName?: string;

  // Context-aware options
  context?: FieldContext;

  // Input-specific context (only used when context = 'input')
  inputType?: 'create' | 'update' | 'createUpdate';
  contextRequired?: boolean;
  inputOnlyValidations?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  };

  // Entity-specific options (only used when context = 'entity')
  columnType?: string;
  columnOptions?: any;
  default?: any;
  unique?: boolean;
  transformer?: any;
  length?: number;
  precision?: number;
  scale?: number;
  enum?: any;
  comment?: string;
  select?: boolean;

  // GraphQL control (entity-specific)
  graphql?: boolean;
}

/**
 * Function signature for property decorators
 */
export type PropertyDecorator = (target: any, propertyKey: string | symbol) => void;

// Re-export from BaseField for convenience
export { BaseField } from './BaseField.js';