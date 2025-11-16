import { useState, useCallback } from 'react';
import { graphql } from 'react-relay/hooks';
import { notification } from 'antd';
import { useCompatMutation } from "@ui/hooks/relay";

import type { useSimpleMessageInput_SendMessageMutation } from "./__generated__/useSimpleMessageInput_SendMessageMutation.graphql";

const SendMessageMutation = graphql`
  mutation useSimpleMessageInput_SendMessageMutation($input: SendMessageInput!) {
    sendMessage(input: $input) {
      id
      role
      createdAt
      chat {
        id
      }
    }
  }
`;

interface LLMModel {
  id: string;
  name?: string | null;
  capabilities: readonly string[] | null | undefined;
}

export function useSimpleMessageInput() {
  const [isSending, setIsSending] = useState(false);
  const [commitSendMessage] = useCompatMutation<useSimpleMessageInput_SendMessageMutation>(
    SendMessageMutation
  );

  const sendMessage = useCallback(async (
    messageContent: string,
    llmModel: LLMModel,
    attachmentIds: string[] = [],
    onComplete?: (chatId: string) => void,
    options?: {
      chatId?: string;
      systemPrompt?: string;
    }
  ) => {
    if (!messageContent.trim() || isSending) return;

    // Check if model supports vision when there are attachments
    const supportsVision = llmModel?.capabilities?.includes('VISION') || false;
    if (attachmentIds.length > 0 && !supportsVision) {
      notification.error({
        message: 'Model does not support vision',
        description: 'Please select a model with vision capability to attach images.'
      });
      return;
    }

    setIsSending(true);
    try {
      const input: any = {
        content: messageContent.trim(),
        llmModelId: llmModel.id
      };

      if (options?.chatId) {
        // Reply mode
        input.chatId = options.chatId;
      } else {
        // New chat mode
        input.systemPrompt = options?.systemPrompt || 'You are a helpful assistant...';
      }

      if (attachmentIds.length > 0) {
        input.attachmentIds = attachmentIds;
      }

      await commitSendMessage({
        variables: { input },
        onCompleted: (response) => {
          if (response?.sendMessage?.chat?.id && onComplete) {
            onComplete(response.sendMessage.chat.id);
          }
        },
        onError: (error) => {
          notification.error({
            message: 'Failed to send message',
            description: error.message
          });
        }
      });

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  }, [isSending, commitSendMessage]);

  return [sendMessage, isSending] as const;
}