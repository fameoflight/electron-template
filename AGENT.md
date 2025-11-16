# Electron Template - Architecture Guide

> Batteries-included Electron template with React, TypeORM, GraphQL (Relay), and background jobs.

## Stack

**Core:** Electron 39, React 18, TypeScript 5.9, Vite 7, SQLite + TypeORM
**GraphQL:** Type-GraphQL 2.0, Apollo Server 5, Relay 20
**UI:** Tailwind v4, Ant Design 5, Framer Motion 12
**Testing:** Vitest 4, Testing Library 16, Polly.js 6

## Quick Start

```bash
yarn install              # Install dependencies
yarn setup:completions    # Install zsh completions (optional)
yarn db:seed              # Seed database
yarn dev                  # Start dev server
```

## Common Commands

```bash
# Development
yarn dev              # Start Vite + Electron + Relay compiler
yarn fresh            # Clean + install + seed + dev (complete fresh start)
yarn console          # Interactive REPL with full app context
yarn type-check       # Type check (use this, NOT yarn build)
yarn check            # Run type-check + lint + test (pre-commit)
yarn fix              # Auto-fix linting issues
yarn test             # Run all tests
yarn test:watch       # Run tests in watch mode

# Code Generation
yarn g schema [--force] [--watch]   # Generate GraphQL schema from entities
yarn g graphql [--force] [--watch]  # Generate schema + entities + compile Relay
yarn g migration [--dry-run]        # Generate migrations from schema changes

# Alternative syntax
yarn utils schema [--force]         # Generate entities from JSON schemas
yarn utils schema --watch           # Watch for changes and regenerate schema
yarn graphql [--force]              # Generate schema + entities + compile Relay
yarn graphql --watch                # Watch mode: regenerate schema + Relay on changes

# Database
yarn db:seed          # Seed database
yarn db:reset         # Delete data and re-seed
yarn db:stats         # Show table record counts
yarn db:inspect User  # Inspect entity schema
yarn db:snapshot      # Backup database
yarn db:restore-snapshot  # Restore from backup
yarn db:drop          # Delete database entirely

# Project Info
yarn project:info     # Show project health dashboard
yarn project:routes   # List GraphQL resolvers & IPC handlers

# Build & Deploy
yarn build            # Production build
yarn clean:deep       # Deep clean (node_modules + all artifacts)
```

## Architecture

```
┌─────────────────────────────────────────┐
│  UI Layer (React + Relay)      /ui/    │ ← Components, Relay fragments
└─────────────┬───────────────────────────┘
              │ IPC Bridge (typed)
┌─────────────┴───────────────────────────┐
│  Main Process (Electron)      /main/   │ ← GraphQL, SQLite, Services
└─────────────────────────────────────────┘
```

### Directory Structure

```
electron-template/
├── main/                      # Electron main process
│   ├── db/entities/          # TypeORM entities (40-100 lines each)
│   ├── graphql/resolvers/    # GraphQL resolvers (88-203 lines each)
│   ├── handlers/registry.ts  # IPC handlers (single source of truth)
│   ├── services/             # Services (94-541 lines, avg ~200)
│   └── base/                 # Shared infrastructure (decorators, base classes)
├── ui/                       # React renderer
│   ├── Pages/                # Page components (47-293 lines, avg ~150)
│   ├── Components/           # Reusable components (25-90 lines)
│   └── hooks/                # Custom hooks
├── shared/                   # Shared code (main + renderer)
├── cli/                      # Code generators
└── __tests__/                # Test suite
```

## Core Principles

### 1. Boring Over Clever

**No complex abstractions** - Direct, readable code:

