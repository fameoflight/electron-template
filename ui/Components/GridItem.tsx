import React from 'react';

import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { classNames } from '@ui/Components/utils';

export type GridItemType = {
  id: string | 'new';
  name: string;
  icon?: React.ReactNode;
  editable?: boolean;
  deletable?: boolean;
  className?: string;
  tooltip?: string | React.ReactNode;
  tag?: {
    name: string;
    className: string;
  };
};

interface IGridItemViewProps<T extends GridItemType> {
  record: T;
  onClick?: (record: T) => void;
  onDelete?: (record: T) => void;
  onEdit?: (record: T) => void;
  size?: 'small' | 'default';
}

function GridItem<T extends GridItemType>(props: IGridItemViewProps<T>) {
  const { record, onClick, size = 'default' } = props;
  const tag = record.tag;

  const { name, icon, tooltip } = record;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick && !e.defaultPrevented) {
      onClick(record);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    props.onDelete?.(record);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    props.onEdit?.(record);
  };

  const showDelete = record.id !== 'new' && record.deletable;

  const showEditable = record.id !== 'new' && record.editable && props.onEdit;

  const content = (
    <div
      onClick={handleClick}
      key={record.id}
      className={classNames(
        size === 'default' ? 'w-32 py-4 px-2' : 'w-24 py-2 px-1',
        record.className,
        'relative shadow-sm bg-white m-4 text-center items-center hover:opacity-80 hover:bg-gray-50 cursor-pointer'
      )}
    >
      {tag && (
        <div
          className={`absolute -top-2 -left-2 shadow-md px-2  ${tag.className} text-xs truncate max-w-[80%]`}
          title={tag.name}
        >
          {tag.name}
        </div>
      )}

      {showDelete && (
        <button
          className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
          onClick={handleDelete}
          aria-label="Delete item"
        >
          <DeleteOutlined style={{ fontSize: '12px' }} />
        </button>
      )}

      {showEditable && (
        <button
          className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
          onClick={handleEdit}
          aria-label="Edit item"
        >
          <EditOutlined style={{ fontSize: '12px' }} />
        </button>
      )}

      {icon && (
        <div className="w-14 h-14 flex items-center justify-center mx-auto">
          {icon}
        </div>
      )}

      {size === 'small' ? (
        <div className="text-xs text-gray-400 mt-2">{name}</div>
      ) : (
        <div className="text-center mt-4">
          <h4 className="text-xs text-gray-700">{name}</h4>
        </div>
      )}
    </div>
  );

  return tooltip ? (
    <Tooltip title={tooltip} placement="bottom">
      {content}
    </Tooltip>
  ) : (
    content
  );
}

export default GridItem;
