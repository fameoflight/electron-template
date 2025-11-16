import ChatListPage from './ChatListPage';
import ChatNewPage from './ChatNewPage';
import ChatNodePage from './ChatNodePage';

const ChatRoutes = [
  {
    index: true,
    element: <ChatListPage />,
  },
  {
    path: 'new',
    element: <ChatNewPage />,
  },
  {
    path: ':id',
    element: <ChatNodePage />,
  },
];

export default ChatRoutes;
