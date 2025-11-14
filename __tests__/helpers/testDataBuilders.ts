/**
 * Test Data Builders
 *
 * Fluent interface builders for creating test data with readable, chainable methods.
 * These builders make test setup more readable and reduce boilerplate code.
 */

import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { ConnectionKind } from '@db/entities/__generated__/ConnectionBase';
import { createUser } from '../factories/userFactory';
import { createConnection } from '../factories/connectionFactory';
import { createLLMModel } from '../factories/llmModelFactory';

/**
 * Connection builder with fluent interface
 *
 * @example
 * ```typescript
 * const connection = await buildConnection()
 *   .forUser(user.id)
 *   .withName('My API')
 *   .withKind(ConnectionKind.ANTHROPIC)
 *   .withBaseUrl('https://api.anthropic.com')
 *   .create(dataSource);
 * ```
 */
export class ConnectionBuilder {
  private data: Partial<any> = {
    name: 'Test Connection',
    apiKey: 'not-required',
    baseUrl: 'http://localhost:1234/v1',
    kind: ConnectionKind.OPENAI,
    provider: 'OpenAI',
    customHeaders: {
      'Content-Type': 'application/json'
    }
  };

  withName(name: string): ConnectionBuilder {
    this.data.name = name;
    return this;
  }

  withApiKey(apiKey: string): ConnectionBuilder {
    this.data.apiKey = apiKey;
    return this;
  }

  withBaseUrl(baseUrl: string): ConnectionBuilder {
    this.data.baseUrl = baseUrl;
    return this;
  }

  withKind(kind: ConnectionKind): ConnectionBuilder {
    this.data.kind = kind;
    return this;
  }

  withProvider(provider: string): ConnectionBuilder {
    this.data.provider = provider;
    return this;
  }

  forUser(userId: string): ConnectionBuilder {
    this.data.userId = userId;
    return this;
  }

  withCustomHeaders(headers: Record<string, any>): ConnectionBuilder {
    this.data.customHeaders = headers;
    return this;
  }

  withModels(models: any[]): ConnectionBuilder {
    this.data.models = models;
    return this;
  }

  async create(dataSource: DataSource): Promise<any> {
    if (!this.data.userId) {
      throw new Error('Connection must be associated with a user. Call .forUser(userId) first.');
    }
    return await createConnection(dataSource, this.data);
  }

  build(): Partial<any> {
    return { ...this.data };
  }
}

/**
 * User builder with fluent interface
 *
 * @example
 * ```typescript
 * const user = await buildUser()
 *   .withName('John Doe')
 *   .withUsername('johndoe')
 *   .withPassword('secret123')
 *   .create(dataSource);
 * ```
 */
export class UserBuilder {
  private data: Partial<any> = {
    name: faker.person.fullName(),
    username: `user_${Date.now()}`,
    password: 'testpass',
  };

  withName(name: string): UserBuilder {
    this.data.name = name;
    return this;
  }

  withUsername(username: string): UserBuilder {
    this.data.username = username;
    return this;
  }

  withPassword(password: string): UserBuilder {
    this.data.password = password;
    return this;
  }

  withSessionKey(sessionKey: string): UserBuilder {
    this.data.sessionKey = sessionKey;
    return this;
  }

  async create(dataSource: DataSource): Promise<any> {
    return await createUser(dataSource, this.data);
  }

  build(): Partial<any> {
    return { ...this.data };
  }
}

/**
 * LLM Model builder with fluent interface
 *
 * @example
 * ```typescript
 * const model = await buildLLMModel()
 *   .forConnection(connection.id)
 *   .withName('gpt-4')
 *   .withContextWindow(128000)
 *   .create(dataSource);
 * ```
 */
export class LLMModelBuilder {
  private data: Partial<any> = {
    name: 'gpt-3.5-turbo',
    maxTokens: 4096,
    contextWindow: 16385,
    description: 'Test LLM Model',
  };

  forConnection(connectionId: string): LLMModelBuilder {
    this.data.connectionId = connectionId;
    return this;
  }

  withName(name: string): LLMModelBuilder {
    this.data.name = name;
    return this;
  }

  withMaxTokens(maxTokens: number): LLMModelBuilder {
    this.data.maxTokens = maxTokens;
    return this;
  }

  withContextWindow(contextWindow: number): LLMModelBuilder {
    this.data.contextWindow = contextWindow;
    return this;
  }

  withDescription(description: string): LLMModelBuilder {
    this.data.description = description;
    return this;
  }

  withInputCost(inputCost: number): LLMModelBuilder {
    this.data.inputCost = inputCost;
    return this;
  }

  withOutputCost(outputCost: number): LLMModelBuilder {
    this.data.outputCost = outputCost;
    return this;
  }

  async create(dataSource: DataSource): Promise<any> {
    if (!this.data.connectionId) {
      throw new Error('LLM Model must be associated with a connection. Call .forConnection(connectionId) first.');
    }
    return await createLLMModel(dataSource, this.data);
  }

  build(): Partial<any> {
    return { ...this.data };
  }
}

/**
 * Chat builder with fluent interface
 *
 * @example
 * ```typescript
 * const chat = await buildChat()
 *   .forUser(user.id)
 *   .withTitle('Test Conversation')
 *   .withLLMModel(modelId)
 *   .create(dataSource);
 * ```
 */
export class ChatBuilder {
  private data: Partial<any> = {
    title: 'Test Chat',
    systemPrompt: 'You are a helpful assistant.',
  };

  forUser(userId: string): ChatBuilder {
    this.data.userId = userId;
    return this;
  }

  withTitle(title: string): ChatBuilder {
    this.data.title = title;
    return this;
  }

