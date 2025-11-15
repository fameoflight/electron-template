/**
 * CLI UI Module - Ink-based terminal UI components and services
 *
 * Exports all UI components and the OutputManager service
 */

// Export OutputManager service
export {
  OutputManager,
  type OutputManagerOptions,
  type SpinnerHandle,
  type ProgressHandle,
} from './OutputManager.js';

// Export all components
export * from './Components/index.js';
