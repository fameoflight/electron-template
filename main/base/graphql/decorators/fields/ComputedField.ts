import 'reflect-metadata';
import { Field } from 'type-graphql';

/**
 * Options for ComputedField decorator
 */
export interface ComputedFieldOptions {
  // ──────────────────────────────────────────────────────────────────────────
  // GraphQL Field Options
  // ──────────────────────────────────────────────────────────────────────────
  /** GraphQL field description */
  description?: string;
  /** Whether the field can be null */
  nullable?: boolean;
  /** Whether this is an array field */
  array?: boolean;
  /** Deprecation reason */
  deprecationReason?: string;
  /** Field complexity for query cost analysis */
  complexity?: number;

  // ──────────────────────────────────────────────────────────────────────────
  // Computation Options
  // ──────────────────────────────────────────────────────────────────────────
  /**
   * Whether this field requires database relations to be loaded.
   * If true, suggests using eager loading or dataloader.
   */
  requiresRelations?: boolean;
  /**
   * Cache the computed value for this many milliseconds.
   * Useful for expensive computations that don't change often.
   */
  cacheTTL?: number;
}

/**
 * Magical decorator for computed/virtual GraphQL fields
 *
 * Creates a GraphQL field from a class method or getter without storing it in the database.
 * Perfect for derived values, formatted data, or aggregations.
 *
 * **Features:**
 * - Works with methods, getters, and async functions
 * - Auto-infers return type from TypeScript
 * - Supports complex computations and relationship access
 * - No database column created (TypeORM ignores it)
 * - Can mark fields that require eager loading
 *
 * @param type - GraphQL type (String, Number, Boolean, Date, or custom type)
 * @param options - Configuration options
 *
 * @example
 * ```typescript
 * // Simple getter
 * @ComputedField(String, { description: 'User full name' })
 * get fullName(): string {
 *   return `${this.firstName} ${this.lastName}`;
 * }
 *
 * // Method with logic
 * @ComputedField(Number, { description: 'User age in years' })
 * getAge(): number {
 *   const now = new Date();
 *   const birth = new Date(this.birthDate);
 *   return now.getFullYear() - birth.getFullYear();
 * }
 *
 * // Async method accessing relations
 * @ComputedField(Number, {
 *   description: 'Total posts count',
 *   requiresRelations: true
 * })
 * async postCount(): Promise<number> {
 *   return this.posts?.length || 0;
 * }
 *
 * // Array return type
 * @ComputedField(String, {
 *   description: 'User roles as strings',
 *   array: true
 * })
 * get roleNames(): string[] {
 *   return this.roles.map(role => role.name);
 * }
 *
 * // Nullable field
 * @ComputedField(String, {
 *   description: 'User display name (username or full name)',
 *   nullable: true
 * })
 * get displayName(): string | null {
 *   return this.fullName || this.username || null;
 * }
 *
 * // Complex computation with caching
 * @ComputedField(Number, {
 *   description: 'User reputation score',
 *   complexity: 10,
 *   cacheTTL: 3600000  // Cache for 1 hour
 * })
 * async calculateReputation(): Promise<number> {
 *   // Expensive computation...
 *   return this.upvotes * 10 - this.downvotes * 2;
 * }
 * ```
 */
