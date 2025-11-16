import React, { useCallback } from 'react';
import { FormInstance, Select } from 'antd';
import { humanize } from '@shared/utils';

interface IModelSelectorProps {
  availableModels: Array<{ id: string; name: string }>;
  form: FormInstance<any>;
  disabled?: boolean;
  placeholder?: string;
  onModelChange?: (modelIdentifier: string) => void;
}

function ModelSelector(props: IModelSelectorProps) {
  const {
    availableModels,
    form,
    disabled = false,
    placeholder = "Select a model",
    onModelChange
  } = props;

  // Memoize model options
  const modelOptions = React.useMemo(() =>
    availableModels.map((model) => ({
      key: model.id,
      value: model.id,
      label: `${model.name} (${model.id})`
    })), [availableModels]);

  const handleChange = useCallback((modelIdentifier: string) => {
    const selectedModel = availableModels.find(m => m.id === modelIdentifier);
    if (selectedModel) {
      form.setFieldValue('name', humanize(selectedModel.name));
    }
    onModelChange?.(modelIdentifier);
  }, [availableModels, form, onModelChange]);

  return (
    <Select
      disabled={disabled}
      placeholder={placeholder}
      allowClear
      showSearch
      filterOption={(input, option) =>
        option?.label?.toString().toLowerCase().includes(input.toLowerCase()) || false
      }
      options={modelOptions}
      onChange={handleChange}
      className="input"
      size="large"
    />
  );
}

export default React.memo(ModelSelector);