import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ChatBubbleLeftRightIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import AppContainer from '@ui/Components/AppContainer';

export default function ChatContainer() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from route
  const activeTabId = location.pathname === '/chat' ? 'list' : 'chat';

  return (
    <AppContainer
      appName="Chat"
      appIcon={<ChatBubbleLeftRightIcon className="w-5 h-5" />}
      tabs={[
        { id: 'list', label: 'All Chats', href: '/chat' },
      ]}
      activeTabId={activeTabId}
      actions={
        <button
          onClick={() => navigate('/chat/new')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium text-sm hover:bg-primary-700 transition-all duration-[var(--duration-fast)] hover:shadow-md"
          style={{ boxShadow: 'var(--shadow-sm)' }}
        >
          <PlusIcon className="w-4 h-4" />
          New Chat
        </button>
      }
    >
      <Outlet />
    </AppContainer>
  );
}
