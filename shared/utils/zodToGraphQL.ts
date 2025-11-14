import { z } from 'zod';
import { GraphQLJSONObject } from 'graphql-type-json';
import { unwrapZodType, detectTypeCategory, unwrapZodSchema } from './zod/TypeDetector.js';
import { generateObjectType } from './zod/ObjectTypeGenerator.js';
import { generateArrayType } from './zod/ArrayTypeGenerator.js';

/**
 * Configuration options for Zod to TypeGraphQL conversion
 */
export interface ZodToGraphQLOptions {
  /** Custom name for the GraphQL type (extracted from description if not provided) */
  name?: string;
  /** Description for the GraphQL type */
  description?: string;
}

/**
 * Generates a TypeGraphQL class from a Zod schema (object, array, or record)
 * Automatically handles nested objects, arrays, and records by generating separate classes
 *
 * @example
 * ```typescript
 * // Object schema
 * const UserSchema = z.object({
 *   name: z.string().describe('User name'),
 *   age: z.number().describe('User age'),
 *   address: z.object({
 *     city: z.string(),
 *     zip: z.string()
 *   }).optional().describe('UserAddress: User address'),
 * }).describe('User: A user profile');
 *
 * const UserType = zodToGraphQL(UserSchema);
 * // Generates User and UserAddress classes
 *
 * // Array schema - generates proper GraphQL array type
 * const TagsSchema = z.array(z.string()).describe('Tags: Array of string tags');
 * const TagsType = zodToGraphQL(TagsSchema);
 * // Returns GraphQL array type [String]
 *
 * // Object array schema - generates nested type + array
 * const ModelsSchema = z.array(z.object({
 *   id: z.string(),
 *   name: z.string()
 * })).describe('ModelArray: Array of model objects');
 *
 * const ModelsType = zodToGraphQL(ModelsSchema);
 * // Generates Model class and returns [Model!] array type
 * ```
 */
export function zodToGraphQL<T extends z.ZodObject<z.ZodRawShape> | z.ZodArray<any> | z.ZodRecord<any> | z.ZodAny | z.ZodOptional<any> | z.ZodNullable<any> | z.ZodDefault<any>>(
  schema: T,
  options: ZodToGraphQLOptions = {}
): any {
  // Unwrap wrapper types to get the core schema
  const unwrappedSchema = unwrapZodSchema(schema);

  // Handle different schema types using the modular approach
  const typeCategory = detectTypeCategory(unwrappedSchema);

  
  switch (typeCategory) {
    case 'object':
      return generateObjectType(unwrappedSchema as z.ZodObject<z.ZodRawShape>, options);

    case 'array':
      return generateArrayType(unwrappedSchema as z.ZodArray<any>, options);

    case 'record':
      // For records, return GraphQLJSONObject since they have dynamic keys
      return GraphQLJSONObject;

    case 'scalar':
      // Handle scalar types that come through directly
      if (unwrappedSchema instanceof z.ZodAny) {
        return GraphQLJSONObject;
      }
      throw new Error(`Unhandled scalar type: ${unwrappedSchema.constructor.name}`);

    default:
      throw new Error(`Unsupported schema type: ${typeCategory}`);
  }
}

/**
 * Alternative API: Generate multiple related GraphQL types from a schema with nested objects
 * Returns a map of type names to generated classes
 *
 * @example
 * ```typescript
 * const UserSchema = z.object({
 *   name: z.string(),
 *   address: z.object({ city: z.string() }).describe('Address: User address'),
 * });
 *
 * const types = zodToGraphQLTypes(UserSchema, 'User');
 * // Returns: { User: UserClass, Address: AddressClass }
 * ```
 */
export function zodToGraphQLTypes<T extends z.ZodObject<z.ZodRawShape>>(
  schema: T,
  rootName?: string
): Record<string, new () => unknown> {
  const types: Record<string, new () => unknown> = {};

  // Generate the main type
  const mainType = zodToGraphQL(schema, { name: rootName });
  const mainTypeName = rootName || (schema.description?.split(':')[0].trim() || 'Root');
  types[mainTypeName] = mainType;

  return types;
}