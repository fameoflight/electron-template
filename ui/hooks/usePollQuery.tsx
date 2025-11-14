import React, { useEffect, useRef, useState } from 'react';
import {
  CacheConfig,
  FetchPolicy,
  GraphQLTaggedNode,
  OperationType,
  RenderPolicy,
  VariablesOf,
} from 'relay-runtime';
import { useNetworkLazyReloadQuery } from './relay';

interface UsePollQueryOptions<TQuery extends OperationType> {
  // Existing options from useNetworkLazyReloadQuery
  fetchPolicy?: FetchPolicy;
  networkCacheConfig?: CacheConfig;
  UNSTABLE_renderPolicy?: RenderPolicy;

  // Auto-refresh specific options
  enabled?: boolean; // default: true
  deriveRefreshInterval?: (data: TQuery['response']) => number | null; // Dynamic interval based on data, null = no refresh
  defaultInterval?: number; // default: 10000ms (10 seconds)
  maxInterval?: number; // default: 30000ms (30 seconds)
  minInterval?: number; // default: 1000ms (1 second)
  pauseWhenHidden?: boolean; // default: true (Page Visibility API)
}

type UsePollQueryResponse<TQuery extends OperationType> = [
  TQuery['response'], // data
  () => void, // forceFetch (manual refresh)
  boolean, // isAutoRefreshing
  string // fetchKey
];

export function usePollQuery<TQuery extends OperationType>(
  gqlQuery: GraphQLTaggedNode,
  variables?: VariablesOf<TQuery>,
  options: UsePollQueryOptions<TQuery> = {}
): UsePollQueryResponse<TQuery> {
  const {
    enabled = true,
    deriveRefreshInterval: getRefreshInterval,
    defaultInterval = 10000,
    maxInterval = 30000,
    minInterval = 1000,
    pauseWhenHidden = true,
    ...relayOptions
  } = options;

  const [data, refreshData, fetchKey] = useNetworkLazyReloadQuery<TQuery>(
    gqlQuery,
    variables,
    relayOptions
  );

  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPageVisible = useRef(true);

  // Get the appropriate refresh interval based on current data
  const getRefreshIntervalMs = React.useCallback(() => {
    if (!enabled) return null;

    let interval: number | null = defaultInterval;

    if (getRefreshInterval) {
      const customInterval = getRefreshInterval(data);
      if (customInterval !== null) {
        interval = customInterval;
      }
    }

    if (interval === null) return null;

    // Clamp interval between min and max
    return Math.max(minInterval, Math.min(maxInterval, interval));
  }, [enabled, getRefreshInterval, data, defaultInterval, maxInterval, minInterval]);

  // Handle page visibility changes
  useEffect(() => {
    if (!pauseWhenHidden) return;

    const handleVisibilityChange = () => {
      isPageVisible.current = !document.hidden;

      // If page becomes visible and we have an interval setup, restart it
      if (isPageVisible.current && enabled && intervalRef.current) {
        startAutoRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pauseWhenHidden, enabled]);

  // Function to start auto-refresh
  const startAutoRefresh = React.useCallback(() => {
    if (!enabled || (pauseWhenHidden && !isPageVisible.current)) return;

    const intervalMs = getRefreshIntervalMs();
    if (intervalMs === null || intervalMs <= 0) return;

    setIsAutoRefreshing(true);

    intervalRef.current = setInterval(() => {
      // Only refresh if page is visible (if enabled) and we're still enabled
      if (enabled && (!pauseWhenHidden || isPageVisible.current)) {
        refreshData();
      } else {
        // Pause auto-refresh if conditions changed
        stopAutoRefresh();
      }
    }, intervalMs);
  }, [enabled, pauseWhenHidden, getRefreshIntervalMs, refreshData]);

  // Function to stop auto-refresh
  const stopAutoRefresh = React.useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsAutoRefreshing(false);
  }, []);

  // Force fetch function that also restarts auto-refresh with new interval
  const forceFetch = React.useCallback(() => {
    refreshData();

    // Restart auto-refresh with potentially new interval
    if (enabled) {
      stopAutoRefresh();
      startAutoRefresh();
    }
  }, [refreshData, enabled, stopAutoRefresh, startAutoRefresh]);

  // Main effect to manage auto-refresh
  useEffect(() => {
    if (enabled) {
      stopAutoRefresh();
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }

    return () => {
      stopAutoRefresh();
    };
  }, [enabled, startAutoRefresh, stopAutoRefresh]);

  // Restart auto-refresh when interval calculation changes
  useEffect(() => {
    if (enabled && isAutoRefreshing) {
      stopAutoRefresh();
      startAutoRefresh();
    }
  }, [getRefreshIntervalMs, enabled, isAutoRefreshing, stopAutoRefresh, startAutoRefresh]);

  return [data, forceFetch, isAutoRefreshing, fetchKey];
}

export default usePollQuery;