/**
 * FileTree - Display generated files in tree format
 *
 * Shows files in a hierarchical tree structure:
 * - Options object for configuration
 * - Helper functions for tree formatting
 * - No complex state management
 */
import React from 'react';
import { Box, Text } from 'ink';

export interface FileTreeItem {
  path: string;
  status?: 'created' | 'updated' | 'skipped' | 'error';
}

export interface FileTreeOptions {
  title?: string;
  items: FileTreeItem[];
  showStatus?: boolean;
  indent?: number;
}

/**
 * Get status icon and color
 */
function getStatusDisplay(status?: string): { icon: string; color: string } {
  const displays: Record<string, { icon: string; color: string }> = {
    created: { icon: '✔', color: 'green' },
    updated: { icon: '↻', color: 'yellow' },
    skipped: { icon: '→', color: 'gray' },
    error: { icon: '✖', color: 'red' },
  };

  return displays[status || 'created'] || displays.created;
}

/**
 * Get tree branch character
 */
function getBranch(isLast: boolean): string {
  return isLast ? '└─' : '├─';
}

/**
 * FileTree Component
 *
 * Usage:
 *   <FileTree
 *     title="Generated Files"
 *     items={[
 *       { path: 'User.ts', status: 'created' },
 *       { path: 'Chat.ts', status: 'updated' }
 *     ]}
 *   />
 */
export function FileTree(opts: FileTreeOptions) {
  const { title, items, showStatus = true, indent = 0 } = opts;
  const padding = ' '.repeat(indent);

  return (
    <Box flexDirection="column">
      {title && (
        <Box marginBottom={1}>
          <Text bold>{padding}{title}</Text>
        </Box>
      )}
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const branch = getBranch(isLast);
        const { icon, color } = getStatusDisplay(item.status);

        return (
          <Box key={index}>
            <Text dimColor>{padding}  {branch} </Text>
            {showStatus && (
              <Text color={color}>{icon} </Text>
            )}
            <Text>{item.path}</Text>
          </Box>
        );
      })}
    </Box>
  );
}
