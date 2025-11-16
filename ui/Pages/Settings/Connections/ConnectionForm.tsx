import React, { useEffect, useState } from "react";
import _ from "lodash";
import { Form, Input, Button, FormInstance, Select, message } from "antd";
import { useFragment, graphql } from "react-relay/hooks";
import { ConnectionForm_record$key } from "./__generated__/ConnectionForm_record.graphql";
import { PROVIDER_PRESETS } from "./utils";
import DictionaryInput from "@ui/Components/DictionaryInput";

const fragmentSpec = graphql`
  fragment ConnectionForm_record on Connection {
    id
    name
    apiKey
    baseUrl
    provider
    kind
    customHeaders
  }
`;

interface IConnectionFormProps {
  form: FormInstance<any>;
  record: ConnectionForm_record$key | null;
  onSubmit?: (values: any) => void;
}

function ConnectionForm(props: IConnectionFormProps) {
  const record = useFragment(fragmentSpec, props.record ?? null);

  const isEditing = record && record.id ? true : false;

  const handleProviderChange = (newProvider: string, oldProvider?: string) => {
    const selectedProvider = PROVIDER_PRESETS[newProvider as keyof typeof PROVIDER_PRESETS];
    if (selectedProvider) {
      // Try setting fields individually
      props.form.setFieldValue('baseUrl', selectedProvider.baseUrl);
      props.form.setFieldValue('kind', selectedProvider.kind);

      // if name is empty or set to a previous provider name, update it
      const currentName = props.form.getFieldValue('name');

      if (!currentName || _.startsWith(currentName, oldProvider)) {
        props.form.setFieldValue('name', selectedProvider.name);
      }

      // Force form re-render
      props.form.validateFields();
    }
  };

  const onFinish = (values: any) => {
    // Transform kind to uppercase to match GraphQL enum
    const transformedValues = {
      ...values,
      kind: values.kind ? values.kind.toUpperCase() : values.kind,
    };
    props.onSubmit?.(transformedValues);
  };


  const handleFormValuesChange = (changedValues: any, allValues: any) => {
    if (changedValues.provider) {
      handleProviderChange(changedValues.provider, record?.provider || undefined);
    }
  };

  return (
    <Form
      initialValues={record || undefined}
      form={props.form}
      preserve={false}
      layout="vertical"
      onFinish={onFinish}
      name="ConnectionForm"
      onValuesChange={handleFormValuesChange}
      className="space-y-6"
    >
      <Form.Item name="id" hidden>
        <Input />
      </Form.Item>

      <Form.Item
        label={<span className="text-sm font-medium text-primary">Provider</span>}
        name="provider"
        rules={[
          {
            required: true,
            message: "Please select a provider!",
          },
        ]}
      >
        <Select
          disabled={isEditing}
          placeholder="Select a provider"
          allowClear
          className="input"
          size="large"
        >
          {Object.entries(PROVIDER_PRESETS).map(([key, provider]) => (
            <Select.Option key={key} value={key}>
              {provider.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label={<span className="text-sm font-medium text-primary">Name</span>}
        name="name"
        rules={[
          {
            required: true,
            message: "Please input name!",
          },
        ]}
      >
        <Input
          placeholder="My OpenAI Connection"
          className="input"
          size="large"
        />
      </Form.Item>

      <Form.Item
        label={<span className="text-sm font-medium text-primary">Base URL</span>}
        name="baseUrl"
        rules={[
          {
            required: true,
            message: "Please input Base URL!",
          },
        ]}
      >
        <Input
          disabled={isEditing}
          placeholder="https://api.openai.com/v1"
          className="input"
          size="large"
        />
      </Form.Item>

      <Form.Item
        label={<span className="text-sm font-medium text-primary">API Key</span>}
        name="apiKey"
        rules={[
          {
            required: true,
            message: "Please input API Key!",
          },
        ]}
        extra={<span className="text-xs text-tertiary">Your API key will be stored securely</span>}
      >
        <Input.Password
          placeholder="sk-..."
          className="input"
          size="large"
        />
      </Form.Item>

      <Form.Item
        label={<span className="text-sm font-medium text-primary">Custom Headers</span>}
        name="customHeaders"
        tooltip="Add custom HTTP headers that will be sent with each request"
      >
        <DictionaryInput
          placeholder={{
            key: 'Header name',
            value: 'Header value'
          }}
        />
      </Form.Item>

      <Form.Item
        label="Kind"
        name="kind"
        hidden
      >
        <Input />
      </Form.Item>
    </Form>
  );
};

export default ConnectionForm;