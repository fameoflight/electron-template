/**
 * User Update GraphQL Mutation Tests
 *
 * Tests for user profile updates, settings changes, and user modifications.
 * Focused on user data management and update workflows.
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { initializeGraphQLSchema } from '@main/graphql/server';
import {
  createTestDatabase,
  cleanupTestDatabase,
} from '../../base/testDatabase';
import { GraphQLTestHelper } from '../../helpers/GraphQLTestHelper';
import { AuthenticationTestHelper } from '../../helpers/AuthenticationTestHelper';
import { DataSourceProvider } from '@base/db/index';

describe('User Update GraphQL Mutations', () => {
  let dataSource: any;
  let userAuthData: any;

  beforeAll(async () => {
    await initializeGraphQLSchema();
  });

  beforeEach(async () => {
    dataSource = await createTestDatabase();
    userAuthData = await AuthenticationTestHelper.createAuthTestData(dataSource, {
      username: 'updatetestuser',
      name: 'Update Test User'
    });
  });

  afterEach(async () => {
    DataSourceProvider.clearTestDataSource();
    await cleanupTestDatabase(dataSource);
  });

  describe('updateUser Mutation', () => {
    it('should update user with valid input', async () => {
      const mutation = `
        mutation UpdateUser($input: UpdateUserInput!) {
          updateUser(input: $input) {
            id
            username
            name
            sessionKey
            updatedAt
          }
        }
      `;

      const variables = {
        input: {
          name: 'Updated Name'
        }
      };

      const result = await GraphQLTestHelper.expectSuccess(
        mutation,
        variables,
        userAuthData.sessionKey
      );

      expect(result.updateUser).toBeDefined();
      expect(result.updateUser.id).toBe(userAuthData.globalUserId);
      expect(result.updateUser.username).toBe('updatetestuser'); // Username shouldn't change
      expect(result.updateUser.name).toBe('Updated Name');
      expect(result.updateUser.updatedAt).toBeDefined();
    });

    it('should reject update without authentication', async () => {
      const mutation = `
        mutation UpdateUser($input: UpdateUserInput!) {
          updateUser(input: $input) {
            id
            name
          }
        }
      `;

      const variables = {
        input: {
          name: 'Unauthorized Update'
        }
      };

      await GraphQLTestHelper.expectErrors(
        mutation,
        variables,
        'Authentication required',
        undefined
      );
    });

    it('should reject update with invalid authentication', async () => {
      const mutation = `
        mutation UpdateUser($input: UpdateUserInput!) {
          updateUser(input: $input) {
            id
            name
          }
        }
      `;

      const variables = {
        input: {
          name: 'Invalid Auth Update'
        }
      };

      await GraphQLTestHelper.expectErrors(
        mutation,
        variables,
        'Authentication required',
        'invalid-session-key' // Use a dummy session key instead of accessing context
      );
    });

    it('should update only provided fields', async () => {
      const mutation = `
        mutation UpdateUser($input: UpdateUserInput!) {
          updateUser(input: $input) {
            id
            name
            username
            sessionKey
          }
        }
      `;

      // Update only name
      const variables = {
        input: {
          name: 'Only Name Updated'
        }
      };

      const result = await GraphQLTestHelper.expectSuccess(
        mutation,
        variables,
        userAuthData.sessionKey
      );

      expect(result.updateUser.name).toBe('Only Name Updated');
      expect(result.updateUser.username).toBe('updatetestuser'); // Unchanged
    });

    it('should update user password', async () => {
      const mutation = `
        mutation UpdateUser($input: UpdateUserInput!) {
          updateUser(input: $input) {
            id
            name
            username
            updatedAt
          }
        }
      `;

      const variables = {
        input: {
          name: 'Test Name',
          password: 'newpassword123'
        }
      };

      const result = await GraphQLTestHelper.expectSuccess(
        mutation,
        variables,
        userAuthData.sessionKey
      );

      expect(result.updateUser.name).toBe('Test Name');
      expect(result.updateUser.updatedAt).toBeDefined();
    });

    it('should reject username change', async () => {
      const mutation = `
        mutation UpdateUser($input: UpdateUserInput!) {
          updateUser(input: $input) {
            id
            username
          }
        }
      `;

      const variables = {
        input: {
          username: 'newusername'
        }
      };

      await GraphQLTestHelper.expectErrors(
        mutation,
        variables,
        'Cannot change username',
        userAuthData.sessionKey
      );
    });

    it('should validate name format on update', async () => {
      const mutation = `
        mutation UpdateUser($input: UpdateUserInput!) {
          updateUser(input: $input) {
            id
            name
          }
        }
      `;

      // Test with invalid name inputs
      const invalidNames = [
        '', // Empty name
        'A'.repeat(300), // Too long
      ];

      for (const invalidName of invalidNames) {
        const variables = {
          input: {
            name: invalidName
          }
        };

        await GraphQLTestHelper.expectErrors(
          mutation,
          variables,
          undefined, // Expect validation error
          userAuthData.sessionKey
        );
      }
    });

    it('should update user session key', async () => {
      const mutation = `
        mutation UpdateUser($input: UpdateUserInput!) {
          updateUser(input: $input) {
            id
            name
            sessionKey
            updatedAt
          }
        }
      `;

      const newSessionKey = 'new-session-key-12345';
      const variables = {
        input: {
          sessionKey: newSessionKey
        }
      };

      const result = await GraphQLTestHelper.expectSuccess(
        mutation,
        variables,
        userAuthData.sessionKey
      );

      expect(result.updateUser.sessionKey).toBe(newSessionKey);
      expect(result.updateUser.updatedAt).toBeDefined();
    });

    it('should update multiple fields simultaneously', async () => {
      const mutation = `
        mutation UpdateUser($input: UpdateUserInput!) {
          updateUser(input: $input) {
            id
            name
            username
            sessionKey
            updatedAt
          }
        }
      `;

      const variables = {
        input: {
          name: 'Multi Field Update',
          sessionKey: 'multi-update-session-key'
        }
      };

      const result = await GraphQLTestHelper.expectSuccess(
        mutation,
        variables,
        userAuthData.sessionKey
      );

      expect(result.updateUser.name).toBe('Multi Field Update');
      expect(result.updateUser.username).toBe('updatetestuser'); // Unchanged
      expect(result.updateUser.sessionKey).toBe('multi-update-session-key');
      expect(result.updateUser.updatedAt).toBeDefined();
    });

    it('should handle empty updates gracefully', async () => {
      const mutation = `
        mutation UpdateUser($input: UpdateUserInput!) {
          updateUser(input: $input) {
            id
            name
            username
            sessionKey
            updatedAt
          }
        }
      `;

      const variables = {
        input: {}
      };

      const result = await GraphQLTestHelper.expectSuccess(
        mutation,
        variables,
        userAuthData.sessionKey
      );

      expect(result.updateUser).toBeDefined();
      expect(result.updateUser.id).toBe(userAuthData.globalUserId);
      expect(result.updateUser.name).toBe('Update Test User'); // Unchanged
      expect(result.updateUser.username).toBe('updatetestuser'); // Unchanged
    });

    it('should handle large session key values', async () => {
      const mutation = `
        mutation UpdateUser($input: UpdateUserInput!) {
          updateUser(input: $input) {
            id
            name
            sessionKey
          }
        }
      `;

      const largeSessionKey = 'A'.repeat(1000); // Large session key
      const variables = {
        input: {
          sessionKey: largeSessionKey
        }
      };

      const result = await GraphQLTestHelper.expectSuccess(
        mutation,
        variables,
        userAuthData.sessionKey
      );

      expect(result.updateUser.sessionKey).toBe(largeSessionKey);
    });

    it('should reject updates that violate constraints', async () => {
      const mutation = `
        mutation UpdateUser($input: UpdateUserInput!) {
          updateUser(input: $input) {
            id
            name
          }
        }
      `;

      // Test with extremely long name
      const longName = 'A'.repeat(1000);
      const variables = {
        input: {
          name: longName
        }
      };

      await GraphQLTestHelper.expectErrors(
        mutation,
        variables,
        undefined, // Expect constraint validation error
        userAuthData.sessionKey
      );
    });

    it('should update user timestamps correctly', async () => {
      const mutation = `
        mutation UpdateUser($input: UpdateUserInput!) {
          updateUser(input: $input) {
            id
            name
            createdAt
            updatedAt
          }
        }
      `;

      const variables = {
        input: {
          name: 'Timestamp Test'
        }
      };

      const result = await GraphQLTestHelper.expectSuccess(
        mutation,
        variables,
        userAuthData.sessionKey
      );

      expect(result.updateUser.updatedAt).toBeDefined();
      expect(result.updateUser.createdAt).toBeDefined();

      // updatedAt should be present and reasonable (within database precision limits)
      const updatedAt = new Date(result.updateUser.updatedAt).getTime();
      const createdAt = new Date(result.updateUser.createdAt).getTime();
      const now = Date.now();

      expect(updatedAt).toBeDefined();
      expect(createdAt).toBeDefined();
      expect(updatedAt).toBeLessThanOrEqual(now + 5000); // Should not be too far in the future
      expect(updatedAt).toBeGreaterThanOrEqual(now - 60000); // Should be recent (within last minute)
    });

    it('should handle concurrent update requests safely', async () => {
      const mutation = `
        mutation UpdateUser($input: UpdateUserInput!) {
          updateUser(input: $input) {
            id
            name
            sessionKey
            updatedAt
          }
        }
      `;

      // Create multiple concurrent update requests
      const concurrentUpdates = [
        { input: { name: 'Concurrent 1' } },
        { input: { sessionKey: 'session-1' } },
        { input: { name: 'Concurrent 2' } },
        { input: { sessionKey: 'session-2' } },
        { input: { name: 'Final Name' } }
      ];

      const promises = concurrentUpdates.map((variables) =>
        GraphQLTestHelper.expectSuccess(mutation, variables, userAuthData.sessionKey)
      );

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach((result) => {
        expect(result.updateUser).toBeDefined();
        expect(result.updateUser.id).toBe(userAuthData.globalUserId);
        expect(result.updateUser.updatedAt).toBeDefined();
      });
    });

    it('should support GraphQL fragments in update response', async () => {
      const mutationWithFragment = `
        mutation UpdateUser($input: UpdateUserInput!) {
          updateUser(input: $input) {
            ...UpdatedUserFields
            ...UserTimestampFields
          }
        }

        fragment UpdatedUserFields on User {
          id
          name
          username
          sessionKey
        }

        fragment UserTimestampFields on User {
          createdAt
          updatedAt
        }
      `;

      const variables = {
        input: {
          name: 'Fragment Test',
          sessionKey: 'fragment-test-session-key'
        }
      };

      const result = await GraphQLTestHelper.expectSuccess(
        mutationWithFragment,
        variables,
        userAuthData.sessionKey
      );

      expect(result.updateUser).toBeDefined();
      expect(result.updateUser.id).toBe(userAuthData.globalUserId);
      expect(result.updateUser.name).toBe('Fragment Test');
      expect(result.updateUser.sessionKey).toBe('fragment-test-session-key');
      expect(result.updateUser.createdAt).toBeDefined();
      expect(result.updateUser.updatedAt).toBeDefined();
    });

    it('should validate update input types', async () => {
      const mutation = `
        mutation UpdateUser($input: UpdateUserInput!) {
          updateUser(input: $input) {
            id
            name
          }
        }
      `;

      // Test with invalid input types
      const invalidInputs = [
        { name: 123 }, // name should be string
        { username: 123 }, // username should be string
        { sessionKey: 123 } // sessionKey should be string
      ];

      for (const invalidInput of invalidInputs) {
        const variables = { input: invalidInput };

        await GraphQLTestHelper.expectErrors(
          mutation,
          variables,
          undefined, // Expect validation error
          userAuthData.sessionKey
        );
      }
    });
  });
});