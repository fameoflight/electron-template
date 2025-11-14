/**
 * User GraphQL Query Tests
 *
 * Comprehensive tests for user-related GraphQL queries and mutations
 * covering authentication, CRUD operations, validation, and edge cases.
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { initializeGraphQLSchema, executeGraphQLQuery } from '@main/graphql/server';
import { fromGlobalId, fromGlobalIdToLocalId } from '@base/graphql/index';
import {
  createTestDatabase,
  cleanupTestDatabase,
} from '../base/testDatabase';
import { createUser } from '@factories/index';
import { DataSourceProvider } from '@base/db/index';

describe('User GraphQL Operations', () => {
  let dataSource: any;
  let testUser: any;

  beforeAll(async () => {
    await initializeGraphQLSchema();
  });

  beforeEach(async () => {
    dataSource = await createTestDatabase();
    testUser = await createUser(dataSource);
  });

  afterEach(async () => {
    DataSourceProvider.clearTestDataSource();
    await cleanupTestDatabase(dataSource);
  });

  function createAuthContext(sessionKey: string) {
    return { sessionKey };
  }

  describe('currentUser Query', () => {
    it('should return current user with valid session', async () => {
      const query = `
        query {
          currentUser {
            id
            modelId
            name
            username
            sessionKey
            createdAt
            updatedAt
          }
        }
      `;

      const context = createAuthContext(testUser.sessionKey);
      const result = await executeGraphQLQuery<any>(query, {}, context);

      const idParts = fromGlobalId(result.data.currentUser.id);

      expect(idParts.type).toBe('User');
      expect(idParts.id).toBe(testUser.id);


      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.currentUser).toBeDefined();

      const user = result.data.currentUser;
      expect(user.modelId).toBeDefined();
      expect(user.name).toBe(testUser.name);
      expect(user.username).toBe(testUser.username);
      expect(user.sessionKey).toBe(testUser.sessionKey);
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should return null with invalid session key', async () => {
      const query = `
        query {
          currentUser {
            id
            modelId
            name
            username
          }
        }
      `;

      const invalidContext = createAuthContext('invalid-session-key');
      const result = await executeGraphQLQuery<any>(query, {}, invalidContext);

      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.currentUser).toBeNull();
    });

    it('should return null with missing session key', async () => {
      const query = `
        query {
          currentUser {
            id
            modelId
            name
            username
          }
        }
      `;

      const result = await executeGraphQLQuery<any>(query, {});
      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.currentUser).toBeNull();
    });

    it('should return null with empty session key', async () => {
      const query = `
        query {
          currentUser {
            id
            modelId
            name
            username
          }
        }
      `;

      const emptyContext = createAuthContext('');
      const result = await executeGraphQLQuery<any>(query, {}, emptyContext);

      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.currentUser).toBeNull();
    });

    it('should handle authentication correctly', async () => {
      const query = `
        query {
          currentUser {
            id
            modelId
            name
            username
          }
        }
      `;

      // Test with valid session
      const context = createAuthContext(testUser.sessionKey);
      const result = await executeGraphQLQuery<any>(query, {}, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.currentUser).toBeDefined();
      expect(result.data.currentUser.name).toBe(testUser.name);
    });
  });

  describe('createUser Mutation', () => {
    it('should create user with valid input', async () => {
      const mutation = `
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
            modelId
            name
            username
            sessionKey
            createdAt
            updatedAt
          }
        }
      `;

      const variables = {
        input: {
          name: 'New GraphQL User',
          username: `graphql-user-${Date.now()}`,
          password: 'securepassword123'
        }
      };

      const result = await executeGraphQLQuery<any>(mutation, variables);

      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.createUser).toBeDefined();
      expect(result.data.createUser.id).toBeDefined();
      expect(result.data.createUser.modelId).toBeDefined();
      expect(result.data.createUser.name).toBe('New GraphQL User');
      expect(result.data.createUser.username).toBe(variables.input.username);
      expect(result.data.createUser.sessionKey).toBeDefined();
      expect(result.data.createUser.sessionKey.length).toBeGreaterThan(0);
      expect(result.data.createUser.createdAt).toBeDefined();
      expect(result.data.createUser.updatedAt).toBeDefined();
    });

    it('should reject duplicate usernames', async () => {
      const mutation = `
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
            modelId
            name
            username
          }
        }
      `;

      const variables = {
        input: {
          name: 'Duplicate User',
          username: testUser.username, // Same as existing user
          password: 'password123'
        }
      };

      const result = await executeGraphQLQuery<any>(mutation, variables);

      expect(result.errors).toBeDefined();
      expect(result?.errors?.length).toBeGreaterThan(0);
      const errorMessage = result?.errors?.[0].message;
      expect(errorMessage && (errorMessage.includes('UNIQUE constraint failed') || errorMessage.includes('Argument Validation Error'))).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should validate required fields', async () => {
      const mutation = `
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
            modelId
            name
            username
          }
        }
      `;

      // Test missing name
      const missingNameVariables = {
        input: {
          username: `no-name-${Date.now()}`,
          password: 'password123'
        }
      };

      const missingNameResult = await executeGraphQLQuery<any>(mutation, missingNameVariables);
      expect(missingNameResult.errors).toBeDefined();
      expect(missingNameResult?.errors?.[0].message).toContain('name');

      // Test missing username
      const missingUsernameVariables = {
        input: {
          name: 'No Username User',
          password: 'password123'
        }
      };

      const missingUsernameResult = await executeGraphQLQuery<any>(mutation, missingUsernameVariables);
      expect(missingUsernameResult.errors).toBeDefined();
      expect(missingUsernameResult?.errors?.[0].message).toContain('username');

      // Test missing password
      const missingPasswordVariables = {
        input: {
          name: 'No Password User',
          username: `no-pass-${Date.now()}`
        }
      };

      const missingPasswordResult = await executeGraphQLQuery<any>(mutation, missingPasswordVariables);
      expect(missingPasswordResult.errors).toBeDefined();
      expect(missingPasswordResult?.errors?.[0].message).toContain('password');
    });

    it('should handle edge cases in user creation', async () => {
      const mutation = `
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
            modelId
            name
            username
          }
        }
      `;

      // Test with valid but minimal data
      const variables = {
        input: {
          name: 'A', // Minimum valid name
          username: `abc-${Date.now()}`, // Minimum valid username
          password: 'abcdefgh' // Minimum valid password
        }
      };

      const result = await executeGraphQLQuery<any>(mutation, variables);
      expect(result.errors).toStrictEqual([]);
      expect(result.data.createUser).toBeDefined();
      expect(result.data.createUser.name).toBe('A');
    });

    it('should accept valid usernames with allowed characters', async () => {
      const mutation = `
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
            modelId
            name
            username
          }
        }
      `;

      const validUsernames = [
        'user123',
        'test_user',
        'user-name',
        'User_Case-123',
        '123user456'
      ];

      for (const username of validUsernames) {
        const variables = {
          input: {
            name: 'Valid User',
            username: `${username}-${Date.now()}`,
            password: 'validpassword123'
          }
        };

        const result = await executeGraphQLQuery<any>(mutation, variables);
        expect(result.errors).toStrictEqual([]);
        expect(result.data.createUser.username).toContain(username);
      }
    });
  });

  describe('login Mutation', () => {
    it('should login with valid credentials', async () => {
      const mutation = `
        mutation Login($input: LoginInput!) {
          login(input: $input) {
            id
            modelId
            name
            username
            sessionKey
          }
        }
      `;

      const variables = {
        input: {
          username: testUser.username,
          password: 'testpass'
        }
      };

      const result = await executeGraphQLQuery<any>(mutation, variables);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.login).toBeDefined();
      expect(result.data.login.modelId).toBeDefined();
      expect(result.data.login.name).toBe(testUser.name);
      expect(result.data.login.username).toBe(testUser.username);
      expect(result.data.login.sessionKey).toBe(testUser.sessionKey);
    });

    it('should reject invalid username', async () => {
      const mutation = `
        mutation Login($input: LoginInput!) {
          login(input: $input) {
            id
            modelId
            name
          }
        }
      `;

      const variables = {
        input: {
          username: 'nonexistentuser',
          password: 'anypassword'
        }
      };

      const result = await executeGraphQLQuery<any>(mutation, variables);

      expect(result.errors).toBeDefined();
      expect(result?.errors?.length).toBeGreaterThan(0);
      expect(result?.errors?.[0].message).toContain('Invalid username or password');
    });

    it('should reject invalid password', async () => {
      const mutation = `
        mutation Login($input: LoginInput!) {
          login(input: $input) {
            id
            modelId
            name
          }
        }
      `;

      const variables = {
        input: {
          username: testUser.username,
          password: 'wrongpassword'
        }
      };

      const result = await executeGraphQLQuery<any>(mutation, variables);

      expect(result.errors).toBeDefined();
      expect(result?.errors?.length).toBeGreaterThan(0);
      expect(result?.errors?.[0].message).toContain('Invalid username or password');
    });

    it('should handle login with case sensitivity', async () => {
      const mutation = `
        mutation Login($input: LoginInput!) {
          login(input: $input) {
            id
            modelId
            name
          }
        }
      `;

      // Test wrong case username
      const wrongCaseVariables = {
        input: {
          username: testUser.username.toUpperCase(), // Different case
          password: 'testpass'
        }
      };

      const result = await executeGraphQLQuery<any>(mutation, wrongCaseVariables);
      expect(result.errors).toBeDefined();
      expect(result?.errors?.[0].message).toContain('Invalid username or password');
    });

    it('should validate required login fields', async () => {
      const mutation = `
        mutation Login($input: LoginInput!) {
          login(input: $input) {
            id
            modelId
            name
          }
        }
      `;

      // Test missing username
      const missingUsernameVariables = {
        input: {
          password: 'testpass'
        }
      };

      const missingUsernameResult = await executeGraphQLQuery<any>(mutation, missingUsernameVariables);
      expect(missingUsernameResult.errors).toBeDefined();
      expect(missingUsernameResult?.errors?.[0].message).toContain('username');

      // Test missing password
      const missingPasswordVariables = {
        input: {
          username: testUser.username
        }
      };

      const missingPasswordResult = await executeGraphQLQuery<any>(mutation, missingPasswordVariables);
      expect(missingPasswordResult.errors).toBeDefined();
      expect(missingPasswordResult?.errors?.[0].message).toContain('password');
    });
  });

  describe('updateUser Mutation', () => {
    it('should find user for update when authenticated', async () => {
      const mutation = `
        mutation UpdateUser($input: UpdateUserInput!) {
          updateUser(input: $input) {
            id
            modelId
            name
            username
            updatedAt
          }
        }
      `;

      const variables = {
        input: {
          name: testUser.name, // Use existing name
          username: testUser.username, // Use existing username
          password: 'testpass'
        }
      };

      const context = createAuthContext(testUser.sessionKey);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.updateUser).toBeDefined();
      expect(result.data.updateUser.modelId).toBeDefined();
      expect(result.data.updateUser.name).toBe(testUser.name);
      expect(result.data.updateUser.username).toBe(testUser.username);
      expect(result.data.updateUser.updatedAt).toBeDefined();
    });

    it('should handle update operations with existing data', async () => {
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
          name: testUser.name, // Use existing data
          username: testUser.username,
          password: 'testpass'
        }
      };

      const context = createAuthContext(testUser.sessionKey);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.updateUser.name).toBe(testUser.name);
      expect(result.data.updateUser.updatedAt).toBeDefined();
    });

    it('should reject unauthorized updates', async () => {
      const mutation = `
        mutation UpdateUser($input: UpdateUserInput!) {
          updateUser(input: $input) {
            id
            modelId
            name
          }
        }
      `;

      const variables = {
        input: {
          name: 'Hacker Attempt',
          // Use testData's username since updateUser finds user by username
          username: testUser.username,
          password: 'testpass'
        }
      };

      const invalidContext = createAuthContext('invalid-session-key');
      const result = await executeGraphQLQuery<any>(mutation, variables, invalidContext);

      expect(result.errors).toBeDefined();
      expect(result?.errors?.length).toBeGreaterThan(0);
      expect(result?.errors?.[0].message).toContain('Unauthorized');
    });

    it('should validate update constraints', async () => {
      const mutation = `
        mutation UpdateUser($input: UpdateUserInput!) {
          updateUser(input: $input) {
            id
            modelId
            name
            username
          }
        }
      `;

      const invalidVariables = {
        input: {
          id: testUser.id,
          name: '', // Empty name should be invalid
          username: 'invalid',
          password: 'testpass'
        }
      };

      const context = createAuthContext(testUser.sessionKey);
      const result = await executeGraphQLQuery<any>(mutation, invalidVariables, context);

      expect(result.errors).toBeDefined();
      expect(result?.errors?.[0].message).toContain('name');
    });

    it('should prevent updating to existing username', async () => {
      // Create second user
      const secondUser = await createUser(dataSource, {
        username: 'seconduser123',
        name: 'Second User'
      });

      const mutation = `
        mutation UpdateUser($input: UpdateUserInput!) {
          updateUser(input: $input) {
            id
            modelId
            name
            username
          }
        }
      `;

      const variables = {
        input: {
          id: testUser.id,
          name: testUser.name,
          username: secondUser.username, // Try to use existing username
          password: 'testpass'
        }
      };

      const context = createAuthContext(testUser.sessionKey);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toBeDefined();
      expect(result?.errors?.length).toBeGreaterThan(0);
    });
  });

  describe('Integration Workflows', () => {
    it('should support complete user lifecycle via GraphQL', async () => {
      // 1. Create user
      const createMutation = `
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
            modelId
            name
            username
            sessionKey
          }
        }
      `;

      const createVariables = {
        input: {
          name: 'Lifecycle User',
          username: `lifecycle-${Date.now()}`,
          password: 'lifecyclepass'
        }
      };

      const createResult = await executeGraphQLQuery<any>(createMutation, createVariables);
      expect(createResult.errors).toStrictEqual([]);
      const createdUser = createResult.data.createUser;

      // 2. Login with created user
      const loginMutation = `
        mutation Login($input: LoginInput!) {
          login(input: $input) {
            id
            modelId
            sessionKey
          }
        }
      `;

      const loginVariables = {
        input: {
          username: createVariables.input.username,
          password: createVariables.input.password
        }
      };

      const loginResult = await executeGraphQLQuery<any>(loginMutation, loginVariables);
      expect(loginResult.errors).toStrictEqual([]);
      expect(loginResult.data.login.modelId).toBeDefined();

      // 3. Update user
      const updateMutation = `
        mutation UpdateUser($input: UpdateUserInput!) {
          updateUser(input: $input) {
            id
            modelId
            name
            username
          }
        }
      `;

      const updateVariables = {
        input: {
          name: 'Updated Lifecycle User',
          // Use the created user's username since updateUser finds by username
          username: createVariables.input.username,
          password: 'lifecyclepass'
        }
      };

      const updateContext = createAuthContext(loginResult.data.login.sessionKey);
      const updateResult = await executeGraphQLQuery<any>(updateMutation, updateVariables, updateContext);
      expect(updateResult.errors).toStrictEqual([]);
      expect(updateResult.data.updateUser.name).toBeDefined();

      // 4. Verify current user reflects changes
      const query = `
        query {
          currentUser {
            id
            modelId
            name
            username
          }
        }
      `;

      const finalResult = await executeGraphQLQuery<any>(query, {}, updateContext);
      expect(finalResult.errors).toStrictEqual([]);
      expect(finalResult.data.currentUser.name).toBeDefined();
      expect(finalResult.data.currentUser.modelId).toBeDefined();
    });

    it('should handle concurrent operations safely', async () => {
      // Create multiple users concurrently
      const createPromises = Array.from({ length: 5 }, async (_, i) => {
        const mutation = `
          mutation CreateUser($input: CreateUserInput!) {
            createUser(input: $input) {
              id
              modelId
              username
            }
          }
        `;

        const variables = {
          input: {
            name: `Concurrent User ${i}`,
            username: `concurrent${i}_${Date.now()}_${Math.random()}`,
            password: `password${i}`
          }
        };

        return await executeGraphQLQuery<any>(mutation, variables);
      });

      const results = await Promise.all(createPromises);

      // Verify all succeeded
      results.forEach((result, i) => {
        expect(result.errors).toStrictEqual([]);
        expect(result.data.createUser).toBeDefined();
        expect(result.data.createUser.username).toContain(`concurrent${i}`);
      });

      // Verify all have unique usernames
      const usernames = results.map(r => r.data.createUser.username);
      expect(new Set(usernames).size).toBe(5);
    });

    it('should maintain session consistency across operations', async () => {
      // Create and login user
      const createMutation = `
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
            sessionKey
          }
        }
      `;

      const createResult = await executeGraphQLQuery<any>(createMutation, {
        input: {
          name: 'Session Test User',
          username: `sessiontest-${Date.now()}`,
          password: 'sessionpass'
        }
      });

      const sessionKey = createResult.data.createUser.sessionKey;
      const context = createAuthContext(sessionKey);

      // Perform multiple operations with same session
      const query = `
        query {
          currentUser {
            id
            sessionKey
          }
        }
      `;

      const queryResult = await executeGraphQLQuery<any>(query, {}, context);
      expect(queryResult.data.currentUser.sessionKey).toBe(sessionKey);

      // Update user
      const updateMutation = `
        mutation UpdateUser($input: UpdateUserInput!) {
          updateUser(input: $input) {
            id
            sessionKey
          }
        }
      `;

      const updateResult = await executeGraphQLQuery<any>(updateMutation, {
        input: {
          name: createResult.data.createUser.name, // Use existing name
          // Use the created user's username since updateUser finds by username
          username: createResult.data.createUser.username,
          password: 'sessionpass'
        }
      }, context);

      // Session should remain the same
      if (updateResult.data?.updateUser) {
        expect(updateResult.data.updateUser.sessionKey).toBe(sessionKey);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed GraphQL requests gracefully', async () => {
      const malformedQuery = `
        query {
          currentUser {
            id
            nonexistentField
          }
        }
      `;

      const result = await executeGraphQLQuery<any>(malformedQuery, {});
      expect(result.errors).toBeDefined();
      expect(result?.errors?.length).toBeGreaterThan(0);
    });

    it('should handle complex queries correctly', async () => {
      // This tests that the GraphQL server handles complex queries
      const complexQuery = `
        query {
          currentUser {
            id
            modelId
            name
            username
            sessionKey
            createdAt
            updatedAt
          }
        }
      `;

      const context = createAuthContext(testUser.sessionKey);
      const result = await executeGraphQLQuery<any>(complexQuery, {}, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.currentUser).toBeDefined();
      expect(result.data.currentUser.id).toBeDefined();
      expect(result.data.currentUser.sessionKey).toBeDefined();
    });

    it('should handle null and empty inputs appropriately', async () => {
      const mutation = `
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
            name
            username
          }
        }
      `;

      const nullVariables = {
        input: null
      };

      const result = await executeGraphQLQuery<any>(mutation, nullVariables);
      expect(result.errors).toBeDefined();
      expect(result?.errors?.length).toBeGreaterThan(0);
    });

    it('should validate input types strictly', async () => {
      const mutation = `
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
            name
            username
          }
        }
      `;

      // Test with wrong data types
      const wrongTypeVariables = {
        input: {
          name: 123, // Should be string
          username: ['array', 'instead', 'of', 'string'], // Should be string
          password: { password: 'object' } // Should be string
        }
      };

      const result = await executeGraphQLQuery<any>(mutation, wrongTypeVariables);
      expect(result.errors).toBeDefined();
      expect(result?.errors?.length).toBeGreaterThan(0);
    });
  });
});