```typescript
// ✅ GOOD - Static methods, no DI complexity (MessageService pattern)
export class MessageService {
  static async createMessagePairAndStream(
    chatId: string,
    userMessageContent: string,
    options: MessageCreationOptions = {}
  ): Promise<MessageCreationResult> {
    const chat = await this.validateChatForMessage(chatId);
    const userMessage = await this.createUserMessage(chatId, userMessageContent, options);
    const assistantMessage = await this.createAssistantMessage(chatId, options.llmModelId, userId);
    const jobEnqueued = await this.enqueueStreamJob(assistantMessage, userId, options);
    return { userMessage, assistantMessage, jobEnqueued };
  }
}

// ❌ BAD - Over-engineered DI
constructor(
  private messageRepo: Repository<Message>,
  private chatRepo: Repository<Chat>,
  private versionRepo: Repository<MessageVersion>,
  private fileRepo: Repository<File>,
  private jobQueue: JobQueue,
  private logger: Logger
) {}
```

### 2. Small Files Hide Complexity

**Target: 100-200 lines, max 300 for complex cases**

**Real examples from this codebase:**

- `ChatService.ts`: 162 lines - Data fetching and caching
- `WindowManager.ts`: 101 lines - Window state management
- `MessageService.ts`: 475 lines - Complete message lifecycle (exception: genuinely complex)
- `ChatNodePage.tsx`: 153 lines - Page with GraphQL integration
- `CodeBlock.tsx`: 61 lines - Syntax highlighting component

**Pattern:** Each file does ONE thing clearly. Internal complexity is fine if the API is simple.

### 3. Maximum 5 Parameters - Ever

**Constructor parameters: 0-2 max**

```typescript
// ✅ GOOD - Zero parameters (WindowManager, JobQueue)
constructor() {
  this.dataSource = DataSourceProvider.get();
}

// ✅ GOOD - Single options interface (ChatService)
interface ChatServiceOptions {
  chatId?: string;
  messageId?: string;
  messageVersionId?: string;
}

constructor(opts: ChatServiceOptions) {
  this.dataSource = DataSourceProvider.get();
  this.opts = opts;
}

// ✅ GOOD - Single dependency (MenuService, SystemTrayService)
constructor(mainWindow: BrowserWindow) {
  this.mainWindow = mainWindow;
}
```

**Function parameters: 3 positional + 1 options object max**

```typescript
// ✅ GOOD - Options pattern for optional params
static async createMessagePairAndStream(
  chatId: string,              // Required
  userMessageContent: string,  // Required
  options: MessageCreationOptions = {}  // Optional settings
): Promise<MessageCreationResult>

interface MessageCreationOptions {
  llmModelId?: string;
  priority?: number;
  timeoutMs?: number;
  attachmentIds?: string[];
  logPrefix?: string;
}

// ❌ BAD - Too many parameters
function createMessage(
  chatId: string,
  content: string,
  role: string,
  userId: string,
  llmModelId: string,
  priority: number,
  timeoutMs: number,
  attachmentIds: string[]
) {}
```

### 4. Maximum 5 Exports Per File

**Hide implementation, expose minimal API:**

```typescript
// ✅ GOOD - Single service class
export class MessageService {
  // Internal: getRepositories, validateAuth, log (not exported)
  // Public API: 3-5 key methods
  static async createUserMessage(...)
  static async createMessagePairAndStream(...)
  static async cancelMessage(...)
}

// ❌ BAD - Exposing internals
export const validateEmail = ...
export const validatePhone = ...
export const validateAddress = ...
export const formatEmail = ...
export const formatPhone = ...
export const parseEmail = ...
export const normalizeEmail = ...
```

## Key Patterns

### 1. Unified Decorator System

**Single source of truth** for all field decorators - eliminates code duplication between entity and input decorators:

```typescript
// Unified BaseField (214 lines) - handles all GraphQL + validation logic
// Specific decorators become thin wrappers (20-30 lines each)

@FieldColumn(String, { description: 'Title', required: true })     // Entity
@FieldInput(String, { description: 'Title', inputType: 'create' }) // Input

@FieldColumnEnum(Status, { array: true })                           // Entity
@FieldInputEnum(Status, { array: true, inputType: 'update' })     // Input

@FieldColumnJSON(MetadataSchema)                                    // Entity
@FieldInputJSON(MetadataSchema, { inputType: 'create' })          // Input
```

