/**
 * GraphQL Test Setup Utilities
 *
 * All-in-one setup for GraphQL tests including database, user, authentication, and cleanup.
 * This eliminates 15-20 lines of boilerplate setup code from each test file.
 */

import { DataSource } from 'typeorm';
import { createTestDatabase, cleanupTestDatabase } from '../base/testDatabase';
import { createUser } from '../factories/userFactory';
import { initializeGraphQLSchema } from '@main/graphql/server';
import { DataSourceProvider } from '@main/base';
import { setupSimplePolly, PollyContext } from '../polly/helpers';

/**
 * GraphQL test context with database, user, and cleanup utilities
 */
export interface GraphQLTestContext {
  /** Test database connection */
  dataSource: DataSource;
  /** Authenticated test user */
  user: any;
  /** Cleanup function to call in afterEach */
  cleanup: () => Promise<void>;
  /** Create authenticated context for GraphQL calls */
  createAuthContext: (sessionKey?: string) => { sessionKey: string };
  /** Get the user's session key for authentication */
  getSessionKey: () => string;
}

/**
 * GraphQL test context with Polly for HTTP mocking
 */
export interface GraphQLTestContextWithPolly extends GraphQLTestContext {
  /** Polly context for HTTP recording/mocking */
  polly: PollyContext;
}

/**
 * Setup GraphQL test environment with database and authenticated user
 *
 * @param options - Configuration options
 * @returns Promise<GraphQLTestContext> - Test context with cleanup
 *
 * @example
 * ```typescript
 * let ctx: GraphQLTestContext;
 *
 * beforeEach(async () => {
 *   ctx = await setupGraphQLTest();
 * });
 *
 * afterEach(async () => {
 *   await ctx.cleanup();
 * });
 * ```
 */
export async function setupGraphQLTest(options: {
  /** User data overrides for creating test user */
  userOverrides?: Partial<any>;
  /** Skip user creation if you want to create your own */
  skipUser?: boolean;
} = {}): Promise<GraphQLTestContext> {
  // Initialize GraphQL schema once
  await initializeGraphQLSchema();

  // Create isolated test database
  const dataSource = await createTestDatabase();

  // Create test user if not skipped
  let user: any;
  if (!options.skipUser) {
    user = await createUser(dataSource, options.userOverrides);
  }

  return {
    dataSource,
    user,
    cleanup: async () => {
      DataSourceProvider.clearTestDataSource();
      await cleanupTestDatabase(dataSource);
    },
    createAuthContext: (sessionKey?: string) => {
      if (!sessionKey && !user?.sessionKey) {
        throw new Error('No session key available. Provide sessionKey or create a user.');
      }
      return { sessionKey: sessionKey || user.sessionKey };
    },
    getSessionKey: () => {
      if (!user?.sessionKey) {
        throw new Error('No user available to get session key from.');
      }
      return user.sessionKey;
    }
  };
}

/**
 * Setup GraphQL test environment with Polly for HTTP mocking
 *
 * @param recordingName - Name for the Polly recording
 * @param options - Additional setup options
 * @returns Promise<GraphQLTestContextWithPolly> - Test context with Polly
 *
 * @example
 * ```typescript
 * let ctx: GraphQLTestContextWithPolly;
 *
 * beforeAll(async () => {
 *   ctx = await setupGraphQLTestWithPolly('connection-queries');
 * });
 *
 * afterAll(async () => {
 *   await ctx.cleanup();
 * });
 * ```
 */
export async function setupGraphQLTestWithPolly(
  recordingName: string,
  options: {
    userOverrides?: Partial<any>;
    skipUser?: boolean;
  } = {}
): Promise<GraphQLTestContextWithPolly> {
  // Setup Polly first for recording consistency
  const polly = setupSimplePolly({ recordingName });

  try {
    // Setup GraphQL test environment
    const graphqlContext = await setupGraphQLTest(options);

    return {
      ...graphqlContext,
      polly,
      cleanup: async () => {
        await graphqlContext.cleanup();
        await polly.stop();
      }
    };
  } catch (error) {
    // If setup fails, ensure Polly is stopped
    await polly.stop();
    throw error;
  }
}

/**
 * Setup multiple authenticated users for testing permissions
 *
 * @param userCount - Number of users to create
 * @param dataSource - Test database connection
 * @returns Promise<any[]> - Array of created users
 *
 * @example
 * ```typescript
 * let ctx: GraphQLTestContext;
 * let users: any[];
 *
 * beforeEach(async () => {
 *   ctx = await setupGraphQLTest();
 *   users = await setupMultipleUsers(3, ctx.dataSource);
 * });
 * ```
 */
export async function setupMultipleUsers(
  userCount: number,
  dataSource: DataSource,
  overrides?: Partial<any>
): Promise<any[]> {
  const users: any[] = [];
  for (let i = 0; i < userCount; i++) {
    const user = await createUser(dataSource, overrides);
    users.push(user);
  }
  return users;
}

/**
 * Create a test context with multiple authenticated users
 *
 * @param userCount - Number of users to create
 * @param options - Additional setup options
 * @returns Promise<GraphQLTestContext & { users: any[] }> - Test context with multiple users
 *
 * @example
 * ```typescript
 * let ctx: GraphQLTestContext & { users: any[] };
 *
 * beforeEach(async () => {
 *   ctx = await setupGraphQLTestWithMultipleUsers(3);
 * });
 *
 * // Use different users for testing
 * test('user1 can access their own data', async () => {
 *   const user1Context = ctx.createAuthContext(ctx.users[0].sessionKey);
 *   // ... test with user1
 * });
 * ```
 */
export async function setupGraphQLTestWithMultipleUsers(
  userCount: number,
  options: {
    userOverrides?: Partial<any>;
  } = {}
): Promise<GraphQLTestContext & { users: any[] }> {
  const baseContext = await setupGraphQLTest({ skipUser: true });
  const users = await setupMultipleUsers(userCount, baseContext.dataSource, options.userOverrides);

  return {
    ...baseContext,
    user: users[0], // Primary user
    users,
    createAuthContext: (sessionKey?: string) => {
      if (!sessionKey && !users[0]?.sessionKey) {
        throw new Error('No session key available. Provide sessionKey or create users.');
      }
      return { sessionKey: sessionKey || users[0].sessionKey };
    }
  };
}