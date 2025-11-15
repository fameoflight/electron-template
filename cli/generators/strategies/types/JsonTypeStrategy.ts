/**
 * JsonTypeStrategy - Handles regular (non-array) JSON fields
 *
 * JSON fields store structured data as JSON objects
 * Priority: 60 (after JSON arrays)
 */

import { EntityField } from '../../../parsers/EntityJsonParser.js';
import { FieldTypeStrategy, TypeContext } from './FieldTypeStrategy.js';

export class JsonTypeStrategy implements FieldTypeStrategy {
  matches(field: EntityField): boolean {
    return field.type === 'json' && !field.array;
  }

  getTsType(context: TypeContext): string {
    return 'Record<string, any>';
  }

  getGraphQLType(context: TypeContext): string {
    // Regular JSON uses GraphQLJSONObject (only accepts objects, not arrays)
    return 'GraphQLJSONObject';
  }

  getColumnType(field: EntityField): string | null {
    return 'json';
  }

  getPriority(): number {
    return 60; // After JSON arrays
  }
}
