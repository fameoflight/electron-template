import 'reflect-metadata';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsDate,
  IsEnum,
  ArrayContains,
  IsOptional
} from 'class-validator';

/**
 * Shared utilities for GraphQL decorator implementations
 */

/**
 * Extract field metadata from TypeGraphQL and TypeORM storages
 */
export function getFieldMetadata(
  entityClass: Function,
  fieldName: string,
  graphqlFields: any[],
  typeormColumns: any[]
) {
  const graphqlField = graphqlFields.find(
    (f: any) => f.target === entityClass && String(f.name) === fieldName
  );

  const typeormColumn = typeormColumns.find(
    (c: any) => c.target === entityClass && String(c.propertyName) === fieldName
  );

  // Detect if the field is an array type by examining the GraphQL field type design type
  // and checking the TypeORM column type
  const isSimpleJsonColumn = typeormColumn?.options?.type === 'simple-json' ||
                             typeormColumn?.options?.type === 'json';

  // Check if the design type is an array or if the GraphQL field type function returns an array
  let isArray = false;
  try {
    const designType = graphqlField?.designType;
    if (designType) {
      // Check if design type is an array constructor
      isArray = designType === Array ||
                (designType.prototype && designType.prototype.constructor === Array);
    }

    // Check TypeORM column options for array indication
    // We'll detect enum arrays in the getGraphQLTypeFromMetadata function using typeValue

    // Also check if the type function returns an array (most reliable)
    const getTypeFunction = graphqlField?.getType || graphqlField?.typeOptions?.returnTypeFunc;
    if (!isArray && getTypeFunction) {
      const typeResult = typeof getTypeFunction === 'function'
        ? getTypeFunction()
        : getTypeFunction;
      isArray = Array.isArray(typeResult);
    }
  } catch (e) {
    // If detection fails, fall back to checking for simple-json with enum-like behavior
    isArray = isSimpleJsonColumn;
  }

  return {
    graphqlField,
    typeormColumn,
    columnName: fieldName,
    getTypeFunction: graphqlField?.getType || graphqlField?.typeOptions?.returnTypeFunc,
    nullable: graphqlField?.typeOptions?.nullable ?? false,
    description: graphqlField?.description,
    defaultValue: typeormColumn?.options?.default,
    isJSON: typeormColumn?.options?.type === 'json',
    isArray
  };
}

/**
 * Determine GraphQL type from metadata
 */
export function getGraphQLTypeFromMetadata(metadata: ReturnType<typeof getFieldMetadata>) {
  if (!metadata.getTypeFunction) {
    return null;
  }

  try {
    const typeValue = typeof metadata.getTypeFunction === 'function'
      ? metadata.getTypeFunction()
      : metadata.getTypeFunction;

    // Handle array types
    let finalGraphQLType = metadata.getTypeFunction;
    let finalScalarType = typeValue;

    
    // Detect enum arrays: simple-json column + enum type that should be array
    if (!metadata.isArray &&
        metadata.typeormColumn?.options?.type === 'simple-json' &&
        typeValue && typeof typeValue === 'object' && typeValue !== null) {
      const values = Object.values(typeValue);
      const isEnumLike = values.length > 0 && values.every(v => typeof v === 'string');
      if (isEnumLike) {
        metadata.isArray = true; // Update the metadata
      }
    }

    // Detect JSON arrays using the typeOptions.array flag
    if (!metadata.isArray && metadata.typeormColumn?.options?.type === 'json') {
      // Check if the GraphQL field is marked as an array
      if (metadata.graphqlField?.typeOptions?.array === true) {
        metadata.isArray = true; // Update the metadata
      }
    }

    if (metadata.isArray) {
      // For array types, always wrap the type in an array
      finalGraphQLType = () => [typeValue];
      finalScalarType = typeValue;
    }

    
    return {
      graphqlType: finalGraphQLType,
      scalarType: finalScalarType
    };
  } catch (e) {
    return { graphqlType: metadata.getTypeFunction, scalarType: null };
  }
}

/**
 * Apply basic validation decorators based on scalar type
 * This is a simplified version for auto-generated input types
 */
export function applyBasicValidation(
  target: any,
  propertyKey: string,
  scalarType: any,
  nullable: boolean,
  isArray: boolean = false
): void {
  if (nullable) {
    IsOptional()(target, propertyKey);
  }

  const validatorMap: Record<string, () => void> = {
    [String.name]: () => IsString()(target, propertyKey),
    [Number.name]: () => IsNumber()(target, propertyKey),
    [Boolean.name]: () => IsBoolean()(target, propertyKey),
    [Date.name]: () => IsDate()(target, propertyKey)
  };

  // Handle primitive types
  const validator = validatorMap[scalarType?.name];
  if (validator) {
    validator();
    return;
  }

  // Handle enums
  if (scalarType && typeof scalarType === 'object') {
    try {
      const values = Object.values(scalarType);
      if (values.length > 0 && values.every((v: any) => typeof v === 'string' || typeof v === 'number')) {
        if (isArray) {
          IsEnum(scalarType, { each: true })(target, propertyKey);
        } else {
          IsEnum(scalarType)(target, propertyKey);
        }
      }
    } catch (e) {
      // Not an enum, skip
    }
  }
}