**Key Benefits:**

- **Zero Duplication**: Single BaseField handles GraphQL + validation for all field types
- **Context-Aware**: Different behavior for entity vs input contexts
- **Consistent API**: Same options across FieldColumn and FieldInput decorators
- **Type Safety**: Unified interfaces with proper inheritance

**FieldInput System:**

- **Code Generation**: Auto-generates input decorators with context-aware behavior
- **Input Types**: `create` (required), `update` (optional), `createUpdate` (optional)
- **Array Support**: Consistent `array: true` handling across all field types
- **Validation**: Context-aware validation (different rules for create vs update)

### 2. Repository Pattern (Smart Loading & DRY Utilities)

**Ultra-simple 2-repository architecture** with automatic smart loading for all entities:

```typescript
// ✅ CustomRepository - Single foundation for all entities
export class CustomRepository<T extends { id: string; __typename?: string }> {
  // Smart Loading: Always triggers SmartLoadingSubscriber.afterLoad()
  async save<Entity extends DeepPartial<T>>(entity: Entity): Promise<Entity> {
    // Auto-detects: Entity instances vs plain objects
    // Auto-converts: Plain objects → entity instances
    // Auto-reloads: Triggers smart relationships loading
    // Auto-marks: Sets __typename for Relay
  }

  // All methods support both entity instances and plain objects:
  async update(criteria: any, partialEntity: DeepPartial<T>): Promise<any>;
  async recover(entity: T | DeepPartial<T>): Promise<T>;
  async remove(entity: T | DeepPartial<T>): Promise<T>;
}

// ✅ OwnedRepository - User ownership security layer
export class OwnedRepository<
  T extends OwnedEntity
> extends CustomRepository<T> {
  // Automatic userId filtering for ALL operations
  // Auto-attaches userId on create
  // Verifies ownership on update/delete
  // Preserves all smart loading functionality
}
```

**Smart Loading Features:**

- **100% Automatic**: CustomDataSource returns CustomRepository instances automatically
- **Plain Object Support**: `save({ name: 'test' })` works transparently
- **Constructor Preservation**: No spread operators that destroy entity constructors
- **Relay ID Conversion**: Global ID ↔ local ID conversion built-in
- **Entity Marking**: Automatic `__typename` attachment
- **Smart Relationship Loading**: Post-save reload triggers SmartLoadingSubscriber for relationship loading

**Usage Examples:**

```typescript
// BaseResolver provides ready-to-use repositories
const repo = this.getBaseRepository(User); // CustomRepository
const ownedRepo = this.getOwnedRepository(Chat, ctx); // OwnedRepository

// All methods support plain objects and entities
await repo.save({ name: "New User" }); // Plain object ✅
await repo.save(existingUser); // Entity instance ✅
await repo.update({ id: "123" }, { name: "Updated" }); // Mixed ✅

// OwnedRepository enforces security automatically
await ownedRepo.save({ title: "New Chat" }); // Auto-attaches userId ✅
await ownedRepo.findById(chatId); // Verifies ownership ✅
```

**DRY Utility Functions:**

```typescript
// Internal utilities that make the pattern DRY
private detectEntityType(input: any): boolean        // Entity vs plain object
private createEntityFromPlain(input: DeepPartial<T>): T  // Plain object → entity
private async reloadAndMark(id: string): Promise<T | null> // Smart loading + __typename
private extractIdFromCriteria(criteria: any): string | number | null // Flexible ID extraction
```

### 2. Entity Pattern (Single Decorator)

**80% less boilerplate** - One decorator replaces 5-7 decorators:

