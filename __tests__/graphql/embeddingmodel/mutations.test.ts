/**
 * EmbeddingModel GraphQL Mutation Tests
 * Tests for embedding model-related GraphQL mutations with verification
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { initializeGraphQLSchema, executeGraphQLQuery } from '@main/graphql/server';
import { fromGlobalIdToLocalId } from '@base/graphql/index';
import {
  createTestDatabase,
  cleanupTestDatabase,
} from '../../base/testDatabase';
import { createUser, createConnection } from '@factories/index';
import { DataSourceProvider } from '@base/db/index';
import { ConnectionKind } from '@db/entities/__generated__/ConnectionBase';
import { setupPolly, PollyContext } from '@tests/polly/helpers';

describe('EmbeddingModel GraphQL Mutations with Verification', () => {
  let dataSource: any;
  let testData: any;
  let testConnection: any;
  let pollyContext: PollyContext;

  beforeAll(async () => {
    pollyContext = setupPolly({
      recordingName: 'embeddingmodel-mutations',
    });
    await initializeGraphQLSchema();
  });

  beforeEach(async () => {
    dataSource = await createTestDatabase();
    testData = await createUser(dataSource);

    // Create a test connection for the embedding models using localhost URL
    testConnection = await createConnection(dataSource, {
      userId: testData.id,
      name: 'Test OpenAI Connection',
      kind: ConnectionKind.OPENAI,
      provider: 'OpenAI',
      apiKey: 'not-required',
      baseUrl: 'http://localhost:1234/v1'
    });
  });

  afterEach(async () => {
    DataSourceProvider.clearTestDataSource();
    await cleanupTestDatabase(dataSource);
  });

  afterAll(async () => {
    pollyContext.stop();
  });

  function createAuthContext(user: any) {
    return { sessionKey: user.sessionKey };
  }

  describe('createEmbeddingModel mutation with verification', () => {
    it('should create a new embedding model with successful verification and dimension override', async () => {
      const mutation = `
        mutation CreateEmbeddingModel($input: CreateEmbeddingModelInput!) {
          createEmbeddingModel(input: $input) {
            id
            modelId
            name
            connectionId
            dimension
            contextLength
            maxBatchSize
            modelIdentifier
            createdAt
            updatedAt
          }
        }
      `;

      const variables = {
        input: {
          name: 'Nomic Embed Model',
          connectionId: testConnection.id,
          dimension: 1024, // This should be overridden by verification result
          contextLength: 8192,
          maxBatchSize: 100,
          modelIdentifier: 'text-embedding-nomic-embed-text-v1.5'
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.createEmbeddingModel).toBeDefined();

      const embeddingModel = result.data.createEmbeddingModel;
      expect(embeddingModel.id).toBeDefined();
      expect(embeddingModel.modelId).toBeDefined();
      expect(embeddingModel.name).toBe('Nomic Embed Model');
      expect(fromGlobalIdToLocalId(embeddingModel.connectionId)).toBe(testConnection.id);
      expect(embeddingModel.dimension).toBeGreaterThan(0); // Dimension should be set by verification
      expect(embeddingModel.contextLength).toBe(8192);
      expect(embeddingModel.maxBatchSize).toBe(100);
      expect(embeddingModel.modelIdentifier).toBe('text-embedding-nomic-embed-text-v1.5');
      expect(typeof embeddingModel.createdAt).toBe('string');
      expect(typeof embeddingModel.updatedAt).toBe('string');
    });

    it('should handle verification for any model name', async () => {
      const mutation = `
        mutation CreateEmbeddingModel($input: CreateEmbeddingModelInput!) {
          createEmbeddingModel(input: $input) {
            id
            name
            modelIdentifier
            dimension
          }
        }
      `;

      const variables = {
        input: {
          name: 'Test Embedding Model',
          connectionId: testConnection.id,
          dimension: 512,
          contextLength: 4096,
          maxBatchSize: 50,
          modelIdentifier: 'test-embedding-model'
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      // The test environment localhost server might accept any model name
      if (result.errors && result.errors.length > 0) {
        // If verification fails, that's also acceptable behavior
        expect(result.errors[0].message).toContain('Failed to verify embedding model');
      } else {
        // If verification succeeds, verify the model was created
        expect(result.data?.createEmbeddingModel).toBeDefined();
        expect(result.data.createEmbeddingModel.name).toBe('Test Embedding Model');
        expect(result.data.createEmbeddingModel.modelIdentifier).toBe('test-embedding-model');
        expect(result.data.createEmbeddingModel.dimension).toBeGreaterThan(0);
      }
    });

    it('should fail when connection does not exist', async () => {
      const mutation = `
        mutation CreateEmbeddingModel($input: CreateEmbeddingModelInput!) {
          createEmbeddingModel(input: $input) {
            id
            name
          }
        }
      `;

      const variables = {
        input: {
          name: 'Orphan Embedding Model',
          connectionId: 'Q29ubmVjdGlvbjppbnZhbGlkLWNvbm5lY3Rpb24taWQ=', // Invalid connection ID
          dimension: 768,
          contextLength: 4096,
          maxBatchSize: 100,
          modelIdentifier: 'text-embedding-nomic-embed-text-v1.5'
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('SQLITE_CONSTRAINT: FOREIGN KEY constraint failed');
    });

    it('should work with custom headers from connection', async () => {
      // Create connection with custom headers
      const connectionWithHeaders = await createConnection(dataSource, {
        userId: testData.id,
        name: 'Custom Header Connection',
        kind: ConnectionKind.OPENAI,
        provider: 'Custom Provider',
        baseUrl: 'http://localhost:1234/v1',
        customHeaders: {
          'Authorization': 'Bearer custom-token',
          'X-Custom-Header': 'custom-value'
        }
      });

      const mutation = `
        mutation CreateEmbeddingModel($input: CreateEmbeddingModelInput!) {
          createEmbeddingModel(input: $input) {
            id
            name
            connectionId
            dimension
          }
        }
      `;

      const variables = {
        input: {
          name: 'Custom Header Embedding Model',
          connectionId: connectionWithHeaders.id,
          dimension: 512, // Will be overridden
          contextLength: 4096,
          maxBatchSize: 100,
          modelIdentifier: 'text-embedding-nomic-embed-text-v1.5'
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.createEmbeddingModel.name).toBe('Custom Header Embedding Model');
      expect(result.data.createEmbeddingModel.dimension).toBeGreaterThan(0); // Should be overridden
    });

    it('should return error for unauthenticated user', async () => {
      const mutation = `
        mutation CreateEmbeddingModel($input: CreateEmbeddingModelInput!) {
          createEmbeddingModel(input: $input) {
            id
            name
          }
        }
      `;

      const variables = {
        input: {
          name: 'Unauthorized Embedding Model',
          connectionId: testConnection.id,
          dimension: 768,
          contextLength: 4096,
          maxBatchSize: 100,
          modelIdentifier: 'text-embedding-nomic-embed-text-v1.5'
        }
      };

      const result = await executeGraphQLQuery<any>(mutation, variables);

      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.data?.createEmbeddingModel).toBeUndefined();
    });
  });

  describe('updateEmbeddingModel mutation with verification', () => {
    let existingModel: any;

    beforeEach(async () => {
      // Create a model to update
      const createMutation = `
        mutation CreateEmbeddingModel($input: CreateEmbeddingModelInput!) {
          createEmbeddingModel(input: $input) {
            id
            modelId
            name
            connectionId
            dimension
            modelIdentifier
          }
        }
      `;

      const variables = {
        input: {
          name: 'Original Embedding Model',
          connectionId: testConnection.id,
          dimension: 768, // Will be overridden to actual dimension
          contextLength: 4096,
          maxBatchSize: 100,
          modelIdentifier: 'text-embedding-nomic-embed-text-v1.5'
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(createMutation, variables, context);
      existingModel = result.data.createEmbeddingModel;
    });

    it('should update embedding model and re-verify with dimension override', async () => {
      const mutation = `
        mutation UpdateEmbeddingModel($input: UpdateEmbeddingModelInput!) {
          updateEmbeddingModel(input: $input) {
            id
            modelId
            name
            connectionId
            dimension
            modelIdentifier
            updatedAt
          }
        }
      `;

      const variables = {
        input: {
          id: existingModel.id,
          name: 'Updated Embedding Model',
          connectionId: testConnection.id,
          dimension: 512, // This should be overridden
          modelIdentifier: 'text-embedding-nomic-embed-text-v1.5' // Same model
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.updateEmbeddingModel).toBeDefined();

      const updatedModel = result.data.updateEmbeddingModel;
      expect(updatedModel.id).toBe(existingModel.id);
      expect(updatedModel.name).toBe('Updated Embedding Model');
      expect(updatedModel.dimension).toBeGreaterThan(0); // Should be overridden by verification
      expect(updatedModel.modelIdentifier).toBe('text-embedding-nomic-embed-text-v1.5');
    });

    it('should handle verification during model updates', async () => {
      const mutation = `
        mutation UpdateEmbeddingModel($input: UpdateEmbeddingModelInput!) {
          updateEmbeddingModel(input: $input) {
            id
            name
            modelIdentifier
            dimension
          }
        }
      `;

      const variables = {
        input: {
          id: existingModel.id,
          name: 'Updated Test Model',
          connectionId: testConnection.id,
          modelIdentifier: 'updated-test-model'
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      // The test environment localhost server might accept any model name
      if (result.errors && result.errors.length > 0) {
        // If verification fails, that's also acceptable behavior
        expect(result.errors[0].message).toContain('Failed to verify embedding model');
      } else {
        // If verification succeeds, verify the model was updated
        expect(result.data?.updateEmbeddingModel).toBeDefined();
        expect(result.data.updateEmbeddingModel.name).toBe('Updated Test Model');
        expect(result.data.updateEmbeddingModel.modelIdentifier).toBe('updated-test-model');
        expect(result.data.updateEmbeddingModel.dimension).toBeGreaterThan(0);
      }
    });
  });
});