import React, { useEffect, useRef } from 'react';
import { useFragment, graphql } from 'react-relay/hooks';
import { Typography, Space, Spin, Tag } from 'antd';
import { RobotOutlined } from '@ant-design/icons';

import { MessageList_messages$key, MessageList_messages$data } from './__generated__/MessageList_messages.graphql';
import { UserMessageView, AssistantMessageView } from '@ui/Pages/Chat/MessageVersionView';

const { Text } = Typography;

const fragmentSpec = graphql`
  fragment MessageList_messages on Message @relay(plural: true) {
    id
    role
    createdAt
    updatedAt
    currentVersionId
    versions {
      id
      content
      createdAt
      ...MessageVersionView_record
    }
  }
`;

type MessageItem = MessageList_messages$data[0];

interface IMessageListProps {
  messages: MessageList_messages$key;
}

function MessageList(props: IMessageListProps) {
  const messages = useFragment(fragmentSpec, props.messages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-2 py-4 bg-gradient-to-b from-gray-50 to-gray-100"
    >
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center space-y-2">
            <RobotOutlined className="text-5xl mb-2 text-gray-300" />
            <p className="text-base font-medium">Start a conversation by sending a message below</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {messages.map((message: MessageItem) => {
          const currentVersion = message.versions.find(v => v.id === message.currentVersionId) || message.versions[0];

          return (
            <div key={message.id}>
              {message.role === 'user' ? (
                <UserMessageView messageVersion={currentVersion} />
              ) : (
                <AssistantMessageView messageVersion={currentVersion} />
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

export default MessageList;
