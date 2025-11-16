/**
 * Hook for polling chat streaming status updates using existing utilities
 */
import { useState, useEffect, useCallback } from "react";
import { getChatStatuses } from "./chatUtils";

interface ChatStreamingStatus {
  hasStreamingMessages: boolean;
  statuses: string[];
  lastUpdated: string;
}

export function useChatStreamingStatus(
  chatId: string | null,
  enabled: boolean = true
) {
  const [status, setStatus] = useState<ChatStreamingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const checkStreamingStatus = useCallback(async () => {
    if (!chatId || !enabled) return;

    setIsLoading(true);
    try {
      // Use the existing getChatStatuses function which checks ALL versions in ALL messages
      const statuses = await getChatStatuses(chatId);

      // Chat is streaming if ANY version has streaming or pending status
      const hasStreaming = statuses.includes('streaming') || statuses.includes('pending');

      setStatus({
        hasStreamingMessages: hasStreaming,
        statuses,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to check chat streaming status:', error);
      setStatus({
        hasStreamingMessages: false,
        statuses: [],
        lastUpdated: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  }, [chatId, enabled]);

  // Initial check and polling
  useEffect(() => {
    if (!chatId || !enabled) return;

    // Check immediately
    checkStreamingStatus();

    // Set up polling with adaptive interval
    setIsPolling(true);
    let interval: NodeJS.Timeout;

    const startPolling = async () => {
      const initialStatuses = await getChatStatuses(chatId);
      const hasStreaming = initialStatuses.includes('streaming') || initialStatuses.includes('pending');

      // Poll faster (200ms) when streaming, slower (1s) when idle
      const intervalMs = hasStreaming ? 200 : 1000;

      interval = setInterval(checkStreamingStatus, intervalMs);
    };

    startPolling();

    return () => {
      if (interval) clearInterval(interval);
      setIsPolling(false);
    };
  }, [chatId, enabled, checkStreamingStatus]);

  const refetch = useCallback(() => {
    checkStreamingStatus();
  }, [checkStreamingStatus]);

  return {
    status,
    isLoading,
    refetch,
    isPolling,
    isStreaming: status?.hasStreamingMessages || false
  };
}