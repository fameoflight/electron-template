/**
 * ForeignKeyFieldStrategy - Handles foreign key fields from relationships
 *
 * Generates FK columns for ManyToOne and OneToOne relationships
 * Priority: 90 (high - must be checked before regular field strategies)
 */

import { EntityField } from '../../../parsers/EntityJsonParser.js';
import { FieldPreparatorStrategy, FieldPreparationContext, PreparedFieldData } from './FieldPreparatorStrategy.js';
import { DecoratorGenerator } from '../../preparators/DecoratorGenerator.js';
import { GraphQLOptions } from '../../utils/GraphQLOptions.js';

export class ForeignKeyFieldStrategy implements FieldPreparatorStrategy {
  matches(field: EntityField, context: FieldPreparationContext): boolean {
    if (!field.relationship) return false;

    // Check GraphQL options - only generate FK if enabled
    const graphqlOptions = new GraphQLOptions(field);
    if (!graphqlOptions.shouldGenerateForeignKey()) return false;

    // For ManyToOne and OneToOne relations, generate FK
    const { type } = field.relationship;
    return type === 'ManyToOne' || type === 'OneToOne';
  }

  prepare(context: FieldPreparationContext): PreparedFieldData {
    const { field } = context;
    const graphqlOptions = new GraphQLOptions(field);
    const fkFieldName = this.getForeignKeyFieldName(field);
    const nullability = field.required ? '!' : '?';

    // Use DecoratorGenerator to create the FieldColumn decorator
    const decorator = DecoratorGenerator.createForeignKeyFieldColumn(field);
    const decorators = [decorator];

    // Add GraphQL @Field decorator only if object generation is enabled
    if (graphqlOptions.shouldGenerateObject()) {
      const fieldOptionsStr = field.description
        ? `{ description: '${field.description}' }`
        : '';
      decorators.unshift(`@Field(() => ID${fieldOptionsStr ? ', ' + fieldOptionsStr : ''})`);
    }

    return {
      name: fkFieldName,
      tsType: 'string',
      nullability,
      decorators,
      isForeignKey: true,
    };
  }

  getPriority(): number {
    return 90; // High priority
  }

  /**
   * Gets the foreign key field name for a relationship field
   */
  private getForeignKeyFieldName(field: EntityField): string {
    // Use explicit key if provided
    if (field.key) {
      return field.key;
    }

    // If field name already ends with 'Id', use it as-is
    if (field.name.endsWith('Id')) {
      return field.name;
    }

    // Default to {fieldName}Id
    return `${field.name}Id`;
  }
}
