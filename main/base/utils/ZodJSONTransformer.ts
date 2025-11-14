import { ValueTransformer } from 'typeorm';
import { z } from 'zod';

/**
 * Generic Zod JSON transformer for TypeORM entities
 * Automatically validates data on both read (from) and write (to) operations
 *
 * This transformer provides runtime validation for JSON columns using Zod schemas,
 * ensuring data integrity when storing and retrieving structured data from the database.
 */
export class ZodJSONTransformer<T> implements ValueTransformer {
  constructor(
    private schema: z.ZodSchema<T>,
    private fieldName: string = 'field'
  ) { }

  /**
   * Transform value for database storage (write)
   * Validates the value and converts to JSON string
   */
  to(value: T | null): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    try {
      const validated = this.schema.parse(value);
      return JSON.stringify(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Validation failed for ${this.fieldName} on save: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Transform value from database storage (read)
   * Parses JSON and validates against schema
   */
  from(value: string | object | null): T | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    try {
      // Handle both string and object inputs
      let parsed: any;
      if (typeof value === 'string') {
        parsed = JSON.parse(value);
      } else if (typeof value === 'object') {
        // TypeORM is sometimes passing objects directly instead of JSON strings
        parsed = value;
      } else {
        throw new Error(`Expected string or object, got ${typeof value}`);
      }

      return this.schema.parse(parsed);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Validation failed for ${this.fieldName} on load: ${error.message}`
        );
      }
      if (error instanceof SyntaxError) {
        throw new Error(
          `Invalid JSON in ${this.fieldName}: ${error.message}`
        );
      }
      throw error;
    }
  }
}

export function jsonTransformer<T>(schema: z.ZodSchema<T>, fieldName?: string) {
  return new ZodJSONTransformer<T>(schema, fieldName);
}