/**
 * Polly.js helper functions for tests
 *
 * Provides utilities for setting up and configuring Polly in tests
 */

import { Polly, PollyConfig } from '@pollyjs/core';
import { defaultPollyConfig, getPollyMode, sanitizeRecordingName } from './setup';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';

/**
 * Type definition for Polly context returned by setup functions
 */
export interface PollyContext {
  polly?: Polly;
  stop: () => Promise<void>;
}

/**
 * Setup Polly for a test suite
 * Returns a ref object that will contain the Polly instance
 *
 * Usage:
 * ```typescript
 * const pollyContext = setupPolly();
 *
 * it('should make API call', async () => {
 *   // pollyContext.polly is available here
 * });
 * ```
 */
export function setupPolly(options: {
  recordingName?: string;
  config?: Partial<PollyConfig>;
} = {}): PollyContext {
  const context: { polly?: Polly } = {};

  const recordingName = options.recordingName || 'manual-setup';
  const config: PollyConfig = {
    ...defaultPollyConfig,
    ...options.config,
    mode: getPollyMode(),
    recordingName,
  } as PollyConfig;


  context.polly = new Polly(recordingName, config);

  // Add better error handling for both replay and record modes
  context.polly.server
    .any()
    .on('error', (req, error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Handle connection errors gracefully in tests
      if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed')) {
        // For connection tests, we want these errors to be handled by the test timeout logic
        // so we don't throw them here
        console.warn(`Polly caught connection error for ${req.url}: ${errorMessage}`);
        return;
      }

      if (config.mode === 'replay') {
        if (errorMessage.includes('Recording not found') || errorMessage.includes('ENOTFOUND')) {
          throw new Error(
            `❌ Polly recording not found for: ${req.url}\n` +
            `📁 Recording name: ${recordingName}\n` +
            `💡 To create recordings, run: RECORD=true yarn test __tests__/polly/polly.test.ts\n` +
            `💡 Or for development: POLLY_MODE=passthrough yarn test __tests__/polly/polly.test.ts`
          );
        }
      }

      throw error;
    });

  return {
    ...context,
    stop: async () => {
      if (context.polly) {
        await context.polly.stop();
        context.polly = undefined;
      }
    }
  };
}

/**
 * Configure Polly to sanitize sensitive data in recordings
 */
export function sanitizeRecordings(polly: Polly) {
  // Remove API keys from headers
  polly.server
    .any()
    .on('beforePersist', (req, recording) => {
      // Remove authorization headers
      delete recording.request.headers['authorization'];
      delete recording.request.headers['api-key'];
      delete recording.request.headers['x-api-key'];

      // Remove bearer tokens
      if (recording.request.headers['authorization']) {
        recording.request.headers['authorization'] = 'Bearer ***';
      }
    });
}

/**
 * Configure Polly to pause on specific URLs
 * Useful for making real requests to specific endpoints while replaying others
 */
export function pauseOnUrls(polly: Polly, urls: string[]) {
  urls.forEach((url) => {
    polly.server.any(url).passthrough();
  });
}

/**
 * Configure Polly to fail fast on missing recordings (CI mode)
 */
export function failOnMissingRecordings(polly: Polly) {
  polly.server
    .any()
    .on('error', (req, error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Recording not found')) {
        throw new Error(
          `Recording not found. Run tests with RECORD=true to create recordings.\n${errorMessage}`
        );
      }
      throw error;
    });
}

/**
 * Configure Polly for embedding API calls
 * - Matches by body content (not headers)
 * - Records if missing (in development)
 * Example usage:
 * ```typescript
 *   beforeAll(async () => {
     await initializeGraphQLSchema();
     // Setup Polly once for the entire test suite
     pollyContext = setupSimplePolly({
       recordingName: 'connection-queries',
     });
   });
 
   afterAll(async () => {
     // Cleanup Polly once after all tests
     if (pollyContext) {
       await pollyContext.stop();
     }
   });
  * ```
 */
export function setupSimplePolly(options: {
  recordingName?: string;
} = {}): PollyContext {
  const context = setupPolly({
    recordingName: options.recordingName,
    config: {
      matchRequestsBy: {
        method: true,
        headers: false, // Don't match headers (API keys)
        body: true, // Match by request body
        order: false,
      },
    },
  });

  // Apply sanitization immediately
  if (context.polly) {
    sanitizeRecordings(context.polly);

    if (process.env.REPLAY_ONLY === 'true') {
      failOnMissingRecordings(context.polly);
    }
  }

  return context;
}


