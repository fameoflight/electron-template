import React from "react";
import _ from "lodash";
import { graphql } from 'react-relay/hooks';
import { Button, List, Typography, Empty, Spin } from "antd";
import { useNavigate } from 'react-router-dom';
import { MessageOutlined, PlusOutlined } from "@ant-design/icons";
import { ArrowLeftCircleIcon } from "@heroicons/react/24/outline";

import type { ChatListPageQuery, ChatListPageQuery$data } from "./__generated__/ChatListPageQuery.graphql";
import { useNetworkLazyReloadQuery } from "@ui/hooks/relay";
import PageContainer from "@ui/Components/PageContainer";
import ChatListItem from "@ui/Pages/Chat/ChatListItem";

const { Title, Text } = Typography;

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

  return (
    <PageContainer
      title="Chats"
      extra={{
        title: 'New Chat',
        onClick: onCreateNewChat,
        icon: <PlusOutlined />
      }}
    >
      <div className="h-full">
        <List
          className="chat-list"
          itemLayout="vertical"
          dataSource={chats}
          renderItem={(chat) => (
            <List.Item key={chat.id} className="w-full">
              <ChatListItem
                key={chat.id}
                chat={chat}
                onClick={() => onChatSelect(chat.id)}
              />
            </List.Item>
          )}
        />
      </div>
    </PageContainer>
  );
};

export default ChatListPage;