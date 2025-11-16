/**
 * TypeStrategyRegistry - Central registry for type conversion strategies
 *
 * Replaces TypeMapper's if/else chains with O(1) strategy lookup:
 * - Strategies are sorted by priority (high to low)
 * - First matching strategy handles the conversion
 * - Adding new types = just register new strategy (no code changes to TypeMapper)
 *
 * Pattern: Registry + Strategy
 */

import { EntityField } from '../../../parsers/EntityJsonParser.js';
import { FieldTypeStrategy, TypeContext } from './FieldTypeStrategy.js';
import { RelationshipTypeStrategy } from './RelationshipTypeStrategy.js';
import { PolymorphicTypeStrategy } from './PolymorphicTypeStrategy.js';
import { EnumTypeStrategy } from './EnumTypeStrategy.js';
import { JsonArrayTypeStrategy } from './JsonArrayTypeStrategy.js';
import { JsonTypeStrategy } from './JsonTypeStrategy.js';
import { ScalarTypeStrategy } from './ScalarTypeStrategy.js';

export class TypeStrategyRegistry {
  private strategies: FieldTypeStrategy[] = [];

  constructor() {
    // Register all strategies (order matters - high priority first)
    this.registerDefaults();
  }

  /**
   * Register default type strategies
   * Order: High priority → Low priority
   */
  private registerDefaults(): void {
    this.register(new RelationshipTypeStrategy());  // Priority 100
    this.register(new PolymorphicTypeStrategy());   // Priority 90
    this.register(new EnumTypeStrategy());          // Priority 80
    this.register(new JsonArrayTypeStrategy());     // Priority 70
    this.register(new JsonTypeStrategy());          // Priority 60
    this.register(new ScalarTypeStrategy());        // Priority 10 (fallback)

    // Sort by priority (highest first)
    this.strategies.sort((a, b) => b.getPriority() - a.getPriority());
  }

  /**
   * Register a custom type strategy
   */
  register(strategy: FieldTypeStrategy): void {
    this.strategies.push(strategy);
    // Re-sort after adding
    this.strategies.sort((a, b) => b.getPriority() - a.getPriority());
  }

  /**
   * Find the appropriate strategy for a field
   * Returns first matching strategy (highest priority wins)
   */
  findStrategy(field: EntityField): FieldTypeStrategy | null {
    return this.strategies.find(s => s.matches(field)) || null;
  }

  /**
   * Get TypeScript type for a field
   */
  getTsType(entityName: string, fieldName: string, field: EntityField): string {
    const strategy = this.findStrategy(field);
    if (!strategy) {
      // Fallback to string if no strategy matches
      return field.array ? 'string[]' : 'string';
    }

    const context: TypeContext = { entityName, fieldName, field };
    return strategy.getTsType(context);
  }

  /**
   * Get GraphQL type for a field
   */
  getGraphQLType(entityName: string, fieldName: string, field: EntityField): string {
    const strategy = this.findStrategy(field);
    if (!strategy) {
      // Fallback to String if no strategy matches
      return field.array ? '[String!]' : 'String';
    }

    const context: TypeContext = { entityName, fieldName, field };
    return strategy.getGraphQLType(context);
  }

  /**
   * Get database column type for a field
   */
  getColumnType(field: EntityField): string | null {
    const strategy = this.findStrategy(field);
    if (!strategy) {
      return null;
    }

    return strategy.getColumnType(field);
  }
}

// Singleton instance for global use
let registryInstance: TypeStrategyRegistry | null = null;

/**
 * Get the global TypeStrategyRegistry instance
 */
export function getTypeStrategyRegistry(): TypeStrategyRegistry {
  if (!registryInstance) {
    registryInstance = new TypeStrategyRegistry();
  }
  return registryInstance;
}
