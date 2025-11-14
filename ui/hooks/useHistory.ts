/**
 * History Navigation Hook
 * Provides browser-like back/forward navigation functionality
 * Tracks navigation history and allows traversing through it
 */

import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export interface HistoryEntry {
  path: string;
  timestamp: number;
}

export interface HistoryState {
  stack: HistoryEntry[];
  currentIndex: number;
  canGoBack: boolean;
  canGoForward: boolean;
}

function useHistory(): [() => void, () => void, HistoryState] {
  const location = useLocation();
  const navigate = useNavigate();

  const [stack, setStack] = useState<HistoryEntry[]>([
    { path: location.pathname, timestamp: Date.now() },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Refs to avoid stale closures in handlers/effects
  const stackRef = useRef(stack);
  const indexRef = useRef(currentIndex);
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    stackRef.current = stack;
  }, [stack]);

  useEffect(() => {
    indexRef.current = currentIndex;
  }, [currentIndex]);

  const goBack = () => {
    if (indexRef.current > 0) {
      isNavigatingRef.current = true;
      const newIndex = indexRef.current - 1;
      setCurrentIndex(newIndex);
      navigate(-1);
    }
  };

  const goForward = () => {
    if (indexRef.current < stackRef.current.length - 1) {
      isNavigatingRef.current = true;
      const newIndex = indexRef.current + 1;
      setCurrentIndex(newIndex);
      navigate(1);
    }
  };

  useEffect(() => {
    // If this navigation was triggered by goBack/goForward, ignore adding a new entry
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }

    const newPath = location.pathname;
    const currentEntry = stackRef.current[indexRef.current];

    // Only add if it's different from current location
    if (!currentEntry || currentEntry.path !== newPath) {
      const newStack = stackRef.current.slice(0, indexRef.current + 1);
      newStack.push({ path: newPath, timestamp: Date.now() });
      setStack(newStack);
      setCurrentIndex(newStack.length - 1);
    }
     
  }, [location.pathname]);

  const historyState: HistoryState = {
    stack,
    currentIndex,
    canGoBack: currentIndex > 0,
    canGoForward: currentIndex < stack.length - 1,
  };

  return [goBack, goForward, historyState];
}

export default useHistory;