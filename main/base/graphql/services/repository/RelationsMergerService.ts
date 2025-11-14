import { FindOptionsRelations } from 'typeorm';

/**
 * Service for merging default and explicit relations
 * Extracts complex conditional logic from RelayRepository
 *
 * Handles 3 input types:
 * - string: single relation name
 * - string[]: array of relation names
 * - FindOptionsRelations<T>: TypeORM object format
 */
export class RelationsMergerService {
  /**
   * Merge default relations with explicit relations
   * Smart handling of different input types
   *
   * @param defaults Default relations from @EagerLoad or metadata
   * @param explicit Explicit relations passed by caller
   * @returns Merged relations (undefined if both are empty)
   */
  static merge<T>(
    defaults?: string[],
    explicit?: string | string[] | FindOptionsRelations<T>
  ): string[] | FindOptionsRelations<T> | undefined {
    // Case 1: Both empty → undefined
    if (!defaults && !explicit) {
      return undefined;
    }

    // Case 2: No defaults → return explicit (normalized)
    if (!defaults) {
      return this.normalizeExplicit(explicit);
    }

    // Case 3: No explicit → return defaults
    if (!explicit) {
      return defaults;
    }

    // Case 4: Explicit is object → object takes precedence
    if (this.isObject(explicit)) {
      return explicit as FindOptionsRelations<T>;
    }

    // Case 5: Both are arrays → merge and deduplicate
    const explicitArray = this.toArray(explicit);
    return [...new Set([...defaults, ...explicitArray])];
  }

  /**
   * Normalize explicit relations to proper format
   */
  private static normalizeExplicit<T>(
    explicit?: string | string[] | FindOptionsRelations<T>
  ): string[] | FindOptionsRelations<T> | undefined {
    if (!explicit) {
      return undefined;
    }

    // Object format → return as-is
    if (this.isObject(explicit)) {
      return explicit as FindOptionsRelations<T>;
    }

    // String or array → convert to array
    return this.toArray(explicit);
  }

  /**
   * Check if value is a FindOptionsRelations object
   * (not a string, not an array)
   */
  private static isObject(value: any): boolean {
    return typeof value === 'object' && !Array.isArray(value);
  }

  /**
   * Convert string or array to array
   */
  private static toArray(value: string | string[] | any): string[] {
    if (typeof value === 'string') {
      return [value];
    }
    if (Array.isArray(value)) {
      return value;
    }
    return [];
  }
}

/**
 * Builder pattern for complex relation merging scenarios
 * Use when you need more control over the merging process
 */
export class RelationsMergerBuilder<T = any> {
  private defaults?: string[];
  private explicit?: string | string[] | FindOptionsRelations<T>;
  private overrides?: string[];

  /**
   * Set default relations
   */
  withDefaults(defaults?: string[]): this {
    this.defaults = defaults;
    return this;
  }

  /**
   * Set explicit relations
   */
  withExplicit(explicit?: string | string[] | FindOptionsRelations<T>): this {
    this.explicit = explicit;
    return this;
  }

  /**
   * Set override relations (always included)
   */
  withOverrides(overrides?: string[]): this {
    this.overrides = overrides;
    return this;
  }

  /**
   * Build the final merged relations
   */
  build(): string[] | FindOptionsRelations<T> | undefined {
    // Start with base merge
    let result = RelationsMergerService.merge(this.defaults, this.explicit);

    // Add overrides if present
    if (this.overrides && this.overrides.length > 0) {
      if (!result) {
        result = this.overrides;
      } else if (Array.isArray(result)) {
        result = [...new Set([...result, ...this.overrides])];
      }
      // If result is object, overrides don't apply
    }

    return result;
  }
}
