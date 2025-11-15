/**
 * JsonArrayTypeStrategy - Handles JSON array fields with or without itemSchema
 *
 * JSON arrays can be:
 * - Typed with itemSchema: CustomType[]
 * - Untyped: Record<string, any>[]
 * Priority: 70 (before regular JSON)
 */

import { EntityField } from '../../../parsers/EntityJsonParser.js';
import { FieldTypeStrategy, TypeContext } from './FieldTypeStrategy.js';
import { TypeMapper } from '../../utils/TypeMapper.js';

export class JsonArrayTypeStrategy implements FieldTypeStrategy {
  matches(field: EntityField): boolean {
    return field.type === 'json' && field.array === true;
  }

  getTsType(context: TypeContext): string {
    const { field, entityName, fieldName } = context;

    // JSON arrays with itemSchema get typed interface
    if (field.itemSchema) {
      const interfaceName = TypeMapper.getItemSchemaInterfaceName(entityName, fieldName);
      return `${interfaceName}[]`;
    }

    // JSON arrays without itemSchema are generic
    return 'Record<string, any>[]';
  }

  getGraphQLType(context: TypeContext): string {
    // All JSON arrays use GraphQLJSON (accepts any JSON value including arrays)
    return 'GraphQLJSON';
  }

  getColumnType(field: EntityField): string | null {
    return 'json';
  }

  getPriority(): number {
    return 70; // Before regular JSON
  }
}
