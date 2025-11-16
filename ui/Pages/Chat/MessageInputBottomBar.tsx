import React, { useState, useEffect, useCallback } from 'react';
import _ from 'lodash';
import { Form, Button } from 'antd';
import { PaperClipIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { Upload } from 'antd';

import LLMModelSelect from "@ui/Pages/Chat/LLMModelSelect";

import { useFragment, graphql } from "react-relay/hooks";

import { MessageInputBottomBar_models$data, MessageInputBottomBar_models$key } from "./__generated__/MessageInputBottomBar_models.graphql";
import { UploadResult, useUploadFiles } from '@ui/hooks/useUploadFiles';

const fragmentSpec = graphql`
  fragment MessageInputBottomBar_models on LLMModel @relay(plural: true) {
    id
    name
    capabilities
    updatedAt
    systemPrompt
    ...LLMModelSelect_records
}`;



export type InputLLMModel = MessageInputBottomBar_models$data[0];

interface MessageInputBottomBarProps {
  llmModels: MessageInputBottomBar_models$key;
  isSending: boolean;
  disabled: boolean;
  onFileAdded: (results: UploadResult[]) => void;
  onSend: () => void;
  onModelChange?: (model: InputLLMModel | null) => void;
}

function MessageInputBottomBar(props: MessageInputBottomBarProps) {
  const llmModels = useFragment(fragmentSpec, props.llmModels);
  const [selectedModel, setSelectedModel] = useState<InputLLMModel | null>(null);
  const { uploadFiles, isUploading: isFileUploading } = useUploadFiles();

  const handleFileUpload = useCallback(async (files: File[]) => {
    uploadFiles(files, {
      showNotifications: true,
      onComplete: (results) => {
        props.onFileAdded(results);
      },
    });
  }, [props.onFileAdded]);

  // Set default model on mount
  useEffect(() => {
    if (selectedModel === null) {
      const defaultModel = _.first(_.sortBy(llmModels, 'updatedAt'));
      setSelectedModel(defaultModel || null);
    }
  }, [llmModels]);

  // Notify parent of model changes
  useEffect(() => {
    props.onModelChange?.(selectedModel);
  }, [selectedModel, props.onModelChange]);

  // Check if selected model supports vision
  const supportsVision = selectedModel?.capabilities?.includes('VISION') || false;

  return (
    <div className="border-t border-border-default bg-(--color-background-secondary) px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Attachment Button */}
        <Upload
          multiple
          accept="image/*"
          beforeUpload={(file, fileList) => {
            handleFileUpload(fileList);
            return false;
          }}
          disabled={!supportsVision}
          showUploadList={false}
        >
          <Button
            disabled={!supportsVision}
            type="text"
            className={`h-10 w-10 flex items-center justify-center rounded-lg ${supportsVision
              ? 'text-text-secondary hover:text-primary-600 hover:bg-primary-50'
              : 'text-text-tertiary cursor-not-allowed opacity-50'
              }`}
            title={!supportsVision ? "Selected model does not support images" : "Attach images"}
            style={{ padding: 0 }}
          >
            <PaperClipIcon className="w-5 h-5" style={{ strokeWidth: 2.2 }} />
          </Button>
        </Upload>

        {/* Right: Model Select + Send Button */}
        <div className="flex items-center justify-between gap-2">
          <LLMModelSelect
            records={llmModels}
            placeholder="Select model"
            showSearch={false}
            disabled={llmModels.length === 0}
            className="min-w-48"
          />

          <Button
            type="primary"
            onClick={props.onSend}
            disabled={props.disabled}
            loading={props.isSending}
            icon={<PaperAirplaneIcon className="w-4 h-4" />}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

export default MessageInputBottomBar;
