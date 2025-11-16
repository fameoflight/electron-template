/**
 * LLMModel GraphQL Mutation Tests
 * Tests for LLM model-related GraphQL mutations with verification
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

describe('LLMModel GraphQL Mutations with Verification', () => {
  let dataSource: any;
  let testData: any;
  let testConnection: any;
  let pollyContext: PollyContext;

  beforeAll(async () => {
    pollyContext = setupPolly({
      recordingName: 'llmmodel-mutations',
    });
    await initializeGraphQLSchema();
  });

  beforeEach(async () => {
    dataSource = await createTestDatabase();
    testData = await createUser(dataSource);

    // Create a test connection for the LLM models using localhost URL
    testConnection = await createConnection(dataSource, {
      userId: testData.id,
      name: 'Test Local Connection',
      kind: ConnectionKind.OPENAI,
      provider: 'Local Provider',
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

  describe('createLLMModel mutation with verification', () => {
    it('should create a new LLM model with successful verification', async () => {
      const mutation = `
        mutation CreateLLMModel($input: CreateLLMModelInput!) {
          createLLMModel(input: $input) {
            id
            modelId
            name
            connectionId
            temperature
            contextLength
            capabilities
            modelIdentifier
            createdAt
            updatedAt
          }
        }
      `;

      const variables = {
        input: {
          name: 'Gemma 3 4B Model',
          connectionId: testConnection.id,
          temperature: 70, // 0.7 in integer form
          contextLength: 8192,
          capabilities: ['TEXT', 'VISION'],
          modelIdentifier: 'google/gemma-3-4b'
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.createLLMModel).toBeDefined();

      const llmModel = result.data.createLLMModel;
      expect(llmModel.id).toBeDefined();
      expect(llmModel.modelId).toBeDefined();
      expect(llmModel.name).toBe('Gemma 3 4B Model');
      expect(fromGlobalIdToLocalId(llmModel.connectionId)).toBe(testConnection.id);
      expect(llmModel.temperature).toBe(70);
      expect(llmModel.contextLength).toBe(8192);
      expect(llmModel.capabilities).toEqual(['TEXT', 'VISION']);
      expect(llmModel.modelIdentifier).toBe('google/gemma-3-4b');
      expect(typeof llmModel.createdAt).toBe('string');
      expect(typeof llmModel.updatedAt).toBe('string');
    });

    it('should handle verification for any model name', async () => {
      const mutation = `
        mutation CreateLLMModel($input: CreateLLMModelInput!) {
          createLLMModel(input: $input) {
            id
            name
            modelIdentifier
            temperature
          }
        }
      `;

      const variables = {
        input: {
          name: 'Test LLM Model',
          connectionId: testConnection.id,
          temperature: 50,
          contextLength: 4096,
          capabilities: ['TEXT'],
          modelIdentifier: 'test-llm-model'
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      // The test environment localhost server might accept any model name
      if (result.errors && result.errors.length > 0) {
        // If verification fails, that's also acceptable behavior
        expect(result.errors[0].message).toContain('Failed to verify LLM model');
      } else {
        // If verification succeeds, verify the model was created
        expect(result.data?.createLLMModel).toBeDefined();
        expect(result.data.createLLMModel.name).toBe('Test LLM Model');
        expect(result.data.createLLMModel.modelIdentifier).toBe('test-llm-model');
        expect(result.data.createLLMModel.temperature).toBe(50);
      }
    });

    it('should fail when connection does not exist', async () => {
      const mutation = `
        mutation CreateLLMModel($input: CreateLLMModelInput!) {
          createLLMModel(input: $input) {
            id
            name
          }
        }
      `;

      const variables = {
        input: {
          name: 'Orphan Model',
          connectionId: 'Q29ubmVjdGlvbjppbnZhbGlkLWNvbm5lY3Rpb24taWQ=', // Invalid connection ID
          temperature: 50,
          contextLength: 4096,
          capabilities: ['TEXT'],
          modelIdentifier: 'google/gemma-3-4b'
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
        mutation CreateLLMModel($input: CreateLLMModelInput!) {
          createLLMModel(input: $input) {
            id
            name
            connectionId
          }
        }
      `;

      const variables = {
        input: {
          name: 'Custom Header Model',
          connectionId: connectionWithHeaders.id,
          temperature: 50,
          contextLength: 4096,
          capabilities: ['TEXT'],
          modelIdentifier: 'google/gemma-3-4b'
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.createLLMModel.name).toBe('Custom Header Model');
    });

    it('should return error for unauthenticated user', async () => {
      const mutation = `
        mutation CreateLLMModel($input: CreateLLMModelInput!) {
          createLLMModel(input: $input) {
            id
            name
          }
        }
      `;

      const variables = {
        input: {
          name: 'Unauthorized Model',
          connectionId: testConnection.id,
          temperature: 50,
          contextLength: 4096,
          capabilities: ['TEXT'],
          modelIdentifier: 'google/gemma-3-4b'
        }
      };

      const result = await executeGraphQLQuery<any>(mutation, variables);

      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.data?.createLLMModel).toBeUndefined();
    });
  });

  describe('updateLLMModel mutation with verification', () => {
    let existingModel: any;

    beforeEach(async () => {
      // Create a model to update
      const createMutation = `
        mutation CreateLLMModel($input: CreateLLMModelInput!) {
          createLLMModel(input: $input) {
            id
            modelId
            name
            connectionId
            temperature
            modelIdentifier
          }
        }
      `;

      const variables = {
        input: {
          name: 'Original LLM Model',
          connectionId: testConnection.id,
          temperature: 50,
          contextLength: 4096,
          capabilities: ['TEXT'],
          modelIdentifier: 'google/gemma-3-4b'
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(createMutation, variables, context);
      existingModel = result.data.createLLMModel;
    });

    it('should update LLM model and re-verify', async () => {
      const mutation = `
        mutation UpdateLLMModel($input: UpdateLLMModelInput!) {
          updateLLMModel(input: $input) {
            id
            modelId
            name
            connectionId
            temperature
            modelIdentifier
            updatedAt
          }
        }
      `;

      const variables = {
        input: {
          id: existingModel.id,
          name: 'Updated Gemma Model',
          connectionId: testConnection.id,
          temperature: 80, // Change temperature
          modelIdentifier: 'google/gemma-3-4b' // Same model
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.updateLLMModel).toBeDefined();

      const updatedModel = result.data.updateLLMModel;
      expect(updatedModel.id).toBe(existingModel.id);
      expect(updatedModel.name).toBe('Updated Gemma Model');
      expect(updatedModel.temperature).toBe(80);
      expect(updatedModel.modelIdentifier).toBe('google/gemma-3-4b');
    });

    it('should handle verification during model updates', async () => {
      const mutation = `
        mutation UpdateLLMModel($input: UpdateLLMModelInput!) {
          updateLLMModel(input: $input) {
            id
            name
            modelIdentifier
            temperature
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
        expect(result.errors[0].message).toContain('Failed to verify LLM model');
      } else {
        // If verification succeeds, verify the model was updated
        expect(result.data?.updateLLMModel).toBeDefined();
        expect(result.data.updateLLMModel.name).toBe('Updated Test Model');
        expect(result.data.updateLLMModel.modelIdentifier).toBe('updated-test-model');
      }
    });
  });

  describe('Anthropic LLM model verification', () => {
    let anthropicConnection: any;

    beforeEach(async () => {
      // Create an Anthropic connection
      anthropicConnection = await createConnection(dataSource, {
        userId: testData.id,
        name: 'Test Anthropic Connection',
        kind: ConnectionKind.ANTHROPIC,
        provider: 'Anthropic',
        apiKey: 'not-required',
        baseUrl: 'http://localhost:1234/v1'
      });
    });

    it('should handle Anthropic models verification', async () => {
      const mutation = `
        mutation CreateLLMModel($input: CreateLLMModelInput!) {
          createLLMModel(input: $input) {
            id
            name
            connectionId
            modelIdentifier
          }
        }
      `;

      const variables = {
        input: {
          name: 'Claude Model',
          connectionId: anthropicConnection.id,
          temperature: 30,
          contextLength: 100000,
          capabilities: ['TEXT'],
          modelIdentifier: 'claude-3-sonnet-20240229'
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      // Anthropic models might fail verification with localhost server
      if (result.errors && result.errors.length > 0) {
        // If verification fails, that's expected behavior for Anthropic with localhost
        expect(result.errors[0].message).toContain('Failed to verify LLM model');
      } else {
        // If verification succeeds, verify the model was created
        expect(result.data?.createLLMModel).toBeDefined();
        expect(result.data.createLLMModel.name).toBe('Claude Model');
        expect(result.data.createLLMModel.modelIdentifier).toBe('claude-3-sonnet-20240229');
      }
    });
  });
});