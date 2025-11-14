/**
 * FieldPreparator - Prepares field and relationship data for templates
 *
 * Handles transformation of raw field definitions into template-ready data structures
 */

import { ParsedEntity, EntityField } from '../../parsers/EntityJsonParser.js';
import { TypeMapper } from '../utils/TypeMapper.js';
import { ValidationHelper } from '../utils/ValidationHelper.js';
import { DecoratorGenerator } from './DecoratorGenerator.js';
import { GraphQLOptions } from '../utils/GraphQLOptions.js';

export class FieldPreparator {
  private entity: ParsedEntity;

  constructor(entity: ParsedEntity) {
    this.entity = entity;
  }

  /**
   * Prepares regular field data for entity templates
   */
  prepareEntityFields(): Array<ReturnType<typeof this.prepareField>> {
    // Include regular fields AND foreign key fields from relations
    const fields = this.entity.fields.filter(f => !f.relationship || this.shouldGenerateForeignKey(f));

    // Add polymorphic field columns (id and type columns)
    const polymorphicFields = this.entity.fields.filter(f => f.type === 'polymorphic');
    const polymorphicColumns = polymorphicFields.flatMap(f => this.preparePolymorphicColumns(f));

    // Sort fields alphabetically by name for consistent ordering
    fields.sort((a, b) => a.name.localeCompare(b.name));

    const regularFields = fields.map(f => this.prepareField(f)).filter(f => f !== null);

    return [...regularFields, ...polymorphicColumns];
  }

  /**
   * Prepares polymorphic field columns (id and type) for template rendering
   */
  private preparePolymorphicColumns(field: EntityField) {
    if (field.type !== 'polymorphic') {
      return [];
    }

    const graphqlOptions = new GraphQLOptions(field);
    const { idColumn, typeColumn } = TypeMapper.getPolymorphicColumns(field.name);
    const nullability = field.required ? '!' : '?';

    // Prepare ID column using DecoratorGenerator (includes proper GraphQL handling)
    const idDecorator = DecoratorGenerator.createPolymorphicIdFieldColumn(field, this.entity.name);
    const idDecorators = [idDecorator];

    // Prepare Type column using DecoratorGenerator (includes proper GraphQL handling)
    const typeDecorator = DecoratorGenerator.createPolymorphicTypeFieldColumn(field, this.entity.name);
    const typeDecorators = [typeDecorator];

    return [
      {
        name: idColumn,
        tsType: 'string',
        nullability,
        decorators: idDecorators,
        isPolymorphicId: true,
        originalFieldName: field.name,
      },
      {
        name: typeColumn,
        tsType: 'string',
        nullability,
        decorators: typeDecorators,
        isPolymorphicType: true,
        originalFieldName: field.name,
      }
    ];
  }

