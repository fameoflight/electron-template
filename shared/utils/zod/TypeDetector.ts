import { z } from 'zod';
import { GraphQLJSONObject } from 'graphql-type-json';

/**
 * Type detection utilities for Zod schemas
 * Handles unwrapping and identifying Zod types
 */

/**
 * Unwraps Zod wrapper types (optional, nullable, default) to get the inner type
 */
export function unwrapZodType(zodType: z.ZodTypeAny): z.ZodTypeAny {
  if (zodType instanceof z.ZodOptional ||
      zodType instanceof z.ZodNullable ||
      zodType instanceof z.ZodDefault) {
    return unwrapZodType(zodType._def.innerType as z.ZodTypeAny);
  }
  return zodType;
}

/**
 * Unwraps Zod wrapper types to get the core schema (alias for unwrapZodType)
 */
export function unwrapZodSchema(schema: any): any {
  return unwrapZodType(schema);
}

/**
 * Detects if a Zod type is optional or nullable
 */
export function isOptional(zodType: z.ZodTypeAny): boolean {
  return zodType instanceof z.ZodOptional ||
    zodType instanceof z.ZodNullable ||
    (zodType instanceof z.ZodDefault && isOptional(zodType._def.innerType as z.ZodTypeAny));
}

/**
 * Extracts description from Zod schema
 */
export function getDescription(zodType: z.ZodTypeAny): string | undefined {
  return zodType.description;
}

/**
 * Maps Zod primitive types to GraphQL scalar types
 */
export function getGraphQLScalarType(zodType: z.ZodTypeAny): any {
  const unwrapped = unwrapZodType(zodType);

  if (unwrapped instanceof z.ZodString) return String;
  if (unwrapped instanceof z.ZodNumber) return Number;
  if (unwrapped instanceof z.ZodBoolean) return Boolean;
  if (unwrapped instanceof z.ZodDate) return Date;
  if (unwrapped instanceof z.ZodEnum) {
    // Map ZodEnum to String type with validation
    return String;
  }
  if (unwrapped instanceof z.ZodAny) {
    // Map ZodAny to GraphQL JSON type for maximum flexibility
    return GraphQLJSONObject;
  }

  // Handle cases where constructor.name includes the type but instanceof check fails
  if (unwrapped.constructor.name.includes('String')) return String;
  if (unwrapped.constructor.name.includes('Number')) return Number;
  if (unwrapped.constructor.name.includes('Boolean')) return Boolean;
  if (unwrapped.constructor.name.includes('Date')) return Date;

  throw new Error(`Unsupported Zod type: ${unwrapped.constructor.name}`);
}

/**
 * Detects the type category of a Zod schema
 */
export function detectTypeCategory(zodType: z.ZodTypeAny): 'object' | 'array' | 'record' | 'scalar' {
  const unwrapped = unwrapZodType(zodType);

  if (unwrapped instanceof z.ZodObject) return 'object';
  if (unwrapped instanceof z.ZodArray) return 'array';
  if (unwrapped instanceof z.ZodRecord) return 'record';
  return 'scalar';
}