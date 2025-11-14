/**
 * Polly.js setup for Vitest
 *
 * Provides VCR-like functionality for recording and replaying HTTP requests
 *
 * NOTE: Polly adapters are registered in __tests__/setup.ts (runs for all test files)
 * This file only contains configuration and helper utilities
 */

import { PollyConfig } from '@pollyjs/core';
import path from 'node:path';

/**
 * Default Polly configuration
 */
export const defaultPollyConfig: Partial<PollyConfig> = {
  adapters: ['fetch', 'node-http'],
  persister: 'fs',
  persisterOptions: {
    fs: {
      recordingsDir: path.join(__dirname, '../recordings'),
    },
  },
  recordIfMissing: true,
  recordFailedRequests: true, // Allow recording failed requests for testing error scenarios
  matchRequestsBy: {
    method: true,
    headers: false, // Don't match by headers (API keys change, User-Agent varies)
    body: false, // Don't match by body for GET requests (no body)
    order: false,
    url: true, // Match by URL exactly
  },
};

/**
 * Get Polly mode from environment
 */
export function getPollyMode(): 'replay' | 'record' | 'passthrough' | 'stopped' {
  if (process.env.POLLY_MODE) {
    return process.env.POLLY_MODE as any;
  }

  if (process.env.RECORD === 'true') {
    return 'record';
  }

  if (process.env.REPLAY_ONLY === 'true') {
    return 'replay';
  }

  // Default: replay (use existing recordings, fail fast if missing)
  // This enables offline testing by default
  return 'replay';
}

/**
 * Create sanitized recording name from test name
 * Removes special characters and limits length
 */
export function sanitizeRecordingName(testName: string): string {
  return testName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}
