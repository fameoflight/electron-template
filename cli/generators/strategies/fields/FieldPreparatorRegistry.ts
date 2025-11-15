/**
 * FieldPreparatorRegistry - Central registry for field preparation strategies
 *
 * Replaces FieldPreparator's if/else chains with O(1) strategy lookup:
 * - Strategies are sorted by priority (high to low)
 * - First matching strategy handles the preparation
 * - Adding new field types = just register new strategy (no FieldPreparator changes)
 *
 * Pattern: Registry + Strategy
 */

import { EntityField } from '../../../parsers/EntityJsonParser.js';
import { FieldPreparatorStrategy, FieldPreparationContext, PreparedFieldData } from './FieldPreparatorStrategy.js';
import { PolymorphicFieldStrategy } from './PolymorphicFieldStrategy.js';
import { ForeignKeyFieldStrategy } from './ForeignKeyFieldStrategy.js';
import { EnumFieldStrategy } from './EnumFieldStrategy.js';
import { JsonArrayFieldStrategy } from './JsonArrayFieldStrategy.js';
import { JsonFieldStrategy } from './JsonFieldStrategy.js';
import { RegularFieldStrategy } from './RegularFieldStrategy.js';

export class FieldPreparatorRegistry {
  private strategies: FieldPreparatorStrategy[] = [];

  constructor() {
    // Register all strategies (order matters - high priority first)
    this.registerDefaults();
  }

  /**
   * Register default field preparation strategies
   * Order: High priority → Low priority
   */
  private registerDefaults(): void {
    this.register(new PolymorphicFieldStrategy());  // Priority 100
    this.register(new ForeignKeyFieldStrategy());   // Priority 90
    this.register(new EnumFieldStrategy());         // Priority 80
    this.register(new JsonArrayFieldStrategy());    // Priority 70
    this.register(new JsonFieldStrategy());         // Priority 60
    this.register(new RegularFieldStrategy());      // Priority 10 (fallback)

    // Sort by priority (highest first)
    this.strategies.sort((a, b) => b.getPriority() - a.getPriority());
  }

  /**
   * Register a custom field preparation strategy
   */
  register(strategy: FieldPreparatorStrategy): void {
    this.strategies.push(strategy);
    // Re-sort after adding
    this.strategies.sort((a, b) => b.getPriority() - a.getPriority());
  }

  /**
   * Find the appropriate strategy for a field
   * Returns first matching strategy (highest priority wins)
   */
  findStrategy(field: EntityField, context: FieldPreparationContext): FieldPreparatorStrategy | null {
    return this.strategies.find(s => s.matches(field, context)) || null;
  }

  /**
   * Prepare a field using appropriate strategy
   * Returns null if field should be skipped
   */
  prepareField(context: FieldPreparationContext): PreparedFieldData | PreparedFieldData[] | null {
    const strategy = this.findStrategy(context.field, context);
    if (!strategy) {
      return null;
    }

    return strategy.prepare(context);
  }
}

// Singleton instance for global use
let registryInstance: FieldPreparatorRegistry | null = null;

/**
 * Get the global FieldPreparatorRegistry instance
 */
export function getFieldPreparatorRegistry(): FieldPreparatorRegistry {
  if (!registryInstance) {
    registryInstance = new FieldPreparatorRegistry();
  }
  return registryInstance;
}
