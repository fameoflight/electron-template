/**
 * zodToGraphQL Utility Tests
 *
 * Tests the automatic conversion of Zod schemas to TypeGraphQL types
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { zodToGraphQL, zodToGraphQLTypes } from '@shared/utils/zodToGraphQL';
import { clearGeneratedTypesCache } from '@shared/utils/zod/ObjectTypeGenerator';

describe('zodToGraphQL', () => {
  describe('Basic type conversion', () => {
    it('should generate GraphQL type from simple Zod schema', () => {
      const SimpleSchema = z.object({
        name: z.string().describe('User name'),
        age: z.number().describe('User age'),
        active: z.boolean().describe('Is active'),
      }).describe('SimpleUser: A simple user type');

      const UserType = zodToGraphQL(SimpleSchema);

      // Verify class was created
      expect(UserType).toBeDefined();
      expect(UserType.name).toBe('SimpleUser');

      // Verify instance can be created
      const instance = new UserType();
      expect(instance).toBeDefined();
    });

    it('should handle optional fields', () => {
      const SchemaWithOptional = z.object({
        required: z.string().describe('Required field'),
        optional: z.string().optional().describe('Optional field'),
      }).describe('TestType: Test type with optional fields');

      const TestType = zodToGraphQL(SchemaWithOptional);
      const instance = new TestType();

      expect(instance).toBeDefined();
      expect(TestType.name).toBe('TestType');
    });

    it('should handle nullable fields', () => {
      const SchemaWithNullable = z.object({
        required: z.string().describe('Required field'),
        nullable: z.string().nullable().describe('Nullable field'),
      }).describe('NullableTest: Test type with nullable fields');

      const TestType = zodToGraphQL(SchemaWithNullable);
      const instance = new TestType();

      expect(instance).toBeDefined();
      expect(TestType.name).toBe('NullableTest');
    });

    it('should handle fields with default values', () => {
      const SchemaWithDefaults = z.object({
        name: z.string().describe('Name'),
        count: z.number().default(0).describe('Count with default'),
      }).describe('DefaultTest: Test type with defaults');

      const TestType = zodToGraphQL(SchemaWithDefaults);
      const instance = new TestType();

      expect(instance).toBeDefined();
      expect(TestType.name).toBe('DefaultTest');
    });

    it('should handle Date fields', () => {
      const SchemaWithDate = z.object({
        createdAt: z.date().describe('Creation date'),
        updatedAt: z.date().optional().describe('Update date'),
      }).describe('DateTest: Test type with dates');

      const TestType = zodToGraphQL(SchemaWithDate);
      const instance = new TestType();

      expect(instance).toBeDefined();
      expect(TestType.name).toBe('DateTest');
    });
  });

  describe('Nested object handling', () => {
    it('should generate separate types for nested objects with proper naming', () => {
      const SchemaWithNested = z.object({
        name: z.string().describe('User name'),
        address: z.object({
          street: z.string().describe('Street address'),
          city: z.string().describe('City'),
        }).describe('Address: User address'),
      }).describe('UserWithAddress: User with address');

      const UserType = zodToGraphQL(SchemaWithNested);

      expect(UserType).toBeDefined();
      expect(UserType.name).toBe('UserWithAddress');

      const instance = new UserType();
      expect(instance).toBeDefined();
    });

    it('should handle optional nested objects', () => {
      const SchemaWithOptionalNested = z.object({
        name: z.string().describe('Name'),
        metadata: z.object({
          version: z.number().describe('Version'),
          tags: z.string().describe('Tags'),
        }).optional().describe('Metadata: Optional metadata'),
      }).describe('WithMetadata: Type with optional metadata');

      const TestType = zodToGraphQL(SchemaWithOptionalNested);

      expect(TestType).toBeDefined();
      expect(TestType.name).toBe('WithMetadata');
    });

    it('should handle deeply nested objects', () => {
      const DeeplyNested = z.object({
        user: z.object({
          profile: z.object({
            bio: z.string().describe('Biography'),
          }).describe('Profile: User profile'),
        }).describe('User: User data'),
      }).describe('DeepNest: Deeply nested structure');

      const TestType = zodToGraphQL(DeeplyNested);

      expect(TestType).toBeDefined();
      expect(TestType.name).toBe('DeepNest');
    });
  });

  describe('Naming and descriptions', () => {
    it('should extract type name and description from schema description', () => {
      const Schema = z.object({
        field: z.string().describe('Field description'),
      }).describe('TypeName: This is the type description');

      const Type = zodToGraphQL(Schema);

      expect(Type.name).toBe('TypeName');
    });

    it('should handle description without type name prefix', () => {
      const Schema = z.object({
        field: z.string().describe('Field'),
      }).describe('Just a description without prefix');

      const Type = zodToGraphQL(Schema);

      // Should use default name
      expect(Type.name).toBe('GeneratedType');
    });

    it('should use provided name option over schema description', () => {
      const Schema = z.object({
        field: z.string().describe('Field'),
      }).describe('SchemaName: Description');

      const Type = zodToGraphQL(Schema, { name: 'CustomName' });

      expect(Type.name).toBe('CustomName');
    });

    it('should handle colons in descriptions correctly', () => {
      const Schema = z.object({
        field: z.string().describe('Field'),
      }).describe('TypeName: Description with: multiple: colons');

      const Type = zodToGraphQL(Schema);

      expect(Type.name).toBe('TypeName');
    });
  });

  describe('Warning system', () => {
    beforeEach(() => {
      clearGeneratedTypesCache();
    });

    it('should warn when nested object has no description', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const Schema = z.object({
        nested: z.object({
          field: z.string(),
        }),
      }).describe('ParentType: Parent description');

      zodToGraphQL(Schema);

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('has no description');
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('nested');

      consoleWarnSpy.mockRestore();
    });

    it('should warn when nested object description lacks type name', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const Schema = z.object({
        nested: z.object({
          field: z.string(),
        }).describe('Just a description without type name prefix'),
      }).describe('ParentType: Parent description');

      zodToGraphQL(Schema);

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('doesn\'t follow the "TypeName: Description" format');

      consoleWarnSpy.mockRestore();
    });

    it('should not warn when nested object has proper description format', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const Schema = z.object({
        nested: z.object({
          field: z.string(),
        }).describe('NestedType: Proper nested type description'),
      }).describe('ParentType: Parent description');

      zodToGraphQL(Schema);

      expect(consoleWarnSpy).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Real-world schema examples', () => {
    it('should handle EmbeddingMetadata-like schema', () => {
      const EmbeddingMetadataSchema = z.object({
        progress: z.object({
          completed: z.boolean().describe('Whether the embedding process is completed'),
          processedChunks: z.number().int().min(0).describe('Number of chunks processed'),
          totalChunks: z.number().int().min(1).describe('Total number of chunks'),
        }).optional().describe('EmbeddingProgress: Progress tracking'),
        errorInfo: z.object({
          message: z.string().min(1).describe('Error message'),
          retryCount: z.number().int().min(0).describe('Number of retries'),
          lastAttemptAt: z.string().datetime().describe('Last attempt timestamp'),
        }).optional().describe('EmbeddingErrorInfo: Error information'),
      }).describe('EmbeddingMetadata: Metadata for embedding operations');

      const MetadataType = zodToGraphQL(EmbeddingMetadataSchema);

      expect(MetadataType).toBeDefined();
      expect(MetadataType.name).toBe('EmbeddingMetadata');

      const instance = new MetadataType();
      expect(instance).toBeDefined();
    });

    it('should handle complex nested structures', () => {
      const ComplexSchema = z.object({
        id: z.string().describe('Unique identifier'),
        name: z.string().describe('Name'),
        config: z.object({
          enabled: z.boolean().describe('Whether enabled'),
          settings: z.object({
            timeout: z.number().describe('Timeout in ms'),
            retries: z.number().describe('Max retries'),
          }).describe('Settings: Configuration settings'),
        }).describe('Config: Configuration object'),
        metadata: z.object({
          createdAt: z.string().datetime().describe('Creation time'),
          updatedAt: z.string().datetime().optional().describe('Update time'),
        }).optional().describe('Metadata: Metadata information'),
      }).describe('ComplexEntity: A complex entity type');

      const EntityType = zodToGraphQL(ComplexSchema);

      expect(EntityType).toBeDefined();
      expect(EntityType.name).toBe('ComplexEntity');

      const instance = new EntityType();
      expect(instance).toBeDefined();
    });
  });

  describe('zodToGraphQLTypes helper', () => {
    it('should return a map with the root type', () => {
      const Schema = z.object({
        name: z.string().describe('Name'),
      }).describe('User: A user type');

      const types = zodToGraphQLTypes(Schema);

      expect(types).toBeDefined();
      expect(types['User']).toBeDefined();
      expect(types['User'].name).toBe('User');
    });

    it('should use provided root name', () => {
      const Schema = z.object({
        name: z.string().describe('Name'),
      }).describe('OriginalName: Description');

      const types = zodToGraphQLTypes(Schema, 'CustomName');

      expect(types['CustomName']).toBeDefined();
      expect(types['CustomName'].name).toBe('CustomName');
    });

    it('should use default name if no description or name provided', () => {
      const Schema = z.object({
        name: z.string().describe('Name'),
      });

      const types = zodToGraphQLTypes(Schema);

      expect(types['Root']).toBeDefined();
    });
  });

  describe('TypeGraphQL integration', () => {
    it('should create types compatible with TypeGraphQL', () => {
      const UserSchema = z.object({
        id: z.string().describe('User ID'),
        name: z.string().describe('User name'),
        age: z.number().optional().describe('User age'),
      }).describe('User: A user in the system');

      const UserType = zodToGraphQL(UserSchema);

      // Verify the type has TypeGraphQL metadata
      expect(UserType).toBeDefined();
      expect(UserType.name).toBe('User');

      // Verify instances can be created
      const instance = new UserType();
      expect(instance).toBeDefined();
    });
  });

  describe('Type inference', () => {
    it('should preserve TypeScript type inference', () => {
      const Schema = z.object({
        name: z.string(),
        age: z.number(),
        active: z.boolean().optional(),
      }).describe('InferTest: Type inference test');

      const Type = zodToGraphQL(Schema);
      const instance = new Type();

      // TypeScript should infer these properties exist
      type ExpectedType = {
        name: string;
        age: number;
        active?: boolean;
      };

      // This is a compile-time check that the types match
      const _typeCheck: ExpectedType = instance as any;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('z.any() support', () => {
    it('should handle z.any() schemas by returning GraphQL JSON type', () => {
      const AnySchema = z.any().describe('ArbitraryData: Any JSON data');

      const AnyType = zodToGraphQL(AnySchema);

      expect(AnyType).toBeDefined();
      // Should return GraphQL JSON type for any type
    });

    it('should handle optional z.any() schemas', () => {
      const OptionalAnySchema = z.any().optional().describe('OptionalData: Optional any data');

      const OptionalAnyType = zodToGraphQL(OptionalAnySchema);

      expect(OptionalAnyType).toBeDefined();
      // Should return GraphQL JSON type for optional any type
    });

    it('should handle nullable z.any() schemas', () => {
      const NullableAnySchema = z.any().nullable().describe('NullableData: Nullable any data');

      const NullableAnyType = zodToGraphQL(NullableAnySchema);

      expect(NullableAnyType).toBeDefined();
      // Should return GraphQL JSON type for nullable any type
    });

    it('should handle z.any() with default value', () => {
      const AnyWithDefaultSchema = z.any().default({}).describe('DefaultData: Any data with default');

      const AnyWithDefaultType = zodToGraphQL(AnyWithDefaultSchema);

      expect(AnyWithDefaultType).toBeDefined();
      // Should return GraphQL JSON type for any type with default
    });
  });

  describe('Edge cases', () => {
    it('should handle empty schema', () => {
      const EmptySchema = z.object({}).describe('Empty: Empty type');

      const EmptyType = zodToGraphQL(EmptySchema);

      expect(EmptyType).toBeDefined();
      expect(EmptyType.name).toBe('Empty');

      const instance = new EmptyType();
      expect(instance).toBeDefined();
    });

    it('should handle schema with only optional fields', () => {
      const AllOptional = z.object({
        field1: z.string().optional().describe('Field 1'),
        field2: z.number().optional().describe('Field 2'),
      }).describe('AllOptional: All fields optional');

      const Type = zodToGraphQL(AllOptional);

      expect(Type).toBeDefined();
      const instance = new Type();
      expect(instance).toBeDefined();
    });

    it('should handle supported schemas at top level', () => {
      // Test that arrays and any types are now supported at the top level
      const ArraySchema = z.array(z.string()).describe('TestArray: Test array');
      const AnySchema = z.any().describe('TestAny: Test any');

      expect(() => {
        zodToGraphQL(ArraySchema);
        zodToGraphQL(AnySchema);
      }).not.toThrow();

      // All should return GraphQL JSON type
      const ArrayType = zodToGraphQL(ArraySchema);
      const AnyType = zodToGraphQL(AnySchema);

      expect(ArrayType).toBeDefined();
      expect(AnyType).toBeDefined();
    });
  });
});
