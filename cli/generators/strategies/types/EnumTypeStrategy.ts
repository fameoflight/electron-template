/**
 * EnumTypeStrategy - Handles enum fields (single and array)
 *
 * Enums are registered TypeScript enums with named values
 * Naming convention: {EntityName}{SingularFieldName}
 * Priority: 80 (high - must be checked before scalar strategies)
 */

import { EntityField } from '../../../parsers/EntityJsonParser.js';
import { FieldTypeStrategy, TypeContext } from './FieldTypeStrategy.js';
import { TypeMapper } from '../../utils/TypeMapper.js';

export class EnumTypeStrategy implements FieldTypeStrategy {
  matches(field: EntityField): boolean {
    return field.type === 'enum';
  }

  getTsType(context: TypeContext): string {
    const enumName = this.getEnumName(context);
    return context.field.array ? `${enumName}[]` : enumName;
  }

  getGraphQLType(context: TypeContext): string {
    const enumName = this.getEnumName(context);
    return context.field.array ? `[${enumName}!]` : enumName;
  }

  getColumnType(field: EntityField): string | null {
    return field.array ? 'json' : 'varchar';
  }

  getPriority(): number {
    return 80; // High priority
  }

  /**
   * Generate enum name: {EntityName}{SingularFieldName}
   */
  private getEnumName(context: TypeContext): string {
    const singularField = TypeMapper.singularizeFieldName(context.fieldName);
    return `${context.entityName}${singularField.charAt(0).toUpperCase() + singularField.slice(1)}`;
  }
}
