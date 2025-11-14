import React, { useState, useRef, useCallback } from 'react';
import { graphql } from 'react-relay/hooks';
import { Button, Form, Upload, Input } from 'antd';
import { SendOutlined, PaperClipOutlined, LoadingOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';

import LLMModelSelect from "@ui/Pages/Chat/LLMModelSelect";
import AutoResizeTextarea, { AutoResizeTextareaRef } from '@ui/Components/AutoResizeTextarea';
import { useNetworkLazyReloadQuery } from "@ui/hooks/relay";
import { useUploadFiles } from "@ui/hooks/useUploadFiles";
import { useSimpleMessageInput } from "@ui/hooks/useSimpleMessageInput";
import type { UnifiedMessageInputQuery } from "./__generated__/UnifiedMessageInputQuery.graphql";

interface LLMModel {
  id: string;
  name?: string | null;
  capabilities: readonly string[] | null | undefined;
}

interface IUnifiedMessageInputProps {
  /** Optional chat ID - if not provided, creates new chat */
  chatId?: string;
  onComplete: (chatId: string) => void;
}

const UnifiedMessageInputQuery = graphql`
  query UnifiedMessageInputQuery {
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
      ...LLMModelSelect_records
    }
  }
`;

function UnifiedMessageInput({
  chatId,
  onComplete,
}: IUnifiedMessageInputProps) {
  const [form] = Form.useForm();
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const textareaRef = useRef<AutoResizeTextareaRef>(null);

  const [sendMessage, isSending] = useSimpleMessageInput();

  const [data] = useNetworkLazyReloadQuery<UnifiedMessageInputQuery>(
    UnifiedMessageInputQuery,
    {}
  );

  const { uploadFiles, isUploading: isFileUploading } = useUploadFiles();

  const llmModels = data?.lLMModelsArray ?? [];
  const isNewChatMode = !chatId;

  const selectedModel = llmModels.find(model => model.id === form.getFieldValue('llmModelId'));
  const supportsVision = selectedModel?.capabilities?.includes('VISION') || false;

  const handleFileUpload = useCallback(async (files: File[]) => {
    try {
      const fileIds = await uploadFiles(files, {
        showNotifications: true,
        onComplete: (results) => {
          console.log('File upload results:', results);
          const successfulUploads = results.filter(r => r.fileId !== null);
          console.log(`Successfully uploaded ${successfulUploads.length}/${results.length} files`);
        },
      });

      if (fileIds.length > 0) {
        const currentAttachmentIds = form.getFieldValue('attachmentIds') || [];
        form.setFieldValue('attachmentIds', [...currentAttachmentIds, ...fileIds]);

        // Add to uploaded files for UI display
        const newFiles: UploadFile[] = files.map(file => ({
          uid: `${Date.now()}-${Math.random()}`,
          name: file.name,
          status: 'done' as any,
          url: URL.createObjectURL(file),
          originFileObj: file as any,
          fileId: fileIds[files.indexOf(file)]
        }));
        setUploadedFiles(prev => [...prev, ...newFiles]);
      }

    } catch (error) {
      console.error('File upload error:', error);
    }
  }, [uploadFiles, form]);

  const handleRemoveFile = useCallback((file: UploadFile) => {
    setUploadedFiles(prev => prev.filter(f => f.uid !== file.uid));

    // Remove from form attachmentIds
    const currentAttachmentIds = form.getFieldValue('attachmentIds') || [];
    const updatedAttachmentIds = currentAttachmentIds.filter((id: string) => id !== (file as any).fileId);
    form.setFieldValue('attachmentIds', updatedAttachmentIds);
  }, [form]);

  const handleSend = useCallback(async () => {
    const messageContent = form.getFieldValue('message') || '';
    if (!messageContent.trim() || isSending || !selectedModel) return;

    try {
      await sendMessage(
        messageContent,
        selectedModel,
        form.getFieldValue('attachmentIds') || [],
        {
          chatId,
          title: isNewChatMode ? 'New Chat' : undefined,
          systemPrompt: isNewChatMode ? form.getFieldValue('systemPrompt') || selectedModel.systemPrompt : undefined,
          onComplete
        }
      );

      // Reset form on successful send
      form.resetFields();
      setUploadedFiles([]);
      if (textareaRef.current) {
        textareaRef.current.setValue('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [isSending, selectedModel, chatId, sendMessage, onComplete, form, isNewChatMode, textareaRef]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleValuesChange = useCallback((changedValues: any) => {
    if (changedValues.llmModelId && isNewChatMode) {
      const newModel = llmModels.find(model => model.id === changedValues.llmModelId);
      if (newModel && !form.getFieldValue('systemPrompt')) {
        form.setFieldValue('systemPrompt', newModel.systemPrompt);
      }
    }
  }, [llmModels, isNewChatMode, form]);

  const isSendDisabled = isSending || !selectedModel;

  return (
    <div className="w-full bg-card px-2 py-4 mb-4">
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
      >
        <Form.Item name="attachmentIds" hidden>
          <Input />
        </Form.Item>
        {/* New Chat Specific Fields */}
        {isNewChatMode && (
          <>
            <div className="mb-2">
              <Button
                type="link"
                onClick={() => setShowAdvanced(v => !v)}
                aria-expanded={showAdvanced}
                aria-controls="system-prompt-panel"
                size="small"
              >
                {showAdvanced ? "Hide advanced options" : "Show advanced options"}
              </Button>
            </div>

            <Form.Item
              label="System Prompt (Optional)"
              name="systemPrompt"
              tooltip="Custom instructions for the AI to follow in this conversation"
              hidden={!showAdvanced}
              wrapperCol={{}}
            >
              <Input.TextArea
                placeholder="You are a helpful assistant..."
                autoSize={{ minRows: 2, maxRows: 4 }}
                className="resize-none"
              />
            </Form.Item>
          </>
        )}

        {/* File Attachments Display */}
        {uploadedFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {uploadedFiles.map(file => (
              <div
                key={file.uid}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md border"
              >
                <span className="text-sm truncate max-w-32">{file.name}</span>
                <Button
                  type="text"
                  size="small"
                  onClick={() => handleRemoveFile(file)}
                  className="p-0 h-auto min-w-0"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Message Input with Bottom Bar */}
        <div className="relative">
          <Form.Item name="message">
            <AutoResizeTextarea
              ref={textareaRef}
              onKeyDown={handleKeyDown}
              placeholder={isNewChatMode ? "What would you like to talk about?" : "Type your message..."}
              minHeight={48}
              autoResize
              className="w-full pb-14 rounded-md border border-gray-200 bg-white text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow shadow-sm"
              containerClassName="w-full"
            />
          </Form.Item>

          {/* Bottom Bar */}
          <div
            className="absolute bottom-2 left-0 right-0 flex items-center justify-between px-3 py-2 bg-white/90 backdrop-blur-sm border border-t border-gray-100 rounded-b-md shadow-sm"
            role="toolbar"
            aria-label="message actions"
          >
            {/* Left: Attachment Icon */}
            <div className="flex items-center gap-2">
              <Upload
                multiple
                accept="image/*"
                beforeUpload={(file) => {
                  handleFileUpload([file]);
                  return false; // Prevent default upload behavior
                }}
                disabled={!supportsVision}
                showUploadList={false}
              >
                <Button
                  type="text"
                  icon={<PaperClipOutlined />}
                  disabled={!supportsVision}
                  className="flex items-center justify-center p-1 text-base text-gray-600 hover:text-primary"
                  title={!supportsVision ? "Selected model does not support images" : "Attach images"}
                />
              </Upload>

              {/* small hint or count */}
              {uploadedFiles.length > 0 && (
                <div className="text-sm text-gray-600">
                  {uploadedFiles.length} attached
                </div>
              )}
            </div>

            {/* Right: Model Select (new chat only) + Send Button */}
            <div className="flex items-center gap-2">
              <Form.Item
                name="llmModelId"
                className="mb-0"
                style={{ margin: 0 }}
              >
                <LLMModelSelect
                  records={llmModels}
                  placeholder="Model"
                  showSearch={false}
                  disabled={llmModels.length === 0}
                  style={{ width: 256 }}
                />
              </Form.Item>

              <Button
                type="primary"
                icon={isSending ? <LoadingOutlined /> : <SendOutlined />}
                onClick={handleSend}
                disabled={isSendDisabled}
                className="flex items-center rounded-md px-4 py-1.5"
                aria-label={isNewChatMode ? 'Start chat' : 'Send message'}
              >
                {isSending ? 'Sending...' : isNewChatMode ? 'Start Chat' : 'Send'}
              </Button>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-2 text-xs text-muted-foreground text-right">
          Press <span className="font-medium">Enter</span> to send, <span className="font-medium">Shift+Enter</span> for new line
        </div>
      </Form>
    </div>
  );
}

export default UnifiedMessageInput;