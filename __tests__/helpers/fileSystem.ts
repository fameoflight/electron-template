/**
 * File System Test Helpers
 *
 * Utility functions for creating and cleaning up test directories
 * during file system related tests.
 */

import fs from 'fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';

/**
 * Create a temporary test directory
 *
 * @param prefix - Optional prefix for the directory name
 * @returns Promise resolving to the created directory path
 */
export async function createTestDirectory(prefix: string = 'test'): Promise<string> {
  const testId = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const testDir = path.join(tmpdir(), testId);

  await fs.mkdir(testDir, { recursive: true });
  return testDir;
}

/**
 * Clean up a test directory and all its contents
 *
 * @param testDir - Path to the test directory to clean up
 * @returns Promise that resolves when cleanup is complete
 */
export async function cleanupTestDirectory(testDir: string): Promise<void> {
  try {
    await fs.rm(testDir, { recursive: true, force: true });
  } catch (error) {
    // Ignore cleanup errors - directory might not exist or permission issues
    // This is common in test environments
    console.warn('Warning: Failed to cleanup test directory:', testDir, error);
  }
}