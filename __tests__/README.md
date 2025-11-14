# Testing Guide

## Philosophy

**Integration > Unit** • **Real > Mocks** • **Isolated Databases** • **Polly for APIs**

## Quick Start

```bash
yarn test                    # Run all tests
yarn test:watch              # Watch mode
yarn test __tests__/path     # Run specific test
RECORD=true yarn test        # Re-record HTTP fixtures
yarn tsc                     # Type check (not yarn build!)
```

## Test Structure

```
__tests__/
├── setup.ts                 # Global config (auto-imported)
├── helpers/
│   ├── testDatabase.ts     # DB setup/cleanup
│   ├── testFactories.ts    # Faker.js generators
│   └── testUtils.ts        # High-level helpers
├── polly/                  # HTTP recording (Polly.js)
├── fixtures/               # Test files (PDFs, CSVs, etc.)
├── integration/            # End-to-end tests
├── services/               # Service-level tests
└── graphql/                # GraphQL resolver tests
```

## Writing Tests

### Basic Pattern (Integration Test)

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { DataSource } from "typeorm";
import {
  createTestDatabase,
  cleanupTestDatabase,
} from "../helpers/testDatabase";
import { createUser } from "../helpers/testUtils";

describe("Feature", () => {
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = await createTestDatabase(); // Fresh DB per test
  });

  afterEach(async () => {
    await cleanupTestDatabase(dataSource);
  });

  it("should do something", async () => {
    // Arrange
    const user = await createUser(dataSource);

    // Act
    const result = await someService.doSomething(user.id);

    // Assert
    expect(result).toBeDefined();
  });
});
```

**CRITICAL**: Use `beforeEach`, not `beforeAll` (causes readonly DB errors).

### Test Utilities

```typescript
// Create user (simplest)
const user = await createUser(dataSource);

// Create user + connection
const { user, connection } = await createConnection(dataSource);

// Create full setup (user + connection + model)
const { user, connection, model } = await createEmbeddingModel(dataSource);

// Customize options
const { user, connection } = await createConnection(dataSource, {
  baseURL: "http://localhost:8080/v1",
  apiKey: "custom-key",
});
```

### Using Fixtures

```typescript
import { loadFixture, FIXTURES } from "../fixtures/loaders";

// Load as buffer
const pdfBuffer = await loadFixture(FIXTURES.PDF);

// Load as string
const text = await loadFixtureAsString(FIXTURES.TEXT);

// Get file stats
const stats = await getFixtureStats(FIXTURES.PDF);
```

### HTTP Mocking with Polly.js

```typescript
import { setupEmbeddingPolly } from "../polly/helpers";

describe("Service with API calls", () => {
  setupEmbeddingPolly({ recordingName: "my-test" });

  it("should make API call", async () => {
    // First run: records to __tests__/recordings/
    // Subsequent runs: replays from recording
    const response = await fetch("https://api.example.com/data");
    expect(response.status).toBe(200);
  });
});
```

**Polly Modes**:

- Default: Replay if exists, else record
- `RECORD=true`: Force re-record
- `REPLAY_ONLY=true`: Fail if missing (CI)
- `POLLY_DEBUG=true`: Debug logs

## Testing GraphQL Resolvers

### Direct Resolver Testing (Recommended)

```typescript
import { LLMModelResolver } from "@main/graphql/resolvers/LLMModelResolver";
import { createLLMModel } from "../helpers/testUtils";

describe("LLMModelResolver", () => {
  let dataSource: DataSource;
  let resolver: LLMModelResolver;
  let testData: any;

  beforeEach(async () => {
    dataSource = await createTestDatabase();
    resolver = new LLMModelResolver();
    testData = await createLLMModel(dataSource);
  });

  afterEach(async () => {
    await cleanupTestDatabase(dataSource);
  });

  function createTestContext(sessionKey?: string) {
    return { sessionKey: sessionKey || testData.user.sessionKey };
  }

  it("should query models", async () => {
    const context = createTestContext();
    const result = await resolver.llmModels(context, testData.user.id, null);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Test LLM Model");
  });

  it("should create model with validation", async () => {
    const context = createTestContext();
    const input = {
      name: "New Model",
      connectionId: testData.connection.id,
      temperature: 0.7,
      contextLength: 2048,
      capabilities: [LLMCapability.TEXT],
      modelIdentifier: "google/gemma-3-4b",
    };

    const result = await resolver.createUpdateLLMModel(context, input);
    expect(result.name).toBe("New Model");
  });

  it("should enforce ownership", async () => {
    const otherUser = await createUser(dataSource);
    const otherContext = createTestContext(otherUser.sessionKey);

    await expect(
      resolver.deleteModel(otherContext, testData.model.id)
    ).rejects.toThrow(/access denied/i);
  });
});
```

**Key Points**:

- Context is **always first parameter**
- Reuse same user for related entities (avoid ownership errors)
- Include **all required fields** in mutations
- Use actual enum values from entity definitions

### With External APIs

```typescript
import { setupEmbeddingPolly } from "../polly/helpers";

