import React, { useEffect, useState, useMemo, useCallback } from "react";
import _ from "lodash";
import { Form, Input, Button, FormInstance, Select, message } from "antd";
import SliderInput from "@ui/Components/SliderInput";
import { useFragment, graphql } from "react-relay/hooks";
import { EmbeddingModelForm_record$key } from "./__generated__/EmbeddingModelForm_record.graphql";
import { EmbeddingModelForm_connections$key } from "./__generated__/EmbeddingModelForm_connections.graphql";

const fragmentSpec = graphql`
  fragment EmbeddingModelForm_record on EmbeddingModel {
    id
    name
    connectionId
    dimension
    contextLength
    maxBatchSize
    modelIdentifier
    systemPrompt
  }
`;

const connectionFragmentSpec = graphql`
  fragment EmbeddingModelForm_connections on Connection @relay(plural: true) {
    id
    name
    provider
    kind
    models {
      id
      name
    }
  }
`;

interface IEmbeddingModelFormProps {
  form: FormInstance<any>;
  record: EmbeddingModelForm_record$key | null;
  connections: EmbeddingModelForm_connections$key;
  onSubmit?: (values: any) => void;
}

function EmbeddingModelForm(props: IEmbeddingModelFormProps) {
  const record = useFragment(fragmentSpec, props.record ?? null);
  const connections = useFragment(connectionFragmentSpec, props.connections);
  const [availableModels, setAvailableModels] = useState<Array<{ id: string, name: string }>>([]);

  const isEditing = record && record.id ? true : false;

  // Filter models for embeddings (models starting with 'embed' or containing 'embedding')
  const filterEmbeddingModels = (models: any[] = []) => {
    return models.filter(model =>
      model.name.toLowerCase().includes('embed') ||
      model.id.toLowerCase().includes('embed')
    );
  };

  // Handle connection change to update available models
  const handleConnectionChange = (connectionId: string) => {
    const selectedConnection = connections.find(c => c.id === connectionId);
    if (selectedConnection && selectedConnection.models) {
      const embeddingModels = filterEmbeddingModels([...selectedConnection.models]);
      setAvailableModels(embeddingModels);

      // Auto-select first model if no model is currently selected
      if (embeddingModels.length > 0 && !props.form.getFieldValue('modelIdentifier')) {
        props.form.setFieldValue('modelIdentifier', embeddingModels[0].id);
      }
    } else {
      setAvailableModels([]);
      props.form.setFieldValue('modelIdentifier', undefined);
    }
  };

  const onFinish = (values: any) => {
    props.onSubmit?.(values);
  };

  return (
    <Form
      initialValues={record || undefined}
      form={props.form}
      preserve={false}
      layout="vertical"
      onFinish={onFinish}
      name="EmbeddingModelForm"
    >

      <Form.Item name="id" hidden>
        <Input />
      </Form.Item>

      <Form.Item
        label="Connection"
        name="connectionId"
        rules={[
          {
            required: true,
            message: "Please select a connection!",
          },
        ]}
      >
        <Select
          disabled={isEditing}
          placeholder="Select a connection"
          allowClear
          onChange={handleConnectionChange}
        >
          {connections.map((connection) => (
            <Select.Option key={connection.id} value={connection.id}>
              {connection.name} ({connection.provider} - {connection.kind})
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label="Model"
        name="modelIdentifier"
        rules={[
          {
            required: true,
            message: "Please select a model!",
          },
        ]}
      >
        <Select
          disabled={isEditing}
          placeholder="Select an embedding model"
          allowClear
          showSearch
          filterOption={(input, option) =>
            (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase()) || false
          }
        >
          {availableModels.map((model) => (
            <Select.Option key={model.id} value={model.id}>
              {model.name} ({model.id})
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label="Name"
        name="name"
        tooltip="Optional display name for the embedding model"
      >
        <Input placeholder="e.g., OpenAI Small Embeddings" />
      </Form.Item>

      <Form.Item
        label="Context Length"
        name="contextLength"
        rules={[
          {
            required: true,
            message: "Please input context length!",
          },
          {
            type: 'number',
            min: 1024,
            max: 8192,
            message: 'Context length must be between 1024 and 8192',
          },
        ]}
      >
        <SliderInput
          min={1024}
          max={8192}
          step={256}
          marks={{
            1024: '1K',
            2048: '2K',
            4096: '4K',
            6144: '6K',
            8192: '8K'
          }}
          placeholder="8192"
        />
      </Form.Item>

      <Form.Item
        label="Max Batch Size"
        name="maxBatchSize"
        rules={[
          {
            required: true,
            message: "Please input max batch size!",
          },
          {
            type: 'number',
            min: 4,
            max: 64,
            message: 'Max batch size must be between 4 and 64',
          },
        ]}
      >
        <SliderInput
          min={4}
          max={64}
          step={4}
          marks={{
            4: '4',
            16: '16',
            32: '32',
            48: '48',
            64: '64'
          }}
          placeholder="32"
        />
      </Form.Item>

      <Form.Item
        label="System Prompt"
        name="systemPrompt"
        tooltip="Optional default system prompt for the embedding model"
      >
        <Input.TextArea
          placeholder="Enter system prompt..."
          autoSize={{ minRows: 3, maxRows: 6 }}
          className="resize-none"
        />
      </Form.Item>
    </Form>
  );
};

export default EmbeddingModelForm;