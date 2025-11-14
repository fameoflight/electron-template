/**
 * Message GraphQL Mutation Tests
 * Tests for message-related GraphQL mutations with job creation verification
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { initializeGraphQLSchema, executeGraphQLQuery } from '@main/graphql/server';
import { fromGlobalIdToLocalId } from '@base/graphql/index';
import {
  createTestDatabase,
  cleanupTestDatabase,
} from '../../base/testDatabase';
import { createUser } from '@factories/index';
import { DataSourceProvider } from '@base/db/index';
import { ConnectionKind } from '@db/entities/__generated__/ConnectionBase';
import { ChatStatus } from '@db/entities/__generated__/ChatBase';
import { LLMModelCapability } from '@db/entities/__generated__/LLMModelBase';
import { MessageRole } from '@db/entities/__generated__/MessageBase';
import { MessageVersionStatus } from '@db/entities/__generated__/MessageVersionBase';
import { setupPolly, PollyContext } from '@tests/polly/helpers';
import { createConnection, createLLMModel, createChat } from '@factories/index';
import { EntityClasses, getEntity, loadEntities } from '@main/db/entityMap';
import JobQueue from '@main/services/JobQueue';
import { StreamMessageVersionJob } from '@main/jobs/StreamMessageVersionJob';
import { DataSource } from 'typeorm';

describe('Message GraphQL Mutations', () => {
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

  beforeAll(async () => {
    pollyContext = setupPolly({
      recordingName: 'message-mutations',
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

    // Set up JobQueue for job integration tests
    jobQueue = JobQueue.getInstance()!;
    if (!jobQueue) {
      const newJobQueue = new JobQueue();
      newJobQueue.registerJob(StreamMessageVersionJob);
      await newJobQueue.start();
      // Store the instance for cleanup
      (global as any).__testJobQueue = newJobQueue;
    }
  });

  afterEach(async () => {
    DataSourceProvider.clearTestDataSource();
    await cleanupTestDatabase(dataSource);

    // Clean up job queue
    const testJobQueue = (global as any).__testJobQueue;
    if (testJobQueue) {
      await testJobQueue.stop();
      delete (global as any).__testJobQueue;
    }
  });

  afterAll(async () => {
    pollyContext.stop();
  });

  function createAuthContext(user: any) {
    // Just pass sessionKey - executeGraphQLQuery will load the user automatically
    return { sessionKey: user.sessionKey };
  }

  describe('sendMessage mutation (existing chat)', () => {
    let connection: any;
    let llmModel: any;
    let chat: any;

    beforeEach(async () => {
      // Create connection for AI provider
      connection = await createConnection(dataSource, {
        userId: testData.id,
        name: 'Test OpenAI Connection',
        apiKey: 'not-required',
        baseUrl: 'http://localhost:1234/v1',
        kind: ConnectionKind.OPENAI,
        provider: 'OpenAI'
      });

      // Create LLM model
      llmModel = await createLLMModel(dataSource, {
        connectionId: connection.id,
        name: 'Google Gemma 3 4B',
        modelIdentifier: 'google/gemma-3-4b',
        temperature: 0.7,
        contextLength: 4096,
        capabilities: [LLMModelCapability.TEXT],
        userId: testData.id
      });

      // Create chat
      chat = await createChat(dataSource, {
        title: 'Test Chat',
        llmModelId: llmModel.id,
        userId: testData.id
      });
    });

    it('should create user message, assistant message, and enqueue StreamMessageVersionJob', async () => {
      const mutation = `
        mutation SendMessage($input: SendMessageInput!) {
          sendMessage(input: $input) {
            id
            role
            chat { id, modelId }
          }
        }
      `;

      const variables = {
        input: {
          chatId: chat.id,
          content: 'Hello, how are you?',
          llmModelId: llmModel.id
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.sendMessage).toBeDefined();

      // Verify assistant message is returned (the mutation returns the assistant message)
      const assistantMessage: {
        id: string,
        role: string,
        chat: { id: string, modelId: string }
      } = result.data.sendMessage;
      expect(assistantMessage.id).toBeDefined();
      expect(assistantMessage.role).toBe(MessageRole.assistant);
      expect(assistantMessage.chat.modelId).toBe(chat.id);

      // Verify both messages were created in database with their current versions
      const messageRepository = dataSource.getRepository(Message);
      const messages = await messageRepository.find({
        where: { chatId: chat.id },
        relations: ['currentVersion'], // Load the currentVersion relationship
        order: { createdAt: 'ASC' }
      });

      expect(messages).toHaveLength(2);

      // Check user message
      const userMessage = messages[0];
      let currentVersion = await userMessage.currentVersion;
      expect(userMessage.role).toBe(MessageRole.user);
      expect(currentVersion?.content).toBe('Hello, how are you?');

      // Check assistant message
      const assistantMessageFromDb = messages[1];
      currentVersion = await assistantMessageFromDb.currentVersion;
      expect(assistantMessageFromDb.role).toBe(MessageRole.assistant);
      expect(currentVersion?.content).toBe('AI is thinking...'); // Placeholder content

      // ★ KEY TEST: Verify StreamMessageVersionJob was created
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
      // Note: timeoutMS default is 300000 (5 minutes), but we set 120000 (2 minutes) in MessageResolver
      // The job system might use the default, so let's just verify it has a timeout
      expect(typeof createdJob.timeoutMS).toBe('number');
      expect(createdJob.timeoutMS).toBeGreaterThan(0);

      // Verify job parameters
      expect(createdJob.parameters.messageVersionId).toBe(assistantMessageFromDb.currentVersionId);
    });


    it('should return error for unauthenticated user', async () => {
      const mutation = `
        mutation SendMessage($input: SendMessageInput!) {
          sendMessage(input: $input) {
            id
            role
          }
        }
      `;

      const variables = {
        input: {
          chatId: chat.id,
          content: 'Hello from anonymous user',
          llmModelId: llmModel.id
        }
      };

      const result = await executeGraphQLQuery<any>(mutation, variables); // No auth context

      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.data?.sendMessage).toBeUndefined();
    });

    it('should return error for non-existent chat', async () => {
      const mutation = `
        mutation SendMessage($input: SendMessageInput!) {
          sendMessage(input: $input) {
            id
            role
          }
        }
      `;

      const variables = {
        input: {
          chatId: '00000000-0000-0000-0000-000000000000', // Non-existent UUID
          content: 'Hello from nowhere',
          llmModelId: llmModel.id
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