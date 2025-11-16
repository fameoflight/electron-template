import React, { useEffect } from 'react';
import Routes from './Routes';
import ErrorBoundary from '@ui/Components/ErrorBoundary';

import './index.css';
import { MemoryRouter } from 'react-router';
import { AnimatePresence } from '@ui/Components/Motion';
import { AuthRelayProvider } from '@ui/contexts/AuthRelayProvider';
import { useMenuActions } from '@ui/hooks/useMenuActions';
import { commonMenuActions } from '@shared/menu/index.js';
import { MotionProvider } from '@ui/Components/Motion';

// Menu actions component
function MenuActionSetup() {
  const { register, createHandler } = useMenuActions();

  useEffect(() => {
    // Register menu action handlers for File > New Post and Settings > Profile
    register('new-post', createHandler('new-post', () => {
      console.log('📝 Creating new post...');
      // Navigate to new post page or open new post modal
      commonMenuActions.navigateTo('/posts/new');
    }));

    register('profile', createHandler('profile', () => {
      console.log('👤 Opening profile...');
      // Navigate to profile page or open profile modal
      commonMenuActions.navigateTo('/profile');
    }));

  }, [register, createHandler]);

  return null; // This component doesn't render anything
}

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // You could integrate with a logging service here
        console.error('App-level error caught:', error, errorInfo);
      }}
    >
      <MotionProvider>
        <AuthRelayProvider>
          <MenuActionSetup />
          <MemoryRouter>
            <AnimatePresence>
              <Routes />
            </AnimatePresence>
          </MemoryRouter>
        </AuthRelayProvider>
      </MotionProvider>
    </ErrorBoundary>
  );
}

export default App;