/**
 * SimplifiedSchemaGenerator - Generates JSDoc-formatted schema documentation
 *
 * Extracts schema generation logic from EntityGenerator to provide:
 * - Clean JSDoc formatted documentation
 * - Handlebars template integration
 * - Reusable utility across different generators
 */

import { ParsedEntity, EntityField } from '../parsers/EntityJsonParser.js';
import { TypeMapper } from '../generators/utils/TypeMapper.js';

export interface SimplifiedSchemaData {
  className: string;
  description?: string;
  baseFields: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
    array?: boolean;
    description?: string;
    metadata?: string[];
  }>;
  polymorphicRelations: Array<{
    idColumn: string;
    typeColumn: string;
    fieldName: string;
    required: boolean;
  }>;
  relationships: Array<{
    name: string;
    type: string;
    targetEntity: string;
    required: boolean;
    eager: boolean;
  }>;
  indexes: Array<{
    type: 'single' | 'composite';
    columns: string[];
  }>;
}

export class SimplifiedSchemaGenerator {
  private entity: ParsedEntity;

  constructor(entity: ParsedEntity) {
    this.entity = entity;
  }

  /**
   * Generate complete simplified schema data for template rendering
   */
  generateSchemaData(): SimplifiedSchemaData {
    return {
      className: this.entity.name,
      description: this.entity.description,
      baseFields: this.getBaseFields(),
      fields: this.getRegularFields(),
      polymorphicRelations: this.getPolymorphicRelations(),
      relationships: this.getRelationshipFields(),
      indexes: this.getIndexFields(),
    };
  }

  /**
   * Generate JSDoc formatted schema string
   */
  generateJSDocSchema(): string {
    const schemaData = this.generateSchemaData();
    const lines: string[] = [];

    // Header
    lines.push('/**');
    lines.push(` * ${schemaData.className} Entity Schema`);
    if (schemaData.description) {
      lines.push(` * ${schemaData.description}`);
    }
    lines.push(' *');

    // Base fields
    lines.push(' * ## Base Fields (inherited from OwnedEntity)');
    for (const field of schemaData.baseFields) {
      const required = field.name !== 'deletedAt' ? '' : ' | null';
      lines.push(` * @property {${field.type}${required}} ${field.name} - ${field.description}`);
    }
    lines.push(' *');

    // Regular fields
    if (schemaData.fields.length > 0) {
      lines.push(' * ## Fields');
      for (const field of schemaData.fields) {
        const typeStr = this.buildTypeString(field);
        const metadata = field.metadata && field.metadata.length > 0
          ? ` - ${field.metadata.join(', ')}`
          : '';
        const description = field.description ? ` - ${field.description}` : '';
        lines.push(` * @property {${typeStr}} ${field.name}${metadata}${description}`);
      }
      lines.push(' *');
    }

    // Polymorphic relations
    if (schemaData.polymorphicRelations.length > 0) {
      lines.push(' * ## Polymorphic Relations');
      for (const relation of schemaData.polymorphicRelations) {
        const required = relation.required ? '' : ' | null';
        lines.push(` * @property {string${required}} ${relation.idColumn} - Foreign key ID`);
        lines.push(` * @property {string${required}} ${relation.typeColumn} - Target entity type`);
        lines.push(` * @property {Promise<any | null>} ${relation.fieldName} - Polymorphic getter method`);
      }
      lines.push(' *');
    }

    // Relationships
    if (schemaData.relationships.length > 0) {
      lines.push(' * ## Relationships');
      for (const relationship of schemaData.relationships) {
        const typeStr = this.buildRelationshipTypeString(relationship);
        const loading = relationship.eager ? ' (eager-loaded)' : ' (lazy-loaded)';
        lines.push(` * @property {${typeStr}} ${relationship.name} - ${relationship.targetEntity}${loading}`);
      }
      lines.push(' *');
    }

    // Indexes
    if (schemaData.indexes.length > 0) {
      lines.push(' * ## Database Indexes');
      for (const index of schemaData.indexes) {
        if (index.type === 'composite') {
          lines.push(` * @property {CompositeIndex} [${index.columns.join(', ')}]`);
        } else {
          lines.push(` * @property {SingleIndex} ${index.columns[0]}`);
        }
      }
    }

    lines.push(' */');
    return lines.join('\n');
  }

  /**
   * Get base fields inherited from OwnedEntity
   */
  private getBaseFields(): SimplifiedSchemaData['baseFields'] {
    return [
      {
        name: 'id',
        type: 'string',
        description: 'UUID primary key',
      },
      {
        name: 'userId',
        type: 'string',
        description: 'Owner ID (authenticated)',
      },
      {
        name: 'createdAt',
        type: 'Date',
        description: 'Auto-generated timestamp',
      },
      {
        name: 'updatedAt',
        type: 'Date',
        description: 'Auto-updated timestamp',
      },
      {
        name: 'deletedAt',
        type: 'Date',
        description: 'Soft delete support',
      },
    ];
  }

