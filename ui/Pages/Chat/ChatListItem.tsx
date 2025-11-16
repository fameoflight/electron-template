import React, { useMemo, KeyboardEvent } from 'react';
import { useFragment, graphql } from 'react-relay/hooks';
import { motion } from '@ui/Components/Motion';
import { ChatBubbleLeftRightIcon, ClockIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

import { ChatListItem_chat$key } from './__generated__/ChatListItem_chat.graphql';
import { useChatStreamingStatus } from './useChatStreamingStatus';

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
const getStatusStyle = (status?: string) => {
  switch (status) {
    case 'active':
      return {
        bg: 'bg-success-50',
        text: 'text-success-700',
        border: 'border-success-200',
      };
    case 'archived':
      return {
        bg: 'bg-text-tertiary/10',
        text: 'text-text-secondary',
        border: 'border-border-default',
      };
    default:
      return {
        bg: 'bg-primary-50',
        text: 'text-primary-700',
        border: 'border-primary-200',
      };
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
  const { isStreaming } = useChatStreamingStatus(chat?.id || null);

  const statusStyle = useMemo(() => getStatusStyle(chat?.status), [chat?.status]);
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
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={`h-full ${className || ''}`}
    >
      <div
        onClick={onClick}
        onKeyDown={handleKeyDown}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        aria-label={`Chat ${titleText}`}
        className="surface-elevated p-6 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg h-full flex flex-col relative overflow-hidden group"
      >
        {/* Top Accent Bar - appears on hover */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Icon */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 transition-all duration-300 group-hover:from-primary-100 group-hover:to-primary-200 relative">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-primary-600" />

            {/* Streaming indicator - pulsing dot */}
            {isStreaming && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
              </span>
            )}
          </div>

          {/* Status Badge */}
          {chat?.status && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}
              aria-label={`status-${chat.status}`}
            >
              {chat.status}
            </span>
          )}
        </div>

        {/* Title */}
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-semibold text-text-primary line-clamp-2">
            {titleText}
          </h3>
          {isStreaming && (
            <div className="flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </span>
              <span className="text-xs text-primary-600 font-medium animate-pulse">Streaming</span>
            </div>
          )}
        </div>

        {/* Description */}
        {chat?.description && (
          <p className="text-sm text-text-secondary mb-4 line-clamp-2 flex-1">
            {chat.description}
          </p>
        )}

        {/* Metadata */}
        <div className="mt-auto pt-4 border-t border-border-default space-y-2">
          {/* Model */}
          {chat?.llmModel?.name && (
            <div className="flex items-center gap-2 text-xs text-text-tertiary">
              <SparklesIcon className="w-3.5 h-3.5" />
              <span className="truncate font-mono">{chat.llmModel.name}</span>
            </div>
          )}

          {/* Updated time */}
          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            <ClockIcon className="w-3.5 h-3.5" />
            <span>{updatedAtText || 'Just now'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(ChatListItem);