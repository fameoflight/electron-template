import React from "react";
import _ from "lodash";
import { graphql } from 'react-relay/hooks';
import { useNavigate } from 'react-router-dom';
import { motion } from '@ui/Components/Motion';
import { ChatBubbleLeftRightIcon, SparklesIcon, CodeBracketIcon, LightBulbIcon } from "@heroicons/react/24/outline";

import type { ChatListPageQuery, ChatListPageQuery$data } from "./__generated__/ChatListPageQuery.graphql";
import { useNetworkLazyReloadQuery } from "@ui/hooks/relay";
import ChatListItem from "@ui/Pages/Chat/ChatListItem";

const ChatListPageQuery = graphql`
  query ChatListPageQuery {
    currentUser {
      id
    }
    myChats {
      id
      title
      status
      createdAt
      updatedAt
      llmModel {
        id
        name
        modelIdentifier
      }
      ...ChatListItem_chat
    }
  }
`;

const suggestedPrompts = [
  { icon: SparklesIcon, text: "Help me brainstorm ideas", color: "amber" },
  { icon: CodeBracketIcon, text: "Write some code", color: "indigo" },
  { icon: LightBulbIcon, text: "Explain a concept", color: "rose" },
];

function ChatListPage() {
  const navigate = useNavigate();
  const [data, refreshData] = useNetworkLazyReloadQuery<ChatListPageQuery>(
    ChatListPageQuery,
    {}
  );

  const chats = _.sortBy(data?.myChats || [], [(chat) => new Date(chat.updatedAt).getTime()]).reverse();

  const onCreateNewChat = () => {
    navigate('/chat/new');
  };

  const onChatSelect = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };

  // Empty state with beautiful design
  if (!chats || chats.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            {/* Animated Icon */}
            <div className="relative mb-8 flex justify-center">
              <div className="absolute inset-0 bg-primary-100 rounded-full blur-3xl opacity-30 scale-75" />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary-50 to-primary-100"
              >
                <ChatBubbleLeftRightIcon className="w-12 h-12 text-primary-600" />
              </motion.div>
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-semibold text-text-primary mb-3"
            >
              No chats yet
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-text-secondary mb-8 max-w-md mx-auto"
            >
              Start a conversation with AI. Ask questions, get help with code, or brainstorm ideas.
            </motion.p>

            {/* Suggested Prompts */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col gap-3 max-w-sm mx-auto mb-8"
            >
              {suggestedPrompts.map((prompt, index) => (
                <motion.button
                  key={prompt.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ x: 4, scale: 1.02 }}
                  onClick={onCreateNewChat}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border-default bg-surface text-left transition-all hover:shadow-md hover:border-primary-200"
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-${prompt.color}-50`}>
                    <prompt.icon className={`w-4 h-4 text-${prompt.color}-600`} />
                  </div>
                  <span className="text-sm text-text-primary">{prompt.text}</span>
                </motion.button>
              ))}
            </motion.div>

            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCreateNewChat}
              className="btn-primary px-6 py-3 rounded-lg font-medium transition-all"
            >
              Start Your First Chat
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Chat list grid
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chats.map((chat, index) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <ChatListItem
                chat={chat}
                onClick={() => onChatSelect(chat.id)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatListPage;