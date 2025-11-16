import React, { useState, useCallback } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { graphql } from 'react-relay/hooks';
import { motion } from '@ui/Components/Motion';
import { TagIcon } from "@heroicons/react/24/outline";

import type { ChatNodePageQuery, ChatNodePageQuery$data } from "./__generated__/ChatNodePageQuery.graphql";
import usePollQuery from "@ui/hooks/usePollQuery";
import MessageList from "@ui/Pages/Chat/MessageList";
import UnifiedMessageInput from "@ui/Pages/Chat/MessageInput";

type MessageType = ChatNodePageQuery$data['chatMessages'][0];

// Helper function to check if a message is currently streaming
const isMessageStreaming = (message: MessageType): boolean => {
  const currentVersion = message.versions?.find(v => v.id == message.currentVersionId || v.modelId == message.currentVersionId);

  return currentVersion?.status === 'streaming' || currentVersion?.status === 'pending';
};

const ChatNodePageQuery = graphql`
  query ChatNodePageQuery($id: String!) {
    chat(id: $id) {
      id
      title
      description
      tags
      status
      createdAt
      updatedAt
      llmModel {
        id
        name
        modelIdentifier
      }
    }
    chatMessages(chatId: $id) {
      id
      role
      currentVersionId
      createdAt
      updatedAt
      versions {
        id
        status
        modelId
      }
      ...MessageList_messages
    }
  }
`;



function ChatNodePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Use polling for real-time updates when we have a streaming message
  const [chatData, refreshChatData, isAutoRefreshing] = usePollQuery<ChatNodePageQuery>(
    ChatNodePageQuery,
    { id: id! },
    {
      enabled: !!id,
      deriveRefreshInterval: (data) => {
        const hasStreamingMessage = data.chatMessages?.some(isMessageStreaming);
        return hasStreamingMessage ? 100 : 1000;
      },
      defaultInterval: 1000,
      maxInterval: 1000,
      minInterval: 100,
    }
  );

  const handleSendMessage = async (chatId: string) => {
    refreshChatData(); // Immediately refresh to show the new messages
  };

  if (!id) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            Invalid chat ID
          </h2>
          <p className="text-text-secondary">
            The chat you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const chat = chatData?.chat;
  const messages = chatData?.chatMessages || [];

  if (!chat && !isAutoRefreshing) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            Chat not found
          </h2>
          <p className="text-text-secondary">
            This chat may have been deleted or you don't have access to it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Description Card - only show if description or tags exist */}
      {(chat?.description || (chat?.tags && chat.tags.length > 0)) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 sm:px-6 lg:px-8 pt-4"
        >
          <div className="mx-auto">
            <div className="surface-elevated p-4 rounded-xl border border-border-default">
              {chat?.description && (
                <p className="text-sm text-text-secondary leading-relaxed">
                  {chat.description}
                </p>
              )}

              {chat?.tags && chat.tags.length > 0 && (
                <div className={`flex flex-wrap gap-2 ${chat?.description ? 'mt-3' : ''}`}>
                  {chat.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200"
                    >
                      <TagIcon className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Message List */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          chatId={id}
          messages={messages}
        />
      </div>

      {/* Message Input - Fixed at bottom */}
      <div className="px-4 sm:px-6 lg:px-8 pb-4">
        <div className="mx-auto">
          <UnifiedMessageInput
            chatId={id}
            onComplete={handleSendMessage}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatNodePage;