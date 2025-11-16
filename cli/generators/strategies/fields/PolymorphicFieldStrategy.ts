/**
 * PolymorphicFieldStrategy - Handles polymorphic relationship fields
 *
 * Polymorphic fields generate two columns: {fieldName}Id and {fieldName}Type
 * Priority: 100 (highest - must be checked before other strategies)
 */

import { EntityField } from '../../../parsers/EntityJsonParser.js';
import { FieldPreparatorStrategy, FieldPreparationContext, PreparedFieldData } from './FieldPreparatorStrategy.js';
import { TypeMapper } from '../../utils/TypeMapper.js';
import { DecoratorGenerator } from '../../preparators/DecoratorGenerator.js';

export class PolymorphicFieldStrategy implements FieldPreparatorStrategy {
  matches(field: EntityField, context: FieldPreparationContext): boolean {
    return field.type === 'polymorphic';
  }

  prepare(context: FieldPreparationContext): PreparedFieldData[] {
    const { field, entity } = context;
    const { idColumn, typeColumn } = TypeMapper.getPolymorphicColumns(field.name);
    const nullability = field.required ? '!' : '?';

    // Prepare ID column
    const idDecorator = DecoratorGenerator.createPolymorphicIdFieldColumn(field, entity.name);
    const idField: PreparedFieldData = {
      name: idColumn,
      tsType: 'string',
      nullability,
      decorators: [idDecorator],
      isPolymorphicId: true,
      originalFieldName: field.name,
    };

    // Prepare Type column
    const typeDecorator = DecoratorGenerator.createPolymorphicTypeFieldColumn(field, entity.name);
    const typeField: PreparedFieldData = {
      name: typeColumn,
      tsType: 'string',
      nullability,
      decorators: [typeDecorator],
      isPolymorphicType: true,
      originalFieldName: field.name,
    };

    return [idField, typeField];
  }

  getPriority(): number {
    return 100; // Highest priority
  }
}
