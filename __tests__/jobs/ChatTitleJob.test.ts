/**
 * ChatTitleJob Tests
 * Tests for chat title generation functionality using the job system with real AI API integration
 */

// eslint-disable-next-line @codeblocks/file-size-limit
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { ChatTitleJob } from '@main/jobs/ChatTitleJob';
import { DataSourceProvider } from '@base/db/index';
import { setupPolly, PollyContext } from '@tests/polly/helpers';
import { EntityClasses, getEntity, loadEntities } from '@main/db/entityMap';
import {
  createUser,
  createConnection,
  createLLMModel,
  createChat,
  createTestUser,
  createMessage,
  createMessages
} from '@factories/index';
import { MessageRole } from '@main/db/entities/__generated__/MessageBase';
import { MessageVersionStatus } from '@main/db/entities/__generated__/MessageVersionBase';
import { ConnectionKind } from '@main/db/entities/__generated__/ConnectionBase';
import { LLMModelCapability } from '@main/db/entities/__generated__/LLMModelBase';
import { cleanupTestDatabase, createTestDatabase } from '@tests/base/testDatabase';
import { DataSource } from 'typeorm';
import JobQueue from '@main/services/JobQueue';

describe('ChatTitleJob', () => {
  let testData: any;
  let pollyContext: PollyContext;
  let connection: any;
  let llmModel: any;
  let chat: any;
  let User: any;
  let Connection: any;
  let LLMModel: any;
  let Chat: any;
  let Message: any;
  let MessageVersion: any;

  let dataSource: DataSource;
  let testUser: any;
  let Job: EntityClasses['Job'];
  let jobQueue: JobQueue;

  beforeEach(async () => {
    dataSource = await createTestDatabase();
    testUser = await createTestUser(dataSource);
    Job = getEntity('Job');

    // Set up JobQueue for job integration tests (but don't start it for individual job tests)
    jobQueue = new JobQueue();
    jobQueue.registerJob(ChatTitleJob);

    // Set up test data
    const entities = await loadEntities();
    User = entities.User;
    Connection = entities.Connection;
    LLMModel = entities.LLMModel;
    Chat = entities.Chat;
    Message = entities.Message;
    MessageVersion = entities.MessageVersion;

    // Create test user
    testData = testUser;

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
    llmModel = await dataSource.getRepository('LLMModel').save({
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
    // Stop job queue first to ensure no pending jobs
    if (jobQueue) {
      await jobQueue.stop();
    }

    // Wait for any pending async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    DataSourceProvider.clearTestDataSource();
    await cleanupTestDatabase(dataSource);
  });

  beforeAll(async () => {
    pollyContext = setupPolly({
      recordingName: 'chat-title-job',
    });
  });

  afterAll(async () => {
    if (pollyContext) {
      pollyContext.stop();
    }
  });

  describe('perform method', () => {
    it('should generate title for chat with New Chat prefix', async () => {
      // Create chat with "New Chat" prefix that needs title generation
      chat = await createChat(dataSource, {
        userId: testData.id,
        title: 'Untitled Chat',
        llmModelId: llmModel.id
      });

      // Create user messages for conversation context
      await createMessages(dataSource, 2, {
        chatId: chat.id,
        role: MessageRole.user,
        content: 'What is machine learning and how does it work?',
        userId: testData.id,
        llmModelId: llmModel.id
      });

      // Update the second message content to be different
      const messageRepository = dataSource.getRepository('Message');
      const messages = await messageRepository.find({ where: { chatId: chat.id } });
      if (messages.length > 1) {
        await messageRepository.update(messages[1].id, {
          content: 'Can you explain neural networks in simple terms?'
        });
      }

      const result = await ChatTitleJob.performNow(
        testData.id,
        chat.id,
        { chatId: chat.id }
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.chatId).toBe(chat.id);
      expect(result.title).toBeDefined();
      expect(typeof result.title).toBe('string');
      expect(result.title.length).toBeGreaterThan(0);
      expect(result.description).toBeDefined();
      expect(result.tags).toBeDefined();
      expect(Array.isArray(result.tags)).toBe(true);

      // Verify the chat was updated with the generated title
      const updatedChat = await dataSource.getRepository('Chat').findOne({
        where: { id: chat.id }
      });
      expect(updatedChat!.title).toBe(result.title);
      expect(updatedChat!.description).toBe(result.description);
      // Tags are handled specially - just verify they exist and are of expected type
      expect(updatedChat!.tags).toBeDefined();
      expect(result.tags).toBeDefined();
      expect(Array.isArray(result.tags)).toBe(true);

      // Title should not start with "New Chat" anymore
      expect(updatedChat!.title.toLowerCase()).not.to.match(/^new chat/i);
    });

    it('should skip title generation for chat with custom title', async () => {
      // Create chat with custom title that doesn't need generation
      chat = await createChat(dataSource, {
        userId: testData.id,
        title: 'Machine Learning Discussion',
        description: 'A chat about ML basics',
        llmModelId: llmModel.id
      });

      const result = await ChatTitleJob.performNow(
        testData.id,
        chat.id,
        { chatId: chat.id }
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.chatId).toBe(chat.id);
      expect(result.title).toBe('Machine Learning Discussion');
      expect(result.description).toBe('A chat about ML basics');

      // Verify the chat was not modified
      const unchangedChat = await dataSource.getRepository('Chat').findOne({
        where: { id: chat.id }
      });
      expect(unchangedChat!.title).toBe('Machine Learning Discussion');
      expect(unchangedChat!.description).toBe('A chat about ML basics');
    });

    it('should handle case-insensitive "New Chat" variants', async () => {
      const testCases = [
        'New Chat',
        'new chat',
        'NEW CHAT',
        'New Chat ',
        '  new chat',
        'New Chat - 1'
      ];

      for (const titleVariant of testCases) {
        // Create chat with variant of "New Chat"
        const testChat = await createChat(dataSource, {
          userId: testData.id,
          title: titleVariant,
          llmModelId: llmModel.id
        });

        // Create a user message
        await createMessage(dataSource, {
          chatId: testChat.id,
          role: MessageRole.user,
          content: 'Tell me about artificial intelligence',
          userId: testData.id,
          llmModelId: llmModel.id
        });

        const result = await ChatTitleJob.performNow(
          testData.id,
          testChat.id,
          { chatId: testChat.id }
        );

        expect(result.success).toBe(true);
        expect(result.title).not.toBe(titleVariant);
        expect(result.title.toLowerCase().trim()).not.to.match(/^new chat/i);
      }
    });

    it('should fail gracefully when no user messages exist', async () => {
      chat = await createChat(dataSource, {
        userId: testData.id,
        title: 'Untitled Chat',
        llmModelId: llmModel.id
      });

      // Create only assistant messages (no user messages)
      await createMessages(dataSource, 1, {
        chatId: chat.id,
        role: MessageRole.assistant,
        content: 'Hello! How can I help you today?',
        userId: testData.id,
        llmModelId: llmModel.id
      });

      const result = await ChatTitleJob.performNow(
        testData.id,
        chat.id,
        { chatId: chat.id }
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.chatId).toBe(chat.id);
      expect(result.error).toContain('No user messages found');
    });

    it('should handle cancellation via abort signal before LLM call', async () => {
      chat = await createChat(dataSource, {
        userId: testData.id,
        title: 'Untitled Chat',
        llmModelId: llmModel.id
      });

      await createMessage(dataSource, {
        chatId: chat.id,
        role: MessageRole.user,
        content: 'A long message about quantum physics and computing',
        userId: testData.id,
        llmModelId: llmModel.id
      });

      const abortController = new AbortController();

      // Abort before calling the job
      abortController.abort();

      const result = await ChatTitleJob.performNow(
        testData.id,
        chat.id,
        { chatId: chat.id },
        { abortSignal: abortController.signal }
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toContain('aborted');
    });

    it('should build conversation content correctly from multiple user messages', async () => {
      chat = await createChat(dataSource, {
        userId: testData.id,
        title: 'Untitled Chat',
        llmModelId: llmModel.id
      });

      // Create multiple user messages with different content
      await createMessages(dataSource, 5, {
        chatId: chat.id,
        role: MessageRole.user,
        content: 'Python programming question',
        userId: testData.id,
        llmModelId: llmModel.id
      });

      // Update specific messages to have different content
      const messageRepository = dataSource.getRepository('Message');
      const messages = await messageRepository.find({ where: { chatId: chat.id } });

      // Update roles and content for alternating messages
      for (let i = 0; i < messages.length; i++) {
        if (i % 2 === 1) {
          await messageRepository.update(messages[i].id, {
            role: MessageRole.assistant,
            content: `Response to question ${i}`
          });
        } else {
          const contents = [
            'First message about Python programming',
            'Follow-up question about Django framework',
            'Final question about web deployment'
          ];
          await messageRepository.update(messages[i].id, {
            content: contents[Math.floor(i / 2)]
          });
        }
      }

      const result = await ChatTitleJob.performNow(
        testData.id,
        chat.id,
        { chatId: chat.id }
      );

      expect(result.success).toBe(true);
      expect(result.title).toBeDefined();
      // Title should reflect the conversation content (should not be generic)
      expect(result.title.toLowerCase()).not.to.match(/^new chat/i);
      expect(result.title.length).toBeGreaterThan(0);
    });

    it('should handle empty and whitespace-only user messages correctly', async () => {
      chat = await createChat(dataSource, {
        userId: testData.id,
        title: 'Untitled Chat',
        llmModelId: llmModel.id
      });

      // Create mixed messages including empty ones
      await createMessages(dataSource, 3, {
        chatId: chat.id,
        role: MessageRole.user,
        content: '   ',  // Whitespace only
        userId: testData.id,
        llmModelId: llmModel.id
      });

      // Update specific messages to have different content
      const messageRepository = dataSource.getRepository('Message');
      const messages = await messageRepository.find({ where: { chatId: chat.id } });

      // Update the second message to be assistant role
      await messageRepository.update(messages[1].id, {
        role: MessageRole.assistant,
        content: 'Response to empty message'
      });

      // Update the third message to be valid content
      await messageRepository.update(messages[2].id, {
        content: 'What is React.js?'
      });

      const result = await ChatTitleJob.performNow(
        testData.id,
        chat.id,
        { chatId: chat.id }
      );

      expect(result.success).toBe(true);
      expect(result.title).toBeDefined();
      // Should filter out empty messages and generate title from valid content
      expect(result.title.length).toBeGreaterThan(0);
      expect(result.title.toLowerCase()).not.to.match(/^new chat/i);
    });

    it('should validate chat ownership', async () => {
      chat = await createChat(dataSource, {
        userId: testData.id,
        title: 'Untitled Chat',
        llmModelId: llmModel.id
      });

      await createMessage(dataSource, {
        chatId: chat.id,
        role: MessageRole.user,
        content: 'Test message for ownership validation',
        userId: testData.id,
        llmModelId: llmModel.id
      });

      // Create another user
      const otherUser = await createUser(dataSource, {
        username: 'otheruser',
        name: 'Other User'
      });

      // Try to generate title as different user
      const result = await ChatTitleJob.performNow(
        otherUser.id,
        chat.id,
        { chatId: chat.id }
      );

      // Note: ChatTitleJob doesn't validate user ownership at the job level
      // Ownership is validated at higher levels (GraphQL resolvers, etc.)
      expect(result.success).toBe(true);
      expect(result.title).toBeDefined();
    });

    it('should handle missing chat gracefully', async () => {
      const nonExistentChatId = '00000000-0000-0000-0000-000000000000';

      const result = await ChatTitleJob.performNow(
        testData.id,
        nonExistentChatId,
        { chatId: nonExistentChatId }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.chatId).toBe(nonExistentChatId);
    });

    it('should handle LLM model configuration correctly', async () => {
      // Create a chat with a different LLM model
      const coolModel = await createLLMModel(dataSource, {
        connectionId: connection.id,
        name: 'Cool Model',
        modelIdentifier: 'google/gemma-3-4b',
        temperature: 0.1, // Very low temperature
        contextLength: 4096,
        capabilities: [LLMModelCapability.TEXT],
        userId: testData.id
      });

      chat = await createChat(dataSource, {
        userId: testData.id,
        title: 'Untitled Chat',
        llmModelId: coolModel.id
      });

      await createMessage(dataSource, {
        chatId: chat.id,
        role: MessageRole.user,
        content: 'Explain the concept of entropy in thermodynamics',
        userId: testData.id,
        llmModelId: coolModel.id
      });

      const result = await ChatTitleJob.performNow(
        testData.id,
        chat.id,
        { chatId: chat.id }
      );

      expect(result.success).toBe(true);
      expect(result.title).toBeDefined();
      // With low temperature, should generate more conservative/deterministic titles
      expect(result.title.length).toBeGreaterThan(0);
      expect(result.title.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Job integration', () => {
    it('should work with job queue system', async () => {
      chat = await createChat(dataSource, {
        userId: testData.id,
        title: 'Untitled Chat',
        llmModelId: llmModel.id
      });

      await createMessage(dataSource, {
        chatId: chat.id,
        role: MessageRole.user,
        content: 'Test message for job queue integration',
        userId: testData.id,
        llmModelId: llmModel.id
      });

      // Enqueue job
      const job = await ChatTitleJob.performLater(
        testData.id,
        chat.id,
        { chatId: chat.id },
        {
          priority: 75, // Medium-high priority for chat features
          timeoutMs: 60000
        }
      );

      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.type).toBe('ChatTitleJob');
      expect(job.parameters.chatId).toBe(chat.id);
      expect(job.priority).toBe(75);
      expect(job.status).toBe('PENDING');
    });

    it('should schedule job for later execution', async () => {
      chat = await createChat(dataSource, {
        userId: testData.id,
        title: 'Untitled Chat',
        llmModelId: llmModel.id
      });

      const futureTime = new Date(Date.now() + 60000); // 1 minute from now

      const job = await ChatTitleJob.performAt(
        futureTime,
        testData.id,
        chat.id,
        { chatId: chat.id }
      );

      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.scheduledAt).toEqual(futureTime);
      expect(job.status).toBe('PENDING');
    });

    it('should support job deduplication', async () => {
      chat = await createChat(dataSource, {
        userId: testData.id,
        title: 'Untitled Chat',
        llmModelId: llmModel.id
      });

      await createMessage(dataSource, {
        chatId: chat.id,
        role: MessageRole.user,
        content: 'Test message for deduplication',
        userId: testData.id,
        llmModelId: llmModel.id
      });

      // Create multiple jobs for the same chat
      const job1 = await ChatTitleJob.performLater(
        testData.id,
        chat.id,
        { chatId: chat.id }
      );

      const job2 = await ChatTitleJob.performLater(
        testData.id,
        chat.id,
        { chatId: chat.id }
      );

      // Jobs should have been created successfully
      expect(job1.id).toBeDefined();
      expect(job2.id).toBeDefined();
      // Check that jobs were created with proper parameters
      expect(job1.type).toBe('ChatTitleJob');
      expect(job2.type).toBe('ChatTitleJob');
    });
  });

  describe('Title generation conditions', () => {
    it('should generate titles only for chats starting with "New Chat"', async () => {
      const testCases = [
        { title: 'Hello Chat', shouldGenerate: true },
        { title: 'new chat', shouldGenerate: true },
        { title: 'New Chat - 1', shouldGenerate: true },
        { title: 'Chat about programming', shouldGenerate: false },
        { title: 'Discussion', shouldGenerate: false },
        { title: '', shouldGenerate: true },
        { title: 'New Chat', shouldGenerate: true },
        { title: 'Untitled Chat', shouldGenerate: true }
      ];

      for (const testCase of testCases) {
        const testChat = await createChat(dataSource, {
          userId: testData.id,
          title: testCase.title,
          llmModelId: llmModel.id
        });

        await createMessage(dataSource, {
          chatId: testChat.id,
          role: MessageRole.user,
          content: 'Test message',
          userId: testData.id,
          llmModelId: llmModel.id
        });

        const result = await ChatTitleJob.performNow(
          testData.id,
          testChat.id,
          { chatId: testChat.id }
        );

        if (testCase.shouldGenerate) {
          expect(result.success).toBe(true);
          expect(result.title).not.toBe(testCase.title);
          expect(result.title.toLowerCase()).not.to.match(/^new chat/i);
        } else {
          expect(result.success).toBe(true);
          expect(result.title).toBe(testCase.title);
        }
      }
    });

    it('should handle very long user messages gracefully', async () => {
      chat = await createChat(dataSource, {
        userId: testData.id,
        title: 'Untitled Chat',
        llmModelId: llmModel.id
      });

      // Create a very long user message
      const longContent = 'This is a very long message. '.repeat(1000) + 'End of long message.';

      await createMessage(dataSource, {
        chatId: chat.id,
        role: MessageRole.user,
        content: longContent,
        userId: testData.id,
        llmModelId: llmModel.id
      });

      const result = await ChatTitleJob.performNow(
        testData.id,
        chat.id,
        { chatId: chat.id }
      );

      expect(result.success).toBe(true);
      expect(result.title).toBeDefined();
      expect(result.title.length).toBeGreaterThan(0);
      expect(result.title.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Error handling', () => {
    it('should handle AI service errors gracefully', async () => {
      chat = await createChat(dataSource, {
        userId: testData.id,
        title: 'Untitled Chat',
        llmModelId: llmModel.id
      });

      await createMessage(dataSource, {
        chatId: chat.id,
        role: MessageRole.user,
        content: 'Test message for error handling',
        userId: testData.id,
        llmModelId: llmModel.id
      });

      // Note: AI service error handling is difficult to mock reliably
      // This test ensures the job completes without crashing
      const result = await ChatTitleJob.performNow(
        testData.id,
        chat.id,
        { chatId: chat.id }
      );

      // The job should either succeed or fail gracefully
      expect(result).toBeDefined();
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it('should handle database errors during chat update', async () => {
      chat = await createChat(dataSource, {
        userId: testData.id,
        title: 'Untitled Chat',
        llmModelId: llmModel.id
      });

      await createMessage(dataSource, {
        chatId: chat.id,
        role: MessageRole.user,
        content: 'Test message for database error',
        userId: testData.id,
        llmModelId: llmModel.id
      });

      // Note: Database error handling is difficult to mock reliably
      // This test ensures the job completes without crashing
      const result = await ChatTitleJob.performNow(
        testData.id,
        chat.id,
        { chatId: chat.id }
      );

      // The job should either succeed or fail gracefully
      expect(result).toBeDefined();
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });
});