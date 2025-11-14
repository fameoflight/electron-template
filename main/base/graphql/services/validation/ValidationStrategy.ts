import 'reflect-metadata';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsNumber,
  IsBoolean,
  IsDate,
  IsEnum,
  MinLength,
  MaxLength,
  Min,
  Max,
  Matches,
  IsUrl,
  IsUUID,
  IsJSON
} from 'class-validator';

/**
 * Configuration for validation decorator application
 */
export interface ValidationOptions {
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

/**
 * Base interface for validation strategies
 * Each strategy knows how to apply validators for a specific type
 */
export interface ValidationStrategy {
  /**
   * Apply validation decorators for this strategy's type
   */
  applyValidators(
    target: any,
    propertyKey: string | symbol,
    options: ValidationOptions
  ): void;

  /**
   * Check if this strategy can handle the given type
   */
  canHandle(type: any): boolean;
}

/**
 * Base class providing common validation logic
 */
abstract class BaseValidationStrategy implements ValidationStrategy {
  abstract canHandle(type: any): boolean;
  abstract applyValidators(target: any, propertyKey: string | symbol, options: ValidationOptions): void;

  /**
   * Apply common optional/required logic
   */
  protected applyRequiredLogic(
    target: any,
    propertyKey: string | symbol,
    required: boolean = true
  ): void {
    if (!required) {
      IsOptional()(target, propertyKey);
    }
  }

  /**
   * Apply custom validators if provided
   */
  protected applyCustomValidators(
    target: any,
    propertyKey: string | symbol,
    customValidators?: PropertyDecorator[]
  ): void {
    if (customValidators) {
      for (const validator of customValidators) {
        validator(target, propertyKey);
      }
    }
  }
}

/**
 * Strategy for String type validation
 */
export class StringValidationStrategy extends BaseValidationStrategy {
  canHandle(type: any): boolean {
    return type === String || type?.name === 'String';
  }

  applyValidators(target: any, propertyKey: string | symbol, options: ValidationOptions): void {
    const {
      required = true,
      email,
      pattern,
      isUrl: validateUrl,
      isUUID: validateUUID,
      isJSON: validateJSON,
      minLength,
      maxLength,
      customValidators
    } = options;

    // Base string validator
    IsString()(target, propertyKey);

    // Special string validators
    if (email) IsEmail()(target, propertyKey);
    if (validateUrl) IsUrl()(target, propertyKey);
    if (validateUUID) IsUUID()(target, propertyKey);
    if (validateJSON) IsJSON()(target, propertyKey);
    if (pattern) Matches(pattern)(target, propertyKey);

    // Required/optional logic
    if (required) {
      IsNotEmpty({
        message: `${String(propertyKey).charAt(0).toUpperCase() + String(propertyKey).slice(1)} cannot be empty`
      })(target, propertyKey);
    } else {
      this.applyRequiredLogic(target, propertyKey, required);
    }

    // Length constraints
    if (minLength !== undefined) MinLength(minLength)(target, propertyKey);
    if (maxLength !== undefined) MaxLength(maxLength)(target, propertyKey);

    // Custom validators
    this.applyCustomValidators(target, propertyKey, customValidators);
  }
}

/**
 * Strategy for Number type validation
 */
export class NumberValidationStrategy extends BaseValidationStrategy {
  canHandle(type: any): boolean {
    return type === Number || type?.name === 'Number';
  }

  applyValidators(target: any, propertyKey: string | symbol, options: ValidationOptions): void {
    const { required = true, min, max, customValidators } = options;

    IsNumber()(target, propertyKey);
    this.applyRequiredLogic(target, propertyKey, required);

    if (min !== undefined) Min(min)(target, propertyKey);
    if (max !== undefined) Max(max)(target, propertyKey);

    this.applyCustomValidators(target, propertyKey, customValidators);
  }
}

/**
 * Strategy for Boolean type validation
 */
export class BooleanValidationStrategy extends BaseValidationStrategy {
  canHandle(type: any): boolean {
    return type === Boolean || type?.name === 'Boolean';
  }

  applyValidators(target: any, propertyKey: string | symbol, options: ValidationOptions): void {
    const { required = true, customValidators } = options;

    IsBoolean()(target, propertyKey);
    this.applyRequiredLogic(target, propertyKey, required);
    this.applyCustomValidators(target, propertyKey, customValidators);
  }
}

/**
 * Strategy for Date type validation
 */
export class DateValidationStrategy extends BaseValidationStrategy {
  canHandle(type: any): boolean {
    return type === Date || type?.name === 'Date';
  }

  applyValidators(target: any, propertyKey: string | symbol, options: ValidationOptions): void {
    const { required = true, customValidators } = options;

    IsDate()(target, propertyKey);
    this.applyRequiredLogic(target, propertyKey, required);
    this.applyCustomValidators(target, propertyKey, customValidators);
  }
}

/**
 * Strategy for Enum type validation
 */
export class EnumValidationStrategy extends BaseValidationStrategy {
  canHandle(type: any): boolean {
    // Enums are detected via enumType option rather than type parameter
    return false;
  }

  applyValidators(target: any, propertyKey: string | symbol, options: ValidationOptions): void {
    const { enumType, required = true, customValidators, array = false } = options;

    if (!enumType) {
      throw new Error('EnumValidationStrategy requires enumType option');
    }

    // Use explicit array option, fallback to reflection metadata if not provided
    const isArray = array || Reflect.getMetadata('design:type', target, propertyKey) === Array;

    if (isArray) {
      IsEnum(enumType, { each: true })(target, propertyKey);
    } else {
      IsEnum(enumType)(target, propertyKey);
    }

    this.applyRequiredLogic(target, propertyKey, required);
    this.applyCustomValidators(target, propertyKey, customValidators);
  }
}

/**
 * Factory for creating appropriate validation strategy
 */
export class ValidationStrategyFactory {
  private static strategies: ValidationStrategy[] = [
    new StringValidationStrategy(),
    new NumberValidationStrategy(),
    new BooleanValidationStrategy(),
    new DateValidationStrategy(),
    new EnumValidationStrategy()
  ];

  /**
   * Get the appropriate validation strategy for the given type
   */
  static getStrategy(type: any, options: ValidationOptions): ValidationStrategy | null {
    // Enum types take precedence
    if (options.enumType) {
      return new EnumValidationStrategy();
    }

    // Find strategy that can handle this type
    for (const strategy of this.strategies) {
      if (strategy.canHandle(type)) {
        return strategy;
      }
    }

    return null;
  }

  /**
   * Apply validation decorators using the appropriate strategy
   */
  static applyValidation(
    target: any,
    propertyKey: string | symbol,
    type: any,
    options: ValidationOptions
  ): void {
    const strategy = this.getStrategy(type, options);

    if (strategy) {
      strategy.applyValidators(target, propertyKey, options);
    } else if (options.customValidators) {
      // If no strategy found but custom validators exist, apply them
      for (const validator of options.customValidators) {
        validator(target, propertyKey);
      }
    }
  }
}
