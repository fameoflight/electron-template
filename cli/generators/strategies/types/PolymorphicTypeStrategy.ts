/**
 * PolymorphicTypeStrategy - Handles polymorphic relationship fields
 *
 * Polymorphic fields are special relationships that can point to multiple entity types
 * They're stored as two columns: {fieldName}Id and {fieldName}Type
 * Priority: 90 (high - must be checked before JSON/scalar strategies)
 */

import { EntityField } from '../../../parsers/EntityJsonParser.js';
import { FieldTypeStrategy, TypeContext } from './FieldTypeStrategy.js';

export class PolymorphicTypeStrategy implements FieldTypeStrategy {
  matches(field: EntityField): boolean {
    return field.type === 'polymorphic';
  }

  getTsType(context: TypeContext): string {
    return 'string';
  }

  getGraphQLType(context: TypeContext): string {
    return 'String';
  }

  getColumnType(field: EntityField): string | null {
    return 'varchar';
  }

  getPriority(): number {
    return 90; // High priority
  }
}
