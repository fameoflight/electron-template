import React from 'react';
import { useAuth } from '@ui/contexts/AuthRelayProvider';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Skeleton } from 'antd';
import AuthPage from '@ui/Pages/User/AuthPage';
import HotKeyComponent from '@ui/HotKey/HotKeyComponent';
import { usePageMotion, motion } from '@ui/Components/Motion';

interface IAppLayoutProps {}

function AppLayout(props: IAppLayoutProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { pageMotionProps } = usePageMotion(location.pathname, {
    variant: 'fade', // Using fade for subtle page transitions
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[background-primary]">
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

  // Clean layout - no sidebar, each app manages its own chrome
  return (
    <>
      <div className="min-h-screen bg-[background-primary]">
        {/* Page content with animation using new motion system */}
        <motion.div {...pageMotionProps}>
          <Outlet />
        </motion.div>
      </div>

      <HotKeyComponent />
    </>
  );
}

export default AppLayout;
