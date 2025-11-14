import React from 'react';
import { Card, Typography, Space, Button } from 'antd';

const { Text, Paragraph } = Typography;

export interface PageInfo {
  currentPage: number;
  totalPages?: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalItems?: number;
}

export interface SearchResultItemProps<T = any> {
  item: T;
  index: number;
  pageInfo?: PageInfo;
  onClick?: (item: T, index: number) => void;
  renderTitle: (item: T) => React.ReactNode;
  renderDescription?: (item: T) => React.ReactNode;
  renderMeta?: (item: T) => React.ReactNode;
  renderActions?: (item: T) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  highlightQuery?: string;
  isGrouped?: boolean;
}

function SearchResultItem<T = any>({
  item,
  index,
  pageInfo,
  onClick,
  renderTitle,
  renderDescription,
  renderMeta,
  renderActions,
  className,
  style,
  highlightQuery,
  isGrouped = false,
  ...props
}: SearchResultItemProps<T>) {
  const handleClick = () => {
    onClick?.(item, index);
  };

  
  return (
    <Card
      className={className}
      style={{
        marginBottom: isGrouped ? 12 : 16,
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
      hoverable={!!onClick}
      onClick={handleClick}
      size="small"
      {...props}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {renderTitle(item)}

            {renderDescription && renderDescription(item)}

            {renderMeta && renderMeta(item)}
          </Space>
        </div>

        {renderActions && (
          <div style={{ marginLeft: 12 }}>
            {renderActions(item)}
          </div>
        )}
      </div>
    </Card>
  );
}

export default SearchResultItem;