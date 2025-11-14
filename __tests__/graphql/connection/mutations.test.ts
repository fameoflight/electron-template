/**
 * Connection GraphQL Mutation Tests
 * Tests for connection-related GraphQL mutations using executeGraphQLQuery
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { initializeGraphQLSchema, executeGraphQLQuery } from '@main/graphql/server';
import {
  createTestDatabase,
  cleanupTestDatabase,
} from '../../base/testDatabase';
import { createUser } from '@factories/index';
import { DataSourceProvider } from '@base/db/index';
import { setupPolly, PollyContext } from '@tests/polly/helpers';

describe('Connection GraphQL Mutations', () => {
  let dataSource: any;
  let testData: any;
  let pollyContext: PollyContext;

  beforeAll(async () => {
    pollyContext = setupPolly({
      recordingName: 'connection-mutations',
    });
    await initializeGraphQLSchema();
  });

  beforeEach(async () => {
    dataSource = await createTestDatabase();
    testData = await createUser(dataSource);
  });

  afterEach(async () => {
    DataSourceProvider.clearTestDataSource();
    await cleanupTestDatabase(dataSource);
  });

  afterAll(async () => {
    pollyContext.stop();
  });

  function createAuthContext(user: any) {
    // Just pass sessionKey - executeGraphQLQuery will load the user automatically
    return { sessionKey: user.sessionKey };
  }

  describe('createConnection mutation', () => {
    it('should create a new connection with valid input', async () => {
      const mutation = `
        mutation CreateConnection($input: CreateConnectionInput!) {
          createConnection(input: $input) {
            id
            modelId
            name
            apiKey
            baseUrl
            provider
            kind
            customHeaders
            createdAt
            updatedAt
          }
        }
      `;

      const variables = {
        input: {
          name: 'New OpenAI Connection',
          apiKey: 'not-required',
          baseUrl: 'http://localhost:1234/v1',
          kind: 'OPENAI',
          provider: 'OpenAI',
          customHeaders: {
            'Content-Type': 'application/json',
            'User-Agent': 'TestApp/1.0'
          }
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.createConnection).toBeDefined();

      const connection = result.data.createConnection;
      expect(connection.id).toBeDefined();
      expect(connection.modelId).toBeDefined();
      expect(connection.name).toBe('New OpenAI Connection');
      expect(connection.apiKey).toBe('not-required');
      expect(connection.baseUrl).toBe('http://localhost:1234/v1');
      expect(connection.provider).toBe('OpenAI');
      expect(connection.kind).toBe('OPENAI');
      expect(connection.customHeaders).toEqual({
        'Content-Type': 'application/json',
        'User-Agent': 'TestApp/1.0'
      });
      expect(typeof connection.createdAt).toBe('string');
      expect(typeof connection.updatedAt).toBe('string');
    });

    it('should create connection with minimal required fields', async () => {
      const mutation = `
        mutation CreateConnection($input: CreateConnectionInput!) {
          createConnection(input: $input) {
            id
            name
            apiKey
            baseUrl
            kind
            provider
            customHeaders
          }
        }
      `;

      const variables = {
        input: {
          name: 'Minimal Connection',
          apiKey: 'not-required',
          baseUrl: 'http://localhost:1234/v1',
          kind: 'ANTHROPIC'
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.createConnection.name).toBe('Minimal Connection');
      expect(result.data.createConnection.kind).toBe('ANTHROPIC');
      expect(result.data.createConnection.provider).toBeNull();
      expect(result.data.createConnection.customHeaders).toBeNull();
    });

    it('should return error for unauthenticated user', async () => {
      const mutation = `
        mutation CreateConnection($input: CreateConnectionInput!) {
          createConnection(input: $input) {
            id
            name
          }
        }
      `;

      const variables = {
        input: {
          name: 'Test Connection',
          apiKey: 'not-required',
          baseUrl: 'http://localhost:1234/v1',
          kind: 'OPENAI'
        }
      };

      const result = await executeGraphQLQuery<any>(mutation, variables);

      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.data?.createConnection).toBeUndefined();
    });

    it('should validate required fields', async () => {
      const mutation = `
        mutation CreateConnection($input: CreateConnectionInput!) {
          createConnection(input: $input) {
            id
            name
          }
        }
      `;

      // Missing required fields
      const variables = {
        input: {
          name: 'Incomplete Connection'
          // Missing apiKey, baseUrl, kind
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('updateConnection mutation', () => {
    let existingConnection: any;

    beforeEach(async () => {
      // Create a connection to update
      const createMutation = `
        mutation CreateConnection($input: CreateConnectionInput!) {
          createConnection(input: $input) {
            id
            modelId
            name
            apiKey
            baseUrl
            provider
            kind
          }
        }
      `;

      const variables = {
        input: {
          name: 'Original Connection',
          apiKey: 'not-required',
          baseUrl: 'http://localhost:1234/v1',
          kind: 'OPENAI',
          provider: 'Original Provider'
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(createMutation, variables, context);
      existingConnection = result.data.createConnection;
    });

    it('should update existing connection with valid input', async () => {
      const mutation = `
        mutation UpdateConnection($input: UpdateConnectionInput!) {
          updateConnection(input: $input) {
            id
            modelId
            name
            apiKey
            baseUrl
            provider
            kind
            updatedAt
          }
        }
      `;

      const variables = {
        input: {
          id: existingConnection.id,
          name: 'Updated Connection Name',
          apiKey: 'not-required',
          baseUrl: 'http://localhost:1234/v1',
          provider: 'Updated Provider'
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.updateConnection).toBeDefined();

      const updatedConnection = result.data.updateConnection;
      expect(updatedConnection.id).toBe(existingConnection.id);
      expect(updatedConnection.modelId).toBe(existingConnection.modelId);
      expect(updatedConnection.name).toBe('Updated Connection Name');
      expect(updatedConnection.apiKey).toBe('not-required');
      expect(updatedConnection.baseUrl).toBe('http://localhost:1234/v1');
      expect(updatedConnection.provider).toBe('Updated Provider');
      expect(updatedConnection.kind).toBe('OPENAI'); // Unchanged
      expect(typeof updatedConnection.updatedAt).toBe('string');
    });

    it('should update only specified fields (partial update)', async () => {
      const mutation = `
        mutation UpdateConnection($input: UpdateConnectionInput!) {
          updateConnection(input: $input) {
            id
            name
            apiKey
            baseUrl
            provider
            kind
          }
        }
      `;

      const variables = {
        input: {
          id: existingConnection.id,
          name: 'Only Name Changed',
          apiKey: 'not-required',
          baseUrl: 'http://localhost:1234/v1'
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toStrictEqual([]);

      const updated = result.data.updateConnection;
      expect(updated.name).toBe('Only Name Changed');
      expect(updated.apiKey).toBe('not-required'); // Unchanged
      expect(updated.baseUrl).toBe('http://localhost:1234/v1'); // Unchanged
      expect(updated.provider).toBe('Original Provider'); // Unchanged
      expect(updated.kind).toBe('OPENAI'); // Unchanged
    });

    it('should return error for non-existent connection', async () => {
      const mutation = `
        mutation UpdateConnection($input: UpdateConnectionInput!) {
          updateConnection(input: $input) {
            id
            name
          }
        }
      `;

      const variables = {
        input: {
          id: 'Q29ubmVjdGlvbjowMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDA=', // Fake global ID
          name: 'Wont Update'
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should return error for unauthenticated user', async () => {
      const mutation = `
        mutation UpdateConnection($input: UpdateConnectionInput!) {
          updateConnection(input: $input) {
            id
            name
          }
        }
      `;

      const variables = {
        input: {
          id: existingConnection.id,
          name: 'Unauthorized Update'
        }
      };

      const result = await executeGraphQLQuery<any>(mutation, variables);

      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('createUpdateConnection mutation', () => {
    it('should create new connection when no ID provided', async () => {
      const mutation = `
        mutation CreateUpdateConnection($input: CreateUpdateConnectionInput!) {
          createUpdateConnection(input: $input) {
            id
            modelId
            name
            kind
            createdAt
          }
        }
      `;

      const variables = {
        input: {
          name: 'Created via CreateUpdate',
          apiKey: 'not-required',
          baseUrl: 'http://localhost:1234/v1',
          kind: 'OPENAI'
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.createUpdateConnection).toBeDefined();
      expect(result.data.createUpdateConnection.name).toBe('Created via CreateUpdate');
      expect(result.data.createUpdateConnection.kind).toBe('OPENAI');
      expect(typeof result.data.createUpdateConnection.createdAt).toBe('string');
    });

    it('should update existing connection when ID provided', async () => {
      // First create a connection
      const createMutation = `
        mutation CreateConnection($input: CreateConnectionInput!) {
          createConnection(input: $input) {
            id
            name
            apiKey
          }
        }
      `;

      const createVariables = {
        input: {
          name: 'Original for CreateUpdate',
          apiKey: 'not-required',
          baseUrl: 'http://localhost:1234/v1',
          kind: 'OPENAI'
        }
      };

      const context = createAuthContext(testData);
      const createResult = await executeGraphQLQuery<any>(createMutation, createVariables, context);
      const existingId = createResult.data.createConnection.id;

      // Now update it using createUpdateConnection
      const mutation = `
        mutation CreateUpdateConnection($input: CreateUpdateConnectionInput!) {
          createUpdateConnection(input: $input) {
            id
            name
            apiKey
            updatedAt
          }
        }
      `;

      const variables = {
        input: {
          id: existingId,
          name: 'Updated via CreateUpdate',
          apiKey: 'not-required',
          baseUrl: 'http://localhost:1234/v1'
        }
      };

      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.createUpdateConnection.id).toBe(existingId);
      expect(result.data.createUpdateConnection.name).toBe('Updated via CreateUpdate');
      expect(result.data.createUpdateConnection.apiKey).toBe('not-required');
      expect(typeof result.data.createUpdateConnection.updatedAt).toBe('string');
    });
  });

  describe('destroyConnection mutation (soft delete)', () => {
    let existingConnection: any;

    beforeEach(async () => {
      // Create a connection to delete
      const createMutation = `
        mutation CreateConnection($input: CreateConnectionInput!) {
          createConnection(input: $input) {
            id
            name
          }
        }
      `;

      const variables = {
        input: {
          name: 'Connection to Delete',
          apiKey: 'not-required',
          baseUrl: 'http://localhost:1234/v1',
          kind: 'OPENAI'
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(createMutation, variables, context);
      existingConnection = result.data.createConnection;
    });

    it('should soft delete connection', async () => {
      const mutation = `
        mutation DestroyConnection($id: String!) {
          destroyConnection(id: $id)
        }
      `;

      const variables = { id: existingConnection.id };
      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.destroyConnection).toBe(true);

      // Verify connection is soft deleted by querying with kind="all"
      const query = `
        query ConnectionsIncludingDeleted {
          connectionsArray(kind: "all") {
            id
            name
            deletedAt
          }
        }
      `;

      const verifyResult = await executeGraphQLQuery<any>(query, {}, context);
      expect(verifyResult.errors).toStrictEqual([]);

      const deletedConnection = verifyResult.data.connectionsArray.find(
        (c: any) => c.id === existingConnection.id
      );
      expect(deletedConnection).toBeDefined();
      expect(deletedConnection.deletedAt).toBeDefined();
    });

    it('should return true when destroying already deleted connection', async () => {
      const mutation = `
        mutation DestroyConnection($id: String!) {
          destroyConnection(id: $id)
        }
      `;

      const context = createAuthContext(testData);

      // Delete once
      const firstDelete = await executeGraphQLQuery<any>(mutation, { id: existingConnection.id }, context);
      expect(firstDelete.data.destroyConnection).toBe(true);

      // Delete again
      const secondDelete = await executeGraphQLQuery<any>(mutation, { id: existingConnection.id }, context);
      expect(secondDelete.data.destroyConnection).toBe(true);
    });

    it('should return error for non-existent connection', async () => {
      const mutation = `
        mutation DestroyConnection($id: String!) {
          destroyConnection(id: $id)
        }
      `;

      const variables = { id: 'Q29ubmVjdGlvbjppbnZhbGlkLWlk' }; // Invalid global ID
      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('deleteConnection mutation (hard delete)', () => {
    let existingConnection: any;

    beforeEach(async () => {
      // Create a connection to hard delete
      const createMutation = `
        mutation CreateConnection($input: CreateConnectionInput!) {
          createConnection(input: $input) {
            id
            name
          }
        }
      `;

      const variables = {
        input: {
          name: 'Connection to Hard Delete',
          apiKey: 'not-required',
          baseUrl: 'http://localhost:1234/v1',
          kind: 'OPENAI'
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(createMutation, variables, context);
      existingConnection = result.data.createConnection;
    });

    it('should hard delete connection permanently', async () => {
      const mutation = `
        mutation DeleteConnection($id: String!) {
          deleteConnection(id: $id)
        }
      `;

      const variables = { id: existingConnection.id };
      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.deleteConnection).toBe(true);

      // Verify connection is completely gone (even with kind="all")
      const query = `
        query ConnectionsIncludingDeleted {
          connectionsArray(kind: "all") {
            id
            name
            deletedAt
          }
        }
      `;

      const verifyResult = await executeGraphQLQuery<any>(query, {}, context);
      expect(verifyResult.errors).toStrictEqual([]);

      const deletedConnection = verifyResult.data.connectionsArray.find(
        (c: any) => c.id === existingConnection.id
      );
      expect(deletedConnection).toBeUndefined();
    });
  });

  describe('restoreConnection mutation', () => {
    let softDeletedConnection: any;

    beforeEach(async () => {
      // Create and then soft delete a connection
      const createMutation = `
        mutation CreateConnection($input: CreateConnectionInput!) {
          createConnection(input: $input) {
            id
            name
          }
        }
      `;

      const createVariables = {
        input: {
          name: 'Connection to Restore',
          apiKey: 'not-required',
          baseUrl: 'http://localhost:1234/v1',
          kind: 'ANTHROPIC'
        }
      };

      const context = createAuthContext(testData);
      const createResult = await executeGraphQLQuery<any>(createMutation, createVariables, context);

      // Soft delete it
      const deleteMutation = `
        mutation DestroyConnection($id: String!) {
          destroyConnection(id: $id)
        }
      `;

      await executeGraphQLQuery<any>(deleteMutation, { id: createResult.data.createConnection.id }, context);

      // Store for restore tests
      softDeletedConnection = createResult.data.createConnection;
    });

    it('should restore soft deleted connection', async () => {
      const mutation = `
        mutation RestoreConnection($id: String!) {
          restoreConnection(id: $id) {
            id
            name
            apiKey
            kind
            deletedAt
            updatedAt
          }
        }
      `;

      const variables = { id: softDeletedConnection.id };
      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.restoreConnection).toBeDefined();

      const restoredConnection = result.data.restoreConnection;
      expect(restoredConnection.id).toBe(softDeletedConnection.id);
      expect(restoredConnection.name).toBe('Connection to Restore');
      expect(restoredConnection.apiKey).toBe('not-required');
      expect(restoredConnection.kind).toBe('ANTHROPIC');
      expect(restoredConnection.deletedAt).toBeNull();
      expect(typeof restoredConnection.updatedAt).toBe('string');

      // Verify connection appears in normal queries again
      const query = `
        query ConnectionsActive {
          connectionsArray {
            id
            name
          }
        }
      `;

      const verifyResult = await executeGraphQLQuery<any>(query, {}, context);
      expect(verifyResult.errors).toStrictEqual([]);

      const restoredInActive = verifyResult.data.connectionsArray.find(
        (c: any) => c.id === softDeletedConnection.id
      );
      expect(restoredInActive).toBeDefined();
    });

    it('should return error for non-deleted connection', async () => {
      // Create an active (non-deleted) connection
      const createMutation = `
        mutation CreateConnection($input: CreateConnectionInput!) {
          createConnection(input: $input) {
            id
            name
          }
        }
      `;

      const createVariables = {
        input: {
          name: 'Active Connection',
          apiKey: 'not-required',
          baseUrl: 'http://localhost:1234/v1',
          kind: 'OPENAI'
        }
      };

      const context = createAuthContext(testData);
      const createResult = await executeGraphQLQuery<any>(createMutation, createVariables, context);

      // Try to restore non-deleted connection
      const mutation = `
        mutation RestoreConnection($id: String!) {
          restoreConnection(id: $id) {
            id
            name
          }
        }
      `;

      const result = await executeGraphQLQuery<any>(mutation, { id: createResult.data.createConnection.id }, context);

      expect(result.errors).toEqual([]);
      expect(result.data.restoreConnection).toBeNull();
    });
  });

  describe('Authorization tests', () => {
    it('should prevent user from accessing another user\'s connections', async () => {
      // Create connection for first user
      const user1ConnectionMutation = `
        mutation CreateConnection($input: CreateConnectionInput!) {
          createConnection(input: $input) {
            id
            name
          }
        }
      `;

      const user1Variables = {
        input: {
          name: 'User 1 Connection',
          apiKey: 'not-required',
          baseUrl: 'http://localhost:1234/v1',
          kind: 'OPENAI'
        }
      };

      const user1Context = createAuthContext(testData);
      const user1Result = await executeGraphQLQuery<any>(user1ConnectionMutation, user1Variables, user1Context);
      const user1ConnectionId = user1Result.data.createConnection.id;

      // Create second user
      const user2 = await createUser(dataSource, {
        username: 'user2',
        name: 'User 2'
      });

      // Try to update first user's connection as second user
      const updateMutation = `
        mutation UpdateConnection($input: UpdateConnectionInput!) {
          updateConnection(input: $input) {
            id
            name
          }
        }
      `;

      const user2Context = createAuthContext(user2.sessionKey);
      const updateResult = await executeGraphQLQuery<any>(updateMutation, {
        input: {
          id: user1ConnectionId,
          name: 'Hacked by User 2'
        }
      }, user2Context);

      expect(updateResult.errors).toBeDefined();
      expect(updateResult.errors.length).toBeGreaterThan(0);
    });

    it('should prevent user from deleting another user\'s connections', async () => {
      // Create connection for first user
      const user1ConnectionMutation = `
        mutation CreateConnection($input: CreateConnectionInput!) {
          createConnection(input: $input) {
            id
            name
          }
        }
      `;

      const user1Variables = {
        input: {
          name: 'User 1 Protected Connection',
          apiKey: 'not-required',
          baseUrl: 'http://localhost:1234/v1',
          kind: 'OPENAI'
        }
      };

      const user1Context = createAuthContext(testData);
      const user1Result = await executeGraphQLQuery<any>(user1ConnectionMutation, user1Variables, user1Context);
      const user1ConnectionId = user1Result.data.createConnection.id;

      // Create second user
      const user2 = await createUser(dataSource, {
        username: 'malicious-user',
        name: 'Malicious User'
      });

      // Try to delete first user's connection as second user
      const deleteMutation = `
        mutation DestroyConnection($id: String!) {
          destroyConnection(id: $id)
        }
      `;

      const user2Context = createAuthContext(user2.sessionKey);
      const deleteResult = await executeGraphQLQuery<any>(deleteMutation, { id: user1ConnectionId }, user2Context);

      expect(deleteResult.errors).toBeDefined();
      expect(deleteResult.errors.length).toBeGreaterThan(0);
    });
  });
});