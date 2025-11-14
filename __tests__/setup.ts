/**
 * Global test setup for integration tests
 *
 * Sets up:
 * - Isolated test database directory per test run
 * - Canvas/WebGL mocks for PDF parsing
 * - Database cleanup hooks
 * - Polly.js adapters for HTTP recording/replay
 */

// Import reflect-metadata first - required for TypeGraphQL decorators
import 'reflect-metadata';

import { afterEach, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';

// Load entities to ensure they're available for all tests
import { loadEntities } from '@main/db/entityMap';
import fs from 'fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';

import { Polly } from '@pollyjs/core';
import FSPersister from '@pollyjs/persister-fs';
import FetchAdapter from '@pollyjs/adapter-fetch';
import NodeHttpAdapter from '@pollyjs/adapter-node-http';

// Load database entities
loadEntities();

Polly.register(FSPersister);
Polly.register(FetchAdapter);
Polly.register(NodeHttpAdapter);

// Generate unique test directory per test run to avoid parallel test conflicts
const testId = Math.random().toString(36).substring(7);
export const TEST_DATA_DIR = path.join(tmpdir(), `codeblocks-test-${testId}`);

// Set NODE_ENV to test for TypeORM auto-sync
process.env.NODE_ENV = 'test';

// Mock HTMLCanvasElement for PDF.js
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn((contextType: string) => {
    if (contextType === 'webgl' || contextType === 'webgl2') {
      return {
        getExtension: vi.fn(),
        getParameter: vi.fn(),
        getShaderPrecisionFormat: vi.fn(() => ({
          precision: 1,
          rangeMin: 1,
          rangeMax: 1,
        })),
      };
    }
    // Return 2D context
    return {
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(() => ({ data: new Array(4) })),
      putImageData: vi.fn(),
      createImageData: vi.fn(() => ({ data: new Array(4) })),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      fillText: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
      transform: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
    };
  }),
  writable: true,
});

// Mock OffscreenCanvas if it exists
if (typeof OffscreenCanvas !== 'undefined') {
  Object.defineProperty(OffscreenCanvas.prototype, 'getContext', {
    value: vi.fn(() => ({
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(() => ({ data: new Array(4) })),
      putImageData: vi.fn(),
      createImageData: vi.fn(() => ({ data: new Array(4) })),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      fillText: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
      transform: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
    })),
    writable: true,
  });
}

beforeEach(async () => {
  // Clean up test directory before each test
  try {
    await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
  } catch (error) {
    // Directory might not exist, that's ok
  }

  // Create fresh test directory
  await fs.mkdir(TEST_DATA_DIR, { recursive: true });
});

afterEach(async () => {
  // Clear database tables between tests (keeps DataSource alive)
  try {
    const DataSourceProvider = (await import('@base/db/DataSourceProvider')).default;
    const dataSource = DataSourceProvider.get();

    if (dataSource?.isInitialized) {
      const entities = dataSource.entityMetadatas;

      // Clear all tables in reverse order to handle foreign key constraints
      for (const entity of entities.reverse()) {
        const repository = dataSource.getRepository(entity.name);
        await repository.clear();
      }
    }
  } catch (error) {
    // Only show cleanup warnings in debug mode
    if (process.env.POLLY_DEBUG || process.env.TEST_DEBUG) {
      console.warn('⚠️  Database cleanup warning:', error);
    }
    // Don't throw - allow tests to continue
  }

  // Give a brief moment for any pending file operations to complete
  await new Promise((resolve) => setTimeout(resolve, 10));

  // Clean up test directory after each test with retry logic
  const maxRetries = 3;
  const retryDelay = 50; // ms

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true, maxRetries: 3 });
      break; // Success, exit retry loop
    } catch (error) {
      if (attempt === maxRetries) {
        // Only show cleanup warnings in debug mode
        if (process.env.POLLY_DEBUG || process.env.TEST_DEBUG) {
          console.warn('⚠️  Cleanup failed after final attempt:', error);
        }
        // Try a more forceful cleanup as last resort
        try {
          await new Promise((resolve) => setTimeout(resolve, 100));
          await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
        } catch (finalError) {
          if (process.env.POLLY_DEBUG || process.env.TEST_DEBUG) {
            console.warn('⚠️  Final cleanup attempt failed:', finalError);
          }
        }
      } else {
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }
});
