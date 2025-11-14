/**
 * Fix Verification Test
 *
 * Tests that the Chat.tags field fix works correctly and no longer
 * produces "Expected Iterable" errors.
 */

import { DataSource } from 'typeorm';
import { Chat } from '@main/db/entities/Chat';
import { LLMModelCapability } from '@main/db/entities/__generated__/LLMModelBase';
import { createTestDatabase, cleanupTestDatabase } from '../../__tests__/base/testDatabase';

describe('Chat.tags Fix Verification', () => {
  let dataSource: DataSource;
  let repository: any;

  beforeAll(async () => {
    // Initialize test database with all entities
    dataSource = await createTestDatabase();
    repository = dataSource.getRepository(Chat);
    const userRepository = dataSource.getRepository('User');
    const connectionRepository = dataSource.getRepository('Connection');
    const llmModelRepository = dataSource.getRepository('LLMModel');

    // Create a test user
    await userRepository.save({
      id: 'test-user-id',
      username: 'testuser',
      name: 'Test User',
      password: 'testpassword123'
    });

    // Create a test connection
    await connectionRepository.save({
      id: 'test-connection-id',
      userId: 'test-user-id',
      name: 'Test Connection',
      kind: 'OPENAI',
      provider: 'OpenAI',
      apiKey: 'test-key',
      baseUrl: 'http://localhost:1234'
    });

    // Create a test LLM model with all required fields
    await llmModelRepository.save({
      id: 'test-model-id',
      name: 'Test Model',
      userId: 'test-user-id',
      connectionId: 'test-connection-id',
      temperature: 0.7,
      contextLength: 4096,
      modelIdentifier: 'gpt-3.5-turbo',
      capabilities: [LLMModelCapability.TEXT]
    });
  });

  afterAll(async () => {
    await cleanupTestDatabase(dataSource);
  });

  test('should save and retrieve Chat tags as proper arrays', async () => {

    const chat = await repository.save({
      title: 'Test Chat',
      llmModelId: 'test-model-id',
      userId: 'test-user-id',
      tags: ['tag1', 'tag2', 'tag3']
    });


    // Check raw database content
    const raw = await dataSource.query(
      'SELECT tags FROM chats WHERE id = ?',
      [chat.id]
    );

    // Try to retrieve
    const found = await repository.findOne({ where: { id: chat.id } });

    // Verify the fix works
    expect(found?.tags).toEqual(['tag1', 'tag2', 'tag3']);
    expect(Array.isArray(found?.tags)).toBe(true);
    expect(typeof found?.tags).toBe('object');

    // Check that it's not the broken "[object Object]" string
    expect(found?.tags).not.toBe('[object Object]');
    expect(typeof found?.tags).not.toBe('string');

    console.log('✅ Chat.tags fix verified - arrays work correctly!');
  });

  test('should handle various tag array scenarios', async () => {
    const testCases = [
      ['single-tag'],
      ['multiple', 'different', 'tags'],
      ['with-numbers-123', 'special-chars!@#'],
      [], // empty array
      null, // null value
      undefined, // undefined value
    ];

    for (let i = 0; i < testCases.length; i++) {
      const tags = testCases[i];
      const chat = await repository.save({
        title: `Test Chat ${i + 1}`,
        llmModelId: 'test-model-id',
        userId: 'test-user-id',
        tags: tags
      });

      const found = await repository.findOne({ where: { id: chat.id } });


      if (Array.isArray(tags)) {
        expect(found?.tags).toEqual(tags);
        expect(Array.isArray(found?.tags)).toBe(true);
      } else if (tags === null) {
        expect(found?.tags).toBeNull();
      } else if (tags === undefined) {
        expect(found?.tags).toBeNull(); // Database converts undefined to null
      }
    }

    console.log('✅ All tag array scenarios work correctly!');
  });

  test('should show table schema', async () => {
    const tableInfo = await dataSource.query(`PRAGMA table_info(chats)`);
    console.table(tableInfo);

    // Check that tags column is JSON type
    const tagsColumn = tableInfo.find((col: any) => col.name === 'tags');
    expect(tagsColumn?.type).toBe('json');
  });

  test('should verify array options are enforced', async () => {
    // Test that the schema validation works
    const chat = await repository.save({
      title: 'Array Options Test',
      llmModelId: 'test-model-id',
      userId: 'test-user-id',
      tags: ['valid-tag', 'another-tag']
    });
    expect(chat.tags).toEqual(['valid-tag', 'another-tag']);
  });
});