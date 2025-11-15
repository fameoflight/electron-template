/**
 * TypeMapper - Handles type conversions between GraphQL, TypeScript, and database types
 *
 * Refactored to use Strategy Pattern:
 * - Type conversion delegated to TypeStrategyRegistry (eliminates 25 if/else statements)
 * - Utility methods preserved (naming, pluralization, schema generation)
 * - Adding new types = register new strategy (no changes to this file)
 */

import { EntityField } from '../../parsers/EntityJsonParser.js';
import { getTypeStrategyRegistry } from '../strategies/types/index.js';

// Recursive FieldDef to support nested objects/arrays
type FieldDef = {
  type: string; // e.g. 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date' | ...
  description?: string;
  format?: string;
  examples?: string[];
  // For object types: map property name -> FieldDef (recursive)
  properties?: Record<string, FieldDef>;
  // For array types: schema of items
  items?: FieldDef;
  // Optional required list for object properties
  required?: string[];
};



export class TypeMapper {
  /**
   * Maps field types to their corresponding database column types
   * Delegates to TypeStrategyRegistry
   */
  static getColumnType(field: EntityField): string | null {
    const registry = getTypeStrategyRegistry();
    return registry.getColumnType(field);
  }

  /**
   * Generates column names for polymorphic fields
   */
  static getPolymorphicColumns(fieldName: string): { idColumn: string; typeColumn: string } {
    return {
      idColumn: `${fieldName}Id`,
      typeColumn: `${fieldName}Type`
    };
  }

  /**
   * Generates method name for polymorphic getter
   */
  static getPolymorphicGetterName(fieldName: string): string {
    return `get${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`;
  }


  /**
   * Maps field types to their TypeScript equivalents
   * Delegates to TypeStrategyRegistry (eliminates all if/else chains)
   */
  static getTsType(field: EntityField, entityName: string): string {
    const fieldName = this.singularizeFieldName(field.name);
    const enumName = `${entityName}${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`;

    // Handle relationship fields - they should be UUID strings (foreign keys)
    if (field.relationship) {
      return 'string';
    }

    // Handle polymorphic fields - they should be UUID strings
    if (field.type === 'polymorphic') {
      return 'string';
    }

    // Handle JSON arrays with itemSchema
    if (field.type === 'json' && field.array && field.itemSchema) {
      const interfaceName = this.getItemSchemaInterfaceName(entityName, field.name);
      return `${interfaceName}[]`;
    }

    // Handle JSON arrays without itemSchema
    if (field.type === 'json' && field.array) {
      return 'Record<string, any>[]';
    }

    // Handle regular JSON (non-array)
    if (field.type === 'json') {
      return 'Record<string, any>';
    }

    // Handle arrays for basic types
    if (field.array && field.type) {
      const baseType = {
        string: 'string',
        text: 'string',
        number: 'number',
        boolean: 'boolean',
        date: 'Date',
        uuid: 'string',
        enum: enumName,
        key: 'string',
        relation: 'string',
      }[field.type];

      return `${baseType}[]`;
    }

    const baseType = field.type ? {
      string: 'string',
      text: 'string',
      number: 'number',
      boolean: 'boolean',
      date: 'Date',
      uuid: 'string',
      enum: enumName,
      key: 'string',
      relation: 'string',
    }[field.type] : 'string';

    return baseType;
  }

  /**
   * Generates TypeScript interface name for itemSchema
   */
  static getItemSchemaInterfaceName(entityName: string, fieldName: string): string {
    const singularField = this.singularizeFieldName(fieldName);
    return `${entityName}${singularField.charAt(0).toUpperCase() + singularField.slice(1)}Type`;
  }

  /**
   * Generates TypeScript interface definition for itemSchema
   */
  static getItemSchemaInterfaceDefinition(entityName: string, fieldName: string, itemSchema: { type: 'object'; properties: Record<string, { type: string }>; required?: string[] }): string {
    const interfaceName = this.getItemSchemaInterfaceName(entityName, fieldName);
    const properties = Object.entries(itemSchema.properties).map(([propName, propDef]) => {
      const isRequired = itemSchema.required?.includes(propName) || false;
      const tsType = this.mapJsonFieldType(propDef.type);
      return `  ${propName}${isRequired ? '' : '?'}: ${tsType};`;
    });

    return `export interface ${interfaceName} {\n${properties.join('\n')}\n}`;
  }



