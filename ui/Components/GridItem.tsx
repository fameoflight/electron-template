import React from 'react';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { motion } from '@ui/Components/Motion';
import { classNames } from '@ui/Components/utils';

export type GridItemType = {
  id: string | 'new';
  name: string;
  description?: string;
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
  index?: number;
}

function GridItem<T extends GridItemType>(props: IGridItemViewProps<T>) {
  const { record, onClick, size = 'default', index = 0 } = props;
  const tag = record.tag;

  const { name, icon, tooltip, description } = record;

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={handleClick}
      className={classNames(
        size === 'default' ? 'p-6' : 'p-4',
        record.className,
        'relative group bg-surface rounded-xl border border-border-default cursor-pointer transition-all duration-[var(--duration-fast)] hover:border-primary-600 hover:shadow-lg overflow-hidden'
      )}
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      {/* Top accent bar - appears on hover */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-600 to-primary-400 opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--duration-normal)]" />

      {tag && (
        <div
          className={`absolute -top-2 -left-2 shadow-md px-2 rounded-md ${tag.className} text-xs truncate max-w-[80%]`}
          title={tag.name}
        >
          {tag.name}
        </div>
      )}

      {showDelete && (
        <button
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg bg-white shadow-sm border border-border-default text-tertiary hover:text-error-600 hover:bg-error-50 hover:border-error-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[error-500] transition-all duration-[var(--duration-fast)] opacity-0 group-hover:opacity-100"
          onClick={handleDelete}
          aria-label="Delete item"
        >
          <DeleteOutlined style={{ fontSize: '14px' }} />
        </button>
      )}

      {showEditable && (
        <button
          className="absolute top-3 right-12 w-7 h-7 flex items-center justify-center rounded-lg bg-white shadow-sm border border-border-default text-tertiary hover:text-primary-600 hover:bg-primary-50 hover:border-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-[var(--duration-fast)] opacity-0 group-hover:opacity-100"
          onClick={handleEdit}
          aria-label="Edit item"
        >
          <EditOutlined style={{ fontSize: '14px' }} />
        </button>
      )}

      {/* Icon */}
      {icon && (
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-xl bg-primary-50 text-primary-600 group-hover:bg-primary-100 transition-colors duration-[var(--duration-fast)]">
          <div className="text-2xl">{icon}</div>
        </div>
      )}

      {/* Content */}
      <div className="text-center">
        <h4 className="text-base font-semibold text-primary mb-1">
          {name}
        </h4>
        {description && (
          <p className="text-sm text-secondary line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600/0 to-primary-400/0 group-hover:from-primary-600/5 group-hover:to-primary-400/5 transition-all duration-[var(--duration-normal)] pointer-events-none rounded-xl" />
    </motion.div>
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
