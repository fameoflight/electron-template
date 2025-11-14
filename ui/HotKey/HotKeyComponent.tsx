/**
 * HotKey Container Component
 * Handles global hotkeys using the centralized hotkey system
 * Placed inside the Router context to provide navigate() dependency
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { isHotkey } from 'is-hotkey';
import HotKeyHelp from './HotKeyHelp';
import { getDefaultHotKeys, type HotKeyDependencies, processHotkeyKey } from './hotkeys';
import useHistory from '@ui/hooks/useHistory';
import { FloatButton } from 'antd';
import { QuestionCircleTwoTone } from '@ant-design/icons';

function fireHotkeyEvent(hotkeyId?: string, detail?: any) {
  if (!hotkeyId) return;

  window.dispatchEvent(new CustomEvent(`hotkey:${hotkeyId}`, { detail }));
}

interface IHotKeyComponentProps {
  floatButton?: boolean;
}


function HotKeyComponent() {
  const [showHotkeyHelp, setShowHotkeyHelp] = useState(false);

  // Use the custom history hook
  const [goBack, goForward, history] = useHistory();
  const navigate = useNavigate();

  // Get hotkeys with dependencies injected
  const hotkeys = useMemo(() => {
    const dependencies: HotKeyDependencies = {
      navigate,
      goBack,
      goForward,
    };
    return getDefaultHotKeys(dependencies);
  }, [navigate, goBack, goForward]);

  // Pre-compile hotkey checkers for better performance
  const hotkeyCheckers = useMemo(() => {
    const checkers: Record<string, ((event: KeyboardEvent) => boolean) | ((event: KeyboardEvent) => boolean)[]> = {};

    Object.entries(hotkeys).forEach(([hotkeyId, hotkey]) => {
      if (!hotkey.enabled) return;

      const processKey = processHotkeyKey;

      if (Array.isArray(hotkey.keys)) {
        // Multiple key combinations
        checkers[hotkeyId] = hotkey.keys.map(key => isHotkey(processKey(key)));
      } else {
        // Single key combination
        checkers[hotkeyId] = isHotkey(processKey(hotkey.keys));
      }
    });

    return checkers;
  }, [hotkeys]);

  // Handle global hotkeys
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check each enabled hotkey
      for (const [hotkeyId, checker] of Object.entries(hotkeyCheckers)) {
        const hotkey = hotkeys[hotkeyId];
        if (!hotkey?.enabled) continue;

        // Check if hotkey matches
        let isMatch = false;
        if (Array.isArray(checker)) {
          // Multiple key combinations - check if any match
          isMatch = checker.some(c => c(event));
        } else {
          // Single key combination
          isMatch = checker(event);
        }

        if (isMatch) {
          // Don't trigger non-global hotkeys when user is typing in input fields
          if (isUserTyping() && !hotkey.global) {
            return;
          }

          console.log(`[HotKeyComponent] ${hotkeyId} hotkey pressed - executing action`);

          // Handle special case for show-help - toggle help modal
          if (hotkeyId === 'show-help') {
            setShowHotkeyHelp(prev => !prev);
          }

          try {
            hotkey.action?.();
          } catch (error) {
            console.error(`[HotKeyComponent] Error executing ${hotkeyId} action:`, error);
          }

          fireHotkeyEvent(hotkey.eventName);

          return; // Stop processing after first match
        }
      }
    };

    const isUserTyping = () => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hotkeys, hotkeyCheckers]);

  return (
    <>
      <HotKeyHelp
        visible={showHotkeyHelp}
        onClose={() => setShowHotkeyHelp(false)}
        hotkeys={hotkeys}
      />
      <FloatButton
        icon={<QuestionCircleTwoTone twoToneColor="#1890ff" />}
        onClick={() => setShowHotkeyHelp(!showHotkeyHelp)}
      />
    </>
  );
}

export default HotKeyComponent;