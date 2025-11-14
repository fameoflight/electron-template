/**
 * Main Process Initialization Test
 *
 * Tests the actual main process initialization to catch:
 * - Circular imports
 * - Module resolution issues
 * - Database/GraphQL schema problems
 * - Missing dependencies
 *
 * This test runs the real initialization logic but mocks Electron UI components
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { IpcMain } from 'electron';

// Mock electron modules - define everything inline to avoid hoisting issues
vi.mock('electron', () => {
  const mockBrowserWindow = {
    getAllWindows: () => [],
    webContents: {
      on: vi.fn(),
      send: vi.fn(),
      openDevTools: vi.fn(),
      executeJavaScript: vi.fn().mockResolvedValue(true),
      setWindowOpenHandler: vi.fn(),
    },
    on: vi.fn(),
    loadURL: vi.fn(),
    loadFile: vi.fn(),
    hide: vi.fn(),
    destroy: vi.fn(),
    isDestroyed: vi.fn().mockReturnValue(true),
    isMinimized: vi.fn().mockReturnValue(false),
    restore: vi.fn(),
    focus: vi.fn(),
  };

  const mockApp = {
    whenReady: () => Promise.resolve(),
    setName: vi.fn(),
    requestSingleInstanceLock: () => true,
    on: vi.fn(),
    quit: vi.fn(),
    getPath: vi.fn().mockReturnValue('/tmp'),
  };

  const mockIpcMain = {
    on: vi.fn(),
    handle: vi.fn(),
  };

  const mockShell = {
    openExternal: vi.fn(),
  };

  return {
    app: mockApp,
    BrowserWindow: vi.fn(() => mockBrowserWindow),
    ipcMain: mockIpcMain,
    shell: mockShell,
  };
});

// Mock JobQueue to prevent actual background jobs
vi.mock('@main/services/JobQueue.js', () => {
  return {
    default: class MockJobQueue {
      constructor() {
        // Mock constructor
      }
      async start() {
        return undefined;
      }
      async stop() {
        return undefined;
      }
      getStatus() {
        return { runningJobs: [] };
      }
      async getStats() {
        return { pending: 0, completed: 0, failed: 0 };
      }
      registerJob() {
        return undefined;
      }
      registerJobs() {
        return undefined;
      }
      getAvailableJobTypes() {
        return [];
      }
    }
  };
});

// Mock SystemTrayService to prevent actual tray creation
vi.mock('@main/services/SystemTrayService', () => ({
  SystemTrayService: vi.fn().mockImplementation(() => ({
    createTray: vi.fn().mockResolvedValue(undefined),
    updateJobQueueStatus: vi.fn(),
    destroy: vi.fn(),
  })),
}));

// Mock MenuService to prevent actual menu creation
vi.mock('@main/services/MenuService', () => ({
  MenuService: vi.fn().mockImplementation(() => ({
    createApplicationMenu: vi.fn(),
    registerGlobalShortcuts: vi.fn(),
    unregisterGlobalShortcuts: vi.fn(),
  })),
}));

// Mock IconService to prevent actual icon operations
vi.mock('@main/services/IconService', () => ({
  IconService: {
    getInstance: vi.fn().mockReturnValue({
      getWindowIconOptions: vi.fn().mockResolvedValue({}),
      setupDockIcon: vi.fn().mockResolvedValue(undefined),
      setupDockIconAfterWindowCreation: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

// Mock DataSourceProvider to prevent database dependency in JobQueue constructor
vi.mock('@main/base/db/DataSourceProvider', () => ({
  DataSourceProvider: {
    get: vi.fn().mockReturnValue({
      getRepository: vi.fn().mockReturnValue({
        find: vi.fn(),
        findOne: vi.fn(),
        save: vi.fn(),
        remove: vi.fn(),
        count: vi.fn().mockResolvedValue(0),
      }),
    }),
  },
}));

// Static imports after mocking
import { initializeDatabase } from '@db/dataSource';
import { initializeGraphQLSchema } from '@main/graphql/server';
import { setupHandlers } from '@main/handlers';
import { registerJobs } from '@main/jobs/index.js';
import JobQueue from '@main/services/JobQueue.js';

// Create mock instances for test usage
const createMockIpcMain = (): IpcMain => ({
  on: vi.fn(),
  handle: vi.fn(),
  addListener: vi.fn(),
  handleOnce: vi.fn(),
  off: vi.fn(),
  once: vi.fn(),
  removeAllListeners: vi.fn(),
  setMaxListeners: vi.fn(),
  getMaxListeners: vi.fn(),
  listenerCount: vi.fn(),
  listeners: vi.fn(),
  emit: vi.fn(),
  eventNames: vi.fn(),
  prependListener: vi.fn(),
  prependOnceListener: vi.fn(),
  rawListeners: vi.fn(),
} as any);

describe('Main Process Initialization', () => {
  beforeEach(() => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.VITE_DEV_SERVER_URL = 'http://localhost:5173';

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any global state
    delete (global as any).__jobQueue;
    delete (global as any).__jobQueueInitPromise;
  });

  it('should initialize database and GraphQL schema without errors', async () => {
    // Test the actual database and GraphQL initialization
    // This will catch circular imports and missing dependencies

    expect(typeof initializeDatabase).toBe('function');
    expect(typeof initializeGraphQLSchema).toBe('function');

    // These should not throw - if they do, there are import/dependency issues
    const dbInitPromise = initializeDatabase();
    const gqlInitPromise = initializeGraphQLSchema();

    // initializeDatabase returns CustomDataSource
    await expect(dbInitPromise).resolves.toBeDefined();
    expect(await dbInitPromise).toHaveProperty('isInitialized');

    // initializeGraphQLSchema returns GraphQLSchema
    await expect(gqlInitPromise).resolves.toBeDefined();
  });

  it('should load and execute main process handlers without errors', async () => {
    // Test that handlers can be imported and initialized

    expect(typeof setupHandlers).toBe('function');

    // This should not throw - catches handler initialization issues
    const mockIpc = createMockIpcMain();
    expect(() => setupHandlers(mockIpc)).not.toThrow();
  });

  it('should register all jobs without import errors', async () => {
    // Test job registration - catches issues in job imports

    const mockJobQueue = new JobQueue();

    // This should not throw - catches job definition issues
    expect(() => registerJobs(mockJobQueue)).not.toThrow();
  });

  it('should execute the main initialization flow', async () => {
    // Test the complete initialization flow that happens in main/index.ts
    // This is the closest we can get to `yarn dev` without creating windows

    try {
      // Initialize core components (same as main/index.ts:362-365)
      await Promise.all([
        initializeDatabase(),
        initializeGraphQLSchema()
      ]);

      // Setup handlers (same as main/index.ts:369)
      const mockIpc = createMockIpcMain();
      setupHandlers(mockIpc);

      // If we get here without throwing, the main process can initialize successfully
      expect(true).toBe(true);
    } catch (error) {
      // If there's an error, fail with details about what went wrong
      const errorMessage = error instanceof Error ? error.message : String(error);
      expect.fail(`Main process initialization failed: ${errorMessage}`);
    }
  });

  it('should handle all critical imports without circular dependency issues', async () => {
    // Test that all our static imports work (which means no circular dependencies)

    // If we can import these modules at the top of the file, there are no circular deps
    expect(typeof initializeDatabase).toBe('function');
    expect(typeof initializeGraphQLSchema).toBe('function');
    expect(typeof setupHandlers).toBe('function');
    expect(typeof registerJobs).toBe('function');
    expect(typeof JobQueue).toBe('function');

    // Basic smoke test - all modules should be usable
    expect(initializeDatabase).toBeDefined();
    expect(initializeGraphQLSchema).toBeDefined();
    expect(setupHandlers).toBeDefined();
    expect(registerJobs).toBeDefined();
    expect(JobQueue).toBeDefined();
  });
});