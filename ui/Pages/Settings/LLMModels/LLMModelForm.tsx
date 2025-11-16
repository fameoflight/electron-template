import React, { useEffect, useState, useMemo, useCallback } from "react";
import _ from "lodash";
import { Form, Input, Button, FormInstance, Select, message } from "antd";
import { useFragment, graphql } from "react-relay/hooks";
import { LLMModelForm_record$key } from "./__generated__/LLMModelForm_record.graphql";
import { LLMModelForm_connections$key } from "./__generated__/LLMModelForm_connections.graphql";
import RadioCard from "@ui/Components/RadioCard";
import SliderInput from "@ui/Components/SliderInput";
import { humanize } from "@shared/utils";

const fragmentSpec = graphql`
  fragment LLMModelForm_record on LLMModel {
    id
    name
    connectionId
    temperature
    contextLength
    capabilities
    modelIdentifier
    systemPrompt
  }
`;

const connectionFragmentSpec = graphql`
  fragment LLMModelForm_connections on Connection @relay(plural: true) {
    id
    modelId
    name
    provider
    kind
    models {
      id
      name
    }
  }
`;

interface ILLMModelFormProps {
  form: FormInstance<any>;
  record: LLMModelForm_record$key | null;
  connections: LLMModelForm_connections$key;
  onSubmit?: (values: any) => void;
}

const defaultValues = {
  temperature: 0.7,
  contextLength: 32768,
  capabilities: ['TEXT'],
};

function LLMModelForm(props: ILLMModelFormProps) {
  const record = useFragment(fragmentSpec, props.record ?? null);
  const connections = useFragment(connectionFragmentSpec, props.connections);
  const [availableModels, setAvailableModels] = useState<Array<{ id: string, name: string }>>([]);

  const isEditing = useMemo(() => record && record.id ? true : false, [record]);

  // Filter models for LLM (exclude embedding models) - memoized
  const filterLLMModels = useCallback((models: any[] = []) => {
    return models.filter(model =>
      !model.name.toLowerCase().includes('embed') &&
      !model.id.toLowerCase().includes('embed')
    );
  }, []);

  // Handle connection change to update available models - memoized
  const handleConnectionChange = useCallback((connectionId: string) => {
    const selectedConnection = connections.find(c => c.id === connectionId);
    if (selectedConnection && selectedConnection.models) {
      const llmModels = filterLLMModels([...selectedConnection.models]);
      setAvailableModels(llmModels);

      // Auto-select first model if no model is currently selected
      if (llmModels.length > 0 && !props.form.getFieldValue('modelIdentifier')) {
        props.form.setFieldValue('modelIdentifier', llmModels[0].id);
        props.form.setFieldValue('name', humanize(llmModels[0].name));
      }
    } else {
      setAvailableModels([]);
      props.form.setFieldValue('modelIdentifier', undefined);
    }
  }, [connections, props.form, filterLLMModels]);

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

  // Define capability options
  const capabilityOptions = useMemo(() => [
    {
      label: 'Text',
      value: 'TEXT',
      descriptions: ['Process and generate text content']
    },
    {
      label: 'Vision',
      value: 'VISION',
      descriptions: ['Process images and visual content']
    }
  ], []);

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
        ...defaultValues,
        ...record,
      }}
      form={props.form}
      preserve={false}
      layout="vertical"
      onFinish={onFinish}
      name="LLMModelForm"
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
          placeholder="Select an LLM model"
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
        tooltip="Optional display name for the model"
      >
        <Input
          placeholder="e.g., GPT-4 Turbo"
          className="input"
          size="large"
        />
      </Form.Item>

      <Form.Item
        label={<span className="text-sm font-medium text-[var(--color-text-primary)]">Temperature</span>}
        name="temperature"
        rules={[
          {
            required: true,
            message: "Please input temperature!",
          },
        ]}
        extra={<span className="text-xs text-[var(--color-text-tertiary)]">Controls randomness: 0 = focused, 2 = creative</span>}
      >
        <SliderInput
          min={0}
          max={2}
          step={0.1}
          precision={1}
          marks={{
            0: '0',
            0.5: '0.5',
            1.0: '1.0',
            1.5: '1.5',
            2.0: '2.0'
          }}
          placeholder="0.7"
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
            min: 4096,
            max: 128000,
            message: 'Context length must be between 4096 and 128000',
          },
        ]}
        extra={<span className="text-xs text-[var(--color-text-tertiary)]">Maximum tokens the model can process</span>}
      >
        <SliderInput
          min={4096}
          max={128000}
          step={1024}
          marks={{
            4096: '4K',
            8192: '8K',
            16384: '16K',
            32768: '32K',
            65536: '64K',
            98304: '96K',
            128000: '128K'
          }}
          placeholder="32768"
        />
      </Form.Item>

      <Form.Item
        name="capabilities"
        rules={[
          {
            required: true,
            message: "Please select at least one capability!",
          },
        ]}
      >
        <RadioCard
          className="px-1"
          label="Model Capabilities"
          value={props.form.getFieldValue('capabilities') || []}
          onChange={(value) => props.form.setFieldValue('capabilities', value)}
          options={capabilityOptions}
          multiple={true}
        />
      </Form.Item>

      <Form.Item
        label={<span className="text-sm font-medium text-[var(--color-text-primary)]">System Prompt</span>}
        name="systemPrompt"
        tooltip="Default system prompt for the model"
      >
        <Input.TextArea
          placeholder="You are a helpful assistant..."
          autoSize={{ minRows: 3, maxRows: 6 }}
          className="resize-none rounded-lg border-[var(--color-border-default)] focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-100)] transition-all"
        />
      </Form.Item>
    </Form>
  );
};

export default React.memo(LLMModelForm);