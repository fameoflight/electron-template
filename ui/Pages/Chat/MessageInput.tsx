import React, { useState, useRef, useCallback, useEffect } from 'react';
import _, { set } from 'lodash';
import { graphql } from 'react-relay/hooks';
import { Form, Input } from 'antd';
import { motion, AnimatePresence } from '@ui/Components/Motion';
import {
  PaperClipIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

import AutoResizeTextarea, { AutoResizeTextareaRef } from '@ui/Components/AutoResizeTextarea';
import MessageInputBottomBar, { InputLLMModel } from '@ui/Pages/Chat/MessageInputBottomBar';
import { useNetworkLazyReloadQuery } from "@ui/hooks/relay";
import { UploadResult } from "@ui/hooks/useUploadFiles";
import { useSimpleMessageInput } from "@ui/hooks/useSimpleMessageInput";
import type { MessageInputQuery } from "./__generated__/MessageInputQuery.graphql";


interface IMessageInputProps {
  /** Optional chat ID - if not provided, creates new chat */
  chatId?: string;
  onComplete: (chatId: string) => void;
}

const MessageInputQuery = graphql`
  query MessageInputQuery {
    currentUser {
      id
    }
    lLMModelsArray {
      id
      name
      modelIdentifier
      systemPrompt
      default
      capabilities
      ...MessageInputBottomBar_models
    }
  }
`;

function MessageInput(props: IMessageInputProps) {
  const [form] = Form.useForm();
  const [model, setModel] = useState<InputLLMModel | null>(null);
  const [uploadResults, setFiles] = useState<UploadResult[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const textareaRef = useRef<AutoResizeTextareaRef>(null);

  const [sendMessage, isSending] = useSimpleMessageInput();

  const [data] = useNetworkLazyReloadQuery<MessageInputQuery>(
    MessageInputQuery,
    {}
  );


  const llmModels = data?.lLMModelsArray ?? [];
  const isNewChatMode = !props.chatId;

  const handleRemoveFile = useCallback((result: UploadResult) => {
    setFiles(prev => prev.filter(f => f.file !== result.file));
  }, [form]);

  const handleSend = useCallback(async () => {
    const messageContent = form.getFieldValue('message') || '';

    if (!messageContent.trim() || isSending || !model) return;

    const systemPrompt = form.getFieldValue('systemPrompt') || undefined;

    const fileIds = _.compact(uploadResults.map(f => f.uploadedFile?.id));

    try {
      sendMessage(
        messageContent,
        model,
        fileIds,
        props.onComplete,
        {
          chatId: props.chatId,
          systemPrompt: systemPrompt,
        }
      );

      // Reset form on successful send
      form.resetFields();
      setFiles([]);
      if (textareaRef.current) {
        textareaRef.current.setValue('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [isSending, model, props, sendMessage, form, isNewChatMode, textareaRef]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  useEffect(() => {
    const defaultSystemPrompt = 'You are a helpful assistant.';

    const currentSystemPrompt = form.getFieldValue('systemPrompt');

    if (model?.systemPrompt) {
      form.setFieldValue('systemPrompt', model.systemPrompt);
    }

    if (_.isEmpty(currentSystemPrompt)) {
      form.setFieldValue('systemPrompt', defaultSystemPrompt);
    }

  }, [model, form]);


  const isSendDisabled = isSending || !model;

  return (
    <div className="w-full">


      {/* New Chat Specific Fields */}
      {isNewChatMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <button
            type="button"
            onClick={() => setShowAdvanced(v => !v)}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary-600 transition-colors mb-3"
          >
            {showAdvanced ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
            <span className="font-medium">
              {showAdvanced ? "Hide advanced options" : "Show advanced options"}
            </span>
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Form.Item
                  label={
                    <span className="text-sm font-medium text-text-primary">
                      System Prompt (Optional)
                    </span>
                  }
                  name="systemPrompt"
                  tooltip="Custom instructions for the AI to follow in this conversation"
                >
                  <Input.TextArea
                    placeholder="You are a helpful assistant..."
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    className="rounded-lg border-border-default focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all"
                  />
                </Form.Item>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* File Attachments Display */}
      <AnimatePresence>
        {uploadResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 flex flex-wrap gap-2"
          >
            {uploadResults.map((uploadResult, index) => (
              <motion.div
                key={`attached-file-${uploadResult.file.name}-${index}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-2 px-3 py-2 bg-surface border border-border-default rounded-lg shadow-xs"
              >
                <PaperClipIcon className="w-4 h-4 text-text-tertiary" />
                <span className="text-sm text-text-primary truncate max-w-32">
                  {uploadResult.file.name}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(uploadResult)}
                  className="p-1 rounded-md hover:bg-error-50 text-text-tertiary hover:text-error-600 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <Form
        form={form}
        layout="vertical"
      >
        {/* Message Input Container */}
        <div className="surface-elevated rounded-xl shadow-md border border-border-default overflow-hidden">
          {/* Textarea */}
          <div className="relative">
            <Form.Item name="message" className="mb-0">
              <AutoResizeTextarea
                ref={textareaRef}
                onKeyDown={handleKeyDown}
                placeholder={isNewChatMode ? "What would you like to talk about?" : "Type your message..."}
                minHeight={56}
                autoResize
                className="w-full px-3 py-2 pb-10 bg-transparent border-0 text-base text-text-primary placeholder:text-text-tertiary resize-none focus:outline-none focus:border-0 focus:ring-0"
                containerClassName="w-full"
              />
            </Form.Item>
          </div>

          {/* Bottom Bar */}
          <MessageInputBottomBar
            llmModels={llmModels}
            isSending={isSending}
            disabled={isSendDisabled}
            onFileAdded={(results: UploadResult[]) => {
              setFiles(prev => [...prev, ...results]);
            }}
            onSend={handleSend}
            onModelChange={setModel}
          />
        </div>

        {/* Help Text */}
        <div className="mt-2 text-xs text-text-tertiary text-center">
          Press <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border-default text-text-secondary font-mono text-xs">Enter</kbd> to send,
          <kbd className="ml-1 px-1.5 py-0.5 rounded bg-surface border border-border-default text-text-secondary font-mono text-xs">Shift+Enter</kbd> for new line
        </div>
      </Form>
    </div>
  );
}

export default MessageInput;