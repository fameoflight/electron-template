import { z } from 'zod';
import { ObjectType, Field } from 'type-graphql';
import { GraphQLJSONObject } from 'graphql-type-json';
import { unwrapZodType, getDescription, getGraphQLScalarType } from './TypeDetector.js';
import { generateArrayType } from './ArrayTypeGenerator.js';

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
 * Registry to track generated types and prevent duplicates
 */
const generatedTypes = new Map<string, any>();

/**
 * Clear the generated types cache (useful for testing)
 */
export function clearGeneratedTypesCache(): void {
  generatedTypes.clear();
}

/**
 * Generates a GraphQL class for Zod object schemas
 * Handles nested objects, arrays, and records by generating separate classes
 */
export function generateObjectType<T extends z.ZodObject<z.ZodRawShape>>(
  schema: T,
  options: ZodToGraphQLOptions = {}
): new () => z.infer<T> {
  const shape = schema.shape;
  const schemaDescription = schema.description || '';

  // Extract name from description (format: "Name: Description")
  const descriptionParts = schemaDescription.split(':');
  const typeName = options.name || (descriptionParts.length > 1 ? descriptionParts[0].trim() : 'GeneratedType');
  const typeDescription = options.description || (descriptionParts.length > 1 ? descriptionParts.slice(1).join(':').trim() : schemaDescription);

  // Check if we already generated this type
  if (generatedTypes.has(typeName)) {
    return generatedTypes.get(typeName);
  }

  // Create the class dynamically with TypeGraphQL decorator
  @ObjectType(typeName, { description: typeDescription || undefined })
  class GeneratedClass {
    constructor() {
      // Initialize all fields from schema
      for (const key of Object.keys(shape)) {
        (this as Record<string, unknown>)[key] = undefined;
      }
    }
  }

  // Add fields to the class with proper type handling
  for (const [key, zodType] of Object.entries(shape)) {
    const fieldZodType = zodType as z.ZodTypeAny;
    const nullable = fieldZodType.isOptional?.() ?? false;

    
    const unwrapped = unwrapZodType(fieldZodType);

    let fieldType: any;

    // Handle different field types
    if (unwrapped instanceof z.ZodObject) {
      // Generate nested object type
      const nestedDescription = getDescription(unwrapped);
      const nestedParts = nestedDescription?.split(':') || [];
      const nestedName = nestedParts.length > 1 ? nestedParts[0].trim() : undefined;
      const nestedDesc = nestedParts.length > 1 ? nestedParts.slice(1).join(':').trim() : nestedDescription;

      // Validate nested object description and warn if needed
      if (!nestedDescription) {
        console.warn(`Nested object '${key}' has no description. Add a description like "${key.charAt(0).toUpperCase() + key.slice(1)}Type: Description of ${key}" for better GraphQL schema generation.`);
      } else if (nestedParts.length <= 1) {
        console.warn(`Nested object '${key}' description doesn't follow the "TypeName: Description" format. Current: "${nestedDescription}". Consider using "${key.charAt(0).toUpperCase() + key.slice(1)}Type: ${nestedDescription}" for better type naming.`);
      }

      fieldType = generateObjectType(unwrapped, {
        name: nestedName,
        description: nestedDesc
      });
    } else if (unwrapped instanceof z.ZodArray) {
      // Generate array type
      fieldType = generateArrayType(unwrapped, {
        name: `${key.charAt(0).toUpperCase() + key.slice(1)}Array`,
        description: getDescription(fieldZodType)
      });
    } else if (unwrapped instanceof z.ZodRecord) {
      // Generate record type (fallback to JSON)
      fieldType = GraphQLJSONObject;
    } else {
      // Handle primitive types
      fieldType = getGraphQLScalarType(fieldZodType);
    }

    const fieldDescription = getDescription(fieldZodType);
    // For nested objects, extract just the description part (after the colon)
    const cleanDescription = fieldDescription?.includes(':')
      ? fieldDescription.split(':').slice(1).join(':').trim()
      : fieldDescription;

    // Apply the Field decorator to the prototype
    Field(() => fieldType, {
      nullable,
      description: cleanDescription || fieldDescription
    })(GeneratedClass.prototype, key);

    // Define the property on the prototype
    Object.defineProperty(GeneratedClass.prototype, key, {
      writable: true,
      enumerable: true,
      configurable: true
    });
  }

  // Set a meaningful class name for debugging
  Object.defineProperty(GeneratedClass, 'name', { value: typeName });

  // Cache the generated type
  generatedTypes.set(typeName, GeneratedClass);

  return GeneratedClass as new () => z.infer<T>;
}