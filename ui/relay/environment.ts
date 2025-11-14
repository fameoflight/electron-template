import { GraphQLResponse } from '@shared/types';
import _ from 'lodash';
import { Environment, GraphQLTaggedNode, Network, OperationType, PayloadData, RecordSource, RequestParameters, Store, VariablesOf } from 'relay-runtime';

interface RequestParams {
  text: string;
  name?: string;
}

interface TaggedNode {
  params?: {
    text: string;
    name?: string;
  };
  name?: string;
}

export async function fetchQuery<TQuery extends OperationType>(
  operation: RequestParameters | GraphQLTaggedNode,
  variables?: VariablesOf<TQuery> | Record<string, unknown>,
  context?: Record<string, unknown>
): Promise<{ data: TQuery['response'], errors: PayloadData['errors'] }> {
  // Normalize to an object that definitely has .text and optional .name
  let queryText = '';
  let operationName: string | undefined;

  // RequestParameters has .text and .name
  if (operation && typeof operation === 'object' && 'text' in operation && typeof (operation as RequestParams).text === 'string') {
    queryText = (operation as RequestParams).text || '';
    operationName = (operation as RequestParams).name;
  }
  // ConcreteRequest-like GraphQLTaggedNode often has .params.{text,name}
  else if (operation && typeof operation === 'object' && 'params' in operation && (operation as TaggedNode).params) {
    const params = (operation as TaggedNode).params;
    if (params && typeof params.text === 'string') {
      queryText = params.text;
      operationName = params.name;
    }
  }
  // Fallback: try to read a .toString() or name if present
  else if (operation && typeof operation === 'object' && 'name' in operation) {
    operationName = (operation as TaggedNode).name;
  }

  const result = await window.electron['graphql-query']({
    query: queryText,
    variables,
    context,
  });

  const errors = _.get(result, 'errors');

  if (errors && errors.length > 0) {
    console.error(`[Relay Environment] GraphQL Errors for operation ${operationName || 'unknown'}:`, errors);
  }

  // console.log('[Relay Environment]\n', JSON.stringify({ operationName, variables, result }, null, 2));

  return result as { data: TQuery['response'], errors: PayloadData['errors'] };
}


export function createEnvironment(sessionKey?: string | null) {
  const networkWithAuth = Network.create((operation, variables) =>
    fetchQuery<any>(operation, variables, { sessionKey })
  );

  return new Environment({
    network: networkWithAuth,
    store: new Store(new RecordSource()),
  });
}
