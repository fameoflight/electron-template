/**
 * InputPreparator - Prepares input type data for GraphQL mutations
 *
 * Handles the transformation of entity fields into GraphQL input types
 */

import { ParsedEntity, EntityField } from '../../parsers/EntityJsonParser.js';
import { TypeMapper } from '../utils/TypeMapper.js';
import { ValidationHelper } from '../utils/ValidationHelper.js';
import { GraphQLOptions } from '../utils/GraphQLOptions.js';

export class InputPreparator {
  private entity: ParsedEntity;

  constructor(entity: ParsedEntity) {
    this.entity = entity;
  }

  /**
   * Generates enhanced input descriptions with validation hints
   */
  private generateInputDescription(field: EntityField, baseDescription?: string): string {
    if (!baseDescription) return '';

    // 📝 Prefix with "Input:" to distinguish from entity field descriptions
    const inputPrefix = baseDescription.toLowerCase().includes('input')
      ? baseDescription
      : `Input: ${baseDescription}`;

    const hints: string[] = [inputPrefix];

    // Add validation hints
    if (field.required) {
      hints.push('Required field');
    }

    if (field.maxLength) {
      hints.push(`Max ${field.maxLength} characters`);
    }

    if (field.minLength) {
      hints.push(`Min ${field.minLength} characters`);
    }

    if (field.pattern) {
      hints.push(`Must match pattern: ${field.pattern}`);
    }

    if (field.min !== undefined || field.max !== undefined) {
      if (field.min !== undefined && field.max !== undefined) {
        hints.push(`Must be between ${field.min} and ${field.max}`);
      } else if (field.min !== undefined) {
        hints.push(`Must be at least ${field.min}`);
      } else if (field.max !== undefined) {
        hints.push(`Must be at most ${field.max}`);
      }
    }

    if (field.unique) {
      hints.push('Must be unique');
    }

    if (field.array && field.arrayOptions) {
      if (field.arrayOptions.maxLength) {
        hints.push(`Max ${field.arrayOptions.maxLength} items`);
      }
      if (field.arrayOptions.minLength) {
        hints.push(`Min ${field.arrayOptions.minLength} items`);
      }
      if (field.arrayOptions.uniqueItems) {
        hints.push('Items must be unique');
      }
    }

    return hints.length > 1 ? `${hints.join('. ')}.` : baseDescription;
  }

  /**
   * Prepares all input types data for consolidated template
   */
  prepareAllInputsData() {
    const allFields = this.entity.fields;

    // Prepare fields for each variant
    const createFields = this.prepareFieldsForInputType(allFields, 'create');
    const updateFields = this.prepareFieldsForInputType(allFields, 'update');
    const createUpdateFields = this.prepareFieldsForInputType(allFields, 'createUpdate');

    // Collect enum types for imports (only dynamic imports needed)
    const enumFields = allFields.filter(f => f.type === 'enum');
    const enumImports = enumFields.map(f => {
      const fieldName = TypeMapper.singularizeFieldName(f.name);
      const enumName = TypeMapper.getEnumName(this.entity.name, fieldName);
      return enumName;
    });

    // Collect JSON interface types for TypeScript type safety (only dynamic imports needed)
    const jsonFieldsWithItemSchema = allFields.filter(f => f.type === 'json' && f.array && f.itemSchema);
    const jsonInterfaceImports = jsonFieldsWithItemSchema.map(f =>
      TypeMapper.getItemSchemaInterfaceName(this.entity.name, f.name)
    );

    // 🔗 Collect relation field names for Relay ID conversion (e.g., ['connectionId', 'embeddingModelId'])
    const relationFields = allFields
      .filter(f => f.relationship && new GraphQLOptions(f).shouldGenerateForeignKey())
      .map(f => f.key || `${f.name}Id`);

    return {
      className: this.entity.name,
      createFields,
      updateFields,
      createUpdateFields,
      hasEnums: enumImports.length > 0,
      enumImports: enumImports.join(', '),
      hasJsonInterfaces: jsonInterfaceImports.length > 0,
      jsonInterfaceImports: jsonInterfaceImports.join(', '),
      relationFields,
    };
  }

