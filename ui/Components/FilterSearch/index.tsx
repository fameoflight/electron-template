import React, { useState, useMemo } from "react";
import { Input, Button, Dropdown } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import FilterDropdown from "./FilterDropdown";
import FilterTags from "./FilterTags";


interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  label: string;
  multiple?: boolean;
  items: FilterOption[];
  showAllOption?: boolean;
  initialValue?: string[];
}

interface FilterSearchProps {
  filters: Record<string, FilterConfig>;
  onSubmit: (query: string, selectedFilters: Record<string, string[]>) => void;
  loading?: boolean;
  placeholder?: string;
}

function FilterSearch({
  filters,
  onSubmit,
  loading = false,
  placeholder = "Search..."
}: FilterSearchProps) {
  // Initialize filters with initialValue from config
  const initialFilters = useMemo(() => {
    const initial: Record<string, string[]> = {};
    Object.entries(filters).forEach(([key, config]) => {
      if (config.initialValue && config.initialValue.length > 0) {
        initial[key] = config.initialValue;
      }
    });
    return initial;
  }, [filters]);

  const [query, setQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>(initialFilters);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const handleFilterChange = (filterKey: string, values: string[]) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterKey]: values
    }));
  };

  const normalizeFilters = (selectedFilters: Record<string, string[]>): Record<string, string[]> => {
    const normalized: Record<string, string[]> = {};

    Object.entries(selectedFilters).forEach(([filterKey, values]) => {
      const config = filters[filterKey];

      // Skip empty filters
      if (values.length === 0) return;

      // "all" means no filtering - omit this filter entirely
      if (config?.multiple && values.includes("all")) {
        return; // Don't add this filter to normalized output
      }

      normalized[filterKey] = values;
    });

    return normalized;
  };

  const handleSubmit = () => {
    if (!query.trim()) return;
    const processedFilters = normalizeFilters(selectedFilters);
    onSubmit(query, processedFilters);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const clearFilter = (filterKey: string) => {
    setSelectedFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[filterKey];
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setSelectedFilters({});
  };

  const hasActiveFilters = Object.keys(selectedFilters).some(key =>
    selectedFilters[key]?.length > 0
  );

  return (
    <div className="w-full">
      <Input.Search
        size="large"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
        className="flex-1"
        onSearch={handleSubmit}
        enterButton={
          <Button type="primary" loading={loading} icon={<SearchOutlined />}>Search</Button>
        }
      />

      <div className="my-4 p-2" style={{ visibility: hasActiveFilters ? 'visible' : 'hidden' }}>
        <FilterTags
          filters={Object.entries(selectedFilters).map(([key, values]) => {
            const config = filters[key];
            return {
              key,
              label: config.label,
              values,
              allOption: config.showAllOption ? { label: `All ${config.label}`, value: "all" } : undefined
            };
          })}
          onClearFilter={clearFilter}
          onClearAll={clearAllFilters}
        />
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {Object.entries(filters).map(([filterKey, config]) => {
          const filterDropdown = FilterDropdown({
            label: config.label,
            options: config.items,
            selectedValues: selectedFilters[filterKey] || [],
            multiple: config.multiple,
            onSelect: (values) => handleFilterChange(filterKey, values),
            showAllOption: config.showAllOption
          });

          return (
            <div key={filterKey} className="space-y-2">
              <div className="font-medium text-sm text-gray-700">
                {config.label}
              </div>
              <Dropdown
                overlay={filterDropdown.content}
                trigger={["click"]}
                placement="bottomLeft"
              >
                {filterDropdown.trigger}
              </Dropdown>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FilterSearch;

