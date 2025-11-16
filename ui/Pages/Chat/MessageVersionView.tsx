import React from 'react';
import { useFragment, graphql } from 'react-relay/hooks';
import { UserIcon } from '@heroicons/react/24/solid';
import { motion } from '@ui/Components/Motion';

import { MessageVersionView_record$key } from './__generated__/MessageVersionView_record.graphql';
import StreamingMarkdownViewer from '@ui/Components/StreamingMarkdownViewer';
import MessageVersionBottomBar from './MessageVersionBottomBar';

const fragmentSpec = graphql`
  fragment MessageVersionView_record on MessageVersion {
    id
    content
    status
    files {
      id
      filename
    }
  }
`;

type MessageVersionRef = MessageVersionView_record$key;

interface IMessageVersionContentProps {
  record: MessageVersionRef;
  isUser: boolean;
  isStreaming?: boolean;
}

interface IMessageVersionViewProps {
  record: MessageVersionRef;
  role?: 'user' | 'assistant';
  versionIndex?: number;
  totalVersions?: number;
  onPreviousVersion?: () => void;
  onNextVersion?: () => void;
  onRegenerate?: (modelId: string) => void;
  onEdit?: () => void;
}

interface IMessageViewProps {
  messageVersion: MessageVersionRef;
  versionIndex?: number;
  totalVersions?: number;
  onPreviousVersion?: () => void;
  onNextVersion?: () => void;
  onRegenerate?: (modelId: string) => void;
}

/**
 * Internal: renders files + content (uses relay fragment)
 */
const MessageVersionContent: React.FC<IMessageVersionContentProps> = ({ record, isUser, isStreaming }) => {
  const resolved = useFragment(fragmentSpec, record);
  const files = resolved.files || [];

  return (
    <div>
      {files.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {files.map((file) => (
            <motion.div
              key={file?.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${isUser
                ? 'bg-white/20 text-white border border-white/30'
                : 'bg-(--color-background-secondary) text-text-secondary border border-border-default'
                }`}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
              <span className="truncate max-w-32">{file?.filename}</span>
            </motion.div>
          ))}
        </div>
      )}
      <StreamingMarkdownViewer
        content={resolved.content}
        isStreaming={isStreaming && !isUser} // Only stream for assistant messages
      />
    </div>
  );
};

/**
 * Unified MessageVersionView with refined minimalism aesthetics
 */
export const MessageVersionView: React.FC<IMessageVersionViewProps> = ({
  record,
  role = 'assistant',
  versionIndex,
  totalVersions,
  onPreviousVersion,
  onNextVersion,
  onRegenerate,
  onEdit,
}) => {
  const resolved = useFragment(fragmentSpec, record);
  const isUser = role === 'user';

  // Check if this version is currently streaming (only for assistant messages)
  const isStreaming = !isUser && (resolved.status === 'streaming' || resolved.status === 'pending');

  // Check for error/failed status
  const hasError = !isUser && (resolved.status === 'failed' || resolved.status === 'cancelled');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0.0, 0.2, 1],
      }}
      className={`flex group ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className="relative w-full">
        {/* Flowing border for streaming messages */}
        {isStreaming && !isUser && !hasError && (
          <div
            className="absolute inset-0 rounded-2xl rounded-bl-md"
            style={{
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6)',
              backgroundSize: '300% 100%',
              animation: 'flow 3s linear infinite',
              padding: '2px',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'exclude',
            }}
          />
        )}

        {/* Message content container */}
        <div
          className={`relative
            ${isUser
              ? 'bg-primary-600 text-white rounded-2xl rounded-br-md'
              : hasError
                ? 'bg-red-50 text-text-primary rounded-2xl rounded-bl-md border-2 border-red-500'
                : isStreaming
                  ? 'bg-surface text-text-primary rounded-2xl rounded-bl-md'
                  : 'bg-surface text-text-primary rounded-2xl rounded-bl-md border border-border-default'
            }
            transition-all duration-(--duration-fast) hover:shadow-md
          `}
          style={{
            boxShadow: isUser
              ? 'var(--shadow-sm)'
              : hasError
                ? '0 0 0 1px rgba(239, 68, 68, 0.1)'
                : 'var(--shadow-sm)',
          }}
        >
          {/* Message Content */}
          <div className="px-5 py-4">
            {/* Header with role */}
            <div className="flex items-center gap-2 mb-2.5">
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full ${isUser
                  ? 'bg-white/20'
                  : 'bg-primary-50'
                  }`}
              >
                {isUser ? (
                  <UserIcon className="w-3.5 h-3.5 text-white" />
                ) : (
                  <svg
                    className="w-3.5 h-3.5 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </div>
              <span
                className={`text-xs font-semibold tracking-wide uppercase ${isUser
                  ? 'text-white/80'
                  : hasError
                    ? 'text-red-600'
                    : 'text-text-tertiary'
                  }`}
              >
                {isUser ? 'You' : 'Assistant'}
                {isStreaming && !isUser && !hasError && (
                  <span className="ml-2 inline-flex items-center">
                    <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse"></span>
                  </span>
                )}
                {hasError && (
                  <span className="ml-2 inline-flex items-center gap-1">
                    <svg
                      className="w-3.5 h-3.5 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <span className="text-red-600 normal-case text-xs">Error</span>
                  </span>
                )}
              </span>
            </div>

            {/* Content */}
            <div
              className={`prose prose-sm max-w-none ${isUser
                ? 'prose-invert'
                : 'prose-stone'
                }`}
            >
              <MessageVersionContent record={record} isUser={isUser} isStreaming={isStreaming} />
            </div>

            {/* Action Bar - Shown on hover */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <MessageVersionBottomBar
                messageContent={resolved.content || ''}
                versionIndex={versionIndex}
                totalVersions={totalVersions}
                onPreviousVersion={onPreviousVersion}
                onNextVersion={onNextVersion}
                onRegenerate={onRegenerate}
                onEdit={onEdit}
                isUser={isUser}
                isStreaming={isStreaming}
              />
            </div>
          </div>

          {/* Hover timestamp (optional enhancement) */}
          <div
            className={`absolute -bottom-5 ${isUser ? 'right-0' : 'left-0'
              } opacity-0 group-hover:opacity-100 transition-opacity duration-(--duration-normal)`}
          >
            <span className="text-xs text-text-tertiary">
              Just now
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Backwards-compatible small wrappers
 */
export const UserMessageView: React.FC<IMessageViewProps> = ({
  messageVersion,
  versionIndex,
  totalVersions,
  onPreviousVersion,
  onNextVersion,
  onRegenerate,
}) => (
  <MessageVersionView
    record={messageVersion}
    role="user"
    versionIndex={versionIndex}
    totalVersions={totalVersions}
    onPreviousVersion={onPreviousVersion}
    onNextVersion={onNextVersion}
    onRegenerate={onRegenerate}
  />
);

export const AssistantMessageView: React.FC<IMessageViewProps> = ({
  messageVersion,
  versionIndex,
  totalVersions,
  onPreviousVersion,
  onNextVersion,
  onRegenerate,
}) => (
  <MessageVersionView
    record={messageVersion}
    role="assistant"
    versionIndex={versionIndex}
    totalVersions={totalVersions}
    onPreviousVersion={onPreviousVersion}
    onNextVersion={onNextVersion}
    onRegenerate={onRegenerate}
  />
);

export default MessageVersionView;
