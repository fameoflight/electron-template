import 'reflect-metadata';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsDate,
  IsEmail,
  IsUrl,
  IsUUID,
  IsJSON,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Min,
  Max,
  Matches,
  IsEnum
} from 'class-validator';
import { ValidationStrategyFactory } from '@main/base/graphql/services/validation/ValidationStrategy';
import { DescriptionGeneratorFactory } from '@main/base/graphql/services/description/DescriptionGenerator';

// Types
export type ScalarType = typeof String | typeof Number | typeof Boolean | typeof Date;

// ──────────────────────────────────────────────────────────────────────────
// Type Utilities
// ──────────────────────────────────────────────────────────────────────────

/**
 * Maps SQL column types to GraphQL scalar types
 */
export function sqlTypeToGraphQLType(sqlType: string): ScalarType {
  const typeMap: Record<string, ScalarType> = {
    // String types
    'text': String, 'varchar': String, 'char': String, 'string': String,
    // Number types
    'int': Number, 'integer': Number, 'bigint': Number, 'float': Number,
    'double': Number, 'decimal': Number, 'numeric': Number, 'real': Number,
    // Boolean type
    'boolean': Boolean, 'bool': Boolean,
    // Date types
    'date': Date, 'datetime': Date, 'timestamp': Date, 'time': Date,
    // JSON type
    'json': String, 'jsonb': String,
  };

  return typeMap[sqlType.toLowerCase()] || String;
}

/**
 * Gets the default TypeORM column type for a GraphQL type
 */
export function getDefaultColumnType(type: ScalarType): string {
  switch (type) {
    case String: return 'text';
    case Number: return 'integer';
    case Boolean: return 'boolean';
    case Date: return 'datetime';
    default:
      if (typeof type === 'function' && type.name) {
        return 'text';
      }
      return 'text';
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Validation Decorators
// ──────────────────────────────────────────────────────────────────────────
/**
 * Applies class-validator decorators based on field type and options.
 * Now uses ValidationStrategyFactory for cleaner, more maintainable code.
 */
export function applyValidationDecorators(
  target: any,
  propertyKey: string | symbol,
  options: {
    graphqlType?: any;
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
    array?: boolean;
    customValidators?: PropertyDecorator[];
  }
): void {
  // Delegate to strategy factory
  ValidationStrategyFactory.applyValidation(
    target,
    propertyKey,
    options.graphqlType,
    options
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Description Generators
// ──────────────────────────────────────────────────────────────────────────

/**
 * Generates a smart description for enum fields based on naming patterns
 * Now uses Chain of Responsibility pattern for cleaner, more maintainable code.
 */
export function createEnumDescription(enumName: string, target?: any): string {

  const context = DescriptionGeneratorFactory.createContext(enumName, undefined, target);
  const chain = DescriptionGeneratorFactory.createEnumDescriptionChain();

  return chain.generate(context) || enumName;
}

/**
 * Generates a smart description for fields based on property name, type, and class context
 * Now uses Chain of Responsibility pattern for cleaner, more maintainable code.
 */
export function createFieldDescription(propertyName: string, fieldType: any, target?: any): string {

  const context = DescriptionGeneratorFactory.createContext(propertyName, fieldType, target);
  const chain = DescriptionGeneratorFactory.createFieldDescriptionChain();

  return chain.generate(context) || propertyName;
}

/**
 * Auto-detects enum name from class context and property name
 */
export function detectEnumName(enumType: any, propertyName: string, target: any): string {
  const className = target.constructor?.name;
  if (className && className !== 'Object' && className !== 'Function') {
    const cleanClassName = className.replace(/Entity|Model|Type$/, '');
    const capitalizedName = propertyName.charAt(0).toUpperCase() + propertyName.slice(1);
    return cleanClassName + capitalizedName;
  }

  return propertyName.charAt(0).toUpperCase() + propertyName.slice(1);
}