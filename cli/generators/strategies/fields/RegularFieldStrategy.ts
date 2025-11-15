/**
 * RegularFieldStrategy - Handles regular scalar fields
 *
 * Handles basic types: string, text, number, boolean, date, uuid
 * Uses FieldColumn decorator
 * Priority: 10 (lowest - fallback for unmatched fields)
 */

import { EntityField } from '../../../parsers/EntityJsonParser.js';
import { FieldPreparatorStrategy, FieldPreparationContext, PreparedFieldData } from './FieldPreparatorStrategy.js';
import { TypeMapper } from '../../utils/TypeMapper.js';
import { DecoratorGenerator } from '../../preparators/DecoratorGenerator.js';
import { ValidationHelper } from '../../utils/ValidationHelper.js';
import { GraphQLOptions } from '../../utils/GraphQLOptions.js';
import { output } from '../../../utils/output.js';

export class RegularFieldStrategy implements FieldPreparatorStrategy {
  matches(field: EntityField, context: FieldPreparationContext): boolean {
    // Match regular scalar types that haven't been handled by other strategies
    // Note: string/number/boolean arrays are handled by JsonArrayFieldStrategy
    // This catches date arrays and non-array scalars
    const scalarTypes = ['string', 'text', 'number', 'boolean', 'date', 'uuid'];

    if (!field.type || !scalarTypes.includes(field.type)) {
      return false;
    }

    // Allow date arrays (they're not handled by JsonArrayFieldStrategy)
    if (field.type === 'date' && field.array) {
      return true;
    }

    // For other types, only match non-arrays (arrays handled by JsonArrayFieldStrategy)
    return !field.array;
  }

  prepare(context: FieldPreparationContext): PreparedFieldData {
    const { field, entity } = context;
    const graphqlOptions = new GraphQLOptions(field);
    const tsType = TypeMapper.getTsType(field, entity.name);
    const nullability = field.required ? '!' : '?';

    // Use DecoratorGenerator for regular fields
    const decorator = DecoratorGenerator.createFieldColumn(field, entity.name);

    return {
      name: field.name,
      tsType,
      nullability,
      decorators: [decorator],
    };

  }

  getPriority(): number {
    return 10; // Lowest priority - fallback
  }
}
