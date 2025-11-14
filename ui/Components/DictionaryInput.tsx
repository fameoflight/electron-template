import React, { useState } from 'react';
import { Button, Input } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

interface DictionaryInputProps {
  value?: Record<string, string>;
  onChange?: (value: Record<string, string>) => void;
  placeholder?: {
    key?: string;
    value?: string;
  };
}

interface KeyValuePair {
  key: string;
  value: string;
  id: string;
}

function DictionaryInput({
  value,
  onChange,
  placeholder = { key: 'Header name', value: 'Header value' }
}: DictionaryInputProps) {
  const [pairs, setPairs] = useState<KeyValuePair[]>(
    Object.entries(value || {}).map(([k, v], index) => ({
      key: k,
      value: v,
      id: `${index}-${Date.now()}`
    }))
  );

  const addPair = () => {
    const newPair: KeyValuePair = {
      key: '',
      value: '',
      id: `${Date.now()}`
    };
    const newPairs = [...pairs, newPair];
    setPairs(newPairs);
    updateValue(newPairs);
  };

  const removePair = (id: string) => {
    const newPairs = pairs.filter(pair => pair.id !== id);
    setPairs(newPairs);
    updateValue(newPairs);
  };

  const updatePair = (id: string, field: 'key' | 'value', newValue: string) => {
    const newPairs = pairs.map(pair =>
      pair.id === id ? { ...pair, [field]: newValue } : pair
    );
    setPairs(newPairs);
    updateValue(newPairs);
  };

  const updateValue = (currentPairs: KeyValuePair[]) => {
    const result: Record<string, string> = {};
    currentPairs.forEach(pair => {
      if (pair.key.trim() && pair.value.trim()) {
        result[pair.key.trim()] = pair.value.trim();
      }
    });
    onChange?.(result);
  };

  return (
    <div className="space-y-2">
      {pairs.map((pair) => (
        <div key={pair.id} className="flex gap-2 items-center">
          <Input
            placeholder={placeholder.key}
            value={pair.key}
            onChange={(e) => updatePair(pair.id, 'key', e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder={placeholder.value}
            value={pair.value}
            onChange={(e) => updatePair(pair.id, 'value', e.target.value)}
            className="flex-1"
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => removePair(pair.id)}
            className="flex-shrink-0"
          />
        </div>
      ))}

      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={addPair}
        className="w-full"
      >
        Add Header
      </Button>

      {pairs.length === 0 && (
        <p className="text-gray-500 text-sm">
          No custom headers configured. Click "Add Header" to add one.
        </p>
      )}
    </div>
  );
}

export default DictionaryInput;