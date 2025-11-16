/**
 * FieldPreparator - Prepares field and relationship data for templates
 *
 * Refactored to use Strategy Pattern:
 * - Field preparation delegated to FieldPreparatorRegistry (eliminates complex if/else chains)
 * - Relationship preparation preserved (separate concern)
 * - Helper methods preserved (naming, filtering)
 * - Adding new field types = register new strategy (no changes to this file)
 */

import { ParsedEntity, EntityField } from '../../parsers/EntityJsonParser.js';
import { TypeMapper } from '../utils/TypeMapper.js';
import { DecoratorGenerator } from './DecoratorGenerator.js';
import { GraphQLOptions } from '../utils/GraphQLOptions.js';
import { getFieldPreparatorRegistry } from '../strategies/fields/index.js';
import { ValidationHelper } from '../utils/ValidationHelper.js';
import { cyberOutput } from '../../utils/output.js';

export class FieldPreparator {
  private entity: ParsedEntity;

  constructor(entity: ParsedEntity) {
    this.entity = entity;
  }

  /**
   * Prepares regular field data for entity templates
   * Delegates to FieldPreparatorRegistry (eliminates all if/else chains)
   */
  prepareEntityFields(): Array<any> {
    // Include regular fields AND foreign key fields from relations
    const fields = this.entity.fields.filter(f => !f.relationship || this.shouldGenerateForeignKey(f));

    // Sort fields alphabetically by name for consistent ordering
    fields.sort((a, b) => a.name.localeCompare(b.name));

    // Delegate to strategy registry
    const registry = getFieldPreparatorRegistry();
    const preparedFields: any[] = [];

    for (const field of fields) {
      const result = registry.prepareField({ entity: this.entity, field });

      if (result === null) {
        // Skip fields that shouldn't be included
        continue;
      }

      if (Array.isArray(result)) {
        // Multiple columns (e.g., polymorphic fields)
        preparedFields.push(...result);
      } else {
        // Single column
        preparedFields.push(result);
      }
    }

    return preparedFields;
  }

  /**
   * Prepares relationship field data for entity templates
   */
  prepareRelationshipFields(): Array<ReturnType<typeof this.prepareRelationship>> {
    // Handle all relationship fields
    const relationshipFields = this.entity.fields.filter(f => {
      if (!f.relationship) return false;
      const graphqlOptions = new GraphQLOptions(f);
      return graphqlOptions.shouldGenerateRelation();
    });

    // Sort relationship fields alphabetically by name for consistent ordering
    relationshipFields.sort((a, b) => a.name.localeCompare(b.name));

    return relationshipFields.map(f => this.prepareRelationship(f));
  }

  /**
   * Prepares a single field for template rendering
   */
  private prepareField(field: EntityField) {
    // Skip polymorphic fields - they generate their own columns handled by preparePolymorphicColumns
    if (field.type === 'polymorphic') {
      return null;
    }

    // Skip regular fields without a type
    if (!field.relationship && !field.type) {
      return null;
    }

    // Handle relationship fields that need foreign key generation
    if (field.relationship && this.shouldGenerateForeignKey(field)) {
      return this.prepareForeignKeyField(field);
    }

    // Handle regular fields
    if (field.type && field.type !== 'relation') {
      return this.prepareRegularField(field);
    }

    // For type: 'relation' fields that don't need FK generation, skip here (handled by prepareRelationship)
    return null;
  }

