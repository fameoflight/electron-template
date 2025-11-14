import React from "react";
import { Tag, Space } from "antd";

interface ActiveFilter {
  key: string;
  label: string;
  values: string[];
  allOption?: {
    label: string;
    value: string;
  };
}

interface FilterTagsProps {
  filters: ActiveFilter[];
  onClearFilter?: (filterKey: string) => void;
  onClearAll?: () => void;
}

function FilterTags({ filters, onClearFilter, onClearAll }: FilterTagsProps) {
  if (filters.length === 0) return null;

  const renderFilterTags = (filter: ActiveFilter) => {
    const { key, label, values, allOption } = filter;

    if (values.length === 0) return null;

    // Handle "all" option
    if (allOption && values.includes(allOption.value)) {
      return (
        <Tag
          key={key}
          closable={!!onClearFilter}
          onClose={() => onClearFilter?.(key)}
          color="blue"
        >
          All {label}
        </Tag>
      );
    }

    // Handle single value
    if (values.length === 1) {
      return (
        <Tag
          key={`${key}-${values[0]}`}
          closable={!!onClearFilter}
          onClose={() => onClearFilter?.(key)}
          color="blue"
        >
          {label}: {values[0]}
        </Tag>
      );
    }

    // Handle multiple values
    return (
      <Tag
        key={key}
        closable={!!onClearFilter}
        onClose={() => onClearFilter?.(key)}
        color="blue"
      >
        {label}: {values.length} selected
      </Tag>
    );
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-gray-600">Filters:</span>
      <Space wrap size="small">
        {filters.map(renderFilterTags)}
      </Space>
      {onClearAll && (
        <button
          onClick={onClearAll}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

export default FilterTags;