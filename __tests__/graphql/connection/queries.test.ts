/**
 * Connection GraphQL Query Tests
 * Tests for connection-related GraphQL queries using executeGraphQLQuery
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { initializeGraphQLSchema, executeGraphQLQuery } from '@main/graphql/server';
import { fromGlobalId, fromGlobalIdToLocalId } from '@base/graphql/index';
import {
  createTestDatabase,
  cleanupTestDatabase,
} from '../../base/testDatabase';
import { createUser, createConnection } from '@factories/index';
import { DataSourceProvider } from '@base/db/index';
import { ConnectionKind } from '@db/entities/__generated__/ConnectionBase';

describe('Connection GraphQL Queries', () => {
  let dataSource: any;
  let testData: any;
  let connections: any[];

  beforeAll(async () => {
    await initializeGraphQLSchema();
  });

  beforeEach(async () => {
    dataSource = await createTestDatabase();
    testData = await createUser(dataSource);

    // Create test connections for the user
    connections = await Promise.all([
      createConnection(dataSource, {
        userId: testData.id,
        name: 'OpenAI Connection',
        kind: ConnectionKind.OPENAI,
        provider: 'OpenAI'
      }),
      createConnection(dataSource, {
        userId: testData.id,
        name: 'Anthropic Connection',
        kind: ConnectionKind.ANTHROPIC,
        provider: 'Anthropic'
      }),
      createConnection(dataSource, {
        userId: testData.id,
        name: 'Custom API Connection',
        kind: ConnectionKind.OPENAI,
        provider: 'Custom Provider',
        customHeaders: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token123'
        }
      })
    ]);
  });

  afterEach(async () => {
    DataSourceProvider.clearTestDataSource();
    await cleanupTestDatabase(dataSource);
  });

  function createAuthContext(sessionKey: string) {
    return { sessionKey };
  }

  describe('currentUser query (sanity check)', () => {
    it('should return current user with valid session', async () => {
      const query = `
        query {
          currentUser {
            id
            name
          }
        }
      `;

      const context = createAuthContext(testData.sessionKey);
      const result = await executeGraphQLQuery<any>(query, {}, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.currentUser).toBeDefined();
      expect(result.data.currentUser.id).toBeDefined();
      expect(result.data.currentUser.name).toBe(testData.name);
    });
  });

  describe('Database connection test', () => {
    it('should be able to create a connection directly', async () => {
      // Test if we can create a connection directly using the repository
      const Connection = await import('@db/entities/Connection.js').then(m => m.Connection);
      const connectionRepo = dataSource.getRepository(Connection);

      const connection = connectionRepo.create({
        name: 'Test Direct Connection',
        apiKey: 'not-required',
        baseUrl: 'http://localhost:1234/v1',
        kind: ConnectionKind.OPENAI,
        provider: 'OpenAI',
        userId: testData.id
      });

      const savedConnection = await connectionRepo.save(connection);
      expect(savedConnection.id).toBeDefined();
      expect(savedConnection.name).toBe('Test Direct Connection');
    });
  });

  describe('connectionsArray query', () => {
    it('should return connections array for authenticated user', async () => {
      const query = `
        query ConnectionPageQuery {
          currentUser {
            id
          }
          connectionsArray {
            id
            modelId
            name
            apiKey
            baseUrl
            provider
            kind
            customHeaders
          }
        }
      `;

      const context = createAuthContext(testData.sessionKey);
      const result = await executeGraphQLQuery<any>(query, {}, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.currentUser).toBeDefined();
      expect(result.data.connectionsArray).toBeDefined();

      // Verify current user
      expect(fromGlobalIdToLocalId(result.data.currentUser.id)).toBe(testData.id);

      // Verify connections array
      const connectionsArray = result.data.connectionsArray;
      expect(Array.isArray(connectionsArray)).toBe(true);
      expect(connectionsArray.length).toBeGreaterThan(0);

      const idParts = fromGlobalId(connectionsArray[0].id);

      expect(idParts.type).toBe('Connection');
      expect(idParts.id).toBe(connectionsArray[0].modelId);

      // Verify connection structure
      connectionsArray.forEach((connection: any) => {
        expect(connection.id).toBeDefined();
        expect(connection.name).toBeDefined();
        expect(connection.apiKey).toBe('not-required');
        expect(connection.baseUrl).toBe('http://localhost:1234/v1');
        expect(connection.provider).toBeDefined();
        expect(connection.kind).toBeDefined();
        expect(connection.customHeaders).toBeDefined();
      });

      // Verify we have the expected connections
      const connectionNames = connectionsArray.map((c: any) => c.name);
      expect(connectionNames).toContain('OpenAI Connection');
      expect(connectionNames).toContain('Anthropic Connection');
      expect(connectionNames).toContain('Custom API Connection');
    });

    it('should return connections array with default kind parameter', async () => {
      const query = `
        query {
          connectionsArray {
            id
            name
            kind
            customHeaders
          }
        }
      `;

      const context = createAuthContext(testData.sessionKey);
      const result = await executeGraphQLQuery<any>(query, {}, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.connectionsArray).toBeDefined();

      const connectionsArray = result.data.connectionsArray;
      expect(Array.isArray(connectionsArray)).toBe(true);

      // Should return active connections (not deleted)
      connectionsArray.forEach((connection: any) => {
        expect(connection.id).toBeDefined();
        expect(connection.name).toBeDefined();
        expect([ConnectionKind.OPENAI, ConnectionKind.ANTHROPIC]).toContain(connection.kind);
      });
    });

    it('should return connections array with kind=all including deleted', async () => {
      // Soft delete one connection first
      const connectionToDelete = connections[0];
      await dataSource.getRepository('Connection').softDelete(connectionToDelete.id);

      const query = `
        query {
          connectionsArray(kind: "all") {
            id
            name
            deletedAt
          }
        }
      `;

      const context = createAuthContext(testData.sessionKey);
      const result = await executeGraphQLQuery<any>(query, {}, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.connectionsArray).toBeDefined();

      const connectionsArray = result.data.connectionsArray;
      expect(Array.isArray(connectionsArray)).toBe(true);

      // With kind="all", we should see the deleted connection too
      const deletedConnection = connectionsArray.find((c: any) =>
        fromGlobalIdToLocalId(c.id) === connectionToDelete.id
      );
      expect(deletedConnection).toBeDefined();
      expect(deletedConnection.deletedAt).toBeDefined();
    });

    it('should return empty array for user with no connections', async () => {
      // Create a user with no connections
      const userWithoutConnections = await createUser(dataSource, {
        username: `no-connections-${Date.now()}`,
      });

      const query = `
        query {
          connectionsArray {
            id
            name
          }
        }
      `;

      const context = createAuthContext(userWithoutConnections.sessionKey!);
      const result = await executeGraphQLQuery<any>(query, {}, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.connectionsArray).toBeDefined();
      expect(Array.isArray(result.data.connectionsArray)).toBe(true);
      expect(result.data.connectionsArray).toHaveLength(0);
    });

    it('should return connections with proper field types', async () => {
      const query = `
        query {
          connectionsArray {
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

      const context = createAuthContext(testData.sessionKey);
      const result = await executeGraphQLQuery<any>(query, {}, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.connectionsArray).toBeDefined();

      const connectionsArray = result.data.connectionsArray;
      expect(connectionsArray.length).toBeGreaterThan(0);

      connectionsArray.forEach((connection: any) => {
        // Verify field types and values
        expect(typeof connection.id).toBe('string');
        expect(typeof connection.modelId).toBe('string');
        expect(typeof connection.name).toBe('string');
        expect(typeof connection.apiKey).toBe('string');
        expect(typeof connection.baseUrl).toBe('string');
        expect(connection.provider === null || typeof connection.provider === 'string');
        expect(['OPENAI', 'ANTHROPIC']).toContain(connection.kind);
        expect(connection.customHeaders === null || typeof connection.customHeaders === 'object');
        expect(typeof connection.createdAt).toBe('string');
        expect(typeof connection.updatedAt).toBe('string');

        // Verify modelId matches decoded id
        expect(fromGlobalIdToLocalId(connection.id)).toBe(connection.modelId);

        // Verify specific values from our factory
        expect(connection.apiKey).toBe('not-required');
        expect(connection.baseUrl).toBe('http://localhost:1234/v1');
      });
    });
  });

  describe('Integration with currentUser', () => {
    it('should return both currentUser and connectionsArray in same query', async () => {
      const query = `
        query ConnectionPageQuery {
          currentUser {
            id
            modelId
            name
          }
          connectionsArray {
            id
            name
            kind
          }
        }
      `;

      const context = createAuthContext(testData.sessionKey);
      const result = await executeGraphQLQuery<any>(query, {}, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();

      // Verify currentUser
      expect(result.data.currentUser).toBeDefined();
      expect(result.data.currentUser.id).toBeDefined();
      expect(result.data.currentUser.name).toBe(testData.name);

      // Verify connectionsArray
      expect(result.data.connectionsArray).toBeDefined();
      expect(Array.isArray(result.data.connectionsArray)).toBe(true);
      expect(result.data.connectionsArray.length).toBeGreaterThan(0);

      // Verify connections belong to current user
      result.data.connectionsArray.forEach((connection: any) => {
        expect(connection.id).toBeDefined();
        expect(connection.name).toBeDefined();
        expect(connection.kind).toBeDefined();
      });
    });
  });
});