/**
 * Enum transformer for TypeORM to handle string/enum conversion
 *
 * This transformer converts between:
 * - GraphQL/TypeScript: String enum values ("DRAFT", "PUBLISHED", etc.)
 * - Database: Numeric enum values (0, 1, 2, etc.)
 */

import { ValueTransformer } from 'typeorm';

/**
 * Creates a transformer for a specific enum type
 *
 * @param enumType - The enum class to transform
 * @returns A ValueTransformer that handles string ↔ number conversion
 */
export function createEnumTransformer(enumType: any): ValueTransformer {
  return {
    /**
     * Convert from database value to application value
     * Database stores numbers (0, 1, 2) → Application wants strings ("DRAFT", "PUBLISHED", etc.)
     */
    from(value: any): any {
      if (value === null || value === undefined) {
        return value;
      }

      // If it's already a string, return as-is
      if (typeof value === 'string') {
        return value;
      }

      // Convert number to enum key string
      const enumKey = Object.keys(enumType)[value];
      if (enumKey === undefined) {
        throw new Error(`Invalid enum value: ${value} for enum ${enumType.name}`);
      }

      return enumKey;
    },

    /**
     * Convert from application value to database value
     * Application provides strings ("DRAFT", "PUBLISHED", etc.) → Database stores numbers (0, 1, 2)
     */
    to(value: any): any {
      if (value === null || value === undefined) {
        return value;
      }

      // If it's already a number, return as-is
      if (typeof value === 'number') {
        return value;
      }

      // Handle TypeORM operators (like In) by passing them through unchanged
      // TypeORM will handle these operators before calling the transformer
      if (typeof value === 'object' && value !== null) {
        // This handles cases like In([JobStatus.COMPLETED, JobStatus.FAILED])
        // where TypeORM passes the operator object to the transformer
        return value;
      }

      // Convert string key to enum value (number)
      const enumValue = enumType[value as keyof typeof enumType];
      if (enumValue === undefined) {
        // Handle case where enumType.name is undefined (for dynamic enums)
        const enumName = enumType.name || 'Unknown';
        throw new Error(`Invalid enum key: ${value} for enum ${enumName}`);
      }

      return enumValue;
    }
  };
}