import React from 'react';
import {
  UseMutationConfig,
  useLazyLoadQuery,
  useMutation,
} from 'react-relay/hooks';
import {
  CacheConfig,
  Disposable,
  FetchPolicy,
  GraphQLTaggedNode,
  IEnvironment,
  MutationConfig,
  MutationParameters,
  OperationType,
  PayloadError,
  RenderPolicy,
  VariablesOf,
  commitMutation,
} from 'relay-runtime';


import _ from 'lodash';


import useFetchKey from './useFetchKey';
import { notification } from 'antd';

export const findAllByKey = (object: object, searchKey: string): any[] => {
  const result: any[] = [];

  _.map(object, (value, key) => {
    if (key === searchKey) {
      result.push(value);
    } else if (_.isObjectLike(value)) {
      _.each(findAllByKey(value, searchKey), (r) => result.push(r));
    }
  });

  return _.flatten(result);
};


function showMutationErrors<TMutation extends MutationParameters>(
  response: TMutation['response'],
  payloadErrors: readonly PayloadError[] | null | undefined
) {
  let mutationErrors = findAllByKey(response, 'errors');

  if (!_.isEmpty(payloadErrors)) {
    const payloadErrorMessages = _.map(payloadErrors, 'message');
    mutationErrors = _.concat(mutationErrors, payloadErrorMessages);
  }

  if (!_.isEmpty(mutationErrors)) {
    const errorView = (
      <div className="space-y-1" >
        {
          mutationErrors.map((message, idx) => (
            <p key={idx} > {message} </p>
          ))
        }
      </div>
    );

    notification.error({
      message: 'Error',
      description: errorView,
    });
  }
}

const defaultOnError = (error: Error) => {
  const message = _.get(error, 'message') || 'Internal server error';

  notification.error({
    message: 'Error',
    description: message,
  });
};

export function useCompatMutation<TMutation extends MutationParameters>(
  mutation: GraphQLTaggedNode,
  commitMutationFn?: (
    environment: IEnvironment,
    config: MutationConfig<TMutation>
  ) => Disposable
): [(config: UseMutationConfig<TMutation>) => Disposable, boolean] {
  const [commitUseMutation, commitIsInFlight] = useMutation(
    mutation,
    commitMutationFn
  );

  const commitMutationEnhanced = (config: UseMutationConfig<TMutation>) => {
    const { onCompleted, ...restConfig } = config;

    return commitUseMutation({
      onError: defaultOnError,
      ...restConfig,
      onCompleted: (response: TMutation['response'], payloadErrors) => {
        showMutationErrors(response, payloadErrors);

        onCompleted?.(response, payloadErrors);
      },
    });
  };

  return [commitMutationEnhanced, commitIsInFlight];
}

function useNetworkLazyLoadQuery<TQuery extends OperationType>(
  gqlQuery: GraphQLTaggedNode,
  variables?: VariablesOf<TQuery>,
  options?: {
    fetchKey?: string | number | undefined;
    fetchPolicy?: FetchPolicy | undefined;
    networkCacheConfig?: CacheConfig;
    UNSTABLE_renderPolicy?: RenderPolicy;
  }
): TQuery['response'] {
  const optionKeys = ['fetchKey', 'fetchPolicy', 'networkCacheConfig'];

  for (const key of optionKeys) {
    if (_.includes(variables, key)) {
      console.error(
        `Variables cannot contain ${key}, should be passed as options`
      );
    }
  }

  const fetchPolicy = options?.fetchPolicy || 'store-and-network';

  const queryVariables = variables || {};

  return useLazyLoadQuery(gqlQuery, queryVariables, {
    fetchPolicy: fetchPolicy,
    ...options,
  });
}

type UseNetworkLazyReloadQueryReturn<TQuery extends OperationType> = [
  TQuery['response'], // data
  () => void, // updateData
  string, // fetchKey
];

