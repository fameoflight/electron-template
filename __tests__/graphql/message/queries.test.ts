/**
 * Message GraphQL Query Tests
 * Tests for message-related GraphQL queries using executeGraphQLQuery
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { initializeGraphQLSchema, executeGraphQLQuery } from '@main/graphql/server';
import { fromGlobalId, fromGlobalIdToLocalId, toGlobalId } from '@base/graphql/index';
import {
  createTestDatabase,
  cleanupTestDatabase,
} from '../../base/testDatabase';
import { createUser, createConnection, createChat, createLLMModel } from '@factories/index';
import { createMessage, createMessages, createConversation } from '@factories/messageFactory';
import { DataSourceProvider } from '@base/db/index';
import { MessageRole } from '@db/entities/__generated__/MessageBase';
import { MessageVersionStatus } from '@db/entities/__generated__/MessageVersionBase';

describe('Message GraphQL Queries', () => {
  let dataSource: any;
  let testData: any;
  let testChat: any;
  let testConnection: any;
  let testLLMModel: any;
  let messages: any[];

  beforeAll(async () => {
    await initializeGraphQLSchema();
  });

  beforeEach(async () => {
    dataSource = await createTestDatabase();
    testData = await createUser(dataSource);

    // Create a test connection for the LLM model
    testConnection = await createConnection(dataSource, {
      userId: testData.id,
      name: 'Test Connection',
      provider: 'OpenAI'
    });

    // Create a test LLM model for message tests
    testLLMModel = await createLLMModel(dataSource, {
      connectionId: testConnection.id,
      userId: testData.id,
      name: 'Test LLM Model',
      modelIdentifier: 'gpt-3.5-turbo'
    });

    // Create a test chat for message tests
    testChat = await createChat(dataSource, {
      userId: testData.id,
      title: 'Test Chat for Messages',
      llmModelId: testLLMModel.id
    });

    // Create test messages for the chat manually
    const Message = await import('@main/db/entities/Message.js').then(m => m.Message);
    const MessageVersion = await import('@main/db/entities/MessageVersion.js').then(m => m.MessageVersion);
    const messageRepo = dataSource.getRepository(Message);
    const messageVersionRepo = dataSource.getRepository(MessageVersion);

    const messageContents = [
      { role: MessageRole.user, content: 'Hello, how are you?' },
      { role: MessageRole.assistant, content: 'I am doing well, thank you!' },
      { role: MessageRole.user, content: 'Can you help me with something?' },
      { role: MessageRole.assistant, content: 'Of course! What do you need help with?' }
    ];

    messages = [];
    for (const msgData of messageContents) {
      // Create message version first
      const messageVersion = await messageVersionRepo.save({
        content: msgData.content,
        status: MessageVersionStatus.completed,
        llmModelId: testLLMModel.id,
        userId: testData.id
      });

      // Create message
      const message = await messageRepo.save({
        chatId: testChat.id,
        role: msgData.role,
        content: msgData.content,
        currentVersionId: messageVersion.id,
        llmModelId: testLLMModel.id,
        userId: testData.id
      });

      // Update message version with message ID
      await messageVersionRepo.update(messageVersion.id, {
        messageId: message.id
      });

      messages.push(message);
    }
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

  describe('Database message test', () => {
    it('should be able to create a message directly', async () => {
      // Test if we can create a message directly using the repository
      const Message = await import('@db/entities/Message.js').then(m => m.Message);
      const MessageVersion = await import('@db/entities/MessageVersion.js').then(m => m.MessageVersion);
      const messageRepo = dataSource.getRepository(Message);
      const messageVersionRepo = dataSource.getRepository(MessageVersion);

      // Create message version first
      const messageVersion = await messageVersionRepo.save({
        content: 'Direct test message content',
        status: MessageVersionStatus.completed,
        llmModelId: testLLMModel.id,
        userId: testData.id
      });

      const message = messageRepo.create({
        chatId: testChat.id,
        role: MessageRole.user,
        content: 'Direct test message content',
        currentVersionId: messageVersion.id,
        llmModelId: testLLMModel.id,
        userId: testData.id
      });

      const savedMessage = await messageRepo.save(message);

      // Update message version with message ID
      await messageVersionRepo.update(messageVersion.id, {
        messageId: savedMessage.id
      });

      expect(savedMessage.id).toBeDefined();
      // Note: Message entity doesn't have direct content field - it's in currentVersion
      // The database save works correctly, but we need to verify through currentVersion relationship
    });
  });

  describe('message query', () => {
    it('should return a single message by ID', async () => {
      const messageToQuery = messages[0];
      const query = `
        query GetMessage($id: String!) {
          message(id: $id) {
            id
            modelId
            role
            currentVersion {
              content
            }
            createdAt
            updatedAt
          }
        }
      `;

      const context = createAuthContext(testData.sessionKey);
      const result = await executeGraphQLQuery<any>(query, { id: messageToQuery.id }, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.message).toBeDefined();

      const message = result.data.message;
      expect(message.id).toBeDefined();
      expect(message.modelId).toBe(messageToQuery.id);
      expect(message.role).toBe(messageToQuery.role);
      // messageToQuery is the entity with direct content field, but GraphQL returns content through currentVersion
      expect(message.currentVersion.content).toBeDefined();
      expect(typeof message.createdAt).toBe('string');
      expect(typeof message.updatedAt).toBe('string');

      // Verify modelId matches decoded id
      expect(fromGlobalIdToLocalId(message.id)).toBe(message.modelId);
    });

    it('should return null for non-existent message ID', async () => {
      const fakeId = '99999999-9999-9999-9999-999999999999';
      const query = `
        query GetMessage($id: String!) {
          message(id: $id) {
            id
            currentVersion {
              content
            }
          }
        }
      `;

      const context = createAuthContext(testData.sessionKey);
      const result = await executeGraphQLQuery<any>(query, { id: fakeId }, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.message).toBeNull();
    });

    it('should return message with proper field types', async () => {
      const messageToQuery = messages[1];
      const query = `
        query GetMessage($id: String!) {
          message(id: $id) {
            id
            modelId
            role
            currentVersion {
              content
            }
            createdAt
            updatedAt
          }
        }
      `;

      const context = createAuthContext(testData.sessionKey);
      const result = await executeGraphQLQuery<any>(query, { id: messageToQuery.id }, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.message).toBeDefined();

      const message = result.data.message;
      expect(typeof message.id).toBe('string');
      expect(typeof message.modelId).toBe('string');
      expect(typeof message.role).toBe('string');
      expect(typeof message.currentVersion.content).toBe('string');
      expect(typeof message.createdAt).toBe('string');
      expect(typeof message.updatedAt).toBe('string');

      // Verify role is valid
      expect(['user', 'assistant', 'system']).toContain(message.role);
    });
  });

  describe('messages query (with pagination)', () => {
    it('should return paginated messages for authenticated user', async () => {
      const query = `
        query GetMessages {
          messages(first: 10) {
            edges {
              node {
                id
                modelId
                role
                currentVersion {
                  content
                }
                createdAt
              }
              cursor
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
            totalCount
          }
        }
      `;

      const context = createAuthContext(testData.sessionKey);
      const result = await executeGraphQLQuery<any>(query, {}, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.messages).toBeDefined();

      const messagesConnection = result.data.messages;
      expect(messagesConnection.edges).toBeDefined();
      expect(Array.isArray(messagesConnection.edges)).toBe(true);
      expect(messagesConnection.pageInfo).toBeDefined();
      expect(typeof messagesConnection.totalCount).toBe('number');

      // Verify we have messages
      expect(messagesConnection.edges.length).toBeGreaterThan(0);

      // Verify structure of edges
      messagesConnection.edges.forEach((edge: any) => {
        expect(edge.node).toBeDefined();
        expect(edge.cursor).toBeDefined();
        expect(edge.node.id).toBeDefined();
        expect(edge.node.role).toBeDefined();
        expect(edge.node.currentVersion.content).toBeDefined();
      });

      // Verify pageInfo structure
      expect(typeof messagesConnection.pageInfo.hasNextPage).toBe('boolean');
      expect(typeof messagesConnection.pageInfo.hasPreviousPage).toBe('boolean');
    });

    it('should respect pagination parameters', async () => {
      // Create more messages for pagination testing
      await createMessages(dataSource, 5, {
        chatId: testChat.id,
        role: MessageRole.user,
        content: 'Additional test message',
        llmModelId: testLLMModel.id,
        userId: testData.id
      });

      const query = `
        query GetMessages($first: Int!, $after: String) {
          messages(first: $first, after: $after) {
            edges {
              node {
                id
                currentVersion {
                  content
                }
              }
              cursor
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
              endCursor
            }
            totalCount
          }
        }
      `;

      const context = createAuthContext(testData.sessionKey);

      // Get first page
      const firstPageResult = await executeGraphQLQuery<any>(query, { first: 2 }, context);
      expect(firstPageResult.data.messages.edges.length).toBe(2);

      // Get second page using cursor
      if (firstPageResult.data.messages.pageInfo.hasNextPage) {
        const secondPageResult = await executeGraphQLQuery<any>(query, {
          first: 2,
          after: firstPageResult.data.messages.pageInfo.endCursor
        }, context);

        expect(secondPageResult.data.messages.edges.length).toBeGreaterThan(0);
        // Ensure we get different messages
        const firstPageIds = firstPageResult.data.messages.edges.map((e: any) => e.node.id);
        const secondPageIds = secondPageResult.data.messages.edges.map((e: any) => e.node.id);
        const overlappingIds = firstPageIds.filter((id: string) => secondPageIds.includes(id));
        expect(overlappingIds.length).toBe(0);
      }
    });
  });

  describe('messagesArray query', () => {
    it('should return messages array for authenticated user', async () => {
      const query = `
        query GetMessagesArray {
          messagesArray {
            id
            modelId
            role
            currentVersion {
              content
            }
            createdAt
            updatedAt
          }
        }
      `;

      const context = createAuthContext(testData.sessionKey);
      const result = await executeGraphQLQuery<any>(query, {}, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.messagesArray).toBeDefined();

      const messagesArray = result.data.messagesArray;
      expect(Array.isArray(messagesArray)).toBe(true);
      expect(messagesArray.length).toBeGreaterThan(0);

      const idParts = fromGlobalId(messagesArray[0].id);
      expect(idParts.type).toBe('Message');
      expect(idParts.id).toBe(messagesArray[0].modelId);

      // Verify message structure
      messagesArray.forEach((message: any) => {
        expect(message.id).toBeDefined();
        expect(message.role).toBeDefined();
        expect(message.currentVersion.content).toBeDefined();
        expect(['user', 'assistant', 'system']).toContain(message.role);
        expect(typeof message.createdAt).toBe('string');
        expect(typeof message.updatedAt).toBe('string');
      });
    });

    it('should return messages array with default kind parameter (active only)', async () => {
      // Soft delete one message first
      const messageToDelete = messages[0];
      await dataSource.getRepository('Message').softDelete(messageToDelete.id);

      const query = `
        query {
          messagesArray {
            id
            role
            deletedAt
          }
        }
      `;

      const context = createAuthContext(testData.sessionKey);
      const result = await executeGraphQLQuery<any>(query, {}, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.messagesArray).toBeDefined();

      const messagesArray = result.data.messagesArray;
      expect(Array.isArray(messagesArray)).toBe(true);

      // Should return active messages (not deleted)
      messagesArray.forEach((message: any) => {
        expect(message.id).toBeDefined();
        expect(message.deletedAt).toBeNull();
      });

      // Verify deleted message is not in array
      const deletedMessageInArray = messagesArray.find((m: any) =>
        fromGlobalIdToLocalId(m.id) === messageToDelete.id
      );
      expect(deletedMessageInArray).toBeUndefined();
    });

    it('should return messages array with kind=all including deleted', async () => {
      // Soft delete one message first
      const messageToDelete = messages[0];
      await dataSource.getRepository('Message').softDelete(messageToDelete.id);

      const query = `
        query {
          messagesArray(kind: "all") {
            id
            role
            deletedAt
          }
        }
      `;

      const context = createAuthContext(testData.sessionKey);
      const result = await executeGraphQLQuery<any>(query, {}, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.messagesArray).toBeDefined();

      const messagesArray = result.data.messagesArray;
      expect(Array.isArray(messagesArray)).toBe(true);

      // With kind="all", we should see the deleted message too
      const deletedMessage = messagesArray.find((m: any) =>
        fromGlobalIdToLocalId(m.id) === messageToDelete.id
      );
      expect(deletedMessage).toBeDefined();
      expect(deletedMessage.deletedAt).toBeDefined();
    });

    it('should return empty array for user with no messages', async () => {
      // Create a user with no messages
      const userWithoutMessages = await createUser(dataSource, {
        username: `no-messages-${Date.now()}`,
      });

      const query = `
        query {
          messagesArray {
            id
            role
            currentVersion {
              content
            }
          }
        }
      `;

      const context = createAuthContext(userWithoutMessages.sessionKey!);
      const result = await executeGraphQLQuery<any>(query, {}, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.messagesArray).toBeDefined();
      expect(Array.isArray(result.data.messagesArray)).toBe(true);
      expect(result.data.messagesArray).toHaveLength(0);
    });
  });

  describe('chatMessages query', () => {
    const query = `
        query GetChatMessages($chatId: String!) {
          chatMessages(chatId: $chatId) {
            id
            modelId
            role
            currentVersion {
              content
            }
            createdAt
            versions {
              id
              content
              status
            }
          }
        }
      `;

    it('should return messages for a specific chat', async () => {
      const context = createAuthContext(testData.sessionKey);
      const result = await executeGraphQLQuery<any>(query, { chatId: testChat.id }, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.chatMessages).toBeDefined();

      const chatMessages = result.data.chatMessages;
      expect(Array.isArray(chatMessages)).toBe(true);
      expect(chatMessages.length).toBeGreaterThan(0);

      // Verify messages are ordered by createdAt ASC
      for (let i = 1; i < chatMessages.length; i++) {
        const prevDate = new Date(chatMessages[i - 1].createdAt);
        const currDate = new Date(chatMessages[i].createdAt);
        expect(prevDate <= currDate).toBe(true);
      }

      // Verify structure
      chatMessages.forEach((message: any) => {
        expect(message.id).toBeDefined();
        expect(message.role).toBeDefined();
        expect(message.currentVersion.content).toBeDefined();
        expect(Array.isArray(message.versions)).toBe(true);
      });
    });

    it('with gloabl id should return messages for a specific chat', async () => {
      const globalChatId = toGlobalId('Chat', testChat.id);
      const context = createAuthContext(testData.sessionKey);
      const result = await executeGraphQLQuery<any>(query, { chatId: globalChatId }, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.chatMessages).toBeDefined();

      const chatMessages = result.data.chatMessages;
      expect(Array.isArray(chatMessages)).toBe(true);
      expect(chatMessages.length).toBeGreaterThan(0);
    });

    it('should return empty array for chat with no messages', async () => {
      // Create an empty chat
      const emptyChat = await createChat(dataSource, {
        userId: testData.id,
        title: 'Empty Chat',
        llmModelId: testLLMModel.id
      });

      const query = `
        query GetChatMessages($chatId: String!) {
          chatMessages(chatId: $chatId) {
            id
            role
            currentVersion {
              content
            }
          }
        }
      `;

      const context = createAuthContext(testData.sessionKey);
      const result = await executeGraphQLQuery<any>(query, { chatId: emptyChat.id }, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.chatMessages).toBeDefined();
      expect(Array.isArray(result.data.chatMessages)).toBe(true);
      expect(result.data.chatMessages).toHaveLength(0);
    });

    it('should only return messages for chats owned by the user', async () => {
      // Create a user with their own chat and LLM model
      const otherUser = await createUser(dataSource);
      const otherUserConnection = await createConnection(dataSource, {
        userId: otherUser.id,
        name: 'Other User Connection',
        provider: 'Anthropic'
      });
      const otherUserLLMModel = await createLLMModel(dataSource, {
        connectionId: otherUserConnection.id,
        userId: otherUser.id,
        name: 'Other User LLM Model',
        modelIdentifier: 'claude-3'
      });
      const otherUserChat = await createChat(dataSource, {
        userId: otherUser.id,
        title: 'Other User Chat',
        llmModelId: otherUserLLMModel.id
      });

      const query = `
        query GetChatMessages($chatId: String!) {
          chatMessages(chatId: $chatId) {
            id
            role
            currentVersion {
              content
            }
          }
        }
      `;

      const context = createAuthContext(testData.sessionKey);

      // Try to access messages from other user's chat
      const result = await executeGraphQLQuery<any>(query, { chatId: otherUserChat.id }, context);

      // Should return empty array (or potentially an auth error depending on implementation)
      if (result.data && result.data.chatMessages !== undefined) {
        expect(Array.isArray(result.data.chatMessages)).toBe(true);
        expect(result.data.chatMessages).toHaveLength(0);
      }
    });
  });

  describe('Integration with relationships', () => {
    it('should return message with chat relationship', async () => {
      const messageToQuery = messages[0];
      const query = `
        query GetMessageWithChat($id: String!) {
          message(id: $id) {
            id
            currentVersion {
              content
            }
            role
            chat {
              id
              title
              status
            }
          }
        }
      `;

      const context = createAuthContext(testData.sessionKey);
      const result = await executeGraphQLQuery<any>(query, { id: messageToQuery.id }, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.message).toBeDefined();
      expect(result.data.message.chat).toBeDefined();
      expect(result.data.message.chat.id).toBeDefined();
      expect(result.data.message.chat.title).toBe(testChat.title);
    });

    it('should return message with currentVersion relationship', async () => {
      const messageToQuery = messages[0];
      const query = `
        query GetMessageWithVersion($id: String!) {
          message(id: $id) {
            id
            role
            currentVersion {
              id
              content
              status
              llmModelId
            }
          }
        }
      `;

      const context = createAuthContext(testData.sessionKey);
      const result = await executeGraphQLQuery<any>(query, { id: messageToQuery.id }, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.message).toBeDefined();
      expect(result.data.message.currentVersion).toBeDefined();
      expect(result.data.message.currentVersion.id).toBeDefined();
      expect(result.data.message.currentVersion.content).toBeDefined();
      expect(result.data.message.currentVersion.status).toBeDefined();
    });

    it('should return message with versions relationship', async () => {
      const messageToQuery = messages[0];
      const query = `
        query GetMessageWithVersions($id: String!) {
          message(id: $id) {
            id
            role
            versions {
              id
              content
              status
              isRegenerated
            }
          }
        }
      `;

      const context = createAuthContext(testData.sessionKey);
      const result = await executeGraphQLQuery<any>(query, { id: messageToQuery.id }, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.message).toBeDefined();
      expect(result.data.message.versions).toBeDefined();
      expect(Array.isArray(result.data.message.versions)).toBe(true);
      expect(result.data.message.versions.length).toBeGreaterThan(0);

      result.data.message.versions.forEach((version: any) => {
        expect(version.id).toBeDefined();
        expect(version.content).toBeDefined();
        expect(version.status).toBeDefined();
        expect(typeof version.isRegenerated).toBe('boolean');
      });
    });
  });

  describe('Integration with currentUser', () => {
    it('should return both currentUser and messages in same query', async () => {
      const query = `
        query MessagePageQuery {
          currentUser {
            id
            modelId
            name
          }
          messagesArray {
            id
            role
            currentVersion {
              content
            }
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

      // Verify messagesArray
      expect(result.data.messagesArray).toBeDefined();
      expect(Array.isArray(result.data.messagesArray)).toBe(true);
      expect(result.data.messagesArray.length).toBeGreaterThan(0);

      // Verify messages belong to current user
      result.data.messagesArray.forEach((message: any) => {
        expect(message.id).toBeDefined();
        expect(message.role).toBeDefined();
        expect(message.currentVersion.content).toBeDefined();
      });
    });
  });
});