  /**
   * Prepares a foreign key field for a relationship
   */
  private prepareForeignKeyField(field: EntityField) {
    const fkFieldName = this.getForeignKeyFieldName(field);
    const graphqlOptions = new GraphQLOptions(field);

    // Default foreign key type to string for most relations
    const tsType = 'string';
    const nullability = field.required ? '!' : '?';

    // Use the DecoratorGenerator to create the FieldColumn decorator
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
      tsType,
      nullability,
      decorators,
      isForeignKey: true,
    };
  }

  /**
   * Prepares a regular (non-relationship) field
   */
  private prepareRegularField(field: EntityField) {
    const graphqlOptions = new GraphQLOptions(field);
    const tsType = TypeMapper.getTsType(field, this.entity.name);
    const nullability = field.required ? '!' : '?';

    // Handle special field types that use their own decorators
    if (field.type === 'enum') {
      // Use FieldColumnEnum for enum fields
      const decorator = DecoratorGenerator.createFieldColumnEnum(field, this.entity.name);
      return {
        name: field.name,
        tsType,
        nullability,
        decorators: [decorator],
      };
    } else if ((field.type === 'json' && field.array && field.itemSchema) ||
      ((field.type === 'string' || field.type === 'number' || field.type === 'boolean') && field.array)) {
      // Use FieldColumnJSON for all scalar arrays (string, number, boolean) and JSON arrays with itemSchema
      // This fixes the SQLite array serialization issue where arrays become "[object Object]"
      const decorator = DecoratorGenerator.createFieldColumnJSON(field, this.entity.name);
      return {
        name: field.name,
        tsType,
        nullability,
        decorators: [decorator],
      };
    } else if (field.type === 'json') {
      // Use FieldColumnJSON for all JSON fields, including those with schemas
      // This ensures proper Zod validation and consistent decorator usage
      const decorator = DecoratorGenerator.createFieldColumnJSON(field, this.entity.name);
      return {
        name: field.name,
        tsType,
        nullability,
        decorators: [decorator],
      };
    }

    // Use the DecoratorGenerator for regular fields (string, number, boolean, date, etc.)
    try {
      const decorator = DecoratorGenerator.createFieldColumn(field, this.entity.name);
      return {
        name: field.name,
        tsType,
        nullability,
        decorators: [decorator],
      };
    } catch (error) {
      // If DecoratorGenerator fails, fall back to the old approach
      cyberOutput.warning(`DecoratorGenerator failed for field ${field.name}:`, error instanceof Error ? error.message : String(error));

      const fieldOptions = ValidationHelper.getFieldOptions(field);
      const columnOptions = ValidationHelper.getColumnOptions(field);
      const validationDecorators = ValidationHelper.getValidationDecorators(field);
      const graphqlType = TypeMapper.getGraphQLType(field, this.entity.name);

      const decorators: string[] = [];

      // GraphQL field decorator only if object generation is enabled
      if (graphqlOptions.shouldGenerateObject()) {
        const fieldOptionsStr = fieldOptions.length > 0
          ? `{ ${fieldOptions.join(', ')} }`
          : '';
        decorators.push(`@Field(() => ${graphqlType}${fieldOptionsStr ? ', ' + fieldOptionsStr : ''})`);
      }

      // Column decorator
      const columnOptionsStr = columnOptions.length > 0
        ? `{ ${columnOptions.join(', ')} }`
        : '';
      decorators.push(`@Column(${columnOptionsStr})`);

      decorators.push(...validationDecorators);

      return {
        name: field.name,
        tsType,
        nullability,
        decorators,
      };
    }
  }

  /**
   * Prepares a relationship field for template rendering
   * (Kept separate as relationships have different template structure)
   */
  private prepareRelationship(field: EntityField) {
    if (!field.relationship) {
      throw new Error('Field is not a relationship');
    }

    const graphqlOptions = new GraphQLOptions(field);
    const targetEntity = field.relationship.targetEntity;
    const fieldName = field.name;
    const relationType = field.relationship.type;

    // Use JSON description as primary, but add target entity context if missing
    const description = field.description || `${fieldName} (${targetEntity})`;
    const nullability = field.required ? '!' : '?';

    // Determine TypeScript return type based on relation type
    let tsType: string;
    let isArray = false;

    if (relationType === 'OneToMany' || relationType === 'ManyToMany') {
      tsType = `${targetEntity}[]`;
      isArray = true;
    } else {
      tsType = targetEntity;
      isArray = false;
    }

    // Add Promise wrapper unless eager loading is enabled
    const isEager = field.relationship.eager || false;
    if (!isEager) {
      tsType = `Promise<${tsType}>`;
    }

    const decorators: string[] = [];

    // Add GraphQL Field decorator only if object generation is enabled
    if (graphqlOptions.shouldGenerateObject()) {
      const graphqlReturnType = isArray ? `[${targetEntity}]` : targetEntity;
      const fieldOptionsStr = field.description
        ? `{ description: '${field.description}', nullable: ${!field.required} }`
        : `{ nullable: ${!field.required} }`;

      decorators.push(`@Field(() => ${graphqlReturnType}, ${fieldOptionsStr})`);
    }

    // Build TypeORM relationship decorator
    const relationOptions: string[] = [];
    if (field.relationship.eager) {
      relationOptions.push('eager: true');
    }
    if (field.relationship.cascade && field.relationship.cascade.length > 0) {
      relationOptions.push(`cascade: [${field.relationship.cascade.map(c => `"${c}"`).join(', ')}]`);
    }
    if (field.relationship.onDelete) {
      relationOptions.push(`onDelete: "${field.relationship.onDelete}"`);
    }
    if (field.relationship.onUpdate) {
      relationOptions.push(`onUpdate: "${field.relationship.onUpdate}"`);
    }

    const optionsStr = relationOptions.length > 0 ? `, { ${relationOptions.join(', ')} }` : '';

    let relationDecorator = '';
    switch (relationType) {
      case 'ManyToOne':
        relationDecorator = `@ManyToOne(() => ${targetEntity}${optionsStr})`;
        break;
      case 'OneToMany':
        relationDecorator = `@OneToMany(() => ${targetEntity}${optionsStr})`;
        break;
      case 'ManyToMany':
        relationDecorator = `@ManyToMany(() => ${targetEntity}${optionsStr})`;
        break;
      case 'OneToOne':
        relationDecorator = `@OneToOne(() => ${targetEntity}${optionsStr})`;
        break;
    }

    decorators.push(relationDecorator);

    // Add @JoinColumn for ManyToOne and OneToOne relations
    if (relationType === 'ManyToOne' || relationType === 'OneToOne') {
      const joinColumnName = field.relationship.joinColumn || this.getForeignKeyFieldName(field);
      decorators.push(`@JoinColumn({ name: '${joinColumnName}' })`);
    }

    // Validation decorators
    if (!field.required) {
      decorators.push('@IsOptional()');
    }
    decorators.push('@ValidateNested()');

    return {
      name: fieldName,
      tsType,
      nullability,
      decorators,
      isRelationship: true,
      relationType,
      targetEntity,
    };
  }

  /**
   * Determines if a relationship field should generate a foreign key field
   */
  private shouldGenerateForeignKey(field: EntityField): boolean {
    if (!field.relationship) return false;

    // Check GraphQL options first - only generate foreign key if enabled
    const graphqlOptions = new GraphQLOptions(field);
    if (!graphqlOptions.shouldGenerateForeignKey()) return false;

    // For ManyToOne and OneToOne relations, generate FK by default
    const { type } = field.relationship;
    return type === 'ManyToOne' || type === 'OneToOne';
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

  /**
   * Gets unique target entities from all relationships
   */
  getRelationshipTargets(): Set<string> {
    const targets = new Set<string>();

    for (const field of this.entity.fields) {
      if (field.relationship) {
        targets.add(field.relationship.targetEntity);
      }
    }

    return targets;
  }

  /**
   * Prepares enum definitions for template rendering
   */
  prepareEnums(): Array<{ name: string; values: string[] }> {
    const enumFields = this.entity.fields.filter(f => f.type === 'enum');
    const enums: Array<{ name: string; values: string[] }> = [];

    for (const field of enumFields) {
      if (!field.enum || field.enum.length === 0) continue;

      const singularField = TypeMapper.singularizeFieldName(field.name);
      const enumName = `${this.entity.name}${singularField.charAt(0).toUpperCase() + singularField.slice(1)}`;

      enums.push({
        name: enumName,
        values: field.enum,
      });
    }

    return enums;
  }

  /**
   * Gets polymorphic fields from the entity
   */
  getPolymorphicFields(): Array<{
    fieldName: string;
    getterName: string;
    idColumn: string;
    typeColumn: string;
    required: boolean;
  }> {
    const polymorphicFields = this.entity.fields.filter(f => f.type === 'polymorphic');

    return polymorphicFields.map(field => {
      const { idColumn, typeColumn } = TypeMapper.getPolymorphicColumns(field.name);
      const getterName = TypeMapper.getPolymorphicGetterName(field.name);

      return {
        fieldName: field.name,
        getterName,
        idColumn,
        typeColumn,
        required: field.required || false,
      };
    });
  }
}
