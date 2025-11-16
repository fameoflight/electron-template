/**
 * GraphQL Test Helper
 *
 * Provides common utilities for GraphQL testing to eliminate repetition
 * and provide a consistent interface across test files.
 *
 * Following refactoring principles:
 * - Maximum 5 parameters per method
 * - Options pattern for 3+ parameters
 * - Helper methods remove friction
 * - DRY patterns for common test operations
 */

import { executeGraphQLQuery } from '@main/graphql/server';
import { GraphQLContext } from '@shared/types';

/**
 * Options for GraphQL query execution
 */
export interface GraphQLQueryOptions {
  /** Variables to pass to the query */
  variables?: Record<string, any>;
  /** GraphQL context (will create auth context if sessionKey provided) */
  context?: GraphQLContext;
  /** Session key for authentication (alternative to context) */
  sessionKey?: string;
  /** Whether to expect errors in the response */
  expectErrors?: boolean;
  /** Expected error message if expectErrors is true */
  expectedErrorMessage?: string;
}

/**
 * Options for authentication context creation
 */
export interface AuthContextOptions {
  /** Session key for authentication */
  sessionKey: string;
  /** Additional context properties */
  additionalContext?: Record<string, any>;
}

/**
 * Helper class for GraphQL testing operations
 */
export class GraphQLTestHelper {
  /**
   * Create an authenticated GraphQL context
   *
   * @param options - Authentication context options
   * @returns GraphQL context with session
   */
  static createAuthContext(options: AuthContextOptions): GraphQLContext {
    const { sessionKey, additionalContext = {} } = options;
    // Create a mock user for testing when sessionKey is provided
    const user = sessionKey ? {
      id: sessionKey,
      username: 'test-user',
      name: 'Test User'
    } : null;
    return { user, ...additionalContext };
  }

  /**
   * Execute a GraphQL query with optional authentication
   *
   * @param query - GraphQL query string
   * @param options - Query execution options
   * @returns GraphQL execution result
   */
  static async executeQuery<T = any>(
    query: string,
    options: GraphQLQueryOptions = {}
  ): Promise<any> {
    const {
      variables = {},
      context,
      sessionKey,
      expectErrors = false,
      expectedErrorMessage
    } = options;

    // Prepare client context for executeGraphQLQuery
    const clientContext = sessionKey ? { sessionKey } : undefined;

    const result = await executeGraphQLQuery<T>(query, variables, clientContext);

    // Handle error expectations
    if (expectErrors) {
      if (!result.errors || result.errors.length === 0) {
        throw new Error('Expected GraphQL errors but got none');
      }

      if (expectedErrorMessage) {
        const hasExpectedError = result.errors.some((error: any) =>
          error.message.includes(expectedErrorMessage)
        );
        if (!hasExpectedError) {
          throw new Error(`Expected error message containing "${expectedErrorMessage}" but got: ${JSON.stringify(result.errors)}`);
        }
      }
    } else if (result.errors && result.errors.length > 0) {
      throw new Error(`Unexpected GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    return result;
  }

  /**
   * Execute a query expecting it to succeed
   *
   * @param query - GraphQL query string
   * @param variables - Query variables
   * @param sessionKey - Optional session key for authentication
   * @returns Query result data
   */
  static async expectSuccess<T = any>(
    query: string,
    variables?: Record<string, any>,
    sessionKey?: string
  ): Promise<T> {
    const result = await this.executeQuery<T>(query, {
      variables,
      sessionKey,
      expectErrors: false
    });

    return result.data;
  }

  /**
   * Execute a query expecting it to fail with errors
   *
   * @param query - GraphQL query string
   * @param variables - Query variables
   * @param expectedErrorMessage - Optional expected error message
   * @param sessionKey - Optional session key for authentication
   * @returns GraphQL errors
   */
  static async expectErrors(
    query: string,
    variables?: Record<string, any>,
    expectedErrorMessage?: string,
    sessionKey?: string
  ): Promise<any[]> {
    const result = await this.executeQuery(query, {
      variables,
      sessionKey,
      expectErrors: true,
      expectedErrorMessage
    });

    return result.errors;
  }

  /**
   * Expect a specific GraphQL error message
   *
   * @param query - GraphQL query string
   * @param expectedMessage - Expected error message
   * @param variables - Optional query variables
   * @param sessionKey - Optional session key for authentication
   */
  static async expectErrorMessage(
    query: string,
    expectedMessage: string,
    variables?: Record<string, any>,
    sessionKey?: string
  ): Promise<void> {
    await this.expectErrors(query, variables, expectedMessage, sessionKey);
  }

  /**
   * Create a query execution function with pre-configured session
   *
   * @param sessionKey - Session key to use for all queries
   * @returns Function that executes queries with the configured session
   */
  static createAuthenticatedExecutor(sessionKey: string) {
    return {
      /**
       * Execute a query with the configured session
       */
      query: <T = any>(query: string, variables?: Record<string, any>) =>
        this.expectSuccess<T>(query, variables, sessionKey),

      /**
       * Execute a query expecting errors with the configured session
       */
      expectErrors: (query: string, variables?: Record<string, any>, expectedMessage?: string) =>
        this.expectErrors(query, variables, expectedMessage, sessionKey)
    };
  }

  /**
   * Standard assertion helper for checking GraphQL response structure
   *
   * @param result - GraphQL result
   * @param dataPath - Path to data to check (e.g., 'fileEntity.id')
   * @param expectedValue - Expected value
   */
  static assertDataPath(result: any, dataPath: string, expectedValue?: any): void {
    const pathParts = dataPath.split('.');
    let current = result.data;

    for (const part of pathParts) {
      if (current === null || current === undefined) {
        throw new Error(`Expected data path "${dataPath}" but found null/undefined at "${part}"`);
      }
      current = current[part];
    }

    if (expectedValue !== undefined && current !== expectedValue) {
      throw new Error(`Expected "${dataPath}" to be ${expectedValue} but got ${current}`);
    }
  }
}