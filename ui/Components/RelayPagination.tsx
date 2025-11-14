import React from 'react';
import { Button, Space, Spin } from 'antd';
import { LoadingOutlined, DoubleLeftOutlined, DoubleRightOutlined } from '@ant-design/icons';
import type { RelayConnection } from '@ui/hooks/relay';

export type RelayPaginationVariables =
  | { first?: number; after?: string }
  | { last?: number; before?: string };

export interface RelayPaginationProps<T> {
  /** Connection data with pageInfo */
  connection?: RelayConnection<T>;

  /** Loading state */
  loading?: boolean;

  /** Load more function from useNetworkLazyPaginationQuery */
  loadMore: (variables?: RelayPaginationVariables) => void;

  /** Optional custom load previous function */
  loadPrevious?: (variables?: RelayPaginationVariables) => void;

  /** Custom text */
  loadMoreText?: string;
  loadPreviousText?: string;

  /** Page size for default behavior */
  pageSize?: number;

  /** Show loading indicator */
  showLoading?: boolean;

  /** Custom class name */
  className?: string;
}

/**
 * Standard Relay pagination component that works with useNetworkLazyPaginationQuery
 *
 * Usage:
 * ```tsx
 * const [data, loadMore, reset, fetchKey, isLoading] = useNetworkLazyPaginationQuery(searchQuery, {
 *   query: 'test',
 *   embeddingModelId: 'model-1'
 * });
 *
 * <RelayPagination
 *   connection={data?.searchEmbeddings}
 *   loading={isLoading}
 *   loadMore={loadMore}
 *   loadPrevious={loadMore} // Same function works for both
 * />
 * ```
 */
function RelayPagination<T>({
  connection,
  loading = false,
  loadMore,
  loadPrevious,
  loadMoreText = 'Load More',
  loadPreviousText = 'Load Previous',
  pageSize = 20,
  showLoading = true,
  className
}: RelayPaginationProps<T>) {
  const hasNextPage = connection?.pageInfo?.hasNextPage || false;
  const hasPreviousPage = connection?.pageInfo?.hasPreviousPage || false;
  const endCursor = connection?.pageInfo?.endCursor;
  const startCursor = connection?.pageInfo?.startCursor;

  // Don't render if no pagination available
  if (!hasNextPage && !hasPreviousPage) {
    return null;
  }

  const handleLoadMore = () => {
    if (hasNextPage && endCursor) {
      loadMore({ first: pageSize, after: endCursor });
    }
  };

  const handleLoadPrevious = () => {
    if (hasPreviousPage && startCursor && loadPrevious) {
      loadPrevious({ last: pageSize, before: startCursor });
    } else if (hasPreviousPage && startCursor) {
      // Fallback to using loadMore for backward pagination
      loadMore({ last: pageSize, before: startCursor });
    }
  };

  return (
    <div className={`flex justify-center py-4 space-x-4 ${className}`}>
      {hasPreviousPage && (
        <Button
          icon={<DoubleLeftOutlined />}
          onClick={handleLoadPrevious}
          loading={loading}
          disabled={loading && !hasPreviousPage}
        >
          {loadPreviousText}
        </Button>
      )}
      {hasNextPage && (
        <Button
          icon={<DoubleRightOutlined />}
          onClick={handleLoadMore}
          loading={loading}
          type="primary"
        >
          {loadMoreText}
        </Button>
      )}

      {/* Loading indicator */}
      {loading && showLoading && (
        <div className="flex items-center px-4">
          <Spin
            indicator={<LoadingOutlined style={{ fontSize: 16 }} spin />}
            tip="Loading..."
          />
        </div>
      )}
    </div>
  );
}

export default RelayPagination;