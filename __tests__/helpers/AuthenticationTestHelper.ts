/**
 * Authentication Test Helper
 *
 * Provides utilities for authentication-related test operations.
 * Eliminates repetition in user creation and auth context setup.
 *
 * Following refactoring principles:
 * - Maximum 5 parameters per method
 * - Options pattern for 3+ parameters
 * - Helper methods remove friction
 * - DRY patterns for common auth operations
 */

import { DataSource } from 'typeorm';
import { createUser } from '@factories/index';
import { GraphQLContext } from '@shared/types';

/**
 * Options for user creation in tests
 */
export interface UserCreationOptions {
  /** Username for the test user */
  username?: string;
  /** Display name for the test user */
  name?: string;
  /** Whether to create a session key */
  createSession?: boolean;
  /** Additional user properties */
  additionalProps?: Record<string, any>;
}

/**
 * Options for authentication context creation
 */
export interface AuthContextOptions {
  /** User object or session key */
  userOrSessionKey?: any | string;
  /** Additional context properties */
  additionalContext?: Record<string, any>;
  /** Whether to create a user if session key not provided */
  createUserIfMissing?: boolean;
  /** Data source for user creation (if needed) */
  dataSource?: DataSource;
}

/**
 * Authentication test data structure
 */
export interface AuthTestData {
  /** User object */
  user: any;
  /** Session key */
  sessionKey: string;
  /** GraphQL context */
  context: GraphQLContext;
  /** Global user ID */
  globalUserId: string;
}

/**
 * Helper class for authentication-related test operations
 */
export class AuthenticationTestHelper {
  /**
   * Create a test user with optional custom properties
   *
   * @param dataSource - TypeORM data source
   * @param options - User creation options
   * @returns Created user object
   */
  static async createUser(
    dataSource: DataSource,
    options: UserCreationOptions = {}
  ): Promise<any> {
    const {
      username,
      name,
      createSession = true,
      additionalProps = {}
    } = options;

    return await createUser(dataSource, {
      username,
      name,
      ...additionalProps
    });
  }

  /**
   * Create authentication context from user or session key
   *
   * @param options - Context creation options
   * @returns GraphQL context object
   */
  static createAuthContext(options: AuthContextOptions): GraphQLContext {
    const {
      userOrSessionKey,
      additionalContext = {},
      createUserIfMissing = false,
      dataSource
    } = options;

    let user: GraphQLContext['user'] = null;

    if (typeof userOrSessionKey === 'string') {
      // Session key provided - create a mock user for testing
      user = {
        id: userOrSessionKey,
        username: 'test-user',
        name: 'Test User'
      };
    } else if (userOrSessionKey && userOrSessionKey.id) {
      // User object provided
      user = userOrSessionKey;
    } else if (createUserIfMissing && dataSource) {
      // Create new user if needed (asynchronous case handled in async method)
      throw new Error('Use createAuthContextAsync for automatic user creation');
    }

    return {
      user,
      ...additionalContext
    };
  }

  /**
   * Create authentication context with automatic user creation if needed
   *
   * @param options - Context creation options
   * @returns GraphQL context object
   */
  static async createAuthContextAsync(
    options: AuthContextOptions
  ): Promise<GraphQLContext> {
    const {
      userOrSessionKey,
      additionalContext = {},
      createUserIfMissing = false,
      dataSource
    } = options;

    let user: GraphQLContext['user'] = null;

    if (typeof userOrSessionKey === 'string') {
      // Session key provided - create a mock user for testing
      user = {
        id: userOrSessionKey,
        username: 'test-user',
        name: 'Test User'
      };
    } else if (userOrSessionKey && userOrSessionKey.id) {
      // User object provided
      user = userOrSessionKey;
    } else if (createUserIfMissing && dataSource) {
      // Create new user
      user = await this.createUser(dataSource);
    }

    return {
      user,
      ...additionalContext
    };
  }

  /**
   * Create complete authentication test data set
   *
   * @param dataSource - TypeORM data source
   * @param options - User creation options
   * @returns Complete authentication test data
   */
  static async createAuthTestData(
    dataSource: DataSource,
    options: UserCreationOptions = {}
  ): Promise<AuthTestData> {
    const user = await this.createUser(dataSource, options);
    const sessionKey = user.sessionKey;
    const context = this.createAuthContext({ userOrSessionKey: user });
    const { toGlobalId } = await import('@main/base');
    const globalUserId = toGlobalId('User', user.id);

    return {
      user,
      sessionKey,
      context,
      globalUserId
    };
  }

  /**
   * Create multiple authenticated users for testing
   *
   * @param dataSource - TypeORM data source
   * @param count - Number of users to create
   * @param baseOptions - Base options for all users
   * @returns Array of authentication test data
   */
  static async createMultipleAuthUsers(
    dataSource: DataSource,
    count: number,
    baseOptions: UserCreationOptions = {}
  ): Promise<AuthTestData[]> {
    const authData: AuthTestData[] = [];

    for (let i = 0; i < count; i++) {
      const userOptions = {
        ...baseOptions,
        username: baseOptions.username ? `${baseOptions.username}-${i}` : undefined,
        name: baseOptions.name ? `${baseOptions.name} ${i + 1}` : undefined
      };

      const data = await this.createAuthTestData(dataSource, userOptions);
      authData.push(data);
    }

    return authData;
  }

  /**
   * Create an unauthenticated context (no session)
   *
   * @param additionalContext - Additional context properties
   * @returns GraphQL context without authentication
   */
  static createUnauthenticatedContext(
    additionalContext: Record<string, any> = {}
  ): GraphQLContext {
    return {
      user: null,
      ...additionalContext
    };
  }

  /**
   * Create a context with invalid session key
   *
   * @param additionalContext - Additional context properties
   * @returns GraphQL context with invalid session
   */
  static createInvalidSessionContext(
    additionalContext: Record<string, any> = {}
  ): GraphQLContext {
    return {
      user: null,
      ...additionalContext
    };
  }

  /**
   * Helper to create test contexts for different auth scenarios
   *
   * @param dataSource - TypeORM data source
   * @param userOptions - Options for creating authenticated user
   * @returns Object with different context types
   */
  static async createContextSet(
    dataSource: DataSource,
    userOptions: UserCreationOptions = {}
  ): Promise<{
    authenticated: GraphQLContext;
    unauthenticated: GraphQLContext;
    invalidSession: GraphQLContext;
    authData: AuthTestData;
  }> {
    const authData = await this.createAuthTestData(dataSource, userOptions);

    return {
      authenticated: authData.context,
      unauthenticated: this.createUnauthenticatedContext(),
      invalidSession: this.createInvalidSessionContext(),
      authData
    };
  }

  /**
   * Extract session key from various user object formats
   *
   * @param user - User object or session key
   * @returns Session key string or undefined
   */
  static extractSessionKey(user: any): string | undefined {
    if (typeof user === 'string') {
      return user;
    }

    if (user && typeof user === 'object') {
      return user.sessionKey;
    }

    return undefined;
  }

  /**
   * Validate that a context has proper authentication
   *
   * @param context - GraphQL context to validate
   * @returns True if context has session key
   */
  static isAuthenticated(context: GraphQLContext): boolean {
    return !!(context && context.user);
  }

  /**
   * Create authenticated GraphQL request headers
   *
   * @param sessionKey - Session key for authentication
   * @param additionalHeaders - Additional headers
   * @returns Request headers object
   */
  static createAuthHeaders(
    sessionKey: string,
    additionalHeaders: Record<string, string> = {}
  ): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionKey}`,
      ...additionalHeaders
    };
  }
}