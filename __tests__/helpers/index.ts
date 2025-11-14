/**
 * Test Utilities Index
 *
 * Central export point for core test helper utilities.
 * Only exports working utilities to avoid import issues.
 */

// GraphQL Test Setup (Working Core)
export {
  setupGraphQLTest,
  setupGraphQLTestWithPolly,
  setupMultipleUsers,
  setupGraphQLTestWithMultipleUsers,
  type GraphQLTestContext,
  type GraphQLTestContextWithPolly
} from './graphqlTestSetup';

// GraphQL Assertions (Working Core)
export { graphqlAssert } from './graphqlAssertions';
export type { GraphQLTestResult } from './graphqlAssertions';

// Test Data Builders (Working Core)
export {
  ConnectionBuilder,
  UserBuilder,
  LLMModelBuilder,
  ChatBuilder,
  TestDataSuite,
  buildConnection,
  buildUser,
  buildLLMModel,
  buildChat,
  TestDataPresets,
  buildTestDataSuite
} from './testDataBuilders';

// GraphQL Test Runner (Working Core)
export {
  GraphQLTestRunner,
  createGraphQLTestRunner,
  withGraphQLTestRunner
} from './graphqlTestRunner';

// Mock Data Generators (Working Core)
export {
  MockDataGenerator,
  mockData,
  createMockData,
  quickMocks
} from './mockDataGenerators';

// Re-export commonly used existing utilities for convenience
export { createTestDatabase, cleanupTestDatabase } from '../base/testDatabase';
export { createUser } from '../factories/userFactory';
export { createConnection } from '../factories/connectionFactory';
export { setupSimplePolly, type PollyContext } from '../polly/helpers';

// Note: GraphQL Builders, Test Environment, and Performance utilities
// are available but not exported here to avoid import issues.
// Import them directly from their files if needed.