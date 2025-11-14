/**
 * Mock Data Generators
 *
 * Utilities for generating realistic mock data for testing.
 * These generators use faker.js and custom logic to create test data
 * that feels real while being deterministic when needed.
 */

import { faker } from '@faker-js/faker';
import { ConnectionKind } from '../../main/db/entities/__generated__/ConnectionBase';

/**
 * Configuration for mock data generation
 */
export interface MockDataConfig {
  /** Use deterministic seed for reproducible tests */
  seed?: number;
  /** Locale for faker */
  locale?: string;
}

/**
 * Mock data generator with configurable randomness
 */
export class MockDataGenerator {
  private seed?: number;

  constructor(config: MockDataConfig = {}) {
    if (config.seed !== undefined) {
      this.seed = config.seed;
      faker.seed(config.seed);
    }
    if (config.locale) {
      // Note: In newer versions of faker, locale setting might be different
      // For now, we'll skip locale setting as it's not critical for tests
    }
  }

  /**
   * Reset the generator with a new seed
   */
  resetSeed(seed?: number): void {
    if (seed !== undefined) {
      faker.seed(seed);
    }
  }

  /**
   * Generate a realistic user name
   */
  userName(): string {
    return faker.person.fullName();
  }

  /**
   * Generate a realistic username
   */
  username(): string {
    return faker.internet.username().toLowerCase();
  }

  /**
   * Generate a realistic email
   */
  email(): string {
    return faker.internet.email().toLowerCase();
  }

