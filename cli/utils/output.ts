/**
 * Global Output Utility - Singleton OutputManager for CLI operations
 *
 * Provides a global OutputManager instance for use in generators and utilities
 * that don't extend BaseCommand.
 *
 * Usage:
 *   import { output } from '../utils/output.js';
 *   output.info('Processing...');
 *   output.success('Done!');
 */

import { OutputManager, type OutputManagerOptions } from '../ui/index.js';

/**
 * Global OutputManager instance
 * Configured with colors enabled for better UX
 */
export const output = new OutputManager({
  colors: true,
  verbose: false,
  timestamps: false,
  silent: false,
});

/**
 * Create a new OutputManager instance with custom options
 * Use this when you need different settings than the global instance
 */
export function createOutput(options: OutputManagerOptions = {}) {
  return new OutputManager(options);
}
