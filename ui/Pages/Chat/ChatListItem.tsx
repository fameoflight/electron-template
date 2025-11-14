import React, { useMemo, KeyboardEvent } from 'react';
import { useFragment, graphql } from 'react-relay/hooks';
import { Card, Typography, Tag, Space } from 'antd';
import { MessageOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { formatDistanceToNow } from 'date-fns';

import { ChatListItem_chat$key } from './__generated__/ChatListItem_chat.graphql';

const { Text, Title } = Typography;

const fragmentSpec = graphql`
  fragment ChatListItem_chat on Chat {
    id
    title
    tags
    description
    status
    createdAt
    updatedAt
    llmModel {
      id
      name
      modelIdentifier
    }
  }
`;

// Helpers kept out of the component to avoid recreating on each render
const getStatusColor = (status?: string) => {
  switch (status) {
    case 'active':
      return 'green';
    case 'archived':
      return 'default';
    default:
      return 'blue';
  }
};

const truncate = (value?: string, maxLength = 60) => {
  if (!value) return '';
  return value.length <= maxLength ? value : `${value.substring(0, maxLength)}…`;
};

const safeFormatDistanceToNow = (value?: string | null) => {
  try {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return '';
  }
};

interface IChatListItemProps {
  chat: ChatListItem_chat$key;
  onClick?: () => void;
  className?: string;
}

const ChatListItem: React.FC<IChatListItemProps> = ({ chat: chatKey, onClick, className }) => {
  const chat = useFragment(fragmentSpec, chatKey);

  console.log('Rendering ChatListItem for chat:', chat);

  const statusColor = useMemo(() => getStatusColor(chat?.status), [chat?.status]);
  const updatedAtText = useMemo(() => safeFormatDistanceToNow(chat?.updatedAt), [chat?.updatedAt]);
  const titleText = useMemo(() => chat?.title || 'New Chat', [chat?.title]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Card
      hoverable
      className={` cursor-pointer transition-all duration-200  ${className || ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
      bodyStyle={{ padding: 16 }}
      aria-label={`Chat ${titleText}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Title level={5} className="mb-0 truncate">
              {titleText}
            </Title>

            {chat?.status && (
              <Tag color={statusColor} aria-label={`status-${chat.status}`}>
                {chat.status}
              </Tag>
            )}
          </div>

          {chat?.description ? (
            <Text type="secondary" className="block mb-2 truncate">
              {truncate(chat.description, 100)}
            </Text>
          ) : null}

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <Space size="small" className="truncate">
              <MessageOutlined />
              <span className="truncate">Chat conversation</span>
            </Space>

            <Space size="small" className="truncate">
              <ClockCircleOutlined />
              <span>{updatedAtText || '—'}</span>
            </Space>
          </div>

          {chat?.llmModel?.name && (
            <div className="text-xs text-gray-500 mt-2 truncate">
              Model: <Text code>{chat.llmModel.name}</Text>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default React.memo(ChatListItem);