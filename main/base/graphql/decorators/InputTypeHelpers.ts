import 'reflect-metadata';
import { InputType, Field, ID } from 'type-graphql';
import { ClassType } from 'type-graphql';

/**
 * Cache for generated input types to avoid recreating them
 */
const generatedInputCache = new Map<string, any>();

/**
 * Create an input type with an optional ID field (for createUpdate operations)
 * @param BaseInput - Base input class
 * @param name - Name for the generated class (e.g., "CreateUpdatePostInput")
 */
export function withOptionalId<T extends object>(
  BaseInput: ClassType<T>,
  name: string
): ClassType<T & { id?: string }> {
  @InputType(name)
  class WithOptionalId extends (BaseInput as ClassType<any>) {
    @Field(() => ID, { nullable: true, description: `Unique identifier for the ${name}` })
    id?: string;
  }

  // Set the name property for better debugging and schema generation
  Object.defineProperty(WithOptionalId, 'name', { value: name });

  return WithOptionalId as ClassType<T & { id?: string }>;
}

/**
 * Create an input type with a required ID field (for update operations)
 * @param BaseInput - Base input class
 * @param name - Name for the generated class (e.g., "UpdatePostInput")
 */
export function withRequiredId<T extends object>(
  BaseInput: ClassType<T>,
  name: string
): ClassType<T & { id: string }> {
  @InputType(name)
  class WithRequiredId extends (BaseInput as ClassType<any>) {
    @Field(() => ID, { description: `Unique identifier for the ${name}` })
    id!: string;
  }

  // Set the name property for better debugging and schema generation
  Object.defineProperty(WithRequiredId, 'name', { value: name });

  return WithRequiredId as ClassType<T & { id: string }>;
}

/**
 * Get or create input variants for CRUD operations
 * Returns three variants: base (for create), withId (for update), withOptionalId (for createUpdate)
 */
export function getInputVariants<T extends object>(
  BaseInput: ClassType<T>,
  entityName: string
): {
  createInput: ClassType<T>;
  updateInput: ClassType<T & { id: string }>;
  createUpdateInput: ClassType<T & { id?: string }>;
} {
  const cacheKey = `${entityName}:${BaseInput.name}`;

  if (generatedInputCache.has(cacheKey)) {
    return generatedInputCache.get(cacheKey);
  }

  const variants = {
    createInput: BaseInput, // Use base input as-is (no id needed for creation)
    updateInput: withRequiredId(BaseInput, `Update${entityName}Input`),
    createUpdateInput: withOptionalId(BaseInput, `CreateUpdate${entityName}Input`)
  };

  generatedInputCache.set(cacheKey, variants);
  return variants;
}

/**
 * Helper to get input type dynamically based on naming convention
 * This follows the pattern used in the existing codebase
 */
export async function getInputType(entityName: string): Promise<ClassType<any>> {
  try {
    // Try to import the input type following the existing pattern
    const inputModule = await import(`../../graphql/inputs/${entityName}Input.ts`);
    const InputClass = inputModule[`${entityName}Input`];

    if (!InputClass) {
      throw new Error(`Export ${entityName}Input not found in inputs/${entityName}Input.ts`);
    }

    return InputClass as ClassType<any>;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not find ${entityName}Input - please create it first. Error: ${errorMessage}`);
  }
}

/**
 * Clear the generated input cache (useful for testing or schema rebuilding)
 */
export function clearInputCache(): void {
  generatedInputCache.clear();
}