/**
 * JsonArrayFieldStrategy - Handles JSON array fields and scalar arrays
 *
 * Uses FieldColumnJSON for:
 * - JSON arrays with itemSchema
 * - Scalar arrays (string[], number[], boolean[])
 * Priority: 70 (before regular JSON and scalar strategies)
 */

import { EntityField } from '../../../parsers/EntityJsonParser.js';
import { FieldPreparatorStrategy, FieldPreparationContext, PreparedFieldData } from './FieldPreparatorStrategy.js';
import { TypeMapper } from '../../utils/TypeMapper.js';
import { DecoratorGenerator } from '../../preparators/DecoratorGenerator.js';

export class JsonArrayFieldStrategy implements FieldPreparatorStrategy {
  matches(field: EntityField, context: FieldPreparationContext): boolean {
    // JSON arrays with itemSchema
    if (field.type === 'json' && field.array && field.itemSchema) {
      return true;
    }

    // Scalar arrays (string[], number[], boolean[])
    if ((field.type === 'string' || field.type === 'number' || field.type === 'boolean') && field.array) {
      return true;
    }

    return false;
  }

  prepare(context: FieldPreparationContext): PreparedFieldData {
    const { field, entity } = context;
    const tsType = TypeMapper.getTsType(field, entity.name);
    const nullability = field.required ? '!' : '?';

    // Use FieldColumnJSON for all scalar arrays and JSON arrays with itemSchema
    // This fixes SQLite array serialization issues
    const decorator = DecoratorGenerator.createFieldColumnJSON(field, entity.name);

    return {
      name: field.name,
      tsType,
      nullability,
      decorators: [decorator],
    };
  }

  getPriority(): number {
    return 70; // Before regular JSON
  }
}
