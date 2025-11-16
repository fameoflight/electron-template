/**
 * FieldColumnBuilder - Fluent builder for FieldColumn decorators
 *
 * Eliminates repetitive option building code in DecoratorGenerator:
 * - Before: 60 lines of option pairs building, repeated 7 times
 * - After: Fluent API with self-documenting method chaining
 *
 * Pattern: Fluent Builder
 */

import { FieldColumnOptions } from '../../../../main/base/graphql/decorators/fields/types.js';

export class FieldColumnBuilder {
  private typeName: string;
  private options: Partial<FieldColumnOptions> = {};

  constructor(typeName: string) {
    this.typeName = typeName;
  }

  /**
   * Set GraphQL generation flag
   */
  graphql(enabled: boolean): this {
    this.options.graphql = enabled;
    return this;
  }

  /**
   * Set required flag
   */
  required(value: boolean): this {
    this.options.required = value;
    return this;
  }

  /**
   * Set description
   */
  description(text: string): this {
    this.options.description = text;
    return this;
  }

  /**
   * Set unique constraint
   */
  unique(value: boolean): this {
    this.options.unique = value;
    return this;
  }

  /**
   * Set default value
   */
  defaultValue(value: any): this {
    this.options.defaultValue = value;
    return this;
  }

  /**
   * Set max length (for strings)
   */
  maxLength(length: number): this {
    this.options.maxLength = length;
    return this;
  }

  /**
   * Set min length (for strings)
   */
  minLength(length: number): this {
    this.options.minLength = length;
    return this;
  }

  /**
   * Set min value (for numbers)
   */
  min(value: number): this {
    this.options.min = value;
    return this;
  }

  /**
   * Set max value (for numbers)
   */
  max(value: number): this {
    this.options.max = value;
    return this;
  }

  /**
   * Set email validation
   */
  email(enabled: boolean): this {
    this.options.email = enabled;
    return this;
  }

  /**
   * Set UUID validation
   */
  isUUID(enabled: boolean): this {
    this.options.isUUID = enabled;
    return this;
  }

  /**
   * Set pattern (RegExp)
   */
  pattern(regex: RegExp): this {
    this.options.pattern = regex;
    return this;
  }

  /**
   * Set array flag
   */
  array(enabled: boolean): this {
    this.options.array = enabled;
    return this;
  }

  /**
   * Build the final decorator string
   */
  build(): string {
    const optionPairs: string[] = [];

    if (this.options.graphql === false) {
      optionPairs.push('graphql: false');
    }

    if (this.options.required !== undefined) {
      optionPairs.push(`required: ${this.options.required}`);
    }

    if (this.options.description) {
      const escapedDesc = this.options.description.replace(/'/g, "\\'");
      optionPairs.push(`description: '${escapedDesc}'`);
    }

    if (this.options.unique) {
      optionPairs.push(`unique: ${this.options.unique}`);
    }

    if (this.options.maxLength !== undefined) {
      optionPairs.push(`maxLength: ${this.options.maxLength}`);
    }

    if (this.options.minLength !== undefined) {
      optionPairs.push(`minLength: ${this.options.minLength}`);
    }

    if (this.options.min !== undefined) {
      optionPairs.push(`min: ${this.options.min}`);
    }

    if (this.options.max !== undefined) {
      optionPairs.push(`max: ${this.options.max}`);
    }

    if (this.options.defaultValue !== undefined) {
      const value = typeof this.options.defaultValue === 'string'
        ? `'${this.options.defaultValue.replace(/'/g, "\\'")}'`
        : this.options.defaultValue;
      optionPairs.push(`defaultValue: ${value}`);
    }

    if (this.options.email) {
      optionPairs.push('email: true');
    }

    if (this.options.isUUID) {
      optionPairs.push('isUUID: true');
    }

    if (this.options.pattern) {
      optionPairs.push(`pattern: ${this.options.pattern}`);
    }

    if (this.options.array) {
      optionPairs.push(`array: ${this.options.array}`);
    }

    const optionsStr = optionPairs.length > 0 ? `{ ${optionPairs.join(', ')} }` : '';

    return `@FieldColumn(${this.typeName}${optionsStr ? ', ' + optionsStr : ''})`;
  }

  /**
   * Static factory for common types
   */
  static String(): FieldColumnBuilder {
    return new FieldColumnBuilder('String');
  }

  static Number(): FieldColumnBuilder {
    return new FieldColumnBuilder('Number');
  }

  static Boolean(): FieldColumnBuilder {
    return new FieldColumnBuilder('Boolean');
  }

  static Date(): FieldColumnBuilder {
    return new FieldColumnBuilder('Date');
  }
}
