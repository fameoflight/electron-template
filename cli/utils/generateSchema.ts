import 'reflect-metadata';
import { printSchema, lexicographicSortSchema, GraphQLSchema } from 'graphql';
import { writeFile } from './FileSystemService.js';
import { createGraphQLSchema } from '../../main/graphql/schema.js';

/**
 * Generate GraphQL schema from entities and resolvers
 */
export async function generateSchema(): Promise<void> {
  const schema: GraphQLSchema = await createGraphQLSchema();
  // sort schema for consistency
  const sortedSchema = lexicographicSortSchema(schema);
  const schemaString = printSchema(sortedSchema);
  await writeFile('./schema.graphql', schemaString);
}