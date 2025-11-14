import { ObjectType, Field, Int, ClassType, ArgsType, Field as InputField } from 'type-graphql';

/**
 * PageInfo type for Relay cursor-based pagination
 */
@ObjectType()
export class PageInfo {
  @Field(() => Boolean)
  hasNextPage!: boolean;

  @Field(() => Boolean)
  hasPreviousPage!: boolean;

  @Field(() => String, { nullable: true })
  startCursor?: string | null;

  @Field(() => String, { nullable: true })
  endCursor?: string | null;
}

/**
 * Creates a Relay Edge type for a given node type
 */
export function createEdgeType<TNode extends object>(
  nodeName: string,
  nodeType: ClassType<TNode>
) {
  @ObjectType(`${nodeName}Edge`)
  class Edge {
    @Field(() => nodeType)
    node!: TNode;

    @Field(() => String)
    cursor!: string;
  }

  return Edge;
}

/**
 * Creates a Relay Connection type for a given node type
 */
export function createConnectionType<TNode extends object>(
  nodeName: string,
  nodeType: ClassType<TNode>
) {
  const EdgeType = createEdgeType(nodeName, nodeType);

  @ObjectType(`${nodeName}Connection`)
  class Connection {
    @Field(() => [EdgeType])
    edges!: InstanceType<typeof EdgeType>[];

    @Field(() => PageInfo)
    pageInfo!: PageInfo;

    @Field(() => Int)
    totalCount!: number;
  }

  return Connection;
}

/**
 * Helper to create cursor from an ID
 */
export function toCursor(id: string): string {
  return Buffer.from(id).toString('base64');
}

/**
 * Helper to decode cursor back to ID
 */
export function fromCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64').toString('utf-8');
}

/**
 * Connection arguments for pagination
 */
@ArgsType()
export class ConnectionArgs {
  @InputField(() => Int, { nullable: true })
  first?: number;

  @InputField(() => String, { nullable: true })
  after?: string;

  @InputField(() => Int, { nullable: true })
  last?: number;

  @InputField(() => String, { nullable: true })
  before?: string;
}

/**
 * Builds a connection from an array of items
 */
export function connectionFromArray<T extends { id: string }>(
  items: T[],
  args: ConnectionArgs,
  totalCount: number
): {
  edges: Array<{ node: T; cursor: string }>;
  pageInfo: PageInfo;
  totalCount: number;
} {
  const { first, after, last, before } = args;

  let startIndex = 0;
  let endIndex = items.length;

  // Handle 'after' cursor
  if (after) {
    const afterId = fromCursor(after);
    const afterIndex = items.findIndex((item) => item.id === afterId);
    if (afterIndex >= 0) {
      startIndex = afterIndex + 1;
    }
  }

  // Handle 'before' cursor
  if (before) {
    const beforeId = fromCursor(before);
    const beforeIndex = items.findIndex((item) => item.id === beforeId);
    if (beforeIndex >= 0) {
      endIndex = beforeIndex;
    }
  }

  // Apply first/last limits
  if (first !== undefined) {
    endIndex = Math.min(startIndex + first, endIndex);
  }

  if (last !== undefined) {
    startIndex = Math.max(endIndex - last, startIndex);
  }

  const slicedItems = items.slice(startIndex, endIndex);

  const edges = slicedItems.map((item) => ({
    node: item,
    cursor: toCursor(item.id),
  }));

  const pageInfo: PageInfo = {
    hasNextPage: endIndex < items.length,
    hasPreviousPage: startIndex > 0,
    startCursor: edges.length > 0 ? edges[0].cursor : null,
    endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
  };

  return {
    edges,
    pageInfo,
    totalCount,
  };
}
