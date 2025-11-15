/**
 * FieldInputJSONBuilder - Fluent builder for FieldInputJSON decorators
 *
 * Handles JSON input field decorators with Zod schema validation:
 * - Schema reference (z.any(), z.array(z.any()), or custom schemas)
 * - Input type context
 * - Default values
 *
 * Pattern: Fluent Builder
 */

export interface FieldInputJSONOptions {
  inputType?: 'create' | 'update' | 'createUpdate';
  description?: string;
  required?: boolean;
  array?: boolean;
  default?: any;
}

export class FieldInputJSONBuilder {
  private schemaName: string;
  private options: Partial<FieldInputJSONOptions> = {};

  constructor(schemaName: string) {
    this.schemaName = schemaName;
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

    // Don't add array: true since the schema handles it
    // (e.g., z.array(z.any()) already defines it as an array)

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

    return `@FieldInputJSON(${this.schemaName}${optionsStr})`;
  }

  /**
   * Static factory
   */
  static create(schemaName: string): FieldInputJSONBuilder {
    return new FieldInputJSONBuilder(schemaName);
  }
}
