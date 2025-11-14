/**
 * GraphQL Test Runner
 *
 * High-level test runner that combines GraphQL execution with common assertion patterns.
 * This provides a fluent interface for running GraphQL tests with minimal boilerplate.
 */

import { executeGraphQLQuery } from '@main/graphql/server';
import { GraphQLTestContext } from './graphqlTestSetup';
import { graphqlAssert } from './graphqlAssertions';
import { GraphQLVariables, GraphQLResponse } from '@shared/types';

/**
 * GraphQL Test Runner with built-in assertions
 *
 * @example
 * ```typescript
 * const runner = new GraphQLTestRunner(ctx);
 *
 * // Execute and assert success
 * const data = await runner.expectSuccess(query, variables);
 *
 * // Execute and assert error
 * await runner.expectError(query, 'Not authorized', variables);
 *
 * // Create entity and verify
 * const connection = await runner.createEntity(mutation, input, 'createConnection', ['id', 'name']);
 * ```
 */
export class GraphQLTestRunner {
  constructor(private context: GraphQLTestContext) {}

  /**
   * Execute GraphQL query/mutation and assert successful result
   *
   * @param query - GraphQL query or mutation string
   * @param variables - Optional GraphQL variables
   * @param sessionKey - Optional session key (uses context user's session if not provided)
   * @returns Promise<T> - The data payload from successful result
   *
   * @example
   * ```typescript
   * const runner = new GraphQLTestRunner(ctx);
   * const userData = await runner.expectSuccess(`
   *   query GetUser($id: String!) {
   *     user(id: $id) {
   *       id
   *       name
   *       username
   *     }
   *   }
   * `, { id: user.id });
   * ```
   */
  async expectSuccess<T = any>(
    query: string,
    variables?: GraphQLVariables,
    sessionKey?: string
  ): Promise<T> {
    const context = this.context.createAuthContext(sessionKey);
    const result = await executeGraphQLQuery<T>(query, variables, context);

    graphqlAssert.success(result);
    return result.data!;
  }

  /**
   * Execute GraphQL query/mutation and assert it has errors
   *
   * @param query - GraphQL query or mutation string
   * @param expectedErrorText - Text that should appear in error message
   * @param variables - Optional GraphQL variables
   * @param sessionKey - Optional session key
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * const runner = new GraphQLTestRunner(ctx);
   * await runner.expectError(`
   *   mutation DeleteConnection($id: String!) {
   *     destroyConnection(id: $id)
   *   }
   * `, 'Connection not found', { id: 'invalid-id' });
   * ```
   */
  async expectError(
    query: string,
    expectedErrorText: string,
    variables?: GraphQLVariables,
    sessionKey?: string
  ): Promise<void> {
    const context = this.context.createAuthContext(sessionKey);
    const result = await executeGraphQLQuery(query, variables, context);

    graphqlAssert.errorContains(result, expectedErrorText);
  }

  /**
   * Execute GraphQL query/mutation without authentication and assert unauthorized
   *
   * @param query - GraphQL query or mutation string
   * @param variables - Optional GraphQL variables
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * const runner = new GraphQLTestRunner(ctx);
   * await runner.expectUnauthorized(`
   *   query GetSecrets {
   *     secrets {
   *       id
   *       value
   *     }
   *   }
   * `);
   * ```
   */
  async expectUnauthorized(query: string, variables?: GraphQLVariables): Promise<void> {
    const result = await executeGraphQLQuery(query, variables); // No auth context

    graphqlAssert.unauthorized(result);
  }

