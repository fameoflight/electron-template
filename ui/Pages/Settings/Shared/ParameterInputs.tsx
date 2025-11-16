import React from 'react';
import { Form, Input } from 'antd';
import SliderInput from '@ui/Components/SliderInput';
import RadioCard from '@ui/Components/RadioCard';

interface IParameterInputsProps {
  modelType: 'llm' | 'embedding';
}

function ParameterInputs(props: IParameterInputsProps) {
  const { modelType } = props;

  const renderLLMParameters = () => (
    <>
      <Form.Item
        label={<span className="text-sm font-medium text-primary">Temperature</span>}
        name="temperature"
        rules={[
          {
            required: true,
            message: "Please input temperature!",
          },
        ]}
        extra={<span className="text-xs text-tertiary">Controls randomness: 0 = focused, 2 = creative</span>}
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
        label={<span className="text-sm font-medium text-primary">Context Length</span>}
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
        extra={<span className="text-xs text-tertiary">Maximum tokens the model can process</span>}
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
          options={[
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
          ]}
          multiple={true}
        />
      </Form.Item>
    </>
  );

  const renderEmbeddingParameters = () => (
    <>
      <Form.Item
        label={<span className="text-sm font-medium text-primary">Context Length</span>}
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
        extra={<span className="text-xs text-tertiary">Maximum tokens for embeddings</span>}
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
        label={<span className="text-sm font-medium text-primary">Max Batch Size</span>}
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
        extra={<span className="text-xs text-tertiary">Number of texts to embed at once</span>}
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
    </>
  );

  return (
    <>
      {modelType === 'llm' ? renderLLMParameters() : renderEmbeddingParameters()}

      <Form.Item
        label={<span className="text-sm font-medium text-primary">System Prompt</span>}
        name="systemPrompt"
        tooltip={modelType === 'llm' ? "Default system prompt for the model" : "Optional default system prompt for the embedding model"}
      >
        <Input.TextArea
          placeholder={modelType === 'llm' ? "You are a helpful assistant..." : "Enter system prompt..."}
          autoSize={{ minRows: 3, maxRows: 6 }}
          className="resize-none rounded-lg border-border-default focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all"
        />
      </Form.Item>
    </>
  );
}

export default React.memo(ParameterInputs);