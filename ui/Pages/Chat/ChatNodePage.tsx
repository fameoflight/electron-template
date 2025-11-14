import React, { useState, useCallback } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { graphql } from 'react-relay/hooks';
import { message, Spin, Typography } from "antd";
import { ArrowLeftCircleIcon } from "@heroicons/react/24/outline";

import type { ChatNodePageQuery, ChatNodePageQuery$data } from "./__generated__/ChatNodePageQuery.graphql";
import usePollQuery from "@ui/hooks/usePollQuery";
import PageContainer from "@ui/Components/PageContainer";
import MessageList from "@ui/Pages/Chat/MessageList";
import UnifiedMessageInput from "@ui/Pages/Chat/UnifiedMessageInput";

const { Title } = Typography;

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
      currentVersion {
        id
        status
        content
      }
      createdAt
      updatedAt
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
        // Poll more frequently when there's a streaming message
        const typedData = data as ChatNodePageQuery$data;
        const hasStreamingMessage = typedData.chatMessages?.some(
          (msg) => msg.currentVersion?.status === 'streaming' || msg.currentVersion?.status === 'pending'
        );
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

  const handleBackToList = () => {
    navigate('/chat');
  };

  if (!id) {
    return (
      <PageContainer
        title="Chat"
        extra={{
          title: 'Back to Chats',
          onClick: handleBackToList,
          icon: <ArrowLeftCircleIcon className="h-5 w-5" />
        }}
      >
        <div className="text-center py-8">
          <Title level={4}>Invalid chat ID</Title>
        </div>
      </PageContainer>
    );
  }

  const chat = chatData?.chat;
  const messages = chatData?.chatMessages || [];
  const hasStreamingMessage = messages.some(
    (msg) => msg.currentVersion?.status === 'streaming' || msg.currentVersion?.status === 'pending'
  );

  if (!chat && !isAutoRefreshing) {
    return (
      <PageContainer
        title="Chat"
        extra={{
          title: 'Back to Chats',
          onClick: handleBackToList,
          icon: <ArrowLeftCircleIcon className="h-5 w-5" />
        }}
      >
        <div className="text-center py-8">
          <Title level={4}>Chat not found</Title>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={chat?.title || 'Loading...'}
      extra={{
        title: 'Back to Chats',
        onClick: handleBackToList,
        icon: <ArrowLeftCircleIcon className="h-5 w-5" />
      }}
    >
      <div className="flex flex-col h-full">
        <div className="mb-6">
          <div className="bg-white/60 dark:bg-gray-900/50 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                {chat?.description && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed truncate">
                    {chat.description}
                  </p>
                )}


                {chat?.tags && chat.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {chat.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100/80 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Spin spinning={!chat}>
        <div className="flex flex-col">
          <MessageList
            messages={messages}
          />

          {/* Message Input */}
          <UnifiedMessageInput
            chatId={id}
            onComplete={handleSendMessage}
          />
        </div>
      </Spin>
    </PageContainer >
  );
};

export default ChatNodePage;