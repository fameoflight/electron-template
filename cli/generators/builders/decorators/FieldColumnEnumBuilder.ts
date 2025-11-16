/**
 * FieldColumnEnumBuilder - Fluent builder for FieldColumnEnum decorators
 *
 * Handles enum field decorators with support for:
 * - Single enum values
 * - Enum arrays
 * - Default values (with proper enum reference)
 * - Nullable enums
 *
 * Pattern: Fluent Builder
 */

export interface FieldColumnEnumOptions {
  description?: string;
  array?: boolean;
  required?: boolean;
  defaultValue?: string;
  minArraySize?: number;
  maxArraySize?: number;
}

export class FieldColumnEnumBuilder {
  private enumName: string;
  private options: Partial<FieldColumnEnumOptions> = {};

  constructor(enumName: string) {
    this.enumName = enumName;
  }

  /**
   * Set description
   */
  description(text: string): this {
    this.options.description = text;
    return this;
  }

  /**
   * Set nullable flag
   */
  required(value: boolean): this {
    this.options.required = value;
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
   * Set default value (enum member name)
   */
  defaultValue(value: string): this {
    this.options.defaultValue = value;
    return this;
  }

  /**
   * Set minimum array size (for array enums)
   */
  minArraySize(size: number): this {
    this.options.minArraySize = size;
    return this;
  }

  /**
   * Set maximum array size (for array enums)
   */
  maxArraySize(size: number): this {
    this.options.maxArraySize = size;
    return this;
  }

  /**
   * Build the final decorator string
   */
  build(): string {
    const optionPairs: string[] = [];

    if (this.options.description) {
      optionPairs.push(`description: '${this.options.description}'`);
    }

    if (this.options.required === false) {
      optionPairs.push(`required: false`);
    }

    if (this.options.array) {
      optionPairs.push('array: true');
    }

    if (this.options.defaultValue !== undefined) {
      const defaultValue = this.options.array
        ? `[${this.enumName}.${this.options.defaultValue}]`
        : `${this.enumName}.${this.options.defaultValue}`;
      optionPairs.push(`defaultValue: ${defaultValue}`);
    }

    if (this.options.minArraySize !== undefined) {
      optionPairs.push(`minArraySize: ${this.options.minArraySize}`);
    }

    if (this.options.maxArraySize !== undefined) {
      optionPairs.push(`maxArraySize: ${this.options.maxArraySize}`);
    }

    const optionsStr = optionPairs.length > 0 ? `, { ${optionPairs.join(', ')} }` : '';

    return `@FieldColumnEnum(${this.enumName}${optionsStr})`;
  }

  /**
   * Static factory
   */
  static create(enumName: string): FieldColumnEnumBuilder {
    return new FieldColumnEnumBuilder(enumName);
  }
}