  /**
   * Prepares fields for a specific input type variant
   */
  private prepareFieldsForInputType(
    fields: EntityField[],
    type: 'create' | 'update' | 'createUpdate'
  ) {
    let filteredFields = fields.filter(f => {
      // Check if field should generate inputs
      const graphqlOptions = new GraphQLOptions(f);
      return (f.type || f.relationship) && graphqlOptions.shouldGenerateInputs();
    });

    // Sort fields alphabetically by name for consistent ordering
    filteredFields.sort((a, b) => a.name.localeCompare(b.name));

    const processedFields: Array<ReturnType<typeof this.prepareRegularInputField>> = [];

    for (const field of filteredFields) {
      // Handle polymorphic fields - expand into id and type fields
      if (field.type === 'polymorphic') {
        const polymorphicFields = this.preparePolymorphicInputFields(field, type);
        processedFields.push(...polymorphicFields);
        continue;
      }

      // Handle regular fields
      const regularField = this.prepareRegularInputField(field, type);
      if (regularField !== null) {
        processedFields.push(regularField);
      }
    }

    return processedFields.filter(f => f !== null);
  }

  /**
   * Prepares polymorphic input fields (id and type) for input generation
   */
  private preparePolymorphicInputFields(
    field: EntityField,
    inputType: 'create' | 'update' | 'createUpdate'
  ) {
    if (field.type !== 'polymorphic') {
      return [];
    }

    const graphqlOptions = new GraphQLOptions(field);
    const { idColumn, typeColumn } = TypeMapper.getPolymorphicColumns(field.name);
    const nullability = field.required ? '!' : '?';

    // For update and createUpdate, all fields are optional to support partial updates
    const isOptional = inputType === 'update' || inputType === 'createUpdate' || !field.required;
    const finalNullability = isOptional ? '?' : '!';

    // Prepare ID field
    const idFieldDescription = field.description
      ? `${field.description} ID`
      : `ID of the owning entity`;

    const idField = {
      name: idColumn,
      tsType: 'string',
      nullability: finalNullability,
      decorators: [this.generatePolymorphicFieldInputDecorator(field, 'id', inputType, idFieldDescription)],
      isPolymorphicId: true,
      originalFieldName: field.name,
    };

    // Prepare type field
    const typeFieldDescription = field.description
      ? `${field.description} type`
      : `Type of the owning entity`;

    const typeField = {
      name: typeColumn,
      tsType: 'string',
      nullability: finalNullability,
      decorators: [this.generatePolymorphicFieldInputDecorator(field, 'type', inputType, typeFieldDescription)],
      isPolymorphicType: true,
      originalFieldName: field.name,
    };

    return [idField, typeField];
  }

  /**
   * Prepares a regular (non-polymorphic) field for input generation
   */
  private prepareRegularInputField(
    field: EntityField,
    type: 'create' | 'update' | 'createUpdate'
  ) {
    const graphqlOptions = new GraphQLOptions(field);
    let fieldName = field.name;
    let tsType = TypeMapper.getTsType(field, this.entity.name);
    let description = field.description;

    // 🔄 Handle relationship fields - convert to foreign key ID inputs
    if (field.relationship) {
      // Only generate foreign key input if enabled in GraphQL options
      if (!graphqlOptions.shouldGenerateForeignKey()) {
        return null;
      }
      // Generate foreign key field name (e.g., "connection" → "connectionId")
      fieldName = field.key || `${field.name}Id`;
      tsType = 'string';

      // Enhanced description clarifies this is an ID field
      const baseDesc = field.description || `Related ${field.relationship.targetEntity}`;
      description = field.description
        ? `Input: ${field.description} (ID of ${field.relationship.targetEntity})`
        : `Input: ID of related ${field.relationship.targetEntity}`;
    }

    // For flexible JSON array inputs, use 'any' instead of typed interfaces
    if (field.type === 'json' && field.array) {
      tsType = 'any'; // Allow any JSON value for flexible inputs
    }

    // Generate enhanced description for regular fields (not relationships)
    if (!field.relationship && description) {
      description = this.generateInputDescription(field, description);
    }

    // Generate FieldInput decorator with options
    const fieldInputDecorator = this.generateFieldInputDecorator(field, type, description);

    // For update and createUpdate, all fields are optional to support partial updates
    const isOptional = type === 'update' || type === 'createUpdate' || !field.required;
    const nullability = isOptional ? '?' : '!';

    return {
      name: fieldName,
      tsType,
      nullability,
      decorators: [fieldInputDecorator],
    };
  }

