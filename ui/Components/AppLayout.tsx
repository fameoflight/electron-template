import React from 'react';
import { useAuth } from '@ui/contexts/AuthRelayProvider';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Skeleton } from 'antd';
import AuthPage from '@ui/Pages/User/AuthPage';
import HotKeyComponent from '@ui/HotKey/HotKeyComponent';

interface IAppLayoutProps { }

function AppLayout(props: IAppLayoutProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton active paragraph={{ rows: 4 }} />
      </div>
    );
  }

  const isAuthPath = location.pathname === '/auth';

  // If user is authenticated and trying to access auth page, redirect to home
  if (user && isAuthPath) {
    return <Navigate to="/" replace />;
  }

  // If user is not authenticated and not on auth page, redirect to auth
  if (!user && !isAuthPath) {
    return <Navigate to="/auth" replace />;
  }

  // If on auth page, show auth page
  if (isAuthPath) {
    return <AuthPage />;
  }

  // If authenticated and not on auth page, show the protected routes
  return (
    <>
      <div className="min-h-screen bg-gray-50 p-4">
        <Outlet />
      </div>

      <HotKeyComponent />
    </>
  )
};

export default AppLayout;