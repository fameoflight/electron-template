import { createHandler } from './createHandler';
import { executeGraphQLQuery } from '@main/graphql/server';
import { GraphQLVariables, GraphQLResponse } from '@shared/types';
import { PayloadData } from 'relay-runtime';

export const graphqlHandlers = {
  'graphql-query': createHandler<
    { query: string; variables?: GraphQLVariables; context?: { sessionKey?: string } },
    GraphQLResponse<PayloadData>
  >(async (event, args) => {
    try {
      const result = await executeGraphQLQuery<PayloadData>(args.query, args.variables, args.context);
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`GraphQL query failed: ${errorMessage}`);
    }
  }),
} as const;
