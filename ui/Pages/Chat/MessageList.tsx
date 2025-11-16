import React, { useEffect, useRef } from 'react';
import { useFragment, graphql } from 'react-relay/hooks';
import { useListMotion, MotionWrapper, motion, AnimatePresence } from '@ui/Components/Motion';

import { MessageList_messages$key, MessageList_messages$data } from './__generated__/MessageList_messages.graphql';
import { UserMessageView, AssistantMessageView } from '@ui/Pages/Chat/MessageVersionView';
import { useCompatMutation } from '@ui/hooks/relay';
import { MessageListRegenerateMutation } from '@ui/Pages/Chat/__generated__/MessageListRegenerateMutation.graphql';
import { useMessageVersion } from '@ui/Pages/Chat/useMessageVersion';
import { MessageListUpdateMutation } from '@ui/Pages/Chat/__generated__/MessageListUpdateMutation.graphql';

const fragmentSpec = graphql`
  fragment MessageList_messages on Message @relay(plural: true) {
    id
    role
    createdAt
    updatedAt
    currentVersionId
    versions {
      id
      modelId
      content
      status
      createdAt
      updatedAt
      ...MessageVersionView_record
    }
  }
`;

type MessageItem = MessageList_messages$data[0];

interface IMessageListProps {
  chatId: string;
  messages: MessageList_messages$key;
}


function MessageList(props: IMessageListProps) {
  const messages = useFragment(fragmentSpec, props.messages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use the new list motion hook for message animations
  const { listMotionProps, isAnimationEnabled } = useListMotion(messages, {
    staggerDelay: 0.05,
    variant: 'fade',
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const [commitRegenerate, regenIsInFlight] = useCompatMutation<MessageListRegenerateMutation>(graphql`
    mutation MessageListRegenerateMutation(
      $input: RegenerateMessageInput!
    ) {
      regenerateMessage(input: $input) {
        id
        currentVersionId
        versions {
          id
          status
        }
      }
    }
  `);

  const [commitUpdate, updateIsInFlight] = useCompatMutation<
    MessageListUpdateMutation
  >(graphql`
    mutation MessageListUpdateMutation(
      $input: UpdateMessageInput!
    ) {
      updateMessage(input: $input) {
       id
       currentVersionId
      }
    }
  `);

  const onRegenerate = (messageVersionId: string, modelId: string) => {
    commitRegenerate({
      variables: {
        input: {
          messageVersionId,
          llmModelId: modelId,
        },
      },
      onCompleted: () => {
        scrollToBottom();
      },
    });
  };

  const updateVersion = (messageId: string, versionId: string) => {
    commitUpdate({
      variables: {
        input: {
          id: messageId,
          chatId: props.chatId,
          currentVersionId: versionId,
        },
      },
    });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 bg-background-primary"
    >
      {messages.length === 0 ? (
        <MotionWrapper
          variant="fade"
          customConfig={{
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -20 },
            transition: { duration: 0.5 }
          }}
          className="flex items-center justify-center h-full"
        >
          <div className="text-center space-y-4 max-w-md">
            {/* Empty state icon */}
            <MotionWrapper
              variant="scale"
              customConfig={{
                initial: { scale: 0.8, opacity: 0 },
                animate: { scale: 1, opacity: 1 },
                transition: { delay: 0.2, duration: 0.5 }
              }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary-100 rounded-full blur-2xl opacity-40" />
                <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-primary-50 border border-primary-100">
                  <svg
                    className="w-10 h-10 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
              </div>
            </MotionWrapper>

            {/* Empty state text */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-text-primary">
                Start a conversation
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Send a message below to begin chatting with the AI assistant
              </p>
            </div>

            {/* Suggested prompts (optional) */}
            <MotionWrapper
              variant="fade"
              customConfig={{
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                transition: { delay: 0.4 }
              }}
              className="grid grid-cols-1 gap-2 mt-6"
            >
              {[
                'Help me write some code',
                'Explain a concept',
                'Review my work',
              ].map((suggestion, index) => (
                <button
                  key={index}
                  className="px-4 py-2.5 text-sm text-text-secondary bg-surface border border-border-default rounded-lg hover:border-primary-600 hover:text-primary-600 hover:bg-primary-50 transition-all duration-[var(--duration-fast)] text-left"
                >
                  {suggestion}
                </button>
              ))}
            </MotionWrapper>
          </div>
        </MotionWrapper>
      ) : (
        <AnimatePresence>
          <motion.div
            className="mx-auto space-y-6"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={listMotionProps.containerVariants}
          >
            {messages.map((message: MessageItem, index) => {
              const totalVersion = message.versions.length;
              const [currentIndex, currentVersion, onPreviousVersion, onNextVersion] = useMessageVersion(message, updateVersion);

              return (
                <motion.div
                  key={message.id}
                  variants={listMotionProps.itemVariants}
                  transition={listMotionProps.transition}
                >
                  {message.role === 'user' ? (
                    <UserMessageView messageVersion={currentVersion} />
                  ) : (
                    <AssistantMessageView
                      versionIndex={currentIndex}
                      totalVersions={totalVersion}
                      messageVersion={currentVersion}
                      onPreviousVersion={onPreviousVersion}
                      onNextVersion={onNextVersion}
                      onRegenerate={(modelId) => onRegenerate(currentVersion.id, modelId)}
                    />
                  )}
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

export default MessageList;
