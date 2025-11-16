import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Button, Form, Typography, Spin, message, Input } from "antd";
import { ArrowLeftCircleIcon } from "@heroicons/react/24/outline";

import PageContainer from "@ui/Components/PageContainer";
import UnifiedMessageInput from "@ui/Pages/Chat/MessageInput";

const { Title, Text } = Typography;

function ChatNewPage() {
  const navigate = useNavigate();

  const handleBackToList = () => {
    navigate('/chat');
  };

  const handleComplete = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };


  return (
    <PageContainer
      title="New Chat"
      extra={{
        title: 'Back to Chats',
        onClick: handleBackToList,
        icon: <ArrowLeftCircleIcon className="h-5 w-5" />
      }}
    >
      <div className="mx-auto p-4 bg-white">
        <Title level={4}>Create a New Conversation</Title>
        <Text type="secondary">
          Start a new chat by providing your first message and selecting an AI model.
        </Text>

        <UnifiedMessageInput
          onComplete={handleComplete}
        />
      </div>
    </PageContainer>
  );
}

export default ChatNewPage;