```typescript
@EntityObjectType("posts", {
  description: "Blog post",
  indexes: ["userId", "status", ["userId", "status"]], // Single + composite
})
export class Post extends BaseEntity {
  @FieldColumn(String, {
    description: "Post title",
    required: true,
    minLength: 1,
    maxLength: 255,
  })
  title!: string;

  @FieldColumn(String, {
    description: "Post content",
    required: true,
  })
  content!: string;

  @FieldColumnEnum(PostStatus, {
    description: "Post status",
    required: true,
    defaultValue: PostStatus.DRAFT,
  })
  status!: PostStatus;

  @FieldColumnEnum(PostTag, {
    description: "Post tags",
    array: true,
    required: false,
  })
  tags?: PostTag[];
}
```

**`@EntityObjectType`** combines: `@ObjectType` (GraphQL) + `@Entity` (TypeORM) + auto-indexing
**`@FieldColumn`** combines: `@Field` (GraphQL) + `@Column` (TypeORM) + validators
**`@FieldColumnEnum`** combines: `@Field` + `@Column` + enum registration + array handling

**Array Handling:**

- Use `array: true` for array fields (both string and enum arrays)
- SQLite: Arrays stored as JSON with ArrayTransformer
- PostgreSQL: Native array support with `array: true`

**Enum Arrays:**

```typescript
// Before (5 decorators)
@Field(() => [PostStatus!], { description: 'Post status' })
@Column({ type: 'text' })
@IsEnum(PostStatus)
@ArrayMinSize(1)
@ArrayMaxSize(10)
statuses!: PostStatus[];

// After (1 decorator)
@FieldColumnEnum(PostStatus, {
  description: 'Post status',
  array: true,
  minArraySize: 1,
  maxArraySize: 10
})
statuses!: PostStatus[];
```

**BaseEntity includes:**

- `id`: UUID (crypto-random)
- `createdAt`, `updatedAt`: Date
- `deletedAt`: Date | null (soft delete)
- `modelId`: str

**Entity extensions are minimal:**

```typescript
// Chat.ts - 41 lines total
@Entity("chats")
export class Chat extends ChatBase {
  async generateTitle(): Promise<{ title: string; description: string }> {
    // Custom business logic
  }

  @OneToMany(() => Message, (message) => message.chat)
  messages!: Message[];
}
```

**Pattern:** Most logic in generated base. Extensions only add:

- Custom relationships
- Computed properties
- Helper methods
- NO business logic (that lives in services)

### 3. Service Pattern (Static Methods)

**Real example: MessageService.ts (475 lines, well-organized)**

```typescript
export class MessageService {
  // No constructor - all static methods

  // Internal helpers (not exported)
  static validateAuth(ctx: GraphQLContext): string { ... }
  static log(prefix: string, message: string, ...args: any[]): void { ... }
  static getRepositories() { ... }

  // Public API
  static async createUserMessage(
    chatId: string,
    content: string,
    attachmentIds: string[] = [],
    logPrefix: string = 'MessageService'
  ): Promise<Message> { ... }

  static async createMessagePairAndStream(
    chatId: string,
    userMessageContent: string,
    options: MessageCreationOptions = {}
  ): Promise<MessageCreationResult> {
    // Composes smaller methods
    const chat = await this.validateChatForMessage(chatId);
    const userMessage = await this.createUserMessage(...);
    const assistantMessage = await this.createAssistantMessage(...);
    const jobEnqueued = await this.enqueueStreamJob(...);
    return { userMessage, assistantMessage, jobEnqueued };
  }
}
```

**Why this works:**

- No constructor complexity
- No instance state to manage
- Clear, composable functions
- Easy to test
- No DI framework needed

**Real example: ChatService.ts (162 lines, perfectly encapsulated)**

