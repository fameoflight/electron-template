/**
 * Chat GraphQL Mutation Tests
 * Tests for chat-related GraphQL mutations using executeGraphQLQuery
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { initializeGraphQLSchema, executeGraphQLQuery } from '@main/graphql/server';
import { fromGlobalIdToLocalId } from '@base/graphql/index';
import {
  createTestDatabase,
  cleanupTestDatabase,
} from '../../base/testDatabase';
import { DataSourceProvider } from '@main/base/db/index';
import { createUser } from '@factories/index';
import { ConnectionKind } from '@db/entities/__generated__/ConnectionBase';
import { LLMModelCapability } from '@db/entities/__generated__/LLMModelBase';
import { MessageRole } from '@db/entities/__generated__/MessageBase';
import { setupPolly, PollyContext } from '@tests/polly/helpers';
import { createConnection, createLLMModel, createChat } from '@factories/index';
import { EntityClasses, getEntity, loadEntities } from '@main/db/entityMap';
import JobQueue from '@main/services/JobQueue';
import { StreamMessageVersionJob } from '@main/jobs/StreamMessageVersionJob';
import { DataSource } from 'typeorm';

describe('Chat GraphQL Mutations', () => {
  let dataSource: DataSource;
  let testData: any;
  let pollyContext: PollyContext;
  let User: EntityClasses['User'];
  let Connection: EntityClasses['Connection'];
  let LLMModel: EntityClasses['LLMModel'];
  let Chat: EntityClasses['Chat'];
  let Message: EntityClasses['Message'];
  let Job: EntityClasses['Job'];
  let jobQueue: JobQueue;
  let connection: any;
  let llmModel: any;

  beforeAll(async () => {
    pollyContext = setupPolly({
      recordingName: 'chat-mutations',
    });
    await initializeGraphQLSchema();
  });

  beforeEach(async () => {
    dataSource = await createTestDatabase();
    testData = await createUser(dataSource);

    // Load entities
    const entities = await loadEntities();
    User = entities.User;
    Connection = entities.Connection;
    LLMModel = entities.LLMModel;
    Chat = entities.Chat;
    Message = entities.Message;
    Job = getEntity('Job');

    // Set up JobQueue for job integration tests - create fresh instance per test
    // Don't start it automatically if we need to test PENDING status
    const newJobQueue = new JobQueue();
    newJobQueue.registerJob(StreamMessageVersionJob);
    // Store the instance for cleanup
    (global as any).__testJobQueue = newJobQueue;

    // Create connection for AI provider (used by all tests)
    connection = await createConnection(dataSource, {
      userId: testData.id,
      name: 'Test OpenAI Connection',
      apiKey: 'not-required',
      baseUrl: 'http://localhost:1234/v1',
      kind: ConnectionKind.OPENAI,
      provider: 'OpenAI'
    });

    // Create LLM model (used by all tests)
    llmModel = await createLLMModel(dataSource, {
      connectionId: connection.id,
      name: 'Google Gemma 3 4B',
      modelIdentifier: 'google/gemma-3-4b',
      temperature: 0.7,
      contextLength: 4096,
      capabilities: [LLMModelCapability.TEXT],
      userId: testData.id
    });
  });

  afterEach(async () => {
    // Clean up job queue first
    const testJobQueue = (global as any).__testJobQueue;
    if (testJobQueue) {
      await testJobQueue.stop();
      delete (global as any).__testJobQueue;
    }

    await cleanupTestDatabase(dataSource);
  });

  afterAll(async () => {
    pollyContext.stop();
  });

  function createAuthContext(user: any) {
    // Just pass sessionKey - executeGraphQLQuery will load the user automatically
    return { sessionKey: user.sessionKey };
  }

  describe('sendMessage mutation', () => {

    it('should create chat without initial message', async () => {
      const mutation = `
        mutation SendMessage($input: SendMessageInput!) {
          sendMessage(input: $input) {
            id
            chat {
              id
              modelId
              title
              description
              status
              systemPrompt
              llmModel {
                id
                name
                modelId
                modelIdentifier
              }
              createdAt
              updatedAt
            }
          }
        }
      `;

      const variables = {
        input: {
          title: 'Test Chat',
          llmModelId: llmModel.id,
          content: '' // Empty content to test chat creation without message
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.sendMessage).toBeDefined();

      const message = result.data.sendMessage;
      const chat = message.chat;
      expect(chat.id).toBeDefined();
      expect(chat.modelId).toBeDefined();
      expect(chat.title).toBe('Test Chat');
      expect(chat.description).toBeNull();
      expect(chat.status).toBe('active');
      expect(chat.llmModel.modelId).toBe(llmModel.id);
      expect(chat.llmModel.name).toBe('Google Gemma 3 4B');
      expect(typeof chat.createdAt).toBe('string');
      expect(typeof chat.updatedAt).toBe('string');
    });

    it('should create chat with initial message and enqueue StreamMessageVersionJob', async () => {
      const mutation = `
        mutation SendMessage($input: SendMessageInput!) {
          sendMessage(input: $input) {
            id
            role
            versions {
              id
              content
              status
            }
            chat {
              id
              title
              status
              llmModel {
                id
                name
                modelId
                modelIdentifier
              }
            }
          }
        }
      `;

      const variables = {
        input: {
          title: 'Chat with Message',
          llmModelId: llmModel.id,
          content: 'Hello, how are you?',
          systemPrompt: 'You are a coding assistant.'
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.sendMessage).toBeDefined();

      const assistantMessage = result.data.sendMessage;
      expect(assistantMessage.id).toBeDefined();
      expect(assistantMessage.role).toBe(MessageRole.assistant);
      expect(assistantMessage.chat.title).toBe('Chat with Message');
      expect(assistantMessage.chat.llmModel.modelId).toBe(llmModel.id);

      // Verify both messages were created in database
      const messageRepository = dataSource.getRepository(Message);
      const messages = await messageRepository.find({
        where: { chatId: fromGlobalIdToLocalId(assistantMessage.chat.id) },
        order: { createdAt: 'ASC' }
      });

      expect(messages).toHaveLength(2);

      // Check user message
      const userMessage = messages[0];
      expect(userMessage.role).toBe(MessageRole.user);

      // Await the currentVersion since it's likely a Promise from SmartLoadingSubscriber
      const userMessageVersion = await userMessage.currentVersion;
      expect(userMessageVersion?.content).toBe('Hello, how are you?');

      // Check assistant message
      const assistantMessageFromDb = messages[1];
      expect(assistantMessageFromDb.role).toBe(MessageRole.assistant);

      // Await the currentVersion for assistant message too
      const assistantMessageVersion = await assistantMessageFromDb.currentVersion;
      expect(assistantMessageVersion?.content).toBe('AI is thinking...');

      // Verify StreamMessageVersionJob was created
      const jobRepository = dataSource.getRepository(Job);
      const jobs = await jobRepository.find({
        where: {
          type: 'StreamMessageVersionJob',
          userId: testData.id
        },
        order: { createdAt: 'DESC' }
      });

      expect(jobs).toHaveLength(1);
      const createdJob = jobs[0];

      expect(createdJob.type).toBe('StreamMessageVersionJob');
      expect(createdJob.userId).toBe(testData.id);
      expect(createdJob.targetId).toBe(assistantMessageFromDb.currentVersionId);
      expect(createdJob.status).toBe('PENDING');
      expect(createdJob.priority).toBe(80); // High priority for interactive chat
      expect(typeof createdJob.timeoutMS).toBe('number');
      expect(createdJob.timeoutMS).toBeGreaterThan(0);

      // Verify job parameters
      expect(createdJob.parameters.messageVersionId).toBe(assistantMessageFromDb.currentVersionId);
    });

    it('should create chat with minimal required fields', async () => {
      const mutation = `
        mutation SendMessage($input: SendMessageInput!) {
          sendMessage(input: $input) {
            chat {
              title
              status
              llmModel {
                id
                name
              }
              systemPrompt
            }
          }
        }
      `;

      const variables = {
        input: {
          title: 'Minimal Chat',
          llmModelId: llmModel.id,
          content: 'Hello'
          // No systemPrompt - will use default
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.sendMessage.chat.title).toBe('Minimal Chat');
      expect(result.data.sendMessage.chat.status).toBe('active');
      expect(result.data.sendMessage.chat.llmModel.name).toBe('Google Gemma 3 4B');
    });

    it('should return error for unauthenticated user', async () => {
      const mutation = `
        mutation SendMessage($input: SendMessageInput!) {
          sendMessage(input: $input) {
            id
            chat {
              title
            }
          }
        }
      `;

      const variables = {
        input: {
          title: 'Unauthorized Chat',
          llmModelId: llmModel.id,
          content: 'Hello'
        }
      };

      const result = await executeGraphQLQuery<any>(mutation, variables); // No auth context

      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.data?.sendMessage).toBeUndefined();
    });

    it('should return error for non-existent LLM model', async () => {
      const mutation = `
        mutation SendMessage($input: SendMessageInput!) {
          sendMessage(input: $input) {
            id
            chat {
              title
            }
          }
        }
      `;

      const variables = {
        input: {
          title: 'Invalid Model Chat',
          llmModelId: '00000000-0000-0000-0000-000000000000', // Non-existent UUID
          content: 'Hello'
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.data?.sendMessage).toBeUndefined();
    });

    it('should validate required fields', async () => {
      const mutation = `
        mutation SendMessage($input: SendMessageInput!) {
          sendMessage(input: $input) {
            id
            chat {
              title
            }
          }
        }
      `;

      // Missing required fields
      const variables = {
        input: {
          title: 'Incomplete Chat'
          // Missing llmModelId and content
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty message gracefully', async () => {
      const mutation = `
        mutation SendMessage($input: SendMessageInput!) {
          sendMessage(input: $input) {
            chat {
              id
              title
            }
          }
        }
      `;

      const variables = {
        input: {
          title: 'Empty Message Chat',
          llmModelId: llmModel.id,
          content: '   ' // Whitespace only
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.sendMessage.chat.title).toBe('Empty Message Chat');

      // Verify both messages were created (user message with empty content + assistant message)
      const messageRepository = dataSource.getRepository(Message);
      const messages = await messageRepository.find({
        where: { chatId: fromGlobalIdToLocalId(result.data.sendMessage.chat.id) }
      });
      expect(messages).toHaveLength(2); // User message with empty content + assistant message
    });
  });

  describe('createChat mutation (base mutation)', () => {

    it('should create basic chat without message', async () => {
      const mutation = `
        mutation CreateChat($input: CreateChatInput!) {
          createChat(input: $input) {
            id
            modelId
            title
            description
            status
            systemPrompt
            llmModel {
              id
              modelId
              name
            }
            createdAt
            updatedAt
          }
        }
      `;

      const variables = {
        input: {
          title: 'Basic Chat',
          llmModelId: llmModel.id,
          status: 'active',
          systemPrompt: 'You are a helpful assistant.',
          description: 'A basic chat for testing'
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.createChat).toBeDefined();

      const chat = result.data.createChat;

      expect(chat.id).toBeDefined();
      expect(chat.modelId).toBeDefined();
      expect(chat.title).toBe('Basic Chat');
      expect(chat.description).toBe('A basic chat for testing');
      expect(chat.status).toBe('active');
      expect(chat.systemPrompt).toBe('You are a helpful assistant.');
      expect(chat.llmModel.modelId).toBe(llmModel.id);
      expect(typeof chat.createdAt).toBe('string');
      expect(typeof chat.updatedAt).toBe('string');
    });
  });

  describe('Authorization tests', () => {

    it('should prevent user from creating chat with another user\'s LLM model', async () => {
      // Create second user
      const otherUser = await createUser(dataSource, {
        username: 'otheruser',
        name: 'Other User'
      });

      // Create LLM model for other user
      const otherLLMModel = await createLLMModel(dataSource, {
        connectionId: connection.id,
        name: 'Other User Model',
        modelIdentifier: 'other/model',
        temperature: 0.7,
        contextLength: 4096,
        capabilities: [LLMModelCapability.TEXT],
        userId: otherUser.id
      });

      const mutation = `
        mutation SendMessage($input: SendMessageInput!) {
          sendMessage(input: $input) {
            id
            chat {
              title
            }
          }
        }
      `;

      const variables = {
        input: {
          title: 'Unauthorized Chat',
          llmModelId: otherLLMModel.id,
          content: 'Hello'
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.data?.sendMessage).toBeUndefined();
    });
  });
});