export function useNetworkLazyReloadQuery<TQuery extends OperationType>(
  gqlQuery: GraphQLTaggedNode,
  variables?: VariablesOf<TQuery>,
  options?: {
    fetchKey?: string | number;
    fetchPolicy?: FetchPolicy;
    networkCacheConfig?: CacheConfig;
    UNSTABLE_renderPolicy?: RenderPolicy;
  }
): UseNetworkLazyReloadQueryReturn<TQuery> {
  if (options?.fetchKey) {
    throw new Error(
      'fetchKey cannot be passed as options, use useNetworkLazyLoadQuery'
    );
  }

  const [fetchKey, updateFetchKey] = useFetchKey();

  const data = useNetworkLazyLoadQuery(gqlQuery, variables, {
    ...options,
    fetchKey,
  });

  return [
    data,
    () => {
      updateFetchKey();
    },
    fetchKey,
  ];
}

// Types for pagination
export interface RelayConnection<TNode> {
  edges: ReadonlyArray<{
    node: TNode;
    cursor?: string | null;
  }>;
  pageInfo: {
    readonly endCursor: string | null | undefined;
    readonly hasNextPage: boolean;
    readonly hasPreviousPage: boolean;
    readonly startCursor: string | null | undefined;
  };
}

export interface PaginationVariables {
  first?: number;
  last?: number;
  after?: string;
  before?: string;
}

export interface UseNetworkLazyPaginationQueryOptions {
  initialPageSize?: number;
  fetchPolicy?: FetchPolicy;
  networkCacheConfig?: CacheConfig;
  UNSTABLE_renderPolicy?: RenderPolicy;
}

type UseNetworkLazyPaginationQueryReturn<TQuery extends OperationType> = [
  TQuery['response'], // data
  (newVariables?: PaginationVariables) => void, // loadMore
  () => void, // reset
  string, // fetchKey
  boolean, // loading
];

export function useNetworkLazyPaginationQuery<TQuery extends OperationType>(
  gqlQuery: GraphQLTaggedNode,
  variables?: VariablesOf<TQuery>,
  options: UseNetworkLazyPaginationQueryOptions = {}
): UseNetworkLazyPaginationQueryReturn<TQuery> {
  const { initialPageSize = 20 } = options;

  const [fetchKey, updateFetchKey] = useFetchKey();
  const [currentVariables, setCurrentVariables] = React.useState<VariablesOf<TQuery>>(variables || {});
  const [isLoading, setIsLoading] = React.useState(false);

  // Extract connection from the response
  const getConnection = (response: TQuery['response']): RelayConnection<any> | null => {
    // Try to find the connection in the response
    // This assumes there's only one connection in the response for simplicity
    const responseObj = response as any;

    // Look for common connection patterns
    for (const key in responseObj) {
      const value = responseObj[key];
      if (value && typeof value === 'object' && 'edges' in value && 'pageInfo' in value) {
        return value as RelayConnection<any>;
      }
    }

    return null;
  };

  // Load more data
  const loadMore = React.useCallback((newVariables?: PaginationVariables) => {
    setIsLoading(true);

    setCurrentVariables(prev => {
      const connection = getConnection(prev as any);

      let mergedVariables: VariablesOf<TQuery> = { ...prev };

      if (connection?.pageInfo.hasNextPage) {
        mergedVariables = {
          ...prev,
          first: newVariables?.first || initialPageSize,
          after: connection.pageInfo.endCursor,
          before: undefined,
          last: undefined,
          ...newVariables
        };
      } else if (connection?.pageInfo.hasPreviousPage) {
        mergedVariables = {
          ...prev,
          first: undefined,
          after: undefined,
          before: connection.pageInfo.startCursor,
          last: newVariables?.last || initialPageSize,
          ...newVariables
        };
      }

      return mergedVariables;
    });

    // Trigger refetch
    updateFetchKey();

    // Reset loading state after a short delay to allow the query to complete
    setTimeout(() => setIsLoading(false), 100);
  }, [initialPageSize]);

  // Reset pagination
  const reset = React.useCallback(() => {
    setCurrentVariables(variables || {});
    updateFetchKey();
    setIsLoading(false);
  }, [variables]);

  // Load initial data
  const data = useNetworkLazyLoadQuery(gqlQuery, currentVariables, {
    fetchPolicy: options.fetchPolicy || 'store-and-network',
    ...options,
    fetchKey,
  });

  return [
    data,
    loadMore,
    reset,
    fetchKey,
    isLoading,
  ];
}

