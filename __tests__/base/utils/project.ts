/**
 * Project-related test utilities
 *
 * Helpers for resolving project paths and directories during testing
 */

import * as path from 'path';

/**
 * Gets the actual project root directory where templates and source files are located
 *
 * @returns {string} Absolute path to the project root
 */
export function getProjectRoot(): string {
  // From __tests__/base/utils/project.ts, go up three levels to reach project root:
  // __tests__/base/utils/project.ts -> __tests__/base/ -> __tests__/ -> projectRoot
  // Use import.meta.url instead of __dirname for ES modules
  const __filename = new URL(import.meta.url).pathname;
  const __dirname = path.dirname(__filename);
  return path.resolve(__dirname, '../../..');
}

/**
 * Gets the temp directory path for test file generation
 *
 * @param {string} testName - Optional test name for subdirectory
 * @returns {string} Absolute path to temp directory
 */
export function getTempDir(testName?: string): string {
  const baseTempDir = path.join(process.cwd(), 'temp-test');
  return testName ? path.join(baseTempDir, testName) : baseTempDir;
}