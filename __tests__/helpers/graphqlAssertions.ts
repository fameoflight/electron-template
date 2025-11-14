/**
 * GraphQL Assertion Utilities
 *
 * Comprehensive assertion helpers for GraphQL test results.
 * These eliminate repetitive assertion code and provide consistent error messages.
 */

import { PayloadError } from 'relay-runtime';
import { fromGlobalIdToLocalId } from '@base/graphql';

/**
 * GraphQL response type (same as GraphQLResponse but for testing)
 */
export interface GraphQLTestResult<T = any> {
  data?: T;
  errors?: PayloadError[];
}

/**
 * Comprehensive GraphQL assertion helpers
 */
export const graphqlAssert = {
  /**
   * Assert successful query/mutation with no errors and valid data
   *
   * @param result - GraphQL test result
   * @param message - Optional custom error message
   *
   * @example
   * ```typescript
   * const result = await executeGraphQLQuery(query, variables, context);
   * graphqlAssert.success(result);
   * ```
   */
  success: (result: GraphQLTestResult, message?: string) => {
    if (result.errors) {
      const errorDetails = result.errors.map(err => err.message).join(', ');
      fail(`Expected successful GraphQL result but got errors: ${errorDetails}${message ? ` - ${message}` : ''}`);
    }
    if (!result.data) {
      fail(`Expected GraphQL result to have data but got: ${JSON.stringify(result)}${message ? ` - ${message}` : ''}`);
    }
  },

  /**
   * Assert query/mutation failed with errors
   *
   * @param result - GraphQL test result
   * @param expectedCount - Optional expected number of errors
   * @param message - Optional custom error message
   *
   * @example
   * ```typescript
   * const result = await executeGraphQLQuery(query, variables, context);
   * graphqlAssert.hasErrors(result, 1);
   * ```
   */
  hasErrors: (result: GraphQLTestResult, expectedCount?: number, message?: string) => {
    if (!result.errors) {
      fail(`Expected GraphQL result to have errors but got none${message ? ` - ${message}` : ''}`);
    }

    if (expectedCount !== undefined && result.errors.length !== expectedCount) {
      fail(`Expected ${expectedCount} errors but got ${result.errors.length}: ${result.errors.map(e => e.message).join(', ')}${message ? ` - ${message}` : ''}`);
    }
  },

  /**
   * Assert error message contains specific text
   *
   * @param result - GraphQL test result
   * @param expectedText - Text that should be in error message
   * @param message - Optional custom error message
   *
   * @example
   * ```typescript
   * const result = await executeGraphQLQuery(query, variables, context);
   * graphqlAssert.errorContains(result, 'Not authorized');
   * ```
   */
  errorContains: (result: GraphQLTestResult, expectedText: string, message?: string) => {
    if (!result.errors || result.errors.length === 0) {
      fail(`Expected GraphQL result to have errors but got none${message ? ` - ${message}` : ''}`);
    }

    const hasMatchingError = result.errors.some(err =>
      err.message.includes(expectedText)
    );

    if (!hasMatchingError) {
      const errorMessages = result.errors.map(err => err.message).join(', ');
      fail(`Expected error message to contain "${expectedText}" but got: ${errorMessages}${message ? ` - ${message}` : ''}`);
    }
  },

  /**
   * Assert field exists and has expected value using dot notation
   *
   * @param result - GraphQL test result
   * @param path - Dot-notation path to field (e.g., 'createConnection.id')
   * @param expected - Expected value
   * @param message - Optional custom error message
   *
   * @example
   * ```typescript
   * const result = await executeGraphQLQuery(mutation, variables, context);
   * graphqlAssert.fieldEquals(result, 'createConnection.name', 'Test Connection');
   * ```
   */
  fieldEquals: (result: GraphQLTestResult, path: string, expected: any, message?: string) => {
    if (!result.data) {
      fail(`Cannot assert field value on result with no data${message ? ` - ${message}` : ''}`);
    }

    const value = path.split('.').reduce((obj, key) => obj?.[key], result.data);

    if (value === undefined) {
      fail(`Expected field "${path}" to exist but it was not found in: ${JSON.stringify(result.data, null, 2)}${message ? ` - ${message}` : ''}`);
    }

    if (value !== expected) {
      fail(`Expected field "${path}" to be ${JSON.stringify(expected)} but got ${JSON.stringify(value)}${message ? ` - ${message}` : ''}`);
    }
  },

  /**
   * Assert field exists and matches predicate function
   *
   * @param result - GraphQL test result
   * @param path - Dot-notation path to field
   * @param predicate - Function that returns true if value is correct
   * @param message - Optional custom error message
   *
   * @example
   * ```typescript
   * const result = await executeGraphQLQuery(query, variables, context);
   * graphqlAssert.fieldMatches(result, 'createConnection.name', name => name.length > 0);
   * ```
   */
  fieldMatches: (result: GraphQLTestResult, path: string, predicate: (value: any) => boolean, message?: string) => {
    if (!result.data) {
      fail(`Cannot assert field value on result with no data${message ? ` - ${message}` : ''}`);
    }

    const value = path.split('.').reduce((obj, key) => obj?.[key], result.data);

    if (value === undefined) {
      fail(`Expected field "${path}" to exist but it was not found${message ? ` - ${message}` : ''}`);
    }

    if (!predicate(value)) {
      fail(`Field "${path}" with value ${JSON.stringify(value)} did not match predicate${message ? ` - ${message}` : ''}`);
    }
  },

  /**
   * Assert entity has all required fields populated
   *
   * @param entity - Entity object to check
   * @param requiredFields - Array of field names that must be present
   * @param message - Optional custom error message
   *
   * @example
   * ```typescript
   * const connection = result.data.createConnection;
   * graphqlAssert.entityFields(connection, ['id', 'name', 'createdAt']);
   * ```
   */
  entityFields: (entity: any, requiredFields: string[], message?: string) => {
    if (!entity || typeof entity !== 'object') {
      fail(`Expected entity to be an object but got: ${JSON.stringify(entity)}${message ? ` - ${message}` : ''}`);
    }

    const missingFields = requiredFields.filter(field =>
      entity[field] === undefined || entity[field] === null
    );

    if (missingFields.length > 0) {
      fail(`Entity missing required fields: ${missingFields.join(', ')}${message ? ` - ${message}` : ''}`);
    }
  },

  /**
   * Assert timestamp fields are valid ISO strings
   *
   * @param entity - Entity object to check
   * @param fields - Array of timestamp field names to validate
   * @param message - Optional custom error message
   *
   * @example
   * ```typescript
   * const user = result.data.createUser;
   * graphqlAssert.validTimestamps(user, ['createdAt', 'updatedAt']);
   * ```
   */
  validTimestamps: (entity: any, fields: string[] = ['createdAt', 'updatedAt'], message?: string) => {
    if (!entity || typeof entity !== 'object') {
      fail(`Expected entity to be an object but got: ${JSON.stringify(entity)}${message ? ` - ${message}` : ''}`);
    }

    for (const field of fields) {
      const value = entity[field];
      if (typeof value !== 'string') {
        fail(`Expected timestamp field "${field}" to be a string but got: ${typeof value}${message ? ` - ${message}` : ''}`);
      }

      const timestamp = new Date(value).getTime();
      if (isNaN(timestamp) || timestamp <= 0) {
        fail(`Expected timestamp field "${field}" to be a valid ISO date string but got: "${value}"${message ? ` - ${message}` : ''}`);
      }
    }
  },

  /**
   * Assert global ID matches local ID
   *
   * @param globalId - Global ID from GraphQL
   * @param expectedLocalId - Expected local ID
   * @param message - Optional custom error message
   *
   * @example
   * ```typescript
   * const globalId = result.data.createConnection.id;
   * graphqlAssert.globalIdMatches(globalId, testConnection.id);
   * ```
   */
  globalIdMatches: (globalId: string, expectedLocalId: string, message?: string) => {
    try {
      const localId = fromGlobalIdToLocalId(globalId);
      if (localId !== expectedLocalId) {
        fail(`Expected global ID "${globalId}" to resolve to local ID "${expectedLocalId}" but got "${localId}"${message ? ` - ${message}` : ''}`);
      }
    } catch (error) {
      fail(`Failed to convert global ID "${globalId}" to local ID: ${error}${message ? ` - ${message}` : ''}`);
    }
  },

  /**
   * Assert unauthorized error (common authentication test)
   *
   * @param result - GraphQL test result
   * @param message - Optional custom error message
   *
   * @example
   * ```typescript
   * const result = await executeGraphQLQuery(query, variables); // No auth context
   * graphqlAssert.unauthorized(result);
   * ```
   */
  unauthorized: (result: GraphQLTestResult, message?: string) => {
    if (!result.errors || result.errors.length === 0) {
      fail(`Expected unauthorized error but got no errors${message ? ` - ${message}` : ''}`);
    }

    const hasUnauthorizedError = result.errors.some(err =>
      err.message.includes('Unauthorized') ||
      err.message.includes('Not authorized') ||
      err.message.includes('Authentication required')
    );

    if (!hasUnauthorizedError) {
      const errorMessages = result.errors.map(err => err.message).join(', ');
      fail(`Expected unauthorized error but got: ${errorMessages}${message ? ` - ${message}` : ''}`);
    }
  },

  /**
   * Assert pagination fields are correctly structured
   *
   * @param result - GraphQL test result
   * @param path - Path to paginated field (e.g., 'connections.edges')
   * @param expectedItemsCount - Optional expected number of items
   * @param message - Optional custom error message
   *
   * @example
   * ```typescript
   * const result = await executeGraphQLQuery(query, variables, context);
   * graphqlAssert.paginated(result, 'connections.edges', 2);
   * ```
   */
  paginated: (result: GraphQLTestResult, path: string, expectedItemsCount?: number, message?: string) => {
    if (!result.data) {
      fail(`Cannot assert pagination on result with no data${message ? ` - ${message}` : ''}`);
    }

    const edges = path.split('.').reduce((obj, key) => obj?.[key], result.data);

    if (!Array.isArray(edges)) {
      fail(`Expected paginated field "${path}" to be an array but got: ${JSON.stringify(edges)}${message ? ` - ${message}` : ''}`);
    }

    if (expectedItemsCount !== undefined && edges.length !== expectedItemsCount) {
      fail(`Expected ${expectedItemsCount} items in "${path}" but got ${edges.length}${message ? ` - ${message}` : ''}`);
    }

    // Check that each edge has node and cursor
    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      if (!edge.node) {
        fail(`Edge at index ${i} in "${path}" missing node field${message ? ` - ${message}` : ''}`);
      }
      if (!edge.cursor) {
        fail(`Edge at index ${i} in "${path}" missing cursor field${message ? ` - ${message}` : ''}`);
      }
    }
  },

  /**
   * Assert array field contains expected number of items
   *
   * @param result - GraphQL test result
   * @param path - Dot-notation path to array field
   * @param expectedCount - Expected number of items
   * @param message - Optional custom error message
   *
   * @example
   * ```typescript
   * const result = await executeGraphQLQuery(query, variables, context);
   * graphqlAssert.arrayLength(result, 'users', 3);
   * ```
   */
  arrayLength: (result: GraphQLTestResult, path: string, expectedCount: number, message?: string) => {
    if (!result.data) {
      fail(`Cannot assert array length on result with no data${message ? ` - ${message}` : ''}`);
    }

    const value = path.split('.').reduce((obj, key) => obj?.[key], result.data);

    if (!Array.isArray(value)) {
      fail(`Expected field "${path}" to be an array but got: ${typeof value}${message ? ` - ${message}` : ''}`);
    }

    if (value.length !== expectedCount) {
      fail(`Expected array "${path}" to have ${expectedCount} items but got ${value.length}${message ? ` - ${message}` : ''}`);
    }
  }
};

/**
 * Helper function to throw errors in tests (works with both Jest and Vitest)
 */
function fail(message: string): never {
  if (typeof expect !== 'undefined') {
    // Jest/Vitest
    expect(message).toBe(''); // This will fail and show the message
  }
  throw new Error(message);
}