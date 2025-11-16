/**
 * FieldColumnJSONBuilder - Fluent builder for FieldColumnJSON decorators
 *
 * Handles JSON field decorators with Zod schema validation:
 * - Schema reference (generated from field definition)
 * - Nullable JSON fields
 * - Default values
 *
 * Pattern: Fluent Builder
 */

export interface FieldColumnJSONOptions {
  description?: string;
  defaultValue?: any;
  required?: boolean;
}

export class FieldColumnJSONBuilder {
  private schemaName: string;
  private options: Partial<FieldColumnJSONOptions> = {};

  constructor(schemaName: string) {
    this.schemaName = schemaName;
  }

  /**
   * Set description
   */
  description(text: string): this {
    this.options.description = text;
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
   * Set required flag
   */
  required(isRequired: boolean): this {
    this.options.required = isRequired;
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

    if (this.options.defaultValue !== undefined) {
      optionPairs.push(`defaultValue: ${JSON.stringify(this.options.defaultValue)}`);
    }

    if (this.options.required !== undefined) {
      optionPairs.push(`required: ${this.options.required}`);
    }

    const optionsStr = optionPairs.length > 0 ? `, { ${optionPairs.join(', ')} }` : '';

    return `@FieldColumnJSON(${this.schemaName}${optionsStr})`;
  }

  /**
   * Static factory
   */
  static create(schemaName: string): FieldColumnJSONBuilder {
    return new FieldColumnJSONBuilder(schemaName);
  }
}
