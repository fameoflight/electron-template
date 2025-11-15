/**
 * RelationshipTypeStrategy - Handles relationship fields
 *
 * Relationship fields are foreign keys stored as UUID strings
 * Priority: 100 (highest - must be checked before other strategies)
 */

import { EntityField } from '../../../parsers/EntityJsonParser.js';
import { FieldTypeStrategy, TypeContext } from './FieldTypeStrategy.js';

export class RelationshipTypeStrategy implements FieldTypeStrategy {
  matches(field: EntityField): boolean {
    return !!field.relationship;
  }

  getTsType(context: TypeContext): string {
    return 'string';
  }

  getGraphQLType(context: TypeContext): string {
    return 'String';
  }

  getColumnType(field: EntityField): string | null {
    return 'uuid';
  }

  getPriority(): number {
    return 100; // Highest priority
  }
}