  /**
   * Generate a realistic password
   */
  password(options: { length?: number; includeNumbers?: boolean; includeSymbols?: boolean } = {}): string {
    const { length = 12, includeNumbers = true, includeSymbols = false } = options;
    let charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  /**
   * Generate a realistic API key
   */
  apiKey(prefix: string = 'sk-'): string {
    const randomPart = faker.string.alphanumeric({ length: 32 });
    return `${prefix}${randomPart}`;
  }

  /**
   * Generate a realistic URL
   */
  url(options: { protocol?: string; domain?: string; path?: string } = {}): string {
    const { protocol = 'https', domain, path } = options;
    const usedDomain = domain || faker.internet.domainName();
    const usedPath = path || `/${faker.helpers.arrayElement(['api', 'v1', 'v2'])}`;
    return `${protocol}://${usedDomain}${usedPath}`;
  }

  /**
   * Generate a realistic connection name
   */
  connectionName(): string {
    const templates = [
      `${faker.helpers.arrayElement(['OpenAI', 'Anthropic', 'Cohere', 'Google'])} ${faker.helpers.arrayElement(['API', 'Service', 'Endpoint', 'Connection'])}`,
      `${faker.helpers.arrayElement(['Production', 'Staging', 'Development', 'Test'])} ${faker.helpers.arrayElement(['AI', 'LLM', 'Model'])} ${faker.helpers.arrayElement(['API', 'Service'])}`,
      `${faker.color.human()} ${faker.helpers.arrayElement(['Model', 'Service', 'Endpoint'])}`,
      `${faker.location.city()} ${faker.helpers.arrayElement(['Server', 'Instance', 'Cluster'])}`
    ];
    return faker.helpers.arrayElement(templates);
  }

  /**
   * Generate realistic connection data
   */
  connectionData(overrides: Partial<{
    name: string;
    apiKey: string;
    baseUrl: string;
    provider: string;
    kind: ConnectionKind;
    customHeaders: Record<string, any>;
    models: Array<{ id: string; name: string; version: string; provider: string }>;
  }> = {}): {
    name: string;
    apiKey: string;
    baseUrl: string;
    kind: ConnectionKind;
    provider?: string;
    customHeaders: Record<string, any>;
    models: Array<{ id: string; name: string; version: string; provider: string }>;
  } {
    const kind = overrides.kind || faker.helpers.arrayElement([ConnectionKind.OPENAI, ConnectionKind.ANTHROPIC]);
    const provider = overrides.provider || (kind === ConnectionKind.OPENAI ? 'OpenAI' : 'Anthropic');

    return {
      name: overrides.name || this.connectionName(),
      apiKey: overrides.apiKey || this.apiKey(kind === ConnectionKind.OPENAI ? 'sk-' : 'sk-ant-'),
      baseUrl: overrides.baseUrl || this.url({
        domain: kind === ConnectionKind.OPENAI ? 'api.openai.com' : 'api.anthropic.com',
        path: '/v1'
      }),
      kind,
      provider,
      customHeaders: overrides.customHeaders || {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Client/1.0'
      },
      models: overrides.models || this.generateLLMModels(kind)
    };
  }

  /**
   * Generate realistic LLM model data
   */
  llmModelData(overrides: Partial<{
    name: string;
    maxTokens: number;
    contextWindow: number;
    description: string;
    inputCost: number;
    outputCost: number;
  }> = {}): {
    name: string;
    maxTokens: number;
    contextWindow: number;
    description: string;
    inputCost: number;
    outputCost: number;
  } {
    const modelNames = [
      'gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku',
      'text-davinci-003', 'text-curie-001', 'text-babbage-001', 'text-ada-001'
    ];

    return {
      name: overrides.name || faker.helpers.arrayElement(modelNames),
      maxTokens: overrides.maxTokens || faker.helpers.arrayElement([2048, 4096, 8192, 16384]),
      contextWindow: overrides.contextWindow || faker.helpers.arrayElement([4096, 8192, 16384, 32768, 128000]),
      description: overrides.description || faker.lorem.sentence(),
      inputCost: overrides.inputCost || parseFloat(faker.number.float({ min: 0.001, max: 0.1, fractionDigits: 4 }).toFixed(4)),
      outputCost: overrides.outputCost || parseFloat(faker.number.float({ min: 0.002, max: 0.2, fractionDigits: 4 }).toFixed(4))
    };
  }

  /**
   * Generate realistic chat title
   */
  chatTitle(): string {
    const templates = [
      `${faker.helpers.arrayElement(['Discussion about', 'Analysis of', 'Review of'])} ${faker.helpers.arrayElement(['Project', 'Report', 'Proposal', 'Strategy'])}`,
      `${faker.helpers.arrayElement(['Meeting', 'Call', 'Review'])} ${faker.helpers.arrayElement(['Notes', 'Summary', 'Minutes'])}`,
      `${faker.helpers.arrayElement(['Customer', 'Client', 'User'])} ${faker.helpers.arrayElement(['Inquiry', 'Request', 'Feedback', 'Support'])}`,
      `${faker.helpers.arrayElement(['Development', 'Design', 'Planning'])} ${faker.helpers.arrayElement(['Session', 'Discussion', 'Brainstorm'])}`
    ];
    return faker.helpers.arrayElement(templates);
  }

  /**
   * Generate realistic system prompt
   */
  systemPrompt(): string {
    const templates = [
      `You are a helpful ${faker.helpers.arrayElement(['assistant', 'analyst', 'consultant', 'expert'])} specializing in ${faker.helpers.arrayElement(['software development', 'data analysis', 'customer support', 'technical writing'])}.`,
      `Act as a ${faker.helpers.arrayElement(['professional', 'friendly', 'technical', 'creative'])} assistant who helps with ${faker.helpers.arrayElement(['problem-solving', 'creative writing', 'data analysis', 'project planning'])}.`,
      `You are an AI assistant focused on providing ${faker.helpers.arrayElement(['accurate', 'concise', 'detailed', 'comprehensive'])} responses about ${faker.helpers.arrayElement(['technology', 'business', 'science', 'arts'])}.`,
      `As a ${faker.helpers.arrayElement(['senior developer', 'product manager', 'design thinking expert', 'business analyst'])}, help me ${faker.helpers.arrayElement(['analyze', 'plan', 'design', 'implement'])} ${faker.helpers.arrayElement(['solutions', 'strategies', 'features', 'processes'])}.`
    ];
    return faker.helpers.arrayElement(templates);
  }

  /**
   * Generate realistic message content
   */
  messageContent(length: 'short' | 'medium' | 'long' = 'medium'): string {
    const lengths = {
      short: { min: 10, max: 50 },
      medium: { min: 50, max: 200 },
      long: { min: 200, max: 500 }
    };

    const range = lengths[length];
    return faker.lorem.paragraph({ min: range.min, max: range.max });
  }

  /**
   * Generate realistic code snippet
   */
  codeSnippet(language: string = 'javascript'): string {
    const snippets: Record<string, string[]> = {
      javascript: [
        `function ${faker.helpers.arrayElement(['calculateTotal', 'processData', 'validateInput', 'generateReport'])}() {\n  // Implementation here\n  return result;\n}`,
        `const ${faker.helpers.arrayElement(['user', 'data', 'config', 'options'])} = {\n  ${faker.helpers.arrayElement(['name', 'type', 'value', 'status'])}: '${faker.helpers.arrayElement(['example', 'test', 'sample', 'demo'])}'\n};`,
        `class ${faker.helpers.arrayElement(['User', 'Service', 'Manager', 'Handler'])} {\n  constructor() {\n    // Initialize\n  }\n}`
      ],
      python: [
        `def ${faker.helpers.arrayElement(['process_data', 'calculate_result', 'validate_input', 'generate_output'])}():\n    # Implementation here\n    return result`,
        `class ${faker.helpers.arrayElement(['DataProcessor', 'APIHandler', 'ConfigManager', 'ServiceClass'])}:\n    def __init__(self):\n        self.${faker.helpers.arrayElement(['data', 'config', 'client', 'logger'])} = None`,
        `def ${faker.helpers.arrayElement(['main', 'run', 'execute', 'start'])}():\n    # Main logic\n    pass`
      ],
      typescript: [
        `interface ${faker.helpers.arrayElement(['User', 'Data', 'Config', 'Options'])} {\n  ${faker.helpers.arrayElement(['id', 'name', 'type', 'status'])}: ${faker.helpers.arrayElement(['string', 'number', 'boolean'])};\n  ${faker.helpers.arrayElement(['createdAt', 'updatedAt', 'timestamp'])}: Date;\n}`,
        `function ${faker.helpers.arrayElement(['handleRequest', 'processData', 'validateForm', 'createResponse'])}<T>(input: T): T {\n  // Type-safe processing\n  return input;\n}`,
        `class ${faker.helpers.arrayElement(['Repository', 'Service', 'Controller', 'Component'])}<T> {\n  private items: T[] = [];\n  \n  add(item: T): void {\n    this.items.push(item);\n  }\n}`
      ]
    };

    const languageSnippets = snippets[language] || snippets.javascript;
    return faker.helpers.arrayElement(languageSnippets);
  }

  /**
   * Generate realistic error message
   */
  errorMessage(): string {
    const templates = [
      `Failed to ${faker.helpers.arrayElement(['connect', 'authenticate', 'process', 'validate'])} ${faker.helpers.arrayElement(['request', 'data', 'input', 'operation'])}: ${faker.helpers.arrayElement(['Network error', 'Timeout exceeded', 'Invalid credentials', 'Resource not found'])}`,
      `${faker.helpers.arrayElement(['Validation', 'Authentication', 'Authorization', 'Rate limit'])} ${faker.helpers.arrayElement(['failed', 'error', 'exception'])}: ${faker.lorem.sentence()}`,
      `Unable to ${faker.helpers.arrayElement(['process', 'handle', 'execute', 'complete'])} ${faker.helpers.arrayElement(['operation', 'request', 'task', 'job'])}: ${faker.helpers.arrayElement(['Internal server error', 'Database connection failed', 'Service unavailable', 'Invalid request format'])}`,
      `${faker.helpers.arrayElement(['Error', 'Exception', 'Failure'])} in ${faker.helpers.arrayElement(['module', 'service', 'component', 'handler'])}: ${faker.lorem.words(3)}`
    ];
    return faker.helpers.arrayElement(templates);
  }

  /**
   * Generate realistic job data
   */
  jobData(overrides: Partial<{
    name: string;
    status: string;
    lastError: string;
  }> = {}): {
    name: string;
    status: string;
    lastError?: string;
  } {
    const jobTypes = [
      'EmailNotification', 'DataProcessing', 'ReportGeneration', 'CacheCleanup',
      'UserSync', 'BackupTask', 'IndexUpdate', 'ContentAnalysis'
    ];

    const statuses = ['pending', 'running', 'completed', 'failed'];

    const status = overrides.status || faker.helpers.arrayElement(statuses);
    const lastError = status === 'failed' ? (overrides.lastError || this.errorMessage()) : undefined;

    return {
      name: overrides.name || faker.helpers.arrayElement(jobTypes),
      status,
      lastError
    };
  }

  /**
   * Generate array of LLM models based on connection kind
   */
  private generateLLMModels(kind: ConnectionKind): Array<{ id: string; name: string; version: string; provider: string }> {
    if (kind === ConnectionKind.OPENAI) {
      return [
        { id: 'gpt-4', name: 'GPT-4', version: '1.0', provider: 'OpenAI' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', version: '1.0', provider: 'OpenAI' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', version: '1.0', provider: 'OpenAI' }
      ];
    } else {
      return [
        { id: 'claude-3-opus', name: 'Claude 3 Opus', version: '1.0', provider: 'Anthropic' },
        { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', version: '1.0', provider: 'Anthropic' },
        { id: 'claude-3-haiku', name: 'Claude 3 Haiku', version: '1.0', provider: 'Anthropic' }
      ];
    }
  }

  /**
   * Generate realistic timestamp within range
   */
  timestamp(options: { daysAgo?: number; recent?: boolean } = {}): Date {
    const { daysAgo = 30, recent = false } = options;

    if (recent) {
      // Last 24 hours
      return faker.date.recent({ days: 1 });
    } else {
      // Within specified days ago
      return faker.date.past({ years: daysAgo / 365 });
    }
  }

  /**
   * Generate realistic metadata object
   */
  metadata(): Record<string, any> {
    return {
      version: faker.system.semver(),
      environment: faker.helpers.arrayElement(['development', 'staging', 'production']),
      region: faker.helpers.arrayElement(['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1']),
      requestId: faker.string.alphanumeric({ length: 16 }),
      traceId: faker.string.alphanumeric({ length: 32 }),
      timestamp: this.timestamp().toISOString(),
      [faker.lorem.word()]: faker.lorem.sentence()
    };
  }
}

/**
 * Default mock data generator instance
 */
export const mockData = new MockDataGenerator();

/**
 * Factory function to create mock data generator with custom config
 */
export function createMockData(config: MockDataConfig = {}): MockDataGenerator {
  return new MockDataGenerator(config);
}

/**
 * Quick mock data generators for common scenarios
 */
export const quickMocks = {
  user: (overrides?: any) => ({
    name: mockData.userName(),
    username: mockData.username(),
    password: mockData.password(),
    ...overrides
  }),

  connection: (overrides?: any) => ({
    ...mockData.connectionData(),
    ...overrides
  }),

  llmModel: (overrides?: any) => ({
    ...mockData.llmModelData(),
    ...overrides
  }),

  chat: (overrides?: any) => ({
    title: mockData.chatTitle(),
    systemPrompt: mockData.systemPrompt(),
    ...overrides
  }),

  message: (overrides?: any) => ({
    content: mockData.messageContent(),
    role: faker.helpers.arrayElement(['user', 'assistant']),
    ...overrides
  }),

  job: (overrides?: any) => ({
    ...mockData.jobData(),
    ...overrides
  })
};