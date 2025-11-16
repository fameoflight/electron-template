/**
 * User Current User GraphQL Query Tests
 *
 * Tests for currentUser query and authentication-related functionality.
 * Focused on user session management and current user data retrieval.
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { initializeGraphQLSchema } from '@main/graphql/server';
import { fromGlobalId, toGlobalId } from '@base/graphql/index';
import {
  createTestDatabase,
  cleanupTestDatabase,
} from '../../base/testDatabase';
import { GraphQLTestHelper } from '../../helpers/GraphQLTestHelper';
import { AuthenticationTestHelper } from '../../helpers/AuthenticationTestHelper';
import { DataSourceProvider } from '@base/db/index';
import { createUser } from '@factories/index';

describe('User Current User GraphQL Queries', () => {
  let dataSource: any;
  let authData: any;

  beforeAll(async () => {
    await initializeGraphQLSchema();
  });

  beforeEach(async () => {
    dataSource = await createTestDatabase();
    // Create user directly to avoid potential issues with AuthenticationTestHelper
    const user = await createUser(dataSource, {
      username: 'test-user-' + Date.now(),
      name: 'Test User',
      password: 'testpass',
      sessionKey: 'test-session-key-' + Date.now()
    });

    const context = AuthenticationTestHelper.createAuthContext({
      userOrSessionKey: user.sessionKey
    });

    authData = {
      user,
      sessionKey: user.sessionKey,
      context,
      globalUserId: toGlobalId('User', user.id)
    };
  });

  afterEach(async () => {
    DataSourceProvider.clearTestDataSource();
    await cleanupTestDatabase(dataSource);
  });

  describe('currentUser Query', () => {
    it('should return current user with valid session', async () => {
      const query = `
        query CurrentUserQuery {
          currentUser {
            id
            username
            name
            createdAt
            updatedAt
          }
        }
      `;

      const result = await GraphQLTestHelper.expectSuccess(
        query,
        undefined,
        authData.sessionKey
      );

      expect(result.currentUser).toBeDefined();
      expect(result.currentUser.id).toBeDefined();
      expect(result.currentUser.username).toBe(authData.user.username);
      expect(result.currentUser.name).toBe(authData.user.name);
      expect(result.currentUser.createdAt).toBeDefined();
      expect(result.currentUser.updatedAt).toBeDefined();
    });

    it('should return null with invalid session key', async () => {
      const query = `
        query CurrentUserQuery {
          currentUser {
            id
            username
          }
        }
      `;

      const result = await GraphQLTestHelper.expectSuccess(
        query,
        undefined,
        'invalid-session-key' // Use a dummy session key instead of accessing context
      );

      expect(result.currentUser).toBeNull();
    });

    it('should return null with missing session key', async () => {
      const query = `
        query CurrentUserQuery {
          currentUser {
            id
            username
          }
        }
      `;

      const result = await GraphQLTestHelper.expectSuccess(query);

      expect(result.currentUser).toBeNull();
    });

    it('should handle expired session gracefully', async () => {
      // Create a session key that looks valid but doesn't exist
      const expiredSessionKey = 'expired-session-key-12345';

      const query = `
        query CurrentUserQuery {
          currentUser {
            id
            username
          }
        }
      `;

      const result = await GraphQLTestHelper.expectSuccess(
        query,
        undefined,
        expiredSessionKey
      );

      expect(result.currentUser).toBeNull();
    });

    it('should return user with all available fields', async () => {
      const query = `
        query CurrentUserFullQuery {
          currentUser {
            id
            username
            name
            createdAt
            updatedAt
          }
        }
      `;

      const result = await GraphQLTestHelper.expectSuccess(
        query,
        undefined,
        authData.sessionKey
      );

      expect(result.currentUser).toBeDefined();
      expect(result.currentUser.id).toBeDefined();
      expect(result.currentUser.username).toBeDefined();
      expect(result.currentUser.name).toBeDefined();
      expect(result.currentUser.createdAt).toBeDefined();
      expect(result.currentUser.updatedAt).toBeDefined();
    });

    it('should maintain session consistency across multiple queries', async () => {
      const query = `
        query CurrentUserQuery {
          currentUser {
            id
            username
            name
          }
        }
      `;

      // Execute query multiple times with same session
      const results = await Promise.all([
        GraphQLTestHelper.expectSuccess(query, undefined, authData.sessionKey),
        GraphQLTestHelper.expectSuccess(query, undefined, authData.sessionKey),
        GraphQLTestHelper.expectSuccess(query, undefined, authData.sessionKey)
      ]);

      // All results should be identical
      results.forEach((result) => {
        expect(result.currentUser).toBeDefined();
        expect(result.currentUser.id).toBe(results[0].currentUser.id);
        expect(result.currentUser.username).toBe(results[0].currentUser.username);
        expect(result.currentUser.name).toBe(results[0].currentUser.name);
      });
    });

    it('should handle concurrent currentUser queries safely', async () => {
      const query = `
        query CurrentUserQuery {
          currentUser {
            id
            username
            createdAt
          }
        }
      `;

      // Execute multiple concurrent requests
      const concurrentRequests = Array.from({ length: 10 }, () =>
        GraphQLTestHelper.expectSuccess(query, undefined, authData.sessionKey)
      );

      const results = await Promise.all(concurrentRequests);

      // All should succeed with consistent results
      results.forEach((result) => {
        expect(result.currentUser).toBeDefined();
        expect(result.currentUser.id).toBe(authData.globalUserId);
        expect(result.currentUser.username).toBe(authData.user.username);
      });
    });

    it('should properly handle global ID format', async () => {
      const query = `
        query CurrentUserQuery {
          currentUser {
            id
          }
        }
      `;

      const result = await GraphQLTestHelper.expectSuccess(
        query,
        undefined,
        authData.sessionKey
      );

      expect(result.currentUser).toBeDefined();
      expect(result.currentUser.id).toBeDefined();

      // Verify global ID format
      const idParts = fromGlobalId(result.currentUser.id);
      expect(idParts.type).toBe('User');
      expect(idParts.id).toBe(authData.user.id);
    });

    it('should handle user data with all fields populated', async () => {
      // Create user with all required fields
      const completeAuthData = await AuthenticationTestHelper.createAuthTestData(dataSource, {
        username: 'complete-user',
        name: 'Complete User'
      });

      const query = `
        query CurrentUserQuery {
          currentUser {
            id
            username
            name
          }
        }
      `;

      const result = await GraphQLTestHelper.expectSuccess(
        query,
        undefined,
        completeAuthData.sessionKey
      );

      expect(result.currentUser).toBeDefined();
      expect(result.currentUser.username).toBe('complete-user');
      expect(result.currentUser.name).toBe('Complete User');
    });

    it('should support GraphQL fragments with currentUser', async () => {
      const queryWithFragment = `
        query CurrentUserWithFragment {
          currentUser {
            ...UserBasicFields
            ...UserTimestamps
          }
        }

        fragment UserBasicFields on User {
          id
          username
          name
        }

        fragment UserTimestamps on User {
          createdAt
          updatedAt
        }
      `;

      const result = await GraphQLTestHelper.expectSuccess(
        queryWithFragment,
        undefined,
        authData.sessionKey
      );

      expect(result.currentUser).toBeDefined();
      expect(result.currentUser.id).toBeDefined();
      expect(result.currentUser.username).toBeDefined();
      expect(result.currentUser.name).toBeDefined();
      expect(result.currentUser.createdAt).toBeDefined();
      expect(result.currentUser.updatedAt).toBeDefined();
    });

    it('should handle malformed session keys gracefully', async () => {
      const query = `
        query CurrentUserQuery {
          currentUser {
            id
            username
          }
        }
      `;

      // Test various malformed session keys
      const malformedSessions = [
        '',
        'not-a-session',
        '123',
        'null',
        'undefined',
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.invalid',
        'short',
        'session-with-special-chars-!@#$%^&*()'
      ];

      for (const malformedSession of malformedSessions) {
        const result = await GraphQLTestHelper.expectSuccess(
          query,
          undefined,
          malformedSession
        );

        expect(result.currentUser).toBeNull();
      }
    });
  });
});