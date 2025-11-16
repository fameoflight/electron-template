import { graphql, GraphQLSchema, GraphQLFormattedError } from 'graphql';
import { createGraphQLSchema } from './schema';
import { ApolloServer } from "@apollo/server";
import { GraphQLVariables, GraphQLResponse, GraphQLContext } from '@shared/types';
import { PayloadError } from 'relay-runtime';
import { DataSourceProvider } from '@main/base';
import { User } from '@main/base/db/User.js';

let schema: GraphQLSchema | null = null;
let server: ApolloServer | null = null;

export async function initializeGraphQLSchema() {
  if (schema && server) {
    return schema;
  }

  schema = await createGraphQLSchema();
  server = new ApolloServer({ schema });

  return schema;
}

async function findUser(sessionKey?: string): Promise<GraphQLContext['user']> {
  const dataSource = DataSourceProvider.get();
  if (!dataSource) {
    return null;
  }

  if (!sessionKey || sessionKey.trim() === '') {
    return null;
  }

  const userRepository = dataSource.getRepository(User);

  const user = await userRepository.findOne({ where: { sessionKey } });
  return (user as GraphQLContext['user']) || null;
}

export async function executeGraphQLQuery<T = unknown>(
  query: string,
  variables?: GraphQLVariables,
  clientContext?: { sessionKey?: string }
): Promise<GraphQLResponse<T>> {
  if (!schema || !server) {
    throw new Error('GraphQL schema not initialized');
  }

  const user = await findUser(clientContext?.sessionKey);

  const context: GraphQLContext = {
    user,
  };

  const executionResult = await server.executeOperation({
    query,
    variables,
  }, { contextValue: context });

  if (executionResult.body.kind != 'single') {
    throw new Error('Unexpected result kind from Apollo Server');
  }

  const result = executionResult.body.singleResult;

  const errors = result.errors || [];


  if (errors.length) {
    // get query line by line with line numbers
    const queryLines = query.split('\n').map((line, index) => `${index + 1}: ${line}`).join('\n');
    const errorContext = {
      errors: errors,
      variables,
      context,
    }
    // TODO: Integrate with a logging service like Sentry here
    console.log('GraphQL Execution Errors:', JSON.stringify(errorContext, null, 2));
    console.log('GraphQL Query with Line Numbers:\n', queryLines);
  }

  return {
    data: result.data as T,
    errors: errors as PayloadError[],
  };
}
