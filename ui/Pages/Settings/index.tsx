import React from 'react';
import { Outlet } from 'react-router-dom';
import { RouterTabItem, RouterTabs } from '@ui/Components/Tabs';

const tabs: RouterTabItem[] = [
  {
    key: 'connections',
    label: 'Connections',
    path: '/settings/connections',
  },
  {
    key: 'llm-models',
    label: 'LLM Models',
    path: '/settings/llm-models',
  },
  {
    key: 'embedding-models',
    label: 'Embedding Models',
    path: '/settings/embedding-models',
  }
];

function SettingsPage() {

  return (
    <RouterTabs
      tabs={tabs}
      basePath="/settings"
    >
      <div className='p-2'>
        <Outlet />
      </div>
    </RouterTabs>
  );
}

export default SettingsPage;