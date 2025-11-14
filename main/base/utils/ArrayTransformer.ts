import { ValueTransformer } from 'typeorm';
import { z } from 'zod';

/**
 * Array transformer for TypeORM entities
 * Handles serialization/deserialization of array fields for SQLite compatibility
 *
 * SQLite doesn't have native array support like PostgreSQL, so arrays need to be
 * stored as JSON strings. This transformer handles the conversion automatically.
 */
export class ArrayTransformer<T> implements ValueTransformer {
  constructor(
    private itemSchema?: z.ZodSchema<T>,
    private fieldName: string = 'field'
  ) { }

  /**
   * Transform array for database storage (write)
   * Converts array to JSON string
   */
  to(value: T[] | null): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    try {
      // Validate each item if schema is provided
      if (this.itemSchema) {
        const validated = value.map(item => this.itemSchema!.parse(item));
        return JSON.stringify(validated);
      }

      return JSON.stringify(value);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Validation failed for ${this.fieldName} array on save: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Transform array from database storage (read)
   * Parses JSON string back to array
   */
  from(value: string | null): T[] | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    try {
      const parsed = JSON.parse(value);

      // Ensure it's an array
      if (!Array.isArray(parsed)) {
        throw new Error(`Expected array for ${this.fieldName}, got ${typeof parsed}`);
      }

      // Validate each item if schema is provided
      if (this.itemSchema) {
        return parsed.map(item => this.itemSchema!.parse(item));
      }

      return parsed;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Validation failed for ${this.fieldName} array on load: ${error.message}`
        );
      }
      if (error instanceof SyntaxError) {
        throw new Error(
          `Invalid JSON in ${this.fieldName} array: ${error.message}`
        );
      }
      throw error;
    }
  }
}

/**
 * Convenience function to create an array transformer
 */
export function arrayTransformer<T>(itemSchema?: z.ZodSchema<T>, fieldName?: string) {
  return new ArrayTransformer<T>(itemSchema, fieldName);
}

/**
 * Pre-configured transformer for string arrays
 */
export const stringArrayTransformer = new ArrayTransformer<string>(z.string(), 'string array');