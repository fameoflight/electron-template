/**
 * FieldPreparatorStrategy - Strategy pattern interface for field preparation
 *
 * Eliminates if/else chains by using polymorphism:
 * - Each strategy handles one field preparation pattern
 * - Registry dispatches to appropriate strategy based on field characteristics
 * - Makes adding new field types trivial (just add new strategy class)
 */

import { ParsedEntity, EntityField } from '../../../parsers/EntityJsonParser.js';

/**
 * Context for field preparation - provides entity information
 */
export interface FieldPreparationContext {
  entity: ParsedEntity;
  field: EntityField;
}

/**
 * Prepared field data structure for templates
 */
export interface PreparedFieldData {
  name: string;
  tsType: string;
  nullability: string;
  decorators: string[];
  isForeignKey?: boolean;
  isPolymorphicId?: boolean;
  isPolymorphicType?: boolean;
  originalFieldName?: string;
}

/**
 * Strategy interface for field preparation
 * Each concrete strategy implements one field pattern
 */
export interface FieldPreparatorStrategy {
  /**
   * Check if this strategy handles the given field
   */
  matches(field: EntityField, context: FieldPreparationContext): boolean;

  /**
   * Prepare field data for template rendering
   * Returns null if field should be skipped
   * Returns array for fields that generate multiple columns (e.g., polymorphic)
   */
  prepare(context: FieldPreparationContext): PreparedFieldData | PreparedFieldData[] | null;

  /**
   * Strategy priority (higher = checked first)
   * Used to resolve conflicts when multiple strategies could match
   */
  getPriority(): number;
}