  /**
   * Get regular fields (non-relationship, non-polymorphic)
   */
  private getRegularFields(): SimplifiedSchemaData['fields'] {
    const regularFields = this.entity.fields.filter(f => !f.relationship && f.type !== 'polymorphic');

    // Sort fields alphabetically for consistent ordering
    regularFields.sort((a, b) => a.name.localeCompare(b.name));

    return regularFields.map(field => ({
      name: field.name,
      type: this.getFieldTypeInfo(field),
      required: field.required || false,
      array: field.array || false,
      description: field.description,
      metadata: this.getFieldMetadataArray(field),
    }));
  }

  /**
   * Get polymorphic relations
   */
  private getPolymorphicRelations(): SimplifiedSchemaData['polymorphicRelations'] {
    const polymorphicFields = this.entity.fields.filter(f => f.type === 'polymorphic');

    return polymorphicFields.map(field => {
      const { idColumn, typeColumn } = TypeMapper.getPolymorphicColumns(field.name);
      return {
        idColumn,
        typeColumn,
        fieldName: field.name,
        required: field.required || false,
      };
    });
  }

  /**
   * Get relationship fields
   */
  private getRelationshipFields(): SimplifiedSchemaData['relationships'] {
    const relationshipFields = this.entity.fields.filter(f => f.relationship);

    // Sort relationship fields alphabetically
    relationshipFields.sort((a, b) => a.name.localeCompare(b.name));

    return relationshipFields.map(field => {
      if (!field.relationship) throw new Error(`Missing relationship data for field ${field.name}`);

      const relationType = field.relationship.type;
      const targetEntity = field.relationship.targetEntity;

      return {
        name: field.name,
        type: relationType,
        targetEntity,
        required: field.required || false,
        eager: field.relationship.eager || false,
      };
    });
  }

  /**
   * Get index fields
   */
  private getIndexFields(): SimplifiedSchemaData['indexes'] {
    if (!this.entity.indexes || this.entity.indexes.length === 0) {
      return [];
    }

    return this.entity.indexes.map(idx => {
      if (Array.isArray(idx)) {
        return {
          type: 'composite' as const,
          columns: idx,
        };
      }
      return {
        type: 'single' as const,
        columns: [idx],
      };
    });
  }

  /**
   * Build TypeScript type string for a field
   */
  private buildTypeString(field: SimplifiedSchemaData['fields'][0]): string {
    let typeStr = field.type;

    if (field.array) {
      typeStr += '[]';
    }

    if (!field.required) {
      typeStr += ' | null';
    }

    return typeStr;
  }

  /**
   * Build TypeScript type string for a relationship
   */
  private buildRelationshipTypeString(relationship: SimplifiedSchemaData['relationships'][0]): string {
    const { type, targetEntity, required, eager } = relationship;
    const nullability = required ? '' : ' | null';
    const promisePrefix = eager ? '' : 'Promise<';

    let result: string;
    if (type === 'OneToMany' || type === 'ManyToMany') {
      result = `${targetEntity}${nullability}`;
    } else {
      result = `${targetEntity}${nullability}`;
    }

    if (!eager) {
      result = `Promise<${result}>`;
    }

    if (type === 'OneToMany' || type === 'ManyToMany') {
      result = eager ? `${targetEntity}[]` : `Promise<${targetEntity}${nullability}[]>`;
    }

    return result;
  }

  /**
   * Get simplified type information for a field
   */
  private getFieldTypeInfo(field: EntityField): string {
    if (field.type === 'enum') {
      const enumName = TypeMapper.getEnumName(this.entity.name, TypeMapper.singularizeFieldName(field.name));
      return field.array ? `${enumName}[]` : enumName;
    }

    if (field.type === 'json') {
      return field.array ? 'Record<string, any>[]' : 'Record<string, any>';
    }

    const typeMap: Record<string, string> = {
      string: 'string',
      text: 'string',
      number: 'number',
      boolean: 'boolean',
      date: 'Date',
      uuid: 'string',
    };

    const baseType = field.type ? typeMap[field.type] || 'unknown' : 'unknown';
    return field.array ? `${baseType}[]` : baseType;
  }

  /**
   * Get metadata information for a field as an array
   */
  private getFieldMetadataArray(field: EntityField): string[] {
    const metadata: string[] = [];

    if (field.defaultValue !== undefined) {
      metadata.push(`default: ${field.defaultValue}`);
    }

    if (field.minLength !== undefined) {
      metadata.push(`min: ${field.minLength}`);
    }

    if (field.maxLength !== undefined) {
      metadata.push(`max: ${field.maxLength}`);
    }

    if (field.min !== undefined) {
      metadata.push(`min: ${field.min}`);
    }

    if (field.max !== undefined) {
      metadata.push(`max: ${field.max}`);
    }

    if (field.enum && field.enum.length > 0) {
      metadata.push(`enum: [${field.enum.join(', ')}]`);
    }

    return metadata;
  }
}