import React from 'react';
import { useRoutes } from 'react-router-dom';
import Dashboard from '@ui/Pages/Dashboard';
import AppLayout from '@ui/Components/AppLayout';
import AuthPage from '@ui/Pages/User/AuthPage';
import UserUpdatePage from '@ui/Pages/User/UserUpdatePage';
import NotFoundPage from '@ui/Components/NotFoundPage';
import SettingsPage from '@ui/Pages/Settings';
import AddFile from '@ui/Pages/AddFile';
import SettingsRoutes from '@ui/Pages/Settings/Routes';
import ChatListPage from '@ui/Pages/Chat/ChatListPage';
import ChatNewPage from '@ui/Pages/Chat/ChatNewPage';
import ChatNodePage from '@ui/Pages/Chat/ChatNodePage';


function Routes() {
  const routes = useRoutes([
    {
      path: '/',
      element: <AppLayout />,
      children: [
        {
          index: true,
          element: <Dashboard />,
        },
        {
          path: 'auth',
          element: <AuthPage />,
        },
        {
          path: 'update',
          element: <UserUpdatePage />,
        },
        {
          path: 'add-file',
          element: <AddFile />,
        },
        {
          path: 'chat',
          element: <ChatListPage />,
        },
        {
          path: 'chat/new',
          element: <ChatNewPage />,
        },
        {
          path: 'chat/:id',
          element: <ChatNodePage />,
        },
        {
          path: 'settings',
          element: <SettingsPage />,
          children: SettingsRoutes,
        },
        {
          path: '*',
          element: <NotFoundPage />,
        }
      ]
    },
  ]);

  return routes;
}

export default Routes;