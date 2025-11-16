/**
 * FieldInputBuilder - Fluent builder for FieldInput decorators
 *
 * Eliminates repetitive option building code in InputPreparator:
 * - Before: 12+ if statements for each scalar field input
 * - After: Fluent API with self-documenting method chaining
 *
 * Pattern: Fluent Builder
 */

import { FieldInputOptions } from '../../../../main/base/graphql/decorators/fields/types.js';

export class FieldInputBuilder {
  private typeName: string;
  private options: Partial<FieldInputOptions> = {};

  constructor(typeName: string) {
    this.typeName = typeName;
  }

  /**
   * Set input type context (create, update, createUpdate)
   */
  inputType(type: 'create' | 'update' | 'createUpdate'): this {
    this.options.inputType = type;
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
   * Set required flag
   */
  required(value: boolean): this {
    this.options.required = value;
    return this;
  }



  /**
   * Set default value
   */
  default(value: any): this {
    this.options.default = value;
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
   * Set pattern (RegExp)
   */
  pattern(regex: RegExp | string): this {
    this.options.pattern = typeof regex === 'string' ? new RegExp(regex) : regex;
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

    if (this.options.inputType) {
      optionPairs.push(`inputType: '${this.options.inputType}'`);
    }

    if (this.options.description) {
      // Escape single quotes in descriptions
      const escapedDesc = this.options.description.replace(/'/g, "\\'");
      optionPairs.push(`description: '${escapedDesc}'`);
    }

    if (this.options.required !== undefined) {
      optionPairs.push(`required: ${this.options.required}`);
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

    if (this.options.pattern) {
      optionPairs.push(`pattern: /${this.options.pattern.source}/`);
    }

    if (this.options.isUUID) {
      optionPairs.push('isUUID: true');
    }

    if (this.options.array) {
      optionPairs.push('array: true');
    }

    if (this.options.default !== undefined) {
      if (typeof this.options.default === 'string') {
        // Escape single quotes in string defaults
        const escapedDefault = this.options.default.replace(/'/g, "\\'");
        optionPairs.push(`default: '${escapedDefault}'`);
      } else {
        // JSON.stringify handles numbers, booleans, objects, arrays correctly
        optionPairs.push(`default: ${JSON.stringify(this.options.default)}`);
      }
    }

    const optionsStr = optionPairs.length > 0 ? `, { ${optionPairs.join(', ')} }` : '';

    return `@FieldInput(${this.typeName}${optionsStr})`;
  }

  /**
   * Static factory for common types
   */
  static String(): FieldInputBuilder {
    return new FieldInputBuilder('String');
  }

  static Number(): FieldInputBuilder {
    return new FieldInputBuilder('Number');
  }

  static Boolean(): FieldInputBuilder {
    return new FieldInputBuilder('Boolean');
  }

  static Date(): FieldInputBuilder {
    return new FieldInputBuilder('Date');
  }
}
