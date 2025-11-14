import React, { useEffect } from 'react';

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Empty, Input } from 'antd';

import { invariant } from './utils';

interface IStringListInputProps {
  className?: string;
  value?: string[];
  onChange?: (value: string[]) => void;
  children?: React.ReactNode;
  label?: string;
}
function StringListInput(props: IStringListInputProps) {
  const { value: _value, onChange: _onChange, ...inputProps } = props;

  const label = props.label ?? 'Value';

  if (props.value) {
    invariant(
      Array.isArray(props.value),
      'StringListInput: value must be an array'
    );
  }

  const [values, setValues] = React.useState<string[]>(props.value || []);

  useEffect(() => {
    setValues(props.value || []);
  }, [props.value]);

  const onChange = (value: string, index: number) => {
    const newValues = [...values];
    invariant(index >= 0, 'index must be >= 0');

    if (index >= newValues.length) {
      newValues.push(value);
    } else {
      newValues[index] = value;
    }

    setValues(newValues);
    props.onChange?.(newValues);
  };

  const onRemove = (index: number) => {
    const newValues = [...values];
    invariant(index >= 0, 'index must be >= 0');

    newValues.splice(index, 1);
    setValues(newValues);
    props.onChange?.(newValues);
  };

  return (
    <div className="flex flex-col space-y-2">
      {values.map((value, idx) => (
        <div key={idx} className="flex flex-row items-center">
          <Input
            {...inputProps}
            value={value}
            onChange={(e) => {
              onChange(e.target.value, idx);
            }}
          />

          <Button
            {...inputProps}
            type="text"
            className="ml-2"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              onRemove(idx);
            }}
          />
        </div>
      ))}

      {values.length === 0 && (
        <Empty
          description={`No ${label}s. Click the button below to add a ${label}.`}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}

      <Button
        {...inputProps}
        type="primary"
        className="mt-2"
        onClick={() => {
          onChange('New Value', values.length);
        }}
      >
        <PlusOutlined /> Add {label}
      </Button>
    </div>
  );
}

export default StringListInput;
