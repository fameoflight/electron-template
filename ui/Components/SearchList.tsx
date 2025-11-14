import React, { useState } from 'react';
import { Empty, Spin, Alert, Typography, Space, List, ListProps } from 'antd';

const { Title, Text } = Typography;

export interface SearchResult<T = any> {
  items: T[];
  totalCount?: number;
  hasMore?: boolean;
  nextPage?: number;
}

export interface BaseSearchParams {
  query: string;
  page?: number;
}

export interface SearchListProps<T = any, P extends BaseSearchParams = BaseSearchParams> extends Omit<ListProps<T>, 'dataSource' | 'renderItem'> {
  searchFunction: (params: P) => Promise<SearchResult<T>>;
  renderItem: (item: T, index: number) => React.ReactNode;
  searchParams: P;
  loading?: boolean;
  error?: string | null;
  emptyDescription?: string;
  noResultsDescription?: (query: string) => React.ReactNode;
  loadingText?: string;
  title?: string;
  itemLayout?: 'horizontal' | 'vertical';
  pageSize?: number;
  onLoadMore?: (items: T[], hasMore: boolean) => void;
  onSearchParamsChange?: (params: P) => void;
}

function SearchList<T = any, P extends BaseSearchParams = BaseSearchParams>({
  searchFunction,
  renderItem,
  searchParams,
  loading = false,
  error = null,
  emptyDescription = 'Enter a search query to find items',
  noResultsDescription = (q) => `No results found for "${q}"`,
  loadingText = 'Searching...',
  title = 'Search Results',
  itemLayout = 'vertical',
  pageSize = 20,
  onLoadMore,
  onSearchParamsChange,
  ...listProps
}: SearchListProps<T, P>) {
  const [items, setItems] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const executeSearch = async (params: P, page: number = 1) => {
    try {
      const searchParamsWithPage = { ...params, page };
      const result = await searchFunction(searchParamsWithPage);

      if (page === 1) {
        setItems(result.items);
      } else {
        setItems(prev => [...prev, ...result.items]);
      }

      setTotalCount(result.totalCount || result.items.length);
      setHasMore(result.hasMore !== false && result.items.length === pageSize);
      setCurrentPage(page);

      onLoadMore?.(result.items, result.hasMore !== false);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  React.useEffect(() => {
    if (searchParams.query) {
      setItems([]);
      setCurrentPage(1);
      executeSearch(searchParams, 1);
    } else {
      setItems([]);
      setHasMore(false);
      setTotalCount(0);
    }
  }, [searchParams]);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      executeSearch(searchParams, currentPage + 1);
    }
  };

  if (loading && items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>{loadingText}</Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Search Error"
        description={error}
        type="error"
        showIcon
        style={{ margin: '16px 0' }}
      />
    );
  }

  if (!searchParams.query) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={emptyDescription}
        style={{ margin: '40px 0' }}
      />
    );
  }

  if (items.length === 0 && !loading) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={noResultsDescription(searchParams.query)}
        style={{ margin: '40px 0' }}
      />
    );
  }

  return (
    <div>
      <Space align="center" style={{ marginBottom: 16 }}>
        <Title level={5} style={{ margin: 0 }}>
          {title}
        </Title>
        <Text type="secondary">
          ({totalCount || items.length} result{(totalCount || items.length) !== 1 ? 's' : ''} for "{searchParams.query}")
        </Text>
      </Space>

      <List<T>
        {...listProps}
        dataSource={items}
        renderItem={(item, index) => renderItem(item, index)}
        itemLayout={itemLayout}
        loading={loading && items.length > 0}
        loadMore={hasMore ? (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              onClick={handleLoadMore}
              disabled={loading}
              style={{
                padding: '8px 16px',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                background: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        ) : null}
      />
    </div>
  );
}

export default SearchList;