  /**
   * Generates FieldInput decorator for polymorphic fields
   */
  private generatePolymorphicFieldInputDecorator(
    field: EntityField,
    fieldType: 'id' | 'type',
    inputType: 'create' | 'update' | 'createUpdate',
    description?: string
  ): string {
    const options: string[] = [];

    // Add input type context
    options.push(`inputType: '${inputType}'`);

    // Add description if provided
    if (description) {
      options.push(`description: '${description.replace(/'/g, "\\'")}'`);
    }

    // Add validation options - always include required setting
    if (field.required !== undefined) {
      options.push(`required: ${field.required}`);
    }

    // Add max length for ID fields (UUID length)
    if (fieldType === 'id') {
      options.push('maxLength: 36');
    }

    return `@FieldInput(String, { ${options.join(', ')} })`;
  }

  /**
   * Generates a FieldInput decorator call based on field configuration
   */
  private generateFieldInputDecorator(
    field: EntityField,
    inputType: 'create' | 'update' | 'createUpdate',
    description?: string
  ): string {
    const options: string[] = [];

    // Add input type context
    options.push(`inputType: '${inputType}'`);

    // Add description if provided
    if (description) {
      options.push(`description: '${description.replace(/'/g, "\\'")}'`);
    }

    // Handle relationship fields
    if (field.relationship) {
      options.push(`required: ${field.required || false}`);
      return `@FieldInput(String, { ${options.join(', ')} })`;
    }

    // Handle different field types
    switch (field.type) {
      case 'string':
      case 'text':
        return this.generateScalarFieldInput('String', field, options);

      case 'number':
        return this.generateScalarFieldInput('Number', field, options);

      case 'boolean':
        return this.generateScalarFieldInput('Boolean', field, options);

      case 'date':
        return this.generateScalarFieldInput('Date', field, options);

      case 'uuid':
        return this.generateScalarFieldInput('String', field, options, 'isUUID: true');

      case 'enum':
        return this.generateEnumFieldInput(field, options);

      case 'json':
        return this.generateJSONFieldInput(field, options);

      default:
        return this.generateScalarFieldInput('String', field, options);
    }
  }

  /**
   * Generates FieldInput decorator for scalar types
   *
   * 🔹 INPUT FIELDS GENERATION 🔹
   * This is where GraphQL input field decorators are generated with:
   * - Validation rules (required, min, max, etc.)
   * - Type information (String, Number, Boolean, etc.)
   * - Default values from JSON schema
   * - Input context (create/update/createUpdate)
   *
   * Generated decorators look like:
   * @FieldInput(Number, { inputType: 'create', description: '...', default: 32, required: false })
   */
  private generateScalarFieldInput(
    type: string,
    field: EntityField,
    baseOptions: string[],
    additionalOptions?: string
  ): string {
    const options = [...baseOptions];

    // For Update and CreateUpdate inputs, make fields optional to support partial updates
    const inputType = baseOptions.find(opt => opt.includes('inputType'))?.split("'")[1];
    const isPartialUpdate = inputType === 'update' || inputType === 'createUpdate';

    // Add validation options - respect partial update context
    if (field.required !== undefined && !isPartialUpdate) {
      options.push(`required: ${field.required}`);
    }

    if (field.minLength) {
      options.push(`minLength: ${field.minLength}`);
    }

    if (field.maxLength) {
      options.push(`maxLength: ${field.maxLength}`);
    }

    if (field.pattern) {
      options.push(`pattern: /${field.pattern}/`);
    }

    if (field.min !== undefined) {
      options.push(`min: ${field.min}`);
    }

    if (field.max !== undefined) {
      options.push(`max: ${field.max}`);
    }

    // Add array option for scalar arrays
    if (field.array) {
      options.push('array: true');
    }

    // 🎯 Add default value from JSON schema if specified
    if (field.defaultValue !== undefined) {
      if (typeof field.defaultValue === 'string') {
        // Escape single quotes in string defaults (e.g., "O'Reilly" → "O\\'Reilly")
        options.push(`default: '${field.defaultValue.replace(/'/g, "\\'")}'`);
      } else {
        // JSON.stringify handles numbers, booleans, objects, arrays correctly
        options.push(`default: ${JSON.stringify(field.defaultValue)}`);
      }
    }

    if (additionalOptions) {
      options.push(additionalOptions);
    }

    return `@FieldInput(${type}, { ${options.join(', ')} })`;
  }

