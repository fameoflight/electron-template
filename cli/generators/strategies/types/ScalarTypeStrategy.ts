/**
 * ScalarTypeStrategy - Handles basic scalar types (string, number, boolean, date, uuid)
 *
 * Catches all remaining basic types after special cases are handled
 * Supports arrays of scalars
 * Priority: 10 (lowest - fallback for unmatched types)
 */

import { EntityField } from '../../../parsers/EntityJsonParser.js';
import { FieldTypeStrategy, TypeContext } from './FieldTypeStrategy.js';

export class ScalarTypeStrategy implements FieldTypeStrategy {
  // Type mappings
  private static readonly TS_TYPES: Record<string, string> = {
    string: 'string',
    text: 'string',
    number: 'number',
    boolean: 'boolean',
    date: 'Date',
    uuid: 'string',
    key: 'string',
    relation: 'string',
  };

  private static readonly GRAPHQL_TYPES: Record<string, string> = {
    string: 'String',
    text: 'String',
    number: 'Number',
    boolean: 'Boolean',
    date: 'Date',
    uuid: 'String',
    key: 'String',
    relation: 'String',
  };

  private static readonly COLUMN_TYPES: Record<string, string> = {
    string: 'varchar',
    text: 'text',
    number: 'integer',
    boolean: 'boolean',
    date: 'datetime',
    uuid: 'uuid',
    json: 'json',
  };

  matches(field: EntityField): boolean {
    // Matches if type is in our type map
    return !!field.type && field.type in ScalarTypeStrategy.TS_TYPES;
  }

  getTsType(context: TypeContext): string {
    const { field } = context;
    const baseType = ScalarTypeStrategy.TS_TYPES[field.type!] || 'string';
    return field.array ? `${baseType}[]` : baseType;
  }

  getGraphQLType(context: TypeContext): string {
    const { field } = context;
    const baseType = ScalarTypeStrategy.GRAPHQL_TYPES[field.type!] || 'String';
    return field.array ? `[${baseType}!]` : baseType;
  }

  getColumnType(field: EntityField): string | null {
    if (!field.type) return null;
    return ScalarTypeStrategy.COLUMN_TYPES[field.type] || null;
  }

  getPriority(): number {
    return 10; // Lowest priority - fallback
  }
}