  withSystemPrompt(systemPrompt: string): ChatBuilder {
    this.data.systemPrompt = systemPrompt;
    return this;
  }

  withLLMModel(modelId: string): ChatBuilder {
    this.data.llmModelId = modelId;
    return this;
  }

  async create(dataSource: DataSource): Promise<any> {
    if (!this.data.userId) {
      throw new Error('Chat must be associated with a user. Call .forUser(userId) first.');
    }
    // Use the existing createChat function from the factory
    const { createChat } = await import('../factories/chatFactory');
    return await createChat(dataSource, this.data);
  }

  build(): Partial<any> {
    return { ...this.data };
  }
}

// Factory functions for creating builders
export const buildConnection = () => new ConnectionBuilder();
export const buildUser = () => new UserBuilder();
export const buildLLMModel = () => new LLMModelBuilder();
export const buildChat = () => new ChatBuilder();

/**
 * Pre-built configurations for common test scenarios
 */
export const TestDataPresets = {
  /**
   * Create a standard OpenAI connection for testing
   */
  openaiConnection: (userId: string) => buildConnection()
    .forUser(userId)
    .withName('OpenAI Test Connection')
    .withProvider('OpenAI')
    .withKind(ConnectionKind.OPENAI)
    .withBaseUrl('https://api.openai.com/v1'),

  /**
   * Create a standard Anthropic connection for testing
   */
  anthropicConnection: (userId: string) => buildConnection()
    .forUser(userId)
    .withName('Anthropic Test Connection')
    .withProvider('Anthropic')
    .withKind(ConnectionKind.ANTHROPIC)
    .withBaseUrl('https://api.anthropic.com'),

  /**
   * Create a test user with known credentials
   */
  testUser: () => buildUser()
    .withName('Test User')
    .withUsername('testuser')
    .withPassword('testpass123'),

  /**
   * Create a GPT-4 model for testing
   */
  gpt4Model: (connectionId: string) => buildLLMModel()
    .forConnection(connectionId)
    .withName('gpt-4')
    .withMaxTokens(4096)
    .withContextWindow(128000)
    .withDescription('GPT-4 model for testing'),

  /**
   * Create a GPT-3.5 model for testing
   */
  gpt35Model: (connectionId: string) => buildLLMModel()
    .forConnection(connectionId)
    .withName('gpt-3.5-turbo')
    .withMaxTokens(4096)
    .withContextWindow(16385)
    .withDescription('GPT-3.5 Turbo model for testing')
};

/**
 * Batch builders for creating multiple related entities
 */
export class TestDataSuite {
  private dataSource: DataSource;
  private user: any;
  private connections: any[] = [];
  private models: any[] = [];
  private chats: any[] = [];

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  /**
   * Start building with a user
   */
  withUser(userOverrides?: Partial<any>): TestDataSuite {
    const builder = userOverrides ? buildUser() : TestDataPresets.testUser();

    if (userOverrides) {
      Object.entries(userOverrides).forEach(([key, value]) => {
        switch (key) {
          case 'name': builder.withName(value as string); break;
          case 'username': builder.withUsername(value as string); break;
          case 'password': builder.withPassword(value as string); break;
        }
      });
    }

    // Store the promise and resolve it later when needed
    this.user = builder.create(this.dataSource);
    return this;
  }

  /**
   * Add a connection for the current user
   */
  withConnection(overrides?: Partial<any>): TestDataSuite {
    if (!this.user) {
      throw new Error('User must be created before connections. Call .withUser() first.');
    }

    const connectionPromise = this.user.then((user: any) => {
      const builder = overrides ? buildConnection() : TestDataPresets.openaiConnection(user.id);

      if (overrides) {
        Object.entries(overrides).forEach(([key, value]) => {
          switch (key) {
            case 'name': builder.withName(value as string); break;
            case 'provider': builder.withProvider(value as string); break;
            case 'baseUrl': builder.withBaseUrl(value as string); break;
          }
        });
      }

      return builder.create(this.dataSource);
    });

    this.connections.push(connectionPromise);
    return this;
  }

  /**
   * Add multiple connections for the current user
   */
  withConnections(count: number, overrides?: Partial<any>): TestDataSuite {
    for (let i = 0; i < count; i++) {
      this.withConnection({
        ...overrides,
        name: `Test Connection ${i + 1}`
      });
    }
    return this;
  }

  /**
   * Add LLM models for the first connection
   */
  withModels(modelConfigs: Array<{ name: string; maxTokens?: number; contextWindow?: number }>): TestDataSuite {
    if (this.connections.length === 0) {
      throw new Error('At least one connection must be created before models. Call .withConnection() first.');
    }

    modelConfigs.forEach(config => {
      const modelPromise = this.connections[0].then((connection: any) => {
        return buildLLMModel()
          .forConnection(connection.id)
          .withName(config.name)
          .withMaxTokens(config.maxTokens || 4096)
          .withContextWindow(config.contextWindow || 16385)
          .create(this.dataSource);
      });

      this.models.push(modelPromise);
    });

    return this;
  }

  /**
   * Build and resolve all entities
   */
  async build(): Promise<{
    user: any;
    connections: any[];
    models: any[];
    chats: any[];
  }> {
    const [user, connections, models, chats] = await Promise.all([
      this.user,
      Promise.all(this.connections),
      Promise.all(this.models),
      Promise.all(this.chats)
    ]);

    return {
      user,
      connections,
      models,
      chats
    };
  }
}

/**
 * Factory function for creating test data suites
 */
export const buildTestDataSuite = (dataSource: DataSource) => new TestDataSuite(dataSource);