  /**
   * Create an entity using a mutation and verify it was created correctly
   *
   * @param mutation - GraphQL mutation string
   * @param input - Mutation input object
   * @param entityPath - Path to the created entity (e.g., 'createConnection')
   * @param expectedFields - Array of field names that should be present
   * @param sessionKey - Optional session key
   * @returns Promise<any> - The created entity
   *
   * @example
   * ```typescript
   * const runner = new GraphQLTestRunner(ctx);
   * const connection = await runner.createEntity(`
   *   mutation CreateConnection($input: CreateConnectionInput!) {
   *     createConnection(input: $input) {
   *       id
   *       name
   *       provider
   *       createdAt
   *     }
   *   }
   * `, { name: 'Test API' }, 'createConnection', ['id', 'name', 'provider', 'createdAt']);
   * ```
   */
  async createEntity(
    mutation: string,
    input: any,
    entityPath: string,
    expectedFields: string[],
    sessionKey?: string
  ): Promise<any> {
    const data = await this.expectSuccess(mutation, { input }, sessionKey);
    const entity = entityPath.split('.').reduce((obj, key) => obj?.[key], data);

    graphqlAssert.entityFields(entity, expectedFields);
    return entity;
  }

  /**
   * Update an entity using a mutation and verify it was updated correctly
   *
   * @param mutation - GraphQL mutation string
   * @param input - Mutation input object
   * @param entityPath - Path to the updated entity (e.g., 'updateConnection')
   * @param expectedValues - Object mapping field names to expected values
   * @param sessionKey - Optional session key
   * @returns Promise<any> - The updated entity
   *
   * @example
   * ```typescript
   * const runner = new GraphQLTestRunner(ctx);
   * const updated = await runner.updateEntity(`
   *   mutation UpdateConnection($input: UpdateConnectionInput!) {
   *     updateConnection(input: $input) {
   *       id
   *       name
   *       updatedAt
   *     }
   *   }
   * `, { id: connectionId, name: 'Updated Name' }, 'updateConnection', { name: 'Updated Name' });
   * ```
   */
  async updateEntity(
    mutation: string,
    input: any,
    entityPath: string,
    expectedValues: Record<string, any>,
    sessionKey?: string
  ): Promise<any> {
    const data = await this.expectSuccess(mutation, { input }, sessionKey);
    const entity = entityPath.split('.').reduce((obj, key) => obj?.[key], data);

    // Assert each expected field value
    Object.entries(expectedValues).forEach(([field, expectedValue]) => {
      graphqlAssert.fieldEquals({ data }, `${entityPath}.${field}`, expectedValue);
    });

    return entity;
  }

  /**
   * Delete an entity using a mutation and verify deletion
   *
   * @param mutation - GraphQL mutation string
   * @param variables - Mutation variables
   * @param expectedValue - Expected return value from deletion mutation
   * @param sessionKey - Optional session key
   * @returns Promise<any> - The deletion result
   *
   * @example
   * ```typescript
   * const runner = new GraphQLTestRunner(ctx);
   * const result = await runner.deleteEntity(`
   *   mutation DestroyConnection($id: String!) {
   *     destroyConnection(id: $id)
   *   }
   * `, { id: connectionId }, true);
   * ```
   */
  async deleteEntity(
    mutation: string,
    variables: GraphQLVariables,
    expectedValue: any = true,
    sessionKey?: string
  ): Promise<any> {
    const data = await this.expectSuccess(mutation, variables, sessionKey);
    return data;
  }

  /**
   * Execute a paginated query and verify pagination structure
   *
   * @param query - GraphQL query string
   * @param variables - Query variables
   * @param edgesPath - Path to the edges array (e.g., 'connections.edges')
   * @param expectedItemsCount - Expected number of items in result
   * @param sessionKey - Optional session key
   * @returns Promise<any> - The paginated result data
   *
   * @example
   * ```typescript
   * const runner = new GraphQLTestRunner(ctx);
   * const connections = await runner.queryPaginated(`
   *   query GetConnections($first: Int, $after: String) {
   *     connections(first: $first, after: $after) {
   *       edges {
   *         node {
   *           id
   *           name
   *         }
   *         cursor
   *       }
   *       pageInfo {
   *         hasNextPage
   *         hasPreviousPage
   *       }
   *     }
   *   }
   * `, { first: 10 }, 'connections.edges', 3);
   * ```
   */
  async queryPaginated(
    query: string,
    variables?: GraphQLVariables,
    edgesPath: string = 'edges',
    expectedItemsCount?: number,
    sessionKey?: string
  ): Promise<any> {
    const result = await this.expectSuccess(query, variables, sessionKey);

    if (expectedItemsCount !== undefined) {
      graphqlAssert.paginated(result, edgesPath, expectedItemsCount);
    } else {
      graphqlAssert.paginated(result, edgesPath);
    }

    return result;
  }