describe("ConnectionResolver", () => {
  let pollyContext: any;

  beforeAll(async () => {
    pollyContext = setupEmbeddingPolly({
      recordingName: "connection-mutations",
    });
  });

  afterAll(async () => {
    await pollyContext.stop();
  });

  it("should validate connection", async () => {
    const input = {
      baseURL: "https://api.anthropic.com",
      apiKey: "test-key",
      provider: "anthropic",
    };

    // Real HTTP call (first run) or replay (subsequent)
    const result = await resolver.createUpdateConnection(context, input);
    expect(result.isValid).toBe(true);
  });
});
```

## Service-Level Tests

```typescript
describe("SyncedFolderService", () => {
  let dataSource: DataSource;
  let service: SyncedFolderService;
  let testUser: User;

  beforeEach(async () => {
    dataSource = await createTestDatabase();
    service = new SyncedFolderService();
    testUser = await createUser(dataSource);
  });

  afterEach(async () => {
    DataSourceProvider.clearTestDataSource();
    await cleanupTestDatabase(dataSource);
  });

  it("should create folder with validation", async () => {
    const folder = await service.createSyncedFolder(
      testUser.sessionKey,
      "/test/path"
    );

    expect(folder.userId).toBe(testUser.id);
    expect(folder.folderPath).toBe("/test/path");
  });
});
```

## Integration Tests with File System

```typescript
describe("Sync Integration", () => {
  let dataSource: DataSource;
  let testDir: string;
  let testUser: User;

  beforeEach(async () => {
    dataSource = await createTestDatabase();
    testUser = await createUser(dataSource);

    // Create temp directory
    testDir = path.join(process.env.TMPDIR || "/tmp", `test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean filesystem first, then database
    if (testDir) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
    DataSourceProvider.clearTestDataSource();
    await cleanupTestDatabase(dataSource);
  });

  it("should sync folder with real files", async () => {
    await fs.writeFile(path.join(testDir, "test.txt"), "content");

    const folder = await syncService.syncFolder(testUser.sessionKey, testDir);
    expect(folder.documents).toHaveLength(1);
  });
});
```

## Common Pitfalls

### 1. Ownership Errors

```typescript
// ❌ WRONG - Different users own resources
const testData1 = await createLLMModel(dataSource);
const testData2 = await createConnection(dataSource);
const result = await resolver.createModel(context, {
  connectionId: testData2.connection.id, // Different user!
});

// ✅ CORRECT - Reuse same user
const testData = await createLLMModel(dataSource);
const result = await resolver.createModel(context, {
  connectionId: testData.connection.id, // Same user
});
```

### 2. Missing Required Fields

```typescript
// ❌ WRONG - Missing required fields
const input = { name: "Test" };

// ✅ CORRECT - Check entity for required fields
const input = {
  name: "Test",
  connectionId: testData.connection.id,
  temperature: 0.7, // Required
  contextLength: 2048, // Required
  capabilities: [LLMCapability.TEXT], // Required, non-empty
  modelIdentifier: "google/gemma-3-4b", // Required
};
```

### 3. SQLite NULL vs Undefined

```typescript
// ❌ WRONG - SQLite ignores undefined
await repository.save({ ...entity, someField: undefined });

// ✅ CORRECT - Use null to clear fields
await repository.save({ ...entity, someField: null });
```

### 4. Context Parameter Order

```typescript
// ❌ WRONG
const result = await resolver.llmModels(userId, null, context);

// ✅ CORRECT - Context is always first
const result = await resolver.llmModels(context, userId, null);
```

### 5. beforeAll Database Pattern

```typescript
// ❌ WRONG - Causes readonly errors
beforeAll(async () => {
  dataSource = await createTestDatabase();
});

// ✅ CORRECT - Fresh DB per test
beforeEach(async () => {
  dataSource = await createTestDatabase();
});
```

## Debugging

```bash
# Run single test
yarn test:watch __tests__/integration/my-feature.test.ts

# Debug Polly
POLLY_DEBUG=true yarn test

# Type check
yarn tsc
```

In tests:

## Test Coverage Status

| Component         | Tests | Status |
| ----------------- | ----- | ------ |
| GraphQL Resolvers | 49+   | ✅     |
| Service Layer     | 19+   | ✅     |
| Integration Tests | 5+    | ✅     |

Total: **99+ tests passing**

## Examples

- `__tests__/graphql/llmmodel-queries.test.ts` - Query resolver testing
- `__tests__/graphql/llmmodel-mutations.test.ts` - Mutation resolver testing
- `__tests__/services/SyncedFolderService.test.ts` - Service testing
- `__tests__/integration/document-processing.test.ts` - End-to-end workflows

## Resources

- [Vitest Docs](https://vitest.dev/)
- [Polly.js Docs](https://netflix.github.io/pollyjs/)
- [TypeORM Docs](https://typeorm.io/)

**Remember**: Tests should be simple, fast, and reliable. Write tests that give you confidence to refactor!
