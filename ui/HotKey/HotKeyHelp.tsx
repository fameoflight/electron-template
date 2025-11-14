import React, { useState, useMemo } from 'react';
import { Modal, Input, Divider, Tag } from 'antd';
import { type HotKeyDefinition } from './hotkeys';
import {
  categoryNames,
  formatKeysForDisplay,
  filterHotkeys
} from './helpers';

const { Search } = Input;

interface HotKeyHelpProps {
  visible: boolean;
  onClose: () => void;
  hotkeys: Record<string, HotKeyDefinition>;
}

interface GroupedHotkeys {
  [category: string]: Array<Omit<HotKeyDefinition, 'action'>>;
}

interface HotKeyItemProps {
  hotkey: Omit<HotKeyDefinition, 'action'>;
}

function HotKeyItem({ hotkey }: HotKeyItemProps) {
  const formattedKeys = formatKeysForDisplay(hotkey.keys);
  return (
    <div
      key={hotkey.id}
      className="flex justify-between items-center p-2 bg-white border border-gray-200 rounded-md"
    >
      <span>{hotkey.description}</span>
      <div className="flex items-center gap-2">
        {formattedKeys.map((k, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="px-2 py-1 bg-gray-100 rounded text-xs font-mono border border-gray-200">
              {k}
            </div>
            {i < formattedKeys.length - 1 && (
              <span className="text-sm text-gray-500">or</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface HotKeyCategoryProps {
  category: string;
  items: Array<Omit<HotKeyDefinition, 'action'>>;
  isLast: boolean;
}

function HotKeyCategory({ category, items, isLast }: HotKeyCategoryProps) {
  return (
    <div key={category} className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <Tag>{categoryNames[category] || category}</Tag>
        <span className="text-sm text-gray-500">
          {items.length} shortcut{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((hotkey) => (
          <HotKeyItem key={hotkey.id} hotkey={hotkey} />
        ))}
      </div>

      {!isLast && <Divider className="my-4" />}
    </div>
  );
}

interface HotKeyListProps {
  groupedHotkeys: GroupedHotkeys;
  searchText: string;
}

function HotKeyList({ groupedHotkeys, searchText }: HotKeyListProps) {
  const categoryKeys = Object.keys(groupedHotkeys);

  return (
    <div className="max-h-[60vh] overflow-y-auto">
      {categoryKeys.map((category, idx) => (
        <HotKeyCategory
          key={category}
          category={category}
          items={groupedHotkeys[category]}
          isLast={idx === categoryKeys.length - 1}
        />
      ))}

      {categoryKeys.length === 0 && (
        <div className="text-center p-10 text-gray-500">
          {searchText ? 'No shortcuts found matching your search.' : 'No shortcuts available.'}
        </div>
      )}
    </div>
  );
}

interface HotKeyFooterProps {
  text: string;
}

function HotKeyFooter({ text }: HotKeyFooterProps) {
  return (
    <div className="text-center text-gray-500 text-sm pt-2">
      {text}
    </div>
  );
}

export function HotKeyHelp({ visible, onClose, hotkeys }: HotKeyHelpProps) {
  const [searchText, setSearchText] = useState('');

  const groupedHotkeys = useMemo(() => {
    const filtered = filterHotkeys(hotkeys, searchText);

    return filtered.reduce<GroupedHotkeys>((acc, [, hotkey]) => {
      if (!acc[hotkey.category]) acc[hotkey.category] = [];
      acc[hotkey.category].push(hotkey);
      return acc;
    }, {});
  }, [hotkeys, searchText]);

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <h4 className="m-0 text-base font-medium">"Keyboard Shortcuts"</h4>
          <span className="text-sm text-gray-500">"Press ? to toggle"</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      style={{ top: 50 }}
    >
      <Search
        placeholder="Search shortcuts..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className="mb-5"
        allowClear
      />

      <HotKeyList
        groupedHotkeys={groupedHotkeys}
        searchText={searchText}
      />

      <Divider />

      <HotKeyFooter text="Hotkeys work when the app is focused." />
    </Modal>
  );
}

export default HotKeyHelp;
