import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import AppContainer from '@ui/Components/AppContainer';

export default function SettingsContainer() {
  const location = useLocation();

  // Determine active tab from route
  let activeTabId = 'connections';
  if (location.pathname.includes('/llm-models')) {
    activeTabId = 'llm-models';
  } else if (location.pathname.includes('/embedding-models')) {
    activeTabId = 'embedding-models';
  }

  return (
    <AppContainer
      appName="Settings"
      appIcon={<Cog6ToothIcon className="w-5 h-5" />}
      tabs={[
        { id: 'connections', label: 'Connections', href: '/settings/connections' },
        { id: 'llm-models', label: 'LLM Models', href: '/settings/llm-models' },
        { id: 'embedding-models', label: 'Embedding Models', href: '/settings/embedding-models' },
      ]}
      activeTabId={activeTabId}
    >
      <Outlet />
    </AppContainer>
  );
}
