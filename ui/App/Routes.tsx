import React from 'react';
import { useRoutes } from 'react-router-dom';
import Dashboard from '@ui/Pages/Dashboard';
import AppLayout from '@ui/Components/AppLayout';
import AuthPage from '@ui/Pages/User/AuthPage';
import UserUpdatePage from '@ui/Pages/User/UserUpdatePage';
import NotFoundPage from '@ui/Components/NotFoundPage';
import AddFile from '@ui/Pages/AddFile';

// App Containers
import ChatContainer from '@ui/Pages/Chat/ChatContainer';
import SettingsContainer from '@ui/Pages/Settings/SettingsContainer';

// Co-located Routes
import ChatRoutes from '@ui/Pages/Chat/Routes';
import SettingsRoutes from '@ui/Pages/Settings/Routes';


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
          element: <ChatContainer />,
          children: ChatRoutes,
        },
        {
          path: 'settings',
          element: <SettingsContainer />,
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