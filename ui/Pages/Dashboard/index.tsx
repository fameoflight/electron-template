import React from 'react';
import { useAuth } from '@ui/contexts/AuthRelayProvider';
import { useNavigate } from 'react-router-dom';
import { motion } from '@ui/Components/Motion';
import {
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

import GridItem, { GridItemType } from '@ui/Components/GridItem';
import UnifiedMessageInput from '@ui/Pages/Chat/MessageInput';

interface IDashboardProps { }

const items: GridItemType[] = [
  {
    id: 'chat',
    name: 'Chats',
    description: 'Start conversations with AI assistants and get instant help',
    tooltip: 'AI-powered conversations and assistance.',
    icon: <ChatBubbleLeftRightIcon className="w-6 h-6" />,
  },
  {
    id: 'documents',
    name: 'Documents',
    description: 'Upload, embed, and search through your document collection',
    tooltip: 'Manage and search embedded documents.',
    icon: <DocumentTextIcon className="w-6 h-6" />,
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Configure connections, models, and application preferences',
    tooltip: 'Application settings and configuration.',
    icon: <Cog6ToothIcon className="w-6 h-6" />,
  },
];

function Dashboard(props: IDashboardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const onItemClick = (item: GridItemType) => {
    navigate(`/${item.id}`);
  };

  const handleComplete = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="border-b border-[border-light] bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-primary-400">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-primary tracking-tight">
                  Welcome back{user?.name ? `, ${user.name}` : ''}
                </h1>
                <p className="text-sm text-secondary mt-0.5">
                  Choose an action below or start a conversation
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-primary mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item, index) => (
                <GridItem
                  record={item}
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  index={index}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Quick Chat Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-12"
        >
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              Start a Quick Chat
            </h2>
            <p className="text-sm text-text-secondary">
              Ask a question, get code help, or start a new conversation
            </p>
          </div>

          <UnifiedMessageInput onComplete={handleComplete} />
        </motion.div>
      </div>
    </div>
  );
}

export default Dashboard;