```typescript
interface ChatServiceOptions {
  chatId?: string;
  messageId?: string;
  messageVersionId?: string;
}

class ChatService {
  private chat: Chat | null = null;
  private opts: ChatServiceOptions;
  private dataSource: DataSource;

  constructor(opts: ChatServiceOptions) {
    this.dataSource = DataSourceProvider.get();
    this.opts = opts;
  }

  async getChat(): Promise<Chat> {
    if (this.chat) return this.chat;
    // Fetch and cache
    this.chat = await chatRepository.findOne({ ... });
    return this.chat;
  }

  async getMessage(messageId: string): Promise<Message | null> {
    const chat = await this.getChat();
    return chat.messages.find(msg => msg.id === messageId) || null;
  }

  async update<T>(object: T, fields: Partial<T>): Promise<T> {
    const repository = this.dataSource.getRepository(object.constructor.name);
    Object.assign(object, fields);
    return await repository.save(object);
  }
}
```

**What makes this readable:**

- Single clear constructor (1 parameter)
- Small methods (3-25 lines each)
- Clear data flow: constructor → getChat → other methods use cached data
- No business logic (just data fetching/caching)
- Clear separation: business logic lives in MessageService

### 4. Job System (Rails ActiveJob-Style)

**Database-driven queue (no Redis needed):**

```typescript
// Define job
@Job({
  name: 'EmailJob',
  schema: EmailSchema,     // Zod validation
  maxRetries: 3,
  backoff: 'exponential',
  timeoutMs: 30000
})
export class EmailJob extends BaseJob<EmailJobProps> {
  async perform(props: EmailJobProps): Promise<any> {
    await sendEmail(props.to, props.subject, props.body);
    return { sent: true };
  }
}

// Enqueue job
await EmailJob.performLater(
  'user-123',              // userId
  'email-456',             // targetId
  { to: 'user@example.com', subject: 'Welcome!', body: '...' },
  { priority: 'high' }     // options
);

// Schedule for later
await EmailJob.performAt(
  new Date(Date.now() + 3600000),  // 1 hour from now
  'user-123',
  'email-456',
  { ... }
);

// Execute immediately
await EmailJob.performNow('user-123', 'email-456', { ... });
```

**Backoff strategies:** `exponential`, `linear`, `fixed`

### 5. Type-Safe IPC Bridge

```typescript
// 1. Define handler in main/handlers/
export const customHandlers = {
  "custom:doSomething": async (args: { id: string }) => {
    return { success: true };
  },
};

// 2. Register in main/handlers/registry.ts
export const handlers = {
  ...graphqlHandlers,
  ...customHandlers,
} as const;

// 3. Use in renderer (automatically typed!)
const result = await window.electron["custom:doSomething"]({ id: "123" });
```

### 6. React Component Pattern

**Component size distribution:**

- Small reusable: 25-90 lines (MessageVersionView, LLMModelSelect, CodeBlock)
- Medium pages: 150-200 lines (ChatNodePage, MessageList)
- Complex forms: 250-300 lines (UnifiedMessageInput)

**MessageList.tsx structure (191 lines):**

```typescript
// 1. Fragment definition
const fragment = graphql`...`;

// 2. Helper functions
const getStatusIcon = (status: string) => { ... };
const formatContent = (content: string) => { ... };

// 3. Sub-components extracted
const UserMessageView = ({ message }) => { ... };
const AssistantMessageView = ({ message }) => { ... };

// 4. Main component
export default function MessageList({ chatId }) {
  const data = useFragment(fragment, chatId);
  // Scrolling logic, rendering
  return <div>...</div>;
}
```

**Pattern:**

- Extract sub-components at 100+ lines
- Helper functions above component
- Single responsibility per component
- No component exceeds 300 lines

## Creating New Features

### Add an Entity

```bash
# 1. Generate entity
yarn g entity Post title:string content:text authorId:uuid

# Creates:
# - main/db/entities/Post.ts (with @EntityObjectType + @FieldColumn)
# - main/graphql/inputs/PostInput.ts
# - Updates dataSource.ts

# 2. Generate schema
yarn graphql

# 3. Write tests & run
yarn test

# 4. Type check
yarn type-check
```

