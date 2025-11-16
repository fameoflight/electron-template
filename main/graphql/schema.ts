import { buildSchema } from 'type-graphql';
import { getResolverClasses } from './resolverPaths.js';
import { RelayIdMiddleware } from '../base/graphql/middleware/RelayIdMiddleware';


async function nonEntityResolvers(): Promise<Function[]> {
  return [
    // Add any non-entity resolvers here if needed in the future
  ];
}

export async function createGraphQLSchema() {
  const resolverClasses = [await getResolverClasses(), ...(await nonEntityResolvers())].flat();

  // Ensure we have at least one resolver (TypeGraphQL requirement)
  if (resolverClasses.length === 0) {
    throw new Error('No resolver classes found. At least one resolver is required.');
  }

  return await buildSchema({
    // @ts-ignore - Type assert required to satisfy NonEmptyArray<Function> requirement
    resolvers: resolverClasses as any, // Type assert to satisfy NonEmptyArray<Function> requirement
    emitSchemaFile: false,
    validate: true, // Enable automatic input validation using class-validator
    // Enable orphaned types to ensure Node interface is included
    orphanedTypes: [],
    // Global middleware for automatic Relay ID → local ID conversion
    globalMiddlewares: [RelayIdMiddleware],
  });
}
