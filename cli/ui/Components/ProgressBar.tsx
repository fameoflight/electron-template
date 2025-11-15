/**
 * ProgressBar - Visual progress indicator for CLI operations
 *
 * Simple progress bar following refactor patterns:
 * - Options object for all configuration
 * - No complex state (controlled by parent)
 * - Clear, focused responsibility
 */
import React from 'react';
import { Box, Text } from 'ink';

export interface ProgressBarOptions {
  current: number;
  total: number;
  label?: string;
  width?: number;
  showPercentage?: boolean;
  color?: 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan';
}

/**
 * Calculate percentage
 */
function calculatePercentage(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
}

/**
 * Build progress bar string
 */
function buildBar(current: number, total: number, width: number): string {
  if (total === 0) return '░'.repeat(width);

  const percentage = current / total;
  const filled = Math.round(width * percentage);
  const empty = width - filled;

  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * ProgressBar Component
 *
 * Usage:
 *   <ProgressBar current={5} total={10} label="Files processed" />
 */
export function ProgressBar(opts: ProgressBarOptions) {
  const {
    current,
    total,
    label,
    width = 40,
    showPercentage = true,
    color = 'cyan',
  } = opts;

  const percentage = calculatePercentage(current, total);
  const bar = buildBar(current, total, width);

  return (
    <Box flexDirection="column">
      {label && (
        <Box marginBottom={1}>
          <Text>{label}</Text>
        </Box>
      )}
      <Box>
        <Text color={color}>{bar}</Text>
        {showPercentage && (
          <Text> {percentage}% ({current}/{total})</Text>
        )}
      </Box>
    </Box>
  );
}