  /**
   * Generates FieldInputEnum decorator for enum fields
   */
  private generateEnumFieldInput(field: EntityField, baseOptions: string[]): string {
    const options = [...baseOptions];

    // For Update and CreateUpdate inputs, make fields optional to support partial updates
    const inputType = baseOptions.find(opt => opt.includes('inputType'))?.split("'")[1];
    const isPartialUpdate = inputType === 'update' || inputType === 'createUpdate';

    // Add enum-specific options - respect partial update context
    if (field.required !== undefined && !isPartialUpdate) {
      options.push(`required: ${field.required}`);
    }

    if (field.array) {
      options.push('array: true');
    }

    // 🎯 Add default value from JSON schema if specified
    if (field.defaultValue !== undefined) {
      if (typeof field.defaultValue === 'string') {
        // Escape single quotes in string defaults (e.g., "O'Reilly" → "O\\'Reilly")
        options.push(`default: '${field.defaultValue.replace(/'/g, "\\'")}'`);
      } else {
        // JSON.stringify handles numbers, booleans, objects, arrays correctly
        options.push(`default: ${JSON.stringify(field.defaultValue)}`);
      }
    }

    const enumName = TypeMapper.getEnumName(this.entity.name, field.name);
    return `@FieldInputEnum(${enumName}, { ${options.join(', ')} })`;
  }

  /**
   * Generates FieldInputJSON decorator for JSON fields
   */
  private generateJSONFieldInput(field: EntityField, baseOptions: string[]): string {
    const options = [...baseOptions];

    // For Update and CreateUpdate inputs, make fields optional to support partial updates
    const inputType = baseOptions.find(opt => opt.includes('inputType'))?.split("'")[1];
    const isPartialUpdate = inputType === 'update' || inputType === 'createUpdate';

    // Add JSON-specific options - respect partial update context
    if (field.required !== undefined && !isPartialUpdate) {
      options.push(`required: ${field.required}`);
    }

    if (field.array) {
      options.push('array: true');
    }

    // 🎯 Add default value from JSON schema if specified
    if (field.defaultValue !== undefined) {
      if (typeof field.defaultValue === 'string') {
        // Escape single quotes in string defaults (e.g., "O'Reilly" → "O\\'Reilly")
        options.push(`default: '${field.defaultValue.replace(/'/g, "\\'")}'`);
      } else {
        // JSON.stringify handles numbers, booleans, objects, arrays correctly
        options.push(`default: ${JSON.stringify(field.defaultValue)}`);
      }
    }

    // For JSON fields, we typically need to specify a schema
    // For array fields, use z.array(z.any()), otherwise use z.any()
    const schema = field.array ? 'z.array(z.any())' : 'z.any()';
    // Don't add array: true option since the schema already handles it
    const finalOptions = field.array
      ? options.filter(opt => opt !== 'array: true').join(', ')
      : options.join(', ');

    return `@FieldInputJSON(${schema}, { ${finalOptions} })`;
  }
}