  /**
   * Execute GraphQL query with raw result (no automatic assertions)
   * Useful for custom assertion logic or testing edge cases
   *
   * @param query - GraphQL query or mutation string
   * @param variables - Optional GraphQL variables
   * @param sessionKey - Optional session key
   * @returns Promise<GraphQLResponse<T>> - Full GraphQL response
   *
   * @example
   * ```typescript
   * const runner = new GraphQLTestRunner(ctx);
   * const result = await runner.rawQuery(mutation, variables);
   *
   * // Custom assertions
   * if (result.errors) {
   *   expect(result.errors[0].message).toContain('custom error');
   * }
   * ```
   */
  async rawQuery<T = any>(
    query: string,
    variables?: GraphQLVariables,
    sessionKey?: string
  ): Promise<GraphQLResponse<T>> {
    const context = this.context.createAuthContext(sessionKey);
    return await executeGraphQLQuery<T>(query, variables, context);
  }

  /**
   * Execute multiple GraphQL operations in parallel
   *
   * @param operations - Array of GraphQL operations
   * @param sessionKey - Optional session key
   * @returns Promise<Array<any>> - Array of results
   *
   * @example
   * ```typescript
   * const runner = new GraphQLTestRunner(ctx);
   * const [user, connections, models] = await runner.runBatch([
   *   { query: userQuery, variables: { id: userId } },
   *   { query: connectionsQuery, variables: { userId } },
   *   { query: modelsQuery, variables: { connectionId } }
   * ]);
   * ```
   */
  async runBatch<T = any>(
    operations: Array<{
      query: string;
      variables?: GraphQLVariables;
    }>,
    sessionKey?: string
  ): Promise<Array<any>> {
    const context = this.context.createAuthContext(sessionKey);

    const promises = operations.map(({ query, variables }) =>
      executeGraphQLQuery<T>(query, variables, context)
    );

    const results = await Promise.all(promises);

    // Assert all operations succeeded
    results.forEach((result: any, index: number) => {
      graphqlAssert.success(result, `Batch operation ${index + 1} failed`);
    });

    return results.map((result: any) => result.data);
  }
}

/**
 * Factory function to create a GraphQL test runner
 *
 * @param context - GraphQL test context from setupGraphQLTest
 * @returns GraphQLTestRunner instance
 *
 * @example
 * ```typescript
 * let ctx: GraphQLTestContext;
 * let runner: GraphQLTestRunner;
 *
 * beforeEach(async () => {
 *   ctx = await setupGraphQLTest();
 *   runner = createGraphQLTestRunner(ctx);
 * });
 * ```
 */
export function createGraphQLTestRunner(context: GraphQLTestContext): GraphQLTestRunner {
  return new GraphQLTestRunner(context);
}

/**
 * Higher-order function for running tests with automatic setup/teardown
 *
 * @param testFn - Test function that receives runner
 * @param options - Configuration options
 * @returns Promise<void>
 *
 * @example
 * ```typescript
 * await withGraphQLTestRunner(async (runner) => {
 *   const connection = await runner.createEntity(mutation, input, 'createConnection', ['id', 'name']);
 *   expect(connection.name).toBe('Test Connection');
 * }, { userOverrides: { name: 'Test User' } });
 * ```
 */
export async function withGraphQLTestRunner<T>(
  testFn: (runner: GraphQLTestRunner) => Promise<T>,
  options: {
    userOverrides?: Partial<any>;
    skipUser?: boolean;
  } = {}
): Promise<T> {
  const ctx = await import('./graphqlTestSetup').then(m =>
    m.setupGraphQLTest(options)
  );

  const runner = new GraphQLTestRunner(ctx);

  try {
    return await testFn(runner);
  } finally {
    await ctx.cleanup();
  }
}