export function ComputedField(
  type: any,
  options: ComputedFieldOptions = {}
): MethodDecorator & PropertyDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor?: PropertyDescriptor
  ) {
    const propertyName = String(propertyKey);

    // ──────────────────────────────────────────────────────────────────────────
    // 1. Validate Usage
    // ──────────────────────────────────────────────────────────────────────────
    // ComputedField can be applied to:
    // - Methods (descriptor with value that's a function)
    // - Getters (descriptor with get function)
    // - Properties (no descriptor, but should have getter)

    if (descriptor) {
      const isMethod = typeof descriptor.value === 'function';
      const isGetter = typeof descriptor.get === 'function';

      if (!isMethod && !isGetter) {
        throw new Error(
          `@ComputedField on ${target.constructor.name}.${propertyName}: ` +
          `Can only be applied to methods or getters`
        );
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. Determine Options
    // ──────────────────────────────────────────────────────────────────────────
    const {
      description,
      nullable = false,
      array = false,
      deprecationReason,
      complexity,
      requiresRelations = false,
      cacheTTL
    } = options;

    // Auto-generate description if not provided
    const finalDescription = description || generateComputedFieldDescription(
      propertyName,
      target
    );

    // ──────────────────────────────────────────────────────────────────────────
    // 3. Apply GraphQL @Field Decorator
    // ──────────────────────────────────────────────────────────────────────────
    const fieldOptions: any = {
      nullable,
      description: finalDescription
    };

    if (deprecationReason) {
      fieldOptions.deprecationReason = deprecationReason;
    }

    if (complexity !== undefined) {
      fieldOptions.complexity = complexity;
    }

    // Create type function
    const typeFunction = () => {
      if (type === String) return array ? [String] : String;
      if (type === Number) return array ? [Number] : Number;
      if (type === Boolean) return array ? [Boolean] : Boolean;
      if (type === Date) return array ? [Date] : Date;
      return array ? [type] : type;
    };

    Field(typeFunction, fieldOptions)(target, propertyKey, descriptor!);

    // ──────────────────────────────────────────────────────────────────────────
    // 4. Store Metadata for Introspection
    // ──────────────────────────────────────────────────────────────────────────
    // Store metadata about this computed field for tooling/debugging
    Reflect.defineMetadata(
      'computed:field',
      {
        requiresRelations,
        cacheTTL,
        complexity,
        nullable
      },
      target,
      propertyKey
    );

    // Mark as computed field (useful for filtering in queries)
    const existingComputedFields = Reflect.getMetadata('computed:fields', target) || [];
    Reflect.defineMetadata(
      'computed:fields',
      [...existingComputedFields, propertyName],
      target
    );

    // ──────────────────────────────────────────────────────────────────────────
    // 5. Optionally Add Caching Logic
    // ──────────────────────────────────────────────────────────────────────────
    if (cacheTTL && descriptor?.value) {
      const originalMethod = descriptor.value;
      const cacheKey = Symbol(`cache:${propertyName}`);
      const cacheTimeKey = Symbol(`cache:${propertyName}:time`);

      descriptor.value = function (this: any, ...args: any[]) {
        const now = Date.now();
        const cachedTime = (this as any)[cacheTimeKey];
        const cachedValue = (this as any)[cacheKey];

        // Return cached value if still valid
        if (cachedValue !== undefined && cachedTime && (now - cachedTime) < cacheTTL) {
          return cachedValue;
        }

        // Compute new value
        const result = originalMethod.apply(this, args);

        // Handle async results
        if (result && typeof result.then === 'function') {
          return result.then((value: any) => {
            (this as any)[cacheKey] = value;
            (this as any)[cacheTimeKey] = now;
            return value;
          });
        }

        // Cache sync results
        (this as any)[cacheKey] = result;
        (this as any)[cacheTimeKey] = now;
        return result;
      };
    }
  };
}

/**
 * Helper function to generate smart descriptions for computed fields
 * Now uses Chain of Responsibility pattern for cleaner, more maintainable code.
 */
function generateComputedFieldDescription(
  propertyName: string,
  target: any
): string {
  const { DescriptionGeneratorFactory } = require('../../services/description/DescriptionGenerator.js');

  const context = DescriptionGeneratorFactory.createContext(propertyName, undefined, target);
  const chain = DescriptionGeneratorFactory.createComputedFieldDescriptionChain();

  return chain.generate(context) || propertyName;
}

/**
 * Helper to check if a property is a computed field
 */
export function isComputedField(
  target: any,
  propertyKey: string
): boolean {
  return Reflect.hasMetadata('computed:field', target, propertyKey);
}

/**
 * Helper to get all computed field names for an entity
 */
export function getComputedFields(target: any): string[] {
  return Reflect.getMetadata('computed:fields', target.prototype || target) || [];
}

/**
 * Helper to get computed field metadata
 */
export function getComputedFieldMetadata(
  target: any,
  propertyKey: string
): {
  requiresRelations: boolean;
  cacheTTL?: number;
  complexity?: number;
  nullable: boolean;
} | undefined {
  return Reflect.getMetadata('computed:field', target, propertyKey);
}
