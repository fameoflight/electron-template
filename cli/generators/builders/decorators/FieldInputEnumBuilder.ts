/**
 * FieldInputEnumBuilder - Fluent builder for FieldInputEnum decorators
 *
 * Handles enum input field decorators with support for:
 * - Single enum values
 * - Enum arrays
 * - Default values
 * - Input type context (create, update, createUpdate)
 *
 * Pattern: Fluent Builder
 */

export interface FieldInputEnumOptions {
  inputType?: 'create' | 'update' | 'createUpdate';
  description?: string;
  required?: boolean;
  array?: boolean;
  default?: any;
}

export class FieldInputEnumBuilder {
  private enumName: string;
  private options: Partial<FieldInputEnumOptions> = {};

  constructor(enumName: string) {
    this.enumName = enumName;
  }

  /**
   * Set input type context
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
   * Set array flag
   */
  array(enabled: boolean): this {
    this.options.array = enabled;
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

    return `@FieldInputEnum(${this.enumName}${optionsStr})`;
  }

  /**
   * Static factory
   */
  static create(enumName: string): FieldInputEnumBuilder {
    return new FieldInputEnumBuilder(enumName);
  }
}
