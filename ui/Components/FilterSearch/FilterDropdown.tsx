import React from "react";
import { Button, Checkbox } from "antd";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  selectedValues: string[];
  multiple?: boolean;
  onSelect: (values: string[]) => void;
  showAllOption?: boolean;
}

function FilterDropdown({
  label,
  options,
  selectedValues,
  multiple = false,
  onSelect,
  showAllOption = true
}: FilterDropdownProps) {
  const handleOptionChange = (value: string, checked: boolean) => {
    if (multiple) {
      // Multi-select logic
      let newValues: string[];

      if (value === "all") {
        newValues = checked ? ["all"] : [];
      } else {
        // Remove "all" if selecting specific items
        const filteredValues = selectedValues.filter(v => v !== "all");

        if (checked) {
          newValues = [...filteredValues, value];
        } else {
          newValues = filteredValues.filter(v => v !== value);
        }
      }

      onSelect(newValues);
    } else {
      // Single-select logic
      onSelect(checked ? [value] : []);
    }
  };

  const getSelectedText = () => {
    if (selectedValues.length === 0) return `Select ${label}`;

    if (selectedValues.includes("all")) return `All ${label}`;

    if (selectedValues.length === 1) {
      const option = options.find(opt => opt.value === selectedValues[0]);
      return option?.label || selectedValues[0];
    }

    return `${selectedValues.length} ${label}`;
  };

  const dropdownContent = (
    <div className="p-3 min-w-48 bg-white">
      {multiple && showAllOption && (
        <div className="mb-3 pb-2 border-b">
          <Checkbox
            checked={selectedValues.includes("all")}
            onChange={(e) => handleOptionChange("all", e.target.checked)}
          >
            All {label}
          </Checkbox>
        </div>
      )}

      {options.map((option) => (
        <div key={option.value} className="mb-1">
          <Checkbox
            checked={selectedValues.includes(option.value)}
            onChange={(e) => handleOptionChange(option.value, e.target.checked)}
          >
            {option.label}
          </Checkbox>
        </div>
      ))}
    </div>
  );

  return {
    trigger: (
      <Button className="w-full text-left">
        <div className="truncate">{getSelectedText()}</div>
      </Button>
    ),
    content: dropdownContent
  };
}

export default FilterDropdown;