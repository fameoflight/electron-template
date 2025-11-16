import React, { useState } from 'react';
import { LayoutGroup } from '@ui/Components/Motion';
import { Select } from 'antd';
import _ from 'lodash';
import Tab, { TabProps } from './Tab';
import { MotionWrapper } from '../Motion';

export interface StateTabItem<T = string> {
  key: T;
  label: React.ReactNode;
  render: () => JSX.Element;
  description?: React.ReactNode | null;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface StateTabsProps<T = string> {
  mode?: 'simple' | 'tabs';
  tabs: StateTabItem<T>[];
  selectedKey?: T;
  onChange?: (key: T) => void;
  className?: string;
  contentClassName?: string;
  showDescription?: boolean;
  mobileDropdown?: boolean;
  motionVariant?: 'pills' | 'glow' | 'neon' | 'minimalScale';
  shiftVariant?: 'slide' | 'fade' | 'scale' | 'flip' | 'bounce';
}

function StateTabs<T extends string>({
  mode = 'tabs',
  tabs,
  selectedKey,
  onChange,
  className = '',
  contentClassName = '',
  showDescription = true,
  mobileDropdown = true,
  motionVariant,
  shiftVariant = 'slide'
}: StateTabsProps<T>) {
  const [shift, setShift] = useState({ x: 0, y: 0 });

  // Simple mode: if only one tab, just render its content
  if (mode === 'simple' && tabs.length === 1) {
    return tabs[0].render();
  }

  const [currentKey, setCurrentKey] = useState(
    selectedKey || _.first(tabs)?.key
  );

  const activeKey = selectedKey || currentKey;
  const currentTab = tabs.find((tab) => tab.key === activeKey);

  const handleChange = (newKey: T) => {
    const previousIndex = _.findIndex(tabs, (tab) => tab.key === activeKey);
    const nextIndex = _.findIndex(tabs, (tab) => tab.key === newKey);

    setShift({
      x: 100 * (nextIndex - previousIndex),
      y: 0,
    });

    setCurrentKey(newKey);
    onChange?.(newKey);
  };

  return (
    <LayoutGroup>
      <div className={`mb-4 border-b border-dashed bg-white p-4 ${className}`}>
        {mobileDropdown && (
          <div className="sm:hidden mb-4">
            <Select
              id="tabs"
              className="block w-full"
              value={activeKey}
              onChange={(value) => handleChange(value as T)}
            >
              {tabs.map((tab) => (
                <Select.Option key={String(tab.key)} value={tab.key}>
                  {tab.label}
                </Select.Option>
              ))}
            </Select>
          </div>
        )}

        <div className="hidden sm:block">
          <nav className="flex space-x-4" aria-label="Tabs">
            {tabs.map((tab) => (
              <Tab
                key={tab.key}
                label={tab.label}
                icon={tab.icon}
                badge={tab.badge}
                disabled={false}
                isActive={tab.key === activeKey}
                onClick={() => handleChange(tab.key)}
                variant="pills"
                motionVariant={motionVariant}
              />
            ))}
          </nav>
        </div>

        {showDescription && currentTab?.description && (
          <div className="text-gray-500 mt-4">{currentTab.description}</div>
        )}
      </div>

      <MotionWrapper
        motionKey={String(activeKey)}
        variant={shiftVariant}
        customConfig={{
          initial: { x: shift.x, y: shift.y, opacity: 0 },
          animate: { x: 0, y: 0, opacity: 1 },
          exit: { x: -shift.x, y: -shift.y, opacity: 0 },
          transition: { duration: 0.3 }
        }}
        className={contentClassName}
      >
        {currentTab?.render()}
      </MotionWrapper>
    </LayoutGroup>
  );
}

export default StateTabs;