### Field Types

**Basic Types:**

- `string` → VARCHAR
- `text` → TEXT
- `number` → INTEGER
- `boolean` → BOOLEAN
- `date` → DATETIME
- `uuid` → UUID
- `enum` → ENUM
- `json` → JSON

**Array Types:**

- `array: true` with any basic type → JSON (SQLite) / Array (PostgreSQL)
- Enum arrays: `@FieldColumnEnum(MyEnum, { array: true })`
- String arrays: `@FieldColumn(String, { array: true })`

**Decorator Examples:**

```typescript
// Basic fields
@FieldColumn(String, { description: 'Name', required: true })
name!: string;

@FieldColumn(Number, { description: 'Age', min: 0, max: 120 })
age!: number;

// Enum field
@FieldColumnEnum(Status, { description: 'Status', defaultValue: Status.ACTIVE })
status!: Status;

// Enum array
@FieldColumnEnum(Tag, { description: 'Tags', array: true, required: false })
tags?: Tag[];

// JSON field with schema
@FieldColumnJSON(MetadataSchema, { description: 'User metadata', required: false })
metadata?: UserMetadata;
```

## Testing

```bash
yarn test                # Run all tests
yarn test:watch          # Watch mode
yarn test:record         # Record new HTTP fixtures
yarn test:debug          # Debug Polly.js VCR
```

**Test patterns:**

```typescript
// 1. Factories
import { createUser } from "@factories/user";
const user = await createUser({ name: "Alice" });

// 2. GraphQL testing
import { executeGraphQL } from "@tests/helpers";
const result = await executeGraphQL({ query, variables });

// 3. HTTP mocking
import { setupPolly } from "setup-polly-jest";
setupPolly(); // Records HTTP to __tests__/recordings/
```

## Common Patterns

### Authentication

```typescript
// Backend
@Resolver()
export class UserResolver extends BaseResolver {
  @Authorized() // Requires auth
  @Query(() => User)
  async me(@Ctx() ctx: GraphQLContext): Promise<User> {
    return ctx.user!;
  }
}

// Frontend
const { user, login, logout } = useAuth();
```

### Soft Delete

```typescript
await userRepository.softRemove(user); // Sets deletedAt
await userRepository.recover(user); // Clears deletedAt
const users = await userRepository.find(); // Auto-filters deletedAt IS NULL
```

## Configuration

**Path Aliases:** `@ui/*`, `@main/*`, `@shared/*`, `@base/*`, `@db/*`, `@graphql/*`

**TypeScript:** ES2020, ESNext, strict mode, experimental decorators
**Vite:** React, Relay, Tailwind, Electron plugins
**Vitest:** jsdom environment, 30s timeout, sequential mode

## Important Notes

### Gotchas

1. **Type checking:** Use `yarn type-check`, NOT `yarn build` (which packages the entire app)
2. **Reflect-metadata:** Must be first import in `main/index.ts`
3. **Preload script:** Vite outputs `.mjs`, but Electron needs `.cjs` (auto-copied)
4. **Database sync:** Auto-sync in test mode only (`NODE_ENV=test`)
5. **Relay:** Must run `yarn graphql` before `yarn dev`

### Security

- **IPC:** Context isolation enabled, node integration disabled
- **SQL:** TypeORM auto-escapes parameters (never use string interpolation)
- **Sensitive fields:** Use plain `@Column({ select: false })` to exclude from GraphQL

## Key Files

```
main/index.ts                  # App entry point
main/preload.ts                # IPC bridge
main/handlers/registry.ts      # IPC handlers (single source of truth)
main/db/dataSource.ts          # Database config
main/graphql/server.ts         # GraphQL server
main/services/ChatService.ts   # Example: Perfect encapsulation (162 lines)
main/services/MessageService.ts # Example: Static methods pattern (475 lines)
main/base/graphql/decorators/  # @EntityObjectType, @FieldColumn
main/base/jobs/                # BaseJob, @Job decorator
ui/index.tsx                   # React entry
ui/App/index.tsx               # App wrapper
```

