/**
 * FieldTypeStrategy - Strategy pattern interface for type conversion
 *
 * Eliminates if/else chains by using polymorphism:
 * - Each strategy handles one type pattern (relationship, enum, json, etc.)
 * - Registry dispatches to appropriate strategy based on field characteristics
 * - Makes adding new types trivial (just add new strategy class)
 */

import { EntityField } from '../../../parsers/EntityJsonParser.js';

/**
 * Context for type conversion - provides entity information
 */
export interface TypeContext {
  entityName: string;
  fieldName: string;
  field: EntityField;
}

/**
 * Strategy interface for field type conversion
 * Each concrete strategy implements one type pattern
 */
export interface FieldTypeStrategy {
  /**
   * Check if this strategy handles the given field
   */
  matches(field: EntityField): boolean;

  /**
   * Get TypeScript type for this field
   */
  getTsType(context: TypeContext): string;

  /**
   * Get GraphQL type for this field
   */
  getGraphQLType(context: TypeContext): string;

  /**
   * Get database column type for this field (null if not a database column)
   */
  getColumnType(field: EntityField): string | null;

  /**
   * Strategy priority (higher = checked first)
   * Used to resolve conflicts when multiple strategies could match
   */
  getPriority(): number;
}