  /**
   * Maps JSON field types to TypeScript types
   */
  private static mapJsonFieldType(type: string): string {
    const typeMap = {
      'string': 'string',
      'number': 'number',
      'boolean': 'boolean',
      'integer': 'number',
    };
    return (typeMap as any)[type] || 'any';
  }

  /**
   * Maps field types to their GraphQL equivalents
   * Delegates to TypeStrategyRegistry (eliminates all if/else chains)
   */
  static getGraphQLType(field: EntityField, entityName: string): string {
    const fieldName = this.singularizeFieldName(field.name);

    // Handle relationship fields - they should be UUID strings (foreign keys)
    if (field.relationship) {
      return 'String';
    }

    // Handle polymorphic fields - they should be UUID strings
    if (field.type === 'polymorphic') {
      return 'String';
    }

    // Special handling for JSON fields - use GraphQLJSON for arrays, GraphQLJSONObject for objects
    if (field.type === 'json') {
      if (field.array) {
        return 'GraphQLJSON'; // Accept any JSON value including arrays
      }
      return 'GraphQLJSONObject'; // Accept only JSON objects
    }

    // Handle arrays for basic types
    if (field.array && field.type) {
      const baseType = {
        string: 'String',
        text: 'String',
        number: 'Number',
        boolean: 'Boolean',
        date: 'Date',
        uuid: 'String',
        enum: `${entityName}${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`,
        key: 'String',
        relation: 'String',
      }[field.type];

      return `[${baseType}!]`;
    }

    const graphqlType = field.type ? {
      string: 'String',
      text: 'String',
      number: 'Number',
      boolean: 'Boolean',
      date: 'Date',
      uuid: 'String',
      enum: `${entityName}${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`,
      key: 'String',
      relation: 'String',
    }[field.type] : 'String';

    return graphqlType;
  }

  /**
   * Converts camelCase to snake_case for database table names
   */
  static toSnakeCase(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  }

  /**
   * Converts PascalCase to camelCase for variable names
   */
  static toCamelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  /**
   * Simple pluralization for table names
   */
  static pluralize(word: string): string {
    if (word.endsWith('y')) {
      return word.slice(0, -1) + 'ies';
    }
    if (word.endsWith('s')) {
      return word + 'es';
    }
    return word + 's';
  }

  /**
   * Smart singularization for field names
   * Handles common plural patterns while preserving singular words that end with 's'
   */
  static singularizeFieldName(fieldName: string): string {
    const singularWordsEndingWithS = [
      'status', 'class', 'process', 'address', 'witness',
      'success', 'progress'
    ];

    if (singularWordsEndingWithS.includes(fieldName.toLowerCase())) {
      return fieldName;
    }

    if (fieldName.endsWith('ies')) {
      return fieldName.slice(0, -3) + 'y';
    }

    if (fieldName.endsWith('es')) {
      return fieldName.slice(0, -2);
    }

    if (fieldName.endsWith('s') && !fieldName.endsWith('ss')) {
      return fieldName.slice(0, -1);
    }

    return fieldName;
  }

  /**
   * Generates table name from entity name
   */
  static getTableName(entityName: string): string {
    return this.toSnakeCase(this.pluralize(entityName));
  }

  /**
   * Generates enum name from entity and field name
   */
  static getEnumName(entityName: string, fieldName: string): string {
    const singularField = this.singularizeFieldName(fieldName);
    return entityName + singularField.charAt(0).toUpperCase() + singularField.slice(1);
  }

