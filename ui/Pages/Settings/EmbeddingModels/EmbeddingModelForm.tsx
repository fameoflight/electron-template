import React, { useEffect, useState, useMemo, useCallback } from "react";
import _ from "lodash";
import { Form, Input, Button, FormInstance, Select, message } from "antd";
import SliderInput from "@ui/Components/SliderInput";
import { useFragment, graphql } from "react-relay/hooks";
import { EmbeddingModelForm_record$key } from "./__generated__/EmbeddingModelForm_record.graphql";
import { EmbeddingModelForm_connections$key } from "./__generated__/EmbeddingModelForm_connections.graphql";
import { humanize } from "@shared/utils";

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

  const isEditing = useMemo(() => record && record.id ? true : false, [record]);

  // Filter models for embeddings (models starting with 'embed' or containing 'embedding') - memoized
  const filterEmbeddingModels = useCallback((models: any[] = []) => {
    return models.filter(model =>
      model.name.toLowerCase().includes('embed') ||
      model.id.toLowerCase().includes('embed')
    );
  }, []);

  // Handle connection change to update available models - memoized
  const handleConnectionChange = useCallback((connectionId: string) => {
    const selectedConnection = connections.find(c => c.id === connectionId);
    if (selectedConnection && selectedConnection.models) {
      const embeddingModels = filterEmbeddingModels([...selectedConnection.models]);
      setAvailableModels(embeddingModels);

      // Auto-select first model if no model is currently selected
      if (embeddingModels.length > 0 && !props.form.getFieldValue('modelIdentifier')) {
        props.form.setFieldValue('modelIdentifier', embeddingModels[0].id);
        props.form.setFieldValue('name', humanize(embeddingModels[0].name));
      }
    } else {
      setAvailableModels([]);
      props.form.setFieldValue('modelIdentifier', undefined);
    }
  }, [connections, props.form, filterEmbeddingModels]);

  const onModelChange = useCallback((modelIdentifier: string) => {
    const selectedModel = availableModels.find(m => m.id === modelIdentifier);
    if (selectedModel) {
      props.form.setFieldValue('name', humanize(selectedModel.name));
    }
  }, [availableModels, props.form]);

  const onFinish = useCallback((values: any) => {
    props.onSubmit?.(values);
  }, [props.onSubmit]);

  // Memoize connection options
  const connectionOptions = useMemo(() =>
    connections.map((connection) => ({
      key: connection.id,
      value: connection.id,
      label: `${connection.name} (${connection.provider} - ${connection.kind})`
    })), [connections]);

  // Memoize model options
  const modelOptions = useMemo(() =>
    availableModels.map((model) => ({
      key: model.id,
      value: model.id,
      label: `${model.name} (${model.id})`
    })), [availableModels]);

  const onFormValuesChange = useCallback((changedValues: any) => {
    if (changedValues.connectionId) {
      handleConnectionChange(changedValues.connectionId);
    }
    if (changedValues.modelIdentifier) {
      onModelChange(changedValues.modelIdentifier);
    }
  }, [handleConnectionChange, onModelChange]);

  return (
    <Form
      initialValues={{
        ...record,
      }}
      form={props.form}
      preserve={false}
      layout="vertical"
      onFinish={onFinish}
      name="EmbeddingModelForm"
      onValuesChange={onFormValuesChange}
      className="space-y-6"
    >
      <Form.Item name="id" hidden>
        <Input />
      </Form.Item>

      <Form.Item
        label={<span className="text-sm font-medium text-[var(--color-text-primary)]">Connection</span>}
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
          options={connectionOptions}
          className="input"
          size="large"
        />
      </Form.Item>

      <Form.Item
        label={<span className="text-sm font-medium text-[var(--color-text-primary)]">Model</span>}
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
            option?.label?.toString().toLowerCase().includes(input.toLowerCase()) || false
          }
          options={modelOptions}
          className="input"
          size="large"
        />
      </Form.Item>

      <Form.Item
        label={<span className="text-sm font-medium text-[var(--color-text-primary)]">Name</span>}
        name="name"
        tooltip="Optional display name for the embedding model"
      >
        <Input
          placeholder="e.g., OpenAI Small Embeddings"
          className="input"
          size="large"
        />
      </Form.Item>

      <Form.Item
        label={<span className="text-sm font-medium text-[var(--color-text-primary)]">Context Length</span>}
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
        extra={<span className="text-xs text-[var(--color-text-tertiary)]">Maximum tokens for embeddings</span>}
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
        label={<span className="text-sm font-medium text-[var(--color-text-primary)]">Max Batch Size</span>}
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
        extra={<span className="text-xs text-[var(--color-text-tertiary)]">Number of texts to embed at once</span>}
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
        label={<span className="text-sm font-medium text-[var(--color-text-primary)]">System Prompt</span>}
        name="systemPrompt"
        tooltip="Optional default system prompt for the embedding model"
      >
        <Input.TextArea
          placeholder="Enter system prompt..."
          autoSize={{ minRows: 3, maxRows: 6 }}
          className="resize-none rounded-lg border-[var(--color-border-default)] focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-100)] transition-all"
        />
      </Form.Item>
    </Form>
  );
};

export default EmbeddingModelForm;