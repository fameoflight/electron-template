import React, { useCallback } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import _ from 'lodash';
import Tab, { TabProps } from './Tab';

export interface RouterTabItem<T = string> {
  key: T;
  label: React.ReactNode;
  path: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  badge?: string | number;
}

export interface RouterTabsProps<T = string> {
  tabs: RouterTabItem<T>[];
  className?: string;
  contentClassName?: string;
  children?: React.ReactNode;
  basePath?: string;
  animation?: {
    duration?: number;
    type?: 'tween' | 'spring' | 'keyframes';
    ease?: 'easeOut' | 'easeInOut' | 'anticipate' | 'linear';
  };
}

const DEFAULT_ANIMATION = {
  duration: 0.3,
  type: 'tween' as const,
  ease: 'easeOut' as const,
};

function RouterTabs<T extends string>({
  tabs,
  className = '',
  contentClassName = 'p-4',
  children,
  basePath,
  animation = DEFAULT_ANIMATION
}: RouterTabsProps<T>) {
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
      .sort((a, b) => b.path.length - a.path.length);

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

  return (
    <div className={className}>
      <nav className="-mb-px flex space-x-8 border-gray-200">
        {tabs.map((tab) => (
          <Link key={String(tab.key)} to={tab.path}>
            <Tab
              key={tab.key}
              label={tab.label}
              icon={tab.icon}
              badge={tab.badge}
              disabled={tab.disabled}
              isActive={tab.key === activeKey}
              variant="bordered"
            />
          </Link>
        ))}
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

export default RouterTabs;