  /**
   * Generates Zod schema definition for scalar arrays (string, number, boolean) with array options
   */
  static getScalarArraySchemaDefinition(entityName: string, fieldName: string, fieldType: string, arrayOptions?: any): string {
    const schemaName = `${entityName}${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}Schema`;

    const constraints: string[] = [];

    // Add array constraints from arrayOptions
    if (arrayOptions) {
      if (arrayOptions.minLength !== undefined) {
        constraints.push(`.min(${arrayOptions.minLength})`);
      }
      if (arrayOptions.maxLength !== undefined) {
        constraints.push(`.max(${arrayOptions.maxLength})`);
      }
    }

    // Add item constraints based on field type
    const itemConstraints: string[] = [];
    if (arrayOptions?.itemMinLength !== undefined) {
      itemConstraints.push(`.min(${arrayOptions.itemMinLength})`);
    }
    if (arrayOptions?.itemMaxLength !== undefined) {
      itemConstraints.push(`.max(${arrayOptions.itemMaxLength})`);
    }
    if (arrayOptions?.itemMin !== undefined) {
      itemConstraints.push(`.min(${arrayOptions.itemMin})`);
    }
    if (arrayOptions?.itemMax !== undefined) {
      itemConstraints.push(`.max(${arrayOptions.itemMax})`);
    }

    // Map field type to Zod type
    let itemDefinition: string;
    switch (fieldType) {
      case 'string':
        itemDefinition = `z.string()${itemConstraints.join('')}`;
        break;
      case 'number':
        itemDefinition = `z.number()${itemConstraints.join('')}`;
        break;
      case 'boolean':
        itemDefinition = `z.boolean()`;
        break;
      default:
        itemDefinition = `z.any()`;
    }

    const constraintStr = constraints.length > 0 ? constraints.join('') : '';

    return `const ${schemaName} = z.array(${itemDefinition})${constraintStr}.describe('${schemaName}: Array of ${fieldType}s');`;
  }

  /**
   * Generates Zod schema definition for itemSchema array
   */
  static getItemSchemaZodDefinition(entityName: string, fieldName: string, itemSchema: { type: 'object'; properties: Record<string, { type: string }>; required?: string[] }): string {
    const interfaceName = this.getItemSchemaInterfaceName(entityName, fieldName);
    const schemaName = `${interfaceName}Schema`;
    const arraySchemaName = `${entityName}${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}Schema`;

    const properties = Object.entries(itemSchema.properties).map(([propName, propDef]) => {
      const isRequired = itemSchema.required?.includes(propName) || false;
      const zodType = this.mapJsonFieldDefToZod(propDef);
      const optional = isRequired ? '' : '.optional()';
      return `  ${propName}: ${zodType}${optional},`;
    });

    const objectSchema = `const ${schemaName} = z.object({\n${properties.join('\n')}\n}).describe('${interfaceName}: Generated schema');`;
    const arraySchema = `const ${arraySchemaName} = z.array(${schemaName}).describe('${arraySchemaName}: Array of ${interfaceName}');`;

    return `${objectSchema}\n\n${arraySchema}`;
  }

  /**
   * Maps JSON field types to Zod types
   */
  private static mapJsonFieldTypeToZod(type: string): string {
    const typeMap = {
      'string': 'z.string()',
      'number': 'z.number()',
      'boolean': 'z.boolean()',
      'date': 'z.date()',
    } as const;
    return typeMap[type as keyof typeof typeMap] || 'z.any()';
  }

  /**
   * Maps JSON field definitions to Zod types (supports nested objects)
   */
  private static mapJsonFieldDefToZod(fieldDef: FieldDef): string {
    const desc = fieldDef.description ? `.describe(${JSON.stringify(fieldDef.description)})` : '';
    // const desc = '';
    if (fieldDef.type === 'object' && fieldDef.properties) {
      // Handle nested objects recursively
      const nestedProperties = Object.entries(fieldDef.properties).map(([propName, propDef]) => {
        const zodType = this.mapJsonFieldDefToZod(propDef);
        return `    ${propName}: ${zodType},`;
      });
      return `z.object({\n${nestedProperties.join('\n')}\n  })${desc}`;
    }

    // Handle basic types
    return this.mapJsonFieldTypeToZod(fieldDef.type);
  }

  /**
   * Generates deep Zod schema definition for regular JSON fields with schemas (supports nested objects)
   */
  static getDeepJsonSchemaDefinition(entityName: string, fieldName: string, schema: { type: 'object'; properties: Record<string, FieldDef>; required?: string[] }): string {
    const schemaName = `${entityName}${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}Schema`;

    const properties = Object.entries(schema.properties).map(([propName, propDef]) => {
      const isRequired = schema.required?.includes(propName) || false;
      const zodType = this.mapJsonFieldDefToZod(propDef);

      const optional = isRequired ? '' : '.optional()';
      return `  ${propName}: ${zodType}${optional},`;
    });

    const objectSchema = `const ${schemaName} = z.object({\n${properties.join('\n')}\n}).describe('${schemaName}: Generated schema for ${fieldName} field');`;

    return objectSchema;
  }
}