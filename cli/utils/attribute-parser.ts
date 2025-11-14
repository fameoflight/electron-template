/**
 * Attribute Parser for Entity Generator
 * Parses attribute strings like "title:string" or "userId:number"
 */

export interface ParsedAttribute {
  name: string;
  type: string;
  tsType: string;
  columnType: string;
  graphqlType: string;
  nullable: boolean;
  isRelationship: boolean;
  relationshipEntity?: string;
  relationshipType?: 'one-to-one' | 'many-to-one' | 'one-to-many' | 'many-to-many';
}

/**
 * Type mapping from shorthand to TypeScript/Database/GraphQL types
 */
const TYPE_MAPPINGS: Record<string, {
  ts: string;
  column: string;
  graphql: string;
}> = {
  // String types
  'string': { ts: 'string', column: 'varchar', graphql: 'String' },
  'text': { ts: 'string', column: 'text', graphql: 'String' },

  // Number types
  'number': { ts: 'number', column: 'integer', graphql: 'Int' },
  'integer': { ts: 'number', column: 'integer', graphql: 'Int' },
  'int': { ts: 'number', column: 'integer', graphql: 'Int' },
  'float': { ts: 'number', column: 'float', graphql: 'Float' },
  'decimal': { ts: 'number', column: 'decimal', graphql: 'Float' },

  // Boolean
  'boolean': { ts: 'boolean', column: 'boolean', graphql: 'Boolean' },
  'bool': { ts: 'boolean', column: 'boolean', graphql: 'Boolean' },

  // Date/Time
  'date': { ts: 'Date', column: 'timestamp', graphql: 'Date' },
  'datetime': { ts: 'Date', column: 'timestamp', graphql: 'Date' },
  'timestamp': { ts: 'Date', column: 'timestamp', graphql: 'Date' },

  // JSON
  'json': { ts: 'object', column: 'simple-json', graphql: 'JSON' },
  'jsonb': { ts: 'object', column: 'jsonb', graphql: 'JSON' },
};

/**
 * Parse a single attribute string
 * Examples:
 *   "title:string" -> { name: 'title', type: 'string', ... }
 *   "userId:number" -> { name: 'userId', type: 'number', isRelationship: true, ... }
 *   "content:text?" -> { name: 'content', type: 'text', nullable: true, ... }
 */
export function parseAttribute(attributeStr: string): ParsedAttribute {
  // Check for nullable marker (?)
  const nullable = attributeStr.endsWith('?');
  const cleanStr = attributeStr.replace(/\?$/, '');

  // Split by colon
  const [name, rawType = 'string'] = cleanStr.split(':');
  const type = rawType.toLowerCase();

  // Check if this looks like a relationship (ends with 'Id')
  const isRelationship = name.endsWith('Id') && (type === 'number' || type === 'string');

  let relationshipEntity: string | undefined;
  const relationshipType: ParsedAttribute['relationshipType'] = 'many-to-one';

  if (isRelationship) {
    // Extract entity name from field name (userId -> User)
    relationshipEntity = name.slice(0, -2); // Remove 'Id'
    relationshipEntity = relationshipEntity.charAt(0).toUpperCase() + relationshipEntity.slice(1);
  }

  // Get type mappings
  const typeMapping = TYPE_MAPPINGS[type] || TYPE_MAPPINGS['string'];

  return {
    name,
    type,
    tsType: typeMapping.ts,
    columnType: typeMapping.column,
    graphqlType: typeMapping.graphql,
    nullable,
    isRelationship,
    relationshipEntity,
    relationshipType,
  };
}

/**
 * Parse multiple attribute strings
 */
export function parseAttributes(attributeStrings: string[]): ParsedAttribute[] {
  return attributeStrings.map(parseAttribute);
}

/**
 * Validate attribute name (must be valid TypeScript identifier)
 */
export function isValidAttributeName(name: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name);
}

/**
 * Get column decorator options as a string
 */
export function getColumnOptions(attr: ParsedAttribute): string {
  const options: string[] = [];

  options.push(`type: '${attr.columnType}'`);

  if (attr.nullable) {
    options.push('nullable: true');
  }

  return `{ ${options.join(', ')} }`;
}

/**
 * Get GraphQL Field decorator options
 */
export function getGraphQLFieldOptions(attr: ParsedAttribute): string {
  if (attr.nullable) {
    return '{ nullable: true }';
  }
  return '';
}
