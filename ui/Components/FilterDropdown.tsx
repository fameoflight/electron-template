import React, { useState } from 'react';
import { Dropdown, Checkbox, Button, Badge } from 'antd';
import { DownOutlined, FilterOutlined } from '@ant-design/icons';

interface FilterOption {
  id: string;
  label: string;
  description?: string;
  count?: number;
}

interface IFilterDropdownProps {
  items: FilterOption[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  label: string;
  className?: string;
  showAllOption?: boolean;
  maxDisplayCount?: number;
}

function FilterDropdown(props: IFilterDropdownProps) {
  const {
    items,
    selectedIds,
    onSelectionChange,
    label,
    className,
    showAllOption = true,
    maxDisplayCount = 3
  } = props;

  const [open, setOpen] = useState(false);

  const handleToggle = (optionId: string) => {
    let newSelectedIds: string[];

    if (optionId === 'all') {
      // "All" option clears selection
      newSelectedIds = [];
    } else {
      if (selectedIds.includes(optionId)) {
        newSelectedIds = selectedIds.filter(id => id !== optionId);
      } else {
        newSelectedIds = [...selectedIds, optionId];
      }
    }

    onSelectionChange(newSelectedIds);
  };

  const handleClearAll = () => {
    onSelectionChange([]);
    setOpen(false);
  };

  const handleSelectAll = () => {
    onSelectionChange(items.map(item => item.id));
    setOpen(false);
  };

  // Generate display text
  const getDisplayText = () => {
    if (selectedIds.length === 0) {
      return label;
    }

    if (selectedIds.length <= maxDisplayCount) {
      const selectedLabels = items
        .filter(item => selectedIds.includes(item.id))
        .map(item => item.label);
      return `${label}: ${selectedLabels.join(', ')}`;
    }

    return `${label}: ${selectedIds.length} selected`;
  };

  const menuItems = [
    // "All" option
    ...(showAllOption ? [{
      key: 'divider-1',
      type: 'divider' as const
    }, {
      key: 'all',
      label: (
        <div className="py-1">
          <Checkbox
            checked={selectedIds.length === 0}
            onChange={() => handleToggle('all')}
          >
            <span className="font-medium">All</span>
          </Checkbox>
        </div>
      ),
      onClick: () => {}
    }] : []),

    // Divider
    {
      key: 'divider-2',
      type: 'divider' as const
    },

    // Individual options
    ...items.map(item => ({
      key: item.id,
      label: (
        <div className="py-1">
          <Checkbox
            checked={selectedIds.includes(item.id)}
            onChange={() => handleToggle(item.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{item.label}</div>
                {item.description && (
                  <div className="text-xs text-gray-500">{item.description}</div>
                )}
              </div>
              {typeof item.count === 'number' && (
                <Badge count={item.count} showZero style={{ backgroundColor: '#f0f0f0', color: '#666' }} />
              )}
            </div>
          </Checkbox>
        </div>
      ),
      onClick: () => {}
    })),

    // Divider
    {
      key: 'divider-3',
      type: 'divider' as const
    },

    // Action buttons
    {
      key: 'actions',
      label: (
        <div className="py-2 flex gap-2">
          <Button
            size="small"
            onClick={handleSelectAll}
            disabled={selectedIds.length === items.length}
          >
            Select All
          </Button>
          <Button
            size="small"
            onClick={handleClearAll}
            disabled={selectedIds.length === 0}
          >
            Clear All
          </Button>
        </div>
      ),
      onClick: () => {}
    }
  ];

  return (
    <Dropdown
      menu={{ items: menuItems }}
      trigger={['click']}
      open={open}
      onOpenChange={setOpen}
      placement="bottomLeft"
      className={className}
    >
      <Button
        icon={<FilterOutlined />}
        className={selectedIds.length > 0 ? 'text-blue-600 border-blue-300' : ''}
      >
        <div className="flex items-center gap-2">
          <span className="truncate max-w-32 inline-block text-left">
            {getDisplayText()}
          </span>
          {selectedIds.length > 0 && (
            <Badge count={selectedIds.length} size="small" />
          )}
          <DownOutlined />
        </div>
      </Button>
    </Dropdown>
  );
}

export default FilterDropdown;