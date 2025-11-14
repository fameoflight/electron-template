import { InterfaceType, Field, ID } from 'type-graphql';

/**
 * Relay Node interface for Global Object Identification
 * All types that implement this interface can be refetched using the node query
 */
@InterfaceType({
  description: 'An object with a Globally Unique ID and timestamps',
  resolveType: (value) => {
    // This function helps GraphQL determine which concrete type implements this interface
    // The type name is encoded in the global ID
    if (value.__typename) {
      return value.__typename;
    }
    // Fallback: try to extract from the global ID
    if (value.id && typeof value.id === 'string') {
      const decoded = fromGlobalId(value.id);
      return decoded.type;
    }
    return null;
  },
})
export abstract class Node {
  @Field(() => ID, { description: 'Globally unique Relay ID (base64 encoded type:id)', nullable: false })
  id!: string;

  @Field(() => String, { description: 'Internal database UUID', nullable: false })
  modelId!: string;

  @Field(() => Date, {
    description: 'Timestamp when the entity was created'
  })
  createdAt!: Date;

  @Field(() => Date, {
    description: 'Timestamp when the entity was last updated'
  })
  updatedAt!: Date;
}

/**
 * Encodes a type name and ID into a Relay Global ID
 * Format: base64(TypeName:localId)
 */
export function toGlobalId(type: string, id: string): string {
  return Buffer.from(`${type}:${id}`).toString('base64');
}

/**
 * Decodes a Relay Global ID back into type name and local ID
 */
export function fromGlobalId(globalId: string): { type: string; id: string } {
  try {
    const decoded = Buffer.from(globalId, 'base64').toString('utf-8');
    const [type, ...idParts] = decoded.split(':');
    if (!type || idParts.length === 0 || !decoded.includes(':')) {
      throw new Error('Invalid global ID format');
    }
    return {
      type,
      id: idParts.join(':'), // In case the ID contains colons
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to decode global ID: ${error.message}`);
    }
    throw new Error('Failed to decode global ID: Unknown error');
  }
}

/**
 * Extracts just the local ID from a global ID
 */
export function fromGlobalIdToLocalId(globalId: string): string {
  // check if globalId is UUID format (36 characters with hyphens)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(globalId)) {
    return globalId;
  }
  return fromGlobalId(globalId).id;
}
