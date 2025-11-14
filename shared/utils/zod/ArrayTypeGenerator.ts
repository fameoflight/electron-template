import { z } from 'zod';
import { unwrapZodType, getDescription } from './TypeDetector.js';
import { generateObjectType } from './ObjectTypeGenerator.js';
import { getGraphQLScalarType } from './TypeDetector.js';

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
 * Registry to track generated array types
 */
const generatedArrayTypes = new Map<string, any>();

/**
 * Generates a GraphQL array type for Zod array schemas
 * Returns the array type directly (e.g., [Model!] for object arrays)
 */
export function generateArrayType<T extends z.ZodArray<any>>(
  schema: T,
  options: ZodToGraphQLOptions = {}
): any {
  const elementSchema = schema._def.element as z.ZodTypeAny;
  const schemaDescription = schema.description || '';

  // Extract name from description (format: "Name: Description")
  const descriptionParts = schemaDescription.split(':');
  const arrayTypeName = options.name || (descriptionParts.length > 1 ? descriptionParts[0].trim() : 'GeneratedArray');

  // Check if we already generated this array type
  const cacheKey = `${arrayTypeName}_${elementSchema.constructor.name}`;
  if (generatedArrayTypes.has(cacheKey)) {
    return generatedArrayTypes.get(cacheKey);
  }

  const unwrappedElement = unwrapZodType(elementSchema);
  let elementType: any;

  // Generate element type based on the unwrapped element
  if (unwrappedElement instanceof z.ZodObject) {
    // For object arrays, generate a proper GraphQL object type
    const elementDescription = getDescription(elementSchema);
    const elementParts = elementDescription?.split(':') || [];
    const elementName = elementParts.length > 1 ? elementParts[0].trim() : `${arrayTypeName}Element`;

    elementType = generateObjectType(unwrappedElement, {
      name: elementName,
      description: elementParts.length > 1 ? elementParts.slice(1).join(':').trim() : elementDescription
    });
  } else if (unwrappedElement instanceof z.ZodArray) {
    // Handle nested arrays
    elementType = generateArrayType(unwrappedElement, {
      name: `${arrayTypeName}ElementArray`,
      description: getDescription(elementSchema)
    });
  } else if (unwrappedElement instanceof z.ZodRecord) {
    // For record arrays, we need to generate a record type
    elementType = generateRecordType(unwrappedElement, {
      name: `${arrayTypeName}ElementRecord`,
      description: getDescription(elementSchema)
    });
  } else {
    // Handle primitive types
    elementType = getGraphQLScalarType(elementSchema);
  }

  // Create the array type directly as [elementType]
  // TypeGraphQL expects the array syntax directly
  const arrayType = [elementType];

  // Cache the generated array type
  generatedArrayTypes.set(cacheKey, arrayType);

  return arrayType;
}

/**
 * Generates a GraphQL record type (key-value maps)
 * Returns GraphQLJSONObject since records have dynamic keys
 */
export function generateRecordType<T extends z.ZodRecord<any>>(
  schema: T,
  options: ZodToGraphQLOptions = {}
): any {
  // For records, we'll use GraphQLJSONObject since they are essentially JSON objects
  // with dynamic keys, which GraphQL doesn't handle well with static types
  const { GraphQLJSONObject } = require('graphql-type-json');
  return GraphQLJSONObject;
}