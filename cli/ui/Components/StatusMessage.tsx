/**
 * StatusMessage - Display status messages with icons and colors
 *
 * A simple, focused component for CLI output following the refactor pattern:
 * - Single responsibility: Display styled status messages
 * - Options object for configuration
 * - No complex logic
 */
import React from 'react';
import { Box, Text } from 'ink';

export type MessageType = 'success' | 'error' | 'warning' | 'info' | 'progress';

export interface StatusMessageOptions {
  type: MessageType;
  message: string;
  details?: string;
  indent?: number;
  timestamp?: boolean;
}

/**
 * Get icon for message type
 */
function getIcon(type: MessageType): string {
  const icons: Record<MessageType, string> = {
    success: '✔',
    error: '✖',
    warning: '⚠',
    info: 'ℹ',
    progress: '→',
  };
  return icons[type];
}

/**
 * Get color for message type
 */
function getColor(type: MessageType): string {
  const colors: Record<MessageType, string> = {
    success: 'green',
    error: 'red',
    warning: 'yellow',
    info: 'blue',
    progress: 'cyan',
  };
  return colors[type];
}

/**
 * Format timestamp
 */
function formatTimestamp(): string {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour12: false });
}

/**
 * StatusMessage Component
 */
export function StatusMessage(opts: StatusMessageOptions) {
  const { type, message, details, indent = 0, timestamp = false } = opts;

  const icon = getIcon(type);
  const color = getColor(type);
  const padding = ' '.repeat(indent);

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={color} bold>
          {padding}{icon} {message}
        </Text>
        {timestamp && (
          <Text dimColor> [{formatTimestamp()}]</Text>
        )}
      </Box>
      {details && (
        <Box marginLeft={indent + 2}>
          <Text dimColor>{details}</Text>
        </Box>
      )}
    </Box>
  );
}