## Resources

**Internal Docs:**

- [CONSOLE.md](./CONSOLE.md) - Interactive console guide (REPL, factories, utilities)
- [/cli/README.md](/cli/README.md) - Code generation CLI
- [/cli/GENERATOR.md](/cli/GENERATOR.md) - Generator details

**External Docs:**

- [Electron](https://www.electronjs.org/docs) | [TypeORM](https://typeorm.io/) | [Type-GraphQL](https://typegraphql.com/)
- [Relay](https://relay.dev/) | [Vite](https://vitejs.dev/) | [Vitest](https://vitest.dev/)

## Anti-Patterns to Avoid

### ❌ Over-Parameterization

```typescript
// BAD
function createMessage(
  chatId,
  content,
  role,
  userId,
  llmModelId,
  priority,
  timeout,
  attachments
) {}

// GOOD
function createMessage(
  chatId: string,
  content: string,
  options: MessageOptions
) {}
```

### ❌ Complex Constructors with DI

```typescript
// BAD - 6+ dependencies
constructor(
  private messageRepo: Repository<Message>,
  private chatRepo: Repository<Chat>,
  private versionRepo: Repository<MessageVersion>,
  private fileRepo: Repository<File>,
  private jobQueue: JobQueue,
  private logger: Logger
) {}

// GOOD - 0-2 parameters
constructor(opts: ServiceOptions) {
  this.dataSource = DataSourceProvider.get();
  this.opts = opts;
}
```

### ❌ God Classes

Every file in this codebase has a clear boundary. Even large files (JobQueue: 541 lines, MessageService: 475 lines) have ONE clear purpose.

### ❌ Deep Nesting

```typescript
// BAD
if (condition1) {
  if (condition2) {
    if (condition3) {
      // deeply nested logic
    }
  }
}

// GOOD - early returns
if (!condition1) return <ErrorState />;
if (!condition2) return <LoadingState />;
if (!condition3) return <EmptyState />;
return <MainContent />;
```

## Contributing

When adding features:

1. ✅ Study 2-3 similar implementations first
2. ✅ Keep files under 300 lines
3. ✅ Max 5 parameters per function/constructor
4. ✅ Max 5 exports per file
5. ✅ Write tests first (TDD)
6. ✅ Update schema with `yarn graphql`
7. ✅ Type check with `yarn type-check`
8. ✅ Run tests with `yarn test`
9. ✅ Update CLAUDE.md if adding patterns

## Refactor Guidelines (repository-specific)

Follow the project's refactor rules for readable, DRY, encapsulated code. The full guidelines live at `.claude/skills/refactor.md`; key rules for an AI agent to enforce or follow are:

- **Maximum 5 parameters (ever):** prefer an options object (`opts`) when you need 3+ params.
- **Constructors: max 2 parameters:** use an `opts` object for clarity and extensibility.
- **Prefer small helper methods:** extract repeated logic into helpers (<20 lines) to remove friction.
- **Static vs instance:** Use static methods for stateless utilities (MessageService pattern); use instances for state/caching (ChatService pattern).
- **Max 5 exports per file & small files:** keep files ~100–200 lines; avoid >300 lines unless justified.
- **Convenience getters:** centralize repository access (e.g., `getRepositories()`) to keep code DRY.
- **Encapsulation:** hide internals behind a small public API; avoid exposing repositories or caches directly.

When making automated edits, prefer the `opts` pattern and small, focused changes. See `.claude/skills/refactor.md` for examples and the full checklist the team follows.

---

**Philosophy:** "Do the simplest thing that works, then stop." - No premature abstractions, no over-engineering, no "architecture" for its own sake.
