import React from 'react';
import { Button } from 'antd';
import { useAuth } from '@ui/contexts/AuthRelayProvider';
import LinkButton from '@ui/Components/LinkButton';
import GridItem, { GridItemType } from '@ui/Components/GridItem';
import { SettingOutlined, MessageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import UnifiedMessageInput from '@ui/Pages/Chat/UnifiedMessageInput';

interface IDashboardProps { }

const items: GridItemType[] = [
  {
    id: 'chat',
    name: 'Chats',
    tooltip: 'AI-powered conversations and assistance.',
    icon: <MessageOutlined />,
  },
  {
    id: 'settings',
    name: 'Settings',
    tooltip: 'Application settings and configuration.',
    icon: <SettingOutlined />,
  },
];

function Dashboard(props: IDashboardProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onItemClick = (item: GridItemType) => {
    navigate(`/${item.id}`);
  }

  const handleComplete = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };

  return (
    // add bottom padding so page content doesn't get covered by the fixed bar
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold">Codeblocks</h2>
            <div>
              <LinkButton to="/update" className="mr-4">
                Update Profile
              </LinkButton>

              <Button type="primary" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap -ml-4 mt-8">
            {items.map((item) => (
              <GridItem
                record={item}
                key={item.id}
                onClick={() => onItemClick(item)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Fixed chat form at the bottom of the viewport */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-2 ">
        <UnifiedMessageInput
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}
export default Dashboard;