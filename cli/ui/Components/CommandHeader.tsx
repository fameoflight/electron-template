/**
 * CommandHeader - Consistent header for CLI commands
 *
 * Provides a unified look for command output:
 * - Options object for configuration
 * - Single responsibility: Display command headers
 * - No business logic
 */
import React from 'react';
import { Box, Text } from 'ink';

export interface CommandHeaderOptions {
  title: string;
  subtitle?: string;
  showBorder?: boolean;
  borderColor?: 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan';
}

/**
 * Build border line
 */
function buildBorder(length: number): string {
  return '─'.repeat(length);
}

/**
 * CommandHeader Component
 *
 * Usage:
 *   <CommandHeader title="Schema Generation" subtitle="Generate GraphQL schema from entities" />
 */
export function CommandHeader(opts: CommandHeaderOptions) {
  const { title, subtitle, showBorder = true, borderColor = 'cyan' } = opts;

  const titleLength = title.length;
  const border = buildBorder(titleLength + 4);

  if (!showBorder) {
    return (
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color={borderColor}>
          {title}
        </Text>
        {subtitle && <Text dimColor>{subtitle}</Text>}
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color={borderColor}>┌─{border}─┐</Text>
      <Text color={borderColor}>
        │  <Text bold>{title}</Text>  │
      </Text>
      <Text color={borderColor}>└─{border}─┘</Text>
      {subtitle && (
        <Box marginTop={1}>
          <Text dimColor>{subtitle}</Text>
        </Box>
      )}
    </Box>
  );
}
