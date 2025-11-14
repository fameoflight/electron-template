import React from 'react';
import { Tooltip } from 'antd';
import { formatDateTime, getTimeAgo } from '@shared/utils';

interface DateView {
  timestamp: string;
  format?: 'time' | 'date' | 'datetime' | 'relative';
  className?: string;
}

function DateView({ timestamp, format = 'time', className = '' }: DateView) {
  return (
    <Tooltip title={format === 'relative' ? formatDateTime(timestamp, 'datetime') : getTimeAgo(timestamp)} placement="top">
      <span className={className}>
        {formatDateTime(timestamp, format)}
      </span>
    </Tooltip>
  );
}

export default DateView;