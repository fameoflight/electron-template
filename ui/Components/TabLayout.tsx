import React, { ReactNode, useCallback } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import _ from 'lodash';

export interface TabItem {
  key: string;
  label: string;
  path: string;
  icon?: ReactNode;
  disabled?: boolean;
  badge?: string | number;
}

export interface TabLayoutAnimation {
  duration?: number;
  type?: 'tween' | 'spring' | 'keyframes';
  ease?: 'easeOut' | 'easeInOut' | 'anticipate' | 'linear';
}

export interface TabLayoutProps {
  tabs: TabItem[];
  className?: string;
  contentClassName?: string;
  children?: ReactNode;
  animation?: TabLayoutAnimation;
  basePath?: string;
}

const DEFAULT_ANIMATION: TabLayoutAnimation = {
  duration: 0.3,
  type: 'tween',
  ease: 'easeOut'
};

function TabLayout({
  tabs,
  className = '',
  contentClassName = 'p-4',
  children,
  animation = DEFAULT_ANIMATION,
  basePath
}: TabLayoutProps) {
  const location = useLocation();

  const getActiveTab = useCallback(() => {
    const currentPath = location.pathname;

    // If basePath is provided, ensure we're within that base path first
    if (basePath && !currentPath.startsWith(basePath)) {
      return _.first(tabs)?.key || '';
    }

    // Find the tab with the most specific match (longest path that matches)
    const matchingTabs = tabs
      .filter(item => currentPath === item.path || currentPath.startsWith(item.path))
      .sort((a, b) => b.path.length - a.path.length); // Sort by path length descending

    return matchingTabs[0]?.key || _.first(tabs)?.key || '';
  }, [location.pathname, tabs, basePath]);

  const activeKey = getActiveTab();

  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.98,
    },
    in: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
  };

  const pageTransition = {
    type: animation.type,
    ease: animation.ease,
    duration: animation.duration,
  };

  const renderTabContent = (tab: TabItem) => (
    <span className="flex items-center gap-2">
      {tab.icon}
      <span>{tab.label}</span>
      {tab.badge && (
        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
          {tab.badge}
        </span>
      )}
    </span>
  );

  return (
    <div className={className}>
      <nav className="-mb-px flex space-x-8 border-gray-200">
        {tabs.map((tab) => {
          const isActive = tab.key === activeKey;

          return (
            <motion.div
              key={tab.key}
              whileHover={!tab.disabled ? { scale: 1.02 } : {}}
              whileTap={!tab.disabled ? { scale: 0.98 } : {}}
            >
              <Link
                to={tab.path}
                className={`
                  py-2 px-1 font-medium text-sm transition-colors whitespace-nowrap
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                  ${tab.disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                  }
                `}
              >
                {renderTabContent(tab)}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        variants={pageVariants}
        transition={pageTransition}
        className={contentClassName}
      >
        {children || <Outlet />}
      </motion.div>
    </div>
  );
}

export default TabLayout;