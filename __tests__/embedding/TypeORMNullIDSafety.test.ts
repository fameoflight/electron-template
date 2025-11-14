/**
 * Test to demonstrate the dangerous TypeORM behavior with null ID queries
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DataSourceProvider } from '@base/db/index.js';
import { createTestDatabase, cleanupTestDatabase } from '@tests/base/testDatabase.js';
import { DataSource } from 'typeorm';
import { Message } from '@main/db/entities/Message.js';
import { MessageVersion } from '@main/db/entities/MessageVersion.js';
import { createTestUser, createLLMModel, createChat, createMessage, createConnection } from '@factories/index';
import { ConnectionKind } from '@main/db/entities/__generated__/ConnectionBase.js';
import { MessageRole } from '@main/db/entities/__generated__/MessageBase.js';

describe('TypeORM Null ID Query Safety', () => {
  let dataSource: DataSource;
  let testUser: any;
  let connection: any;
  let llmModel: any;
  let chat: any;
  let message: any;

  beforeEach(async () => {
    dataSource = await createTestDatabase();
    testUser = await createTestUser(dataSource);
    connection = await createConnection(dataSource, {
      userId: testUser.id,
      kind: ConnectionKind.OPENAI,
      baseUrl: 'https://api.openai.com',
      apiKey: 'test-key',
    });
    llmModel = await createLLMModel(dataSource, {
      userId: testUser.id,
      connectionId: connection.id,
      name: 'Test LLM Model',
      modelIdentifier: 'gpt-4',
      contextLength: 8192,
    });
    chat = await createChat(dataSource, {
      userId: testUser.id,
      title: 'Test Chat',
      llmModelId: llmModel.id,
    });
    message = await createMessage(dataSource, {
      chatId: chat.id,
      userId: testUser.id,
      role: MessageRole.assistant,
      content: 'Test message',
      llmModelId: llmModel.id,
    });
  });

  afterEach(async () => {
    await cleanupTestDatabase(dataSource);
  });

  describe('Direct Repository Queries with Null IDs', () => {
    it('should throw error when querying Message with null ID', async () => {
      const messageRepository = dataSource.getRepository(Message);

      // TypeORM should throw an error for null ID values
      await expect(async () => {
        await messageRepository.findOne({
          where: { id: null as any }
        });
      }).rejects.toThrow();
    });

    it('should throw error when querying Message with undefined ID', async () => {
      const messageRepository = dataSource.getRepository(Message);

      await expect(async () => {
        await messageRepository.findOne({
          where: { id: undefined as any }
        });
      }).rejects.toThrow();
    });

    it('should return null when querying Message with invalid UUID string', async () => {
      const messageRepository = dataSource.getRepository(Message);

      const result = await messageRepository.findOne({
        where: { id: 'invalid-uuid-string' }
      });

      expect(result).toBeNull();
    });

    it('should throw error when using findOneBy with null ID', async () => {
      const messageRepository = dataSource.getRepository(Message);

      // Test the direct TypeORM method
      await expect(async () => {
        await messageRepository.findOneBy({ id: null as any });
      }).rejects.toThrow();
    });

    it('should throw error when multiple messages exist and null ID is queried', async () => {
      const messageRepository = dataSource.getRepository(Message);

      // Create a second message
      const secondMessage = await createMessage(dataSource, {
        chatId: chat.id,
        userId: testUser.id,
        role: MessageRole.user,
        content: 'Second message',
        llmModelId: llmModel.id,
      });

      // Query with null ID should throw an error, not return any of the existing messages
      await expect(async () => {
        await messageRepository.findOne({
          where: { id: null as any }
        });
      }).rejects.toThrow();

      // Verify both messages exist and can be found by their actual IDs
      const foundFirst = await messageRepository.findOne({
        where: { id: message.id }
      });
      const foundSecond = await messageRepository.findOne({
        where: { id: secondMessage.id }
      });

      expect(foundFirst?.id).toBe(message.id);
      expect(foundSecond?.id).toBe(secondMessage.id);
    });
  });

  describe('MessageVersion Edge Cases', () => {
    it('should handle MessageVersion with null messageId correctly', async () => {
      const messageVersionRepository = dataSource.getRepository(MessageVersion);

      // Create a MessageVersion with null messageId
      const orphanVersion = messageVersionRepository.create({
        userId: testUser.id,
        llmModelId: llmModel.id,
        content: 'Orphan content',
        contextTokens: 10,
        generationTime: 100,
        isRegenerated: false,
        // Explicitly not setting messageId
      });
      await messageVersionRepository.save(orphanVersion);

      // Verify the saved version has null/undefined messageId
      expect(orphanVersion.messageId === undefined || orphanVersion.messageId === null).toBe(true);

      // Querying messages with this null messageId should throw an error
      const messageRepository = dataSource.getRepository(Message);
      await expect(async () => {
        await messageRepository.findOne({
          where: { id: orphanVersion.messageId as any }
        });
      }).rejects.toThrow();
    });
  });

  describe('Safety Verification', () => {
    it('demonstrates the fix: TypeORM throws error on null ID queries', async () => {
      const messageRepository = dataSource.getRepository(Message);

      // This is what was happening before the fix:
      // Query with null ID could return ANY message from the database!
      // This means orphaned MessageVersions could be linked to wrong messages.

      // With our fix, TypeORM should throw an error
      await expect(async () => {
        await messageRepository.findOne({
          where: { id: null as any }
        });
      }).rejects.toThrow();

    });
  });
});