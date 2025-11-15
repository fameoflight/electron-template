/**
 * CommandSpinner - Animated spinner for long-running operations
 *
 * Wraps ink-spinner with a clean API following refactor patterns:
 * - Options object for configuration
 * - Simple, focused component
 * - No complex state management
 */
import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

export interface CommandSpinnerOptions {
  text: string;
  color?: 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan';
  indent?: number;
}

/**
 * CommandSpinner Component
 *
 * Usage:
 *   <CommandSpinner text="Generating schema..." color="cyan" />
 */
export function CommandSpinner(opts: CommandSpinnerOptions) {
  const { text, color = 'cyan', indent = 0 } = opts;
  const padding = ' '.repeat(indent);

  return (
    <Box>
      <Text color={color}>
        {padding}
        <Spinner type="dots" /> {text}
      </Text>
    </Box>
  );
}