  /**
   * Prepares relationship field data for entity templates
   */
  prepareRelationshipFields(): Array<ReturnType<typeof this.prepareRelationship>> {
    // Handle all relationship fields (both type: 'relation' and implicit relations)
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
   * Gets the foreign key field name for a relationship field
   */
  private getForeignKeyFieldName(field: EntityField): string {
    // Use explicit key if provided
    if (field.key) {
      return field.key;
    }

    // If field name already ends with 'Id', use it as-is (e.g., postId -> postId)
    if (field.name.endsWith('Id')) {
      return field.name;
    }

    // Default to {fieldName}Id (e.g., post -> postId)
    return `${field.name}Id`;
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
    if (type === 'ManyToOne' || type === 'OneToOne') {
      return true;
    }

    // For OneToMany and ManyToMany, never generate FK
    return false;
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
      console.warn(`DecoratorGenerator failed for field ${field.name}:`, error);

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
   */
  private prepareRelationship(field: EntityField) {
    if (!field.relationship) {
      throw new Error('Field is not a relationship');
    }

    const graphqlOptions = new GraphQLOptions(field);
    const targetEntity = field.relationship.targetEntity;
    const fieldName = field.name; // Use field name directly for type: 'relation'
    const relationType = field.relationship.type;

    // Use JSON description as primary, but add target entity context if missing
    const description = field.description || `${fieldName} (${targetEntity})`;

    const nullability = field.required ? '!' : '?';

    const decorators: string[] = [];

    // @Field decorator (only if enabled)
    if (graphqlOptions.shouldGenerateRelation()) {
      decorators.push(
        `@Field(() => ${targetEntity}, { description: '${description}', nullable: ${!field.required} })`
      );
    }

    // TypeORM relationship decorator
    const inverseField = TypeMapper.pluralize(TypeMapper.toCamelCase(this.entity.name));
    let relationDecorator = '';

    // Build relationship options object
    const relationOptions: string[] = [];
    if (field.relationship?.eager) {
      relationOptions.push('eager: true');
    }
    if (field.relationship?.cascade && field.relationship.cascade.length > 0) {
      relationOptions.push(`cascade: [${field.relationship.cascade.map(c => `"${c}"`).join(', ')}]`);
    }
    if (field.relationship?.onDelete) {
      relationOptions.push(`onDelete: "${field.relationship.onDelete}"`);
    }
    if (field.relationship?.onUpdate) {
      relationOptions.push(`onUpdate: "${field.relationship.onUpdate}"`);
    }

    const optionsStr = relationOptions.length > 0 ? `, { ${relationOptions.join(', ')} }` : '';

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

    // Add @JoinColumn for ManyToOne and OneToOne relations to explicitly specify the foreign key column name
    // This ensures the column name matches what indexes reference (e.g., 'authorId')
    if (relationType === 'ManyToOne' || relationType === 'OneToOne') {
      const joinColumnName = field.relationship?.joinColumn || this.getForeignKeyFieldName(field);
      decorators.push(`@JoinColumn({ name: '${joinColumnName}' })`);
    }

    // Validation decorators
    if (!field.required) {
      decorators.push('@IsOptional()');
    }
    decorators.push('@ValidateNested()');

    // Determine TypeScript type:
    // - For eagerly loaded relations: direct type (synchronous)
    // - For lazy loaded relations (managed by SmartLoadingSubscriber): Promise type
    // - For single relations (ManyToOne, OneToOne): Promise<TEntity | null>
    // - For collection relations (OneToMany, ManyToMany): Promise<TEntity[]>
    let tsType: string;
    const isEager = field.relationship?.eager;

    if (isEager) {
      // Eagerly loaded relations are available synchronously
      if (relationType === 'OneToMany' || relationType === 'ManyToMany') {
        tsType = `${targetEntity}[]`;
      } else {
        tsType = `${targetEntity}${nullability === '?' ? ' | null' : ''}`;
      }
    } else {
      // Lazy loaded relations need to be awaited (SmartLoadingSubscriber returns promises)
      if (relationType === 'OneToMany' || relationType === 'ManyToMany') {
        tsType = `Promise<${targetEntity}[]>`;
      } else {
        const nullType = nullability === '?' ? ' | null' : '';
        tsType = `Promise<${targetEntity}${nullType}>`;
      }
    }

    return {
      name: fieldName,
      tsType,
      nullability,
      decorators,
    };
  }

  /**
   * Prepares enum data for templates
   */
  prepareEnums(): Array<ReturnType<typeof this.prepareEnum>> {
    const regularFields = this.entity.fields.filter(f => !f.relationship);
    const enumFields = regularFields.filter(f => f.type === 'enum');
    return enumFields.map(f => this.prepareEnum(f));
  }

  /**
   * Prepares a single enum for template rendering
   */
  private prepareEnum(field: EntityField) {
    const fieldName = TypeMapper.singularizeFieldName(field.name);
    const enumName = TypeMapper.getEnumName(this.entity.name, fieldName);
    const description = field.description || `${enumName} options`;

    return {
      name: enumName,
      description,
      values: field.enum || [],
      array: field.array || false,
    };
  }

  /**
   * Gets all unique relationship target entities for imports
   */
  getRelationshipTargets(): string[] {
    const relationshipFields = this.entity.fields.filter(f => f.relationship);
    const relationshipEntities = relationshipFields
      .map(f => f.relationship!.targetEntity);
    return [...new Set(relationshipEntities)];
  }

  /**
   * Gets TypeORM relationship types for imports
   */
  getRelationshipTypes(): string[] {
    const relationshipFields = this.entity.fields.filter(f => f.relationship);
    const relationTypes = new Set<string>();

    relationshipFields.forEach(f => {
      if (f.relationship) {
        relationTypes.add(f.relationship.type);
      }
    });

    return [...relationTypes];
  }

  /**
   * Gets polymorphic fields for method generation
   */
  getPolymorphicFields(): Array<{ fieldName: string; methodName: string; idColumn: string; typeColumn: string; required: boolean }> {
    const polymorphicFields = this.entity.fields.filter(f => f.type === 'polymorphic');

    return polymorphicFields.map(field => {
      const methodName = TypeMapper.getPolymorphicGetterName(field.name);
      const { idColumn, typeColumn } = TypeMapper.getPolymorphicColumns(field.name);

      return {
        fieldName: field.name,
        methodName,
        idColumn,
        typeColumn,
        required: field.required ?? true
      };
    });
  }
}