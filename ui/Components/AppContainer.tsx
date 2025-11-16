import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from '@ui/Components/Motion';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@ui/contexts/AuthRelayProvider';

export interface AppTab {
  id: string;
  label: string;
  href: string;
}

interface AppContainerProps {
  appName: string;
  appIcon?: ReactNode;
  tabs?: AppTab[];
  activeTabId?: string;
  actions?: ReactNode;
  children: ReactNode;
  showBackButton?: boolean;
}

export default function AppContainer({
  appName,
  appIcon,
  tabs,
  activeTabId,
  actions,
  children,
  showBackButton = true,
}: AppContainerProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* App Header */}
      <div className="sticky top-0 z-40 bg-surface/80 backdrop-blur-sm border-b border-(--color-border-light)">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Bar */}
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              {/* Back to Dashboard */}
              {showBackButton && (
                <button
                  onClick={() => navigate('/')}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-background-secondary transition-all duration-[var(--duration-fast)]"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </button>
              )}

              {/* App Identity */}
              <div className="flex items-center gap-3">
                {appIcon && (
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-600 text-white">
                    {appIcon}
                  </div>
                )}
                <h1 className="text-xl font-semibold text-primary tracking-tight">
                  {appName}
                </h1>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {actions}

              {/* User Menu */}
              <button
                onClick={() => navigate('/update')}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-medium text-sm hover:bg-primary-200 transition-colors"
              >
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </button>
            </div>
          </div>

          {/* Tabs (if provided) */}
          {tabs && tabs.length > 0 && (
            <div className="flex items-center gap-1 -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.href)}
                  className={`
                    relative px-4 py-3 text-sm font-medium transition-all duration-[var(--duration-fast)]
                    ${activeTabId === tab.id
                      ? 'text-primary-600'
                      : 'text-secondary hover:text-primary'
                    }
                  `}
                >
                  {tab.label}

                  {/* Active indicator */}
                  {activeTabId === tab.id && (
                    <motion.div
                      layoutId="appTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* App Content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
