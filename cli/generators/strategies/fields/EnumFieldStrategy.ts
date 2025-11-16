/**
 * EnumFieldStrategy - Handles enum fields
 *
 * Uses FieldColumnEnum decorator for enum fields
 * Priority: 80 (high - must be checked before regular scalar strategies)
 */

import { EntityField } from '../../../parsers/EntityJsonParser.js';
import { FieldPreparatorStrategy, FieldPreparationContext, PreparedFieldData } from './FieldPreparatorStrategy.js';
import { TypeMapper } from '../../utils/TypeMapper.js';
import { DecoratorGenerator } from '../../preparators/DecoratorGenerator.js';

export class EnumFieldStrategy implements FieldPreparatorStrategy {
  matches(field: EntityField, context: FieldPreparationContext): boolean {
    return field.type === 'enum';
  }

  prepare(context: FieldPreparationContext): PreparedFieldData {
    const { field, entity } = context;
    const tsType = TypeMapper.getTsType(field, entity.name);
    const nullability = field.required ? '!' : '?';

    // Use FieldColumnEnum for enum fields
    const decorator = DecoratorGenerator.createFieldColumnEnum(field, entity.name);

    return {
      name: field.name,
      tsType,
      nullability,
      decorators: [decorator],
    };
  }

  getPriority(): number {
    return 80; // High priority
  }
}
