/**
 * JsonFieldStrategy - Handles regular (non-array) JSON fields
 *
 * Uses FieldColumnJSON for JSON fields with or without schemas
 * Priority: 60 (after JSON arrays, before regular scalars)
 */

import { EntityField } from '../../../parsers/EntityJsonParser.js';
import { FieldPreparatorStrategy, FieldPreparationContext, PreparedFieldData } from './FieldPreparatorStrategy.js';
import { TypeMapper } from '../../utils/TypeMapper.js';
import { DecoratorGenerator } from '../../preparators/DecoratorGenerator.js';

export class JsonFieldStrategy implements FieldPreparatorStrategy {
  matches(field: EntityField, context: FieldPreparationContext): boolean {
    return field.type === 'json' && !field.array;
  }

  prepare(context: FieldPreparationContext): PreparedFieldData {
    const { field, entity } = context;
    const tsType = TypeMapper.getTsType(field, entity.name);
    const nullability = field.required ? '!' : '?';

    // Use FieldColumnJSON for all JSON fields
    // This ensures proper Zod validation and consistent decorator usage
    const decorator = DecoratorGenerator.createFieldColumnJSON(field, entity.name);

    return {
      name: field.name,
      tsType,
      nullability,
      decorators: [decorator],
    };
  }

  getPriority(): number {
    return 60; // After JSON arrays
  }
}
