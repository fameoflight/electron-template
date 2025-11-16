# LLM Chat Electron Template

> **Batteries-included Electron template that eliminates boilerplate through meta-programming, letting you focus on what makes your app unique.**

A production-ready Electron template featuring React, TypeORM, GraphQL (Relay), and a powerful code generation system. Built for developers who love meta-programming and want to ship desktop apps fast.

## Why This Template?

### 🎯 Focus on Uniqueness, Not Boilerplate

**Meta-programming at its core:** TypeScript decorators + code generation = 80% less boilerplate.

```typescript
// Single decorator replaces 5-7 decorators
@EntityObjectType("messages", { description: "Chat message" })
export class Message extends BaseEntity {
  @FieldColumn(String, { description: "Content", required: true })
  content!: string;

  @FieldColumnEnum(MessageRole, { description: "Role" })
  role!: MessageRole;
}

// Auto-generates:
// ✅ TypeORM entity with columns
// ✅ GraphQL type with fields
// ✅ GraphQL input types (Create/Update)
// ✅ GraphQL resolvers with CRUD
// ✅ Relay connections
// ✅ Validation decorators
```

**Code generation that actually works:**

- `yarn g entity Post title:string content:text` → Full CRUD in seconds
- `yarn graphql` → Schema + Relay compiler + type safety
- Migrations, resolvers, services - all generated with proper patterns

### 🏗️ Clear Boundaries, Better Structure

**The IPC "penalty" is actually a feature:**

```
┌─────────────────────────────────┐
│  React + Relay (Renderer)      │ ← Type-safe UI layer
└────────────┬────────────────────┘
             │ IPC Bridge (typed)
┌────────────┴────────────────────┐
│  GraphQL + SQLite (Main)       │ ← Business logic + data
└─────────────────────────────────┘
```

**Benefits:**

- **Forces separation** - UI can't directly touch database (good!)
- **Type-safe boundaries** - IPC handlers automatically typed
- **Process isolation** - Renderer crash doesn't kill your data
- **Testing made easy** - Mock IPC, test main process independently
- **Web dev friendly** - It's just GraphQL queries, like any web app

### 🚀 Built for Web Developers

If you know **React + GraphQL**, you already know 90% of this:

```typescript
// Familiar GraphQL queries with Relay
const data = useLazyLoadQuery(
  graphql`
    query ChatQuery($chatId: ID!) {
      chat(id: $chatId) {
        title
        messages {
          content
          role
        }
      }
    }
  `,
  { chatId }
);

// IPC is just another API endpoint
const result = await window.electron["chat:create"]({
  title: "New Chat",
});
```

**No Electron expertise required:**

- Standard React patterns (hooks, components, Suspense)
- Standard GraphQL patterns (fragments, connections, mutations)
- Standard database patterns (TypeORM entities, migrations)

### ⚡️ Real Features, Not Toy Examples

**LLM Chat Implementation:**

- Streaming responses with job queue
- Message versioning and regeneration
- File attachments
- Chat history with SQLite
- Background jobs for AI processing

**Production Infrastructure:**

- Smart relationship loading (transparent N+1 prevention)
- Soft deletes with recovery
- Database migrations
- Job system (Rails ActiveJob style)
- Testing with Vitest + Polly.js (HTTP mocking)
- Type-safe IPC bridge

## Stack

**Core:**

- Electron 39 - Desktop app framework
- React 18 - UI with hooks & Suspense
- TypeScript 5.9 - Full type safety
- Vite 7 - Lightning-fast dev server
- SQLite + TypeORM - Local database

**GraphQL:**

- Type-GraphQL 2.0 - Schema from TypeScript classes
- Apollo Server 5 - GraphQL server in main process
- Relay 20 - Powerful GraphQL client with fragments

**UI & Styling:**

- Tailwind CSS v4 - Utility-first styling
- Ant Design 5 - Rich component library
- Framer Motion 12 - Smooth animations

**Testing:**

- Vitest 4 - Fast unit tests
- Testing Library 16 - Component tests
- Polly.js 6 - HTTP request/response recording

## Quick Start

```bash
# Install dependencies
yarn install

# Seed database with example data
yarn db:seed

# Start development server
yarn dev

# Generate a new entity with full CRUD
yarn g entity Post title:string content:text published:boolean

# Generate GraphQL schema + Relay artifacts
yarn graphql

# Type check (use this, NOT yarn build)
yarn type-check

# Run tests
yarn test
```

## Code Generation System

### The Magic: One Command → Full Stack

```bash
yarn g entity BlogPost title:string content:text authorId:uuid published:boolean
```

**Generates:**

1. **Entity** (`main/db/entities/BlogPost.ts`)

   - TypeORM decorators
   - GraphQL field decorators
   - Validation rules
   - Relationships

2. **GraphQL Inputs** (`main/graphql/inputs/BlogPostInputs.ts`)

   - CreateBlogPostInput (required fields)
   - UpdateBlogPostInput (optional fields)
   - Validation decorators

3. **Resolvers** (`main/graphql/resolvers/BlogPostResolver.ts`)

   - CRUD operations (create, read, update, delete)
   - Relay connections
   - Ownership checks
   - Field resolvers

4. **Migrations** (optional)
   - Database schema changes
   - Up/down migrations
   - Type-safe

### Decorator System: Eliminate Repetition

**Before (Traditional):**

```typescript
@ObjectType()
@Entity("posts")
export class Post {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Field(() => String)
  @Column({ type: "varchar", length: 255 })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;
}
```

**After (Our Decorators):**

```typescript
@EntityObjectType("posts")
export class Post extends BaseEntity {
  @FieldColumn(String, {
    required: true,
    maxLength: 255,
  })
  title!: string;
}
```

**Result:** 80% less code, same functionality, better readability.

## Smart Features That Save Time

### 1. Transparent Relationship Loading

**No more N+1 queries or manual `relations: []` everywhere:**

```typescript
// Automatic lazy loading with caching
const message = await messageRepo.findOne({ where: { id } });

// Relations load transparently when accessed
const chat = await message.chat; // Loads on-demand
const versions = await message.versions; // Loads on-demand

// Subsequent access is synchronous (cached)
console.log(message.chat); // No DB query!
console.log(message.versions); // Already loaded!
```

**How it works:** TypeORM EventSubscriber + Object.defineProperty magic. See `SOFT_DELETE.md` for details.

### 2. Job System (Rails ActiveJob Style)

**Background processing made simple:**

```typescript
@Job({
  name: "ProcessChatJob",
  schema: ChatSchema,
  maxRetries: 3,
  backoff: "exponential",
})
export class ProcessChatJob extends BaseJob<ChatProps> {
  async perform(props: ChatProps): Promise<any> {
    // Your async work here
    await streamLLMResponse(props.prompt);
  }
}

// Enqueue for later
await ProcessChatJob.performLater(userId, chatId, { prompt });

// Schedule for specific time
await ProcessChatJob.performAt(tomorrow, userId, chatId, { prompt });
```

### 3. Type-Safe IPC Bridge

**Define once, use everywhere with full types:**

```typescript
// main/handlers/chatHandlers.ts
export const chatHandlers = {
  "chat:create": async (args: { title: string }) => {
    return await chatRepo.save({ title: args.title });
  },
};

// ui/Pages/ChatPage.tsx - Automatically typed!
const chat = await window.electron["chat:create"]({ title: "New Chat" });
//                                                   ^^^^^ TypeScript knows this!
```

### 4. GraphQL Schema Generation

**TypeScript → GraphQL automatically:**

```bash
yarn graphql
```

1. Scans TypeORM entities
2. Generates GraphQL schema (schema.graphql)
3. Runs Relay compiler
4. Updates TypeScript types
5. Everything stays in sync

## Project Structure

```
electron-template/
├── main/                      # Electron main process
│   ├── db/
│   │   ├── entities/          # TypeORM entities (40-100 lines each)
│   │   ├── migrations/        # Database migrations
│   │   └── dataSource.ts      # Database configuration
│   ├── graphql/
│   │   ├── resolvers/         # GraphQL resolvers (88-203 lines)
│   │   ├── inputs/            # GraphQL input types
│   │   └── server.ts          # Apollo Server setup
│   ├── handlers/
│   │   └── registry.ts        # IPC handlers (single source of truth)
│   ├── services/              # Business logic (94-541 lines, avg ~200)
│   ├── jobs/                  # Background jobs
│   │   └── README.md          # Job system documentation
│   └── base/                  # Shared infrastructure
│       ├── decorators/        # @EntityObjectType, @FieldColumn, etc.
│       ├── jobs/              # BaseJob, @Job decorator
│       └── db/                # CustomRepository, SmartLoadingSubscriber
│
├── ui/                        # React renderer process
│   ├── Pages/                 # Page components (47-293 lines)
│   ├── Components/            # Reusable components (25-90 lines)
│   ├── hooks/                 # Custom React hooks
│   └── relay/                 # Relay environment
│
├── shared/                    # Shared code (main + renderer)
│   └── types/                 # Shared TypeScript types
│
├── cli/                       # Code generators
│   ├── generators/            # Entity, Resolver, Input generators
│   ├── commands/              # CLI commands
│   ├── templates/             # Handlebars templates
│   ├── ENTITY_GENERATOR.md    # Entity generator docs
│   └── README.md              # CLI documentation
│
├── __tests__/                 # Test suite
│   ├── graphql/               # GraphQL tests
│   ├── jobs/                  # Job system tests
│   └── recordings/            # Polly.js HTTP fixtures
│
├── AGENT.md (CLAUDE.md)       # Main architecture guide
├── CONSOLE.md                 # Interactive REPL guide
├── SOFT_DELETE.md             # Soft delete + smart relations
└── README.md                  # This file
```

## Philosophy: Boring Over Clever

**We aggressively eliminate boilerplate, not abstraction.**

### ❌ Bad: Complex Abstractions

```typescript
constructor(
  private messageRepo: Repository<Message>,
  private chatRepo: Repository<Chat>,
  private versionRepo: Repository<MessageVersion>,
  private fileRepo: Repository<File>,
  private jobQueue: JobQueue,
  private logger: Logger
) {}
```

### ✅ Good: Simple Static Methods

```typescript
export class MessageService {
  static async createMessage(chatId: string, content: string) {
    const repo = DataSourceProvider.get().getRepository(Message);
    return await repo.save({ chatId, content });
  }
}
```

**Principles:**

1. **Small files** (100-200 lines, max 300)
2. **Max 5 parameters** per function/constructor
3. **Max 5 exports** per file
4. **No DI frameworks** - Static methods or simple constructors
5. **Decorators eliminate repetition** - But remain readable

## Common Commands

```bash
# Development
yarn dev              # Start Vite + Electron + Relay compiler
yarn fresh            # Clean + install + seed + dev (complete fresh start)
yarn console          # Interactive REPL with full app context
yarn type-check       # Type check (use this, NOT yarn build)
yarn check            # Run type-check + lint + test (pre-commit)

# Code Generation
yarn g entity Post title:string content:text    # Generate entity
yarn graphql                                     # Generate schema + compile Relay

# Database
yarn db:seed          # Seed database
yarn db:reset         # Delete data and re-seed
yarn db:stats         # Show table record counts
yarn db:inspect User  # Inspect entity schema

# Testing
yarn test             # Run all tests
yarn test:watch       # Run tests in watch mode
yarn test:record      # Record new HTTP fixtures

# Build & Deploy
yarn build            # Production build
```

## Key Features

### For Productivity

- 🎨 **Code Generation** - Full CRUD stack from one command
- 🔄 **Auto Schema Generation** - TypeScript → GraphQL automatically
- 🎯 **Unified Decorators** - One decorator replaces 5-7
- 🚀 **Type-Safe IPC** - No manual type definitions
- ✨ **Smart Relations** - Transparent relationship loading
- 🔧 **Interactive Console** - REPL with full app context

### For Quality

- 📝 **Full Type Safety** - TypeScript everywhere
- 🧪 **Testing Built-In** - Vitest + Testing Library + Polly.js
- 🗃️ **Migrations** - Database versioning from day one
- 🔒 **Soft Deletes** - Recover deleted data easily
- 📊 **GraphQL Validation** - Runtime + compile-time checks
- 🎭 **HTTP Mocking** - Record/replay with Polly.js

### For Scale

- 🔁 **Job System** - Background processing with retries
- 📦 **Relay Integration** - Efficient GraphQL with fragments
- 🎯 **Connection Pattern** - Pagination built-in
- 🗄️ **SQLite** - Fast local database, easy deployment
- 🏗️ **Process Isolation** - Main/renderer separation
- 📈 **N+1 Prevention** - Smart loading + caching

## Why These Choices?

### SQLite Over PostgreSQL

- **Zero setup** - No database server to run
- **Fast** - Local file, no network latency
- **Portable** - Single file, easy backups
- **Electron-friendly** - Embedded in app bundle
- **Production-ready** - Used by many desktop apps

### Relay Over Apollo Client

- **Fragment colocation** - Components declare their data needs
- **Automatic caching** - Smart normalization
- **Pagination built-in** - Connections are first-class
- **Optimistic updates** - Better UX
- **Type generation** - Full type safety

### TypeORM Over Prisma

- **Decorator-based** - Fits our meta-programming style
- **Active Record pattern** - Simple, intuitive
- **Migration support** - Version your schema
- **Subscribers** - Event hooks for smart loading
- **Mature** - Battle-tested

### IPC Bridge Design

**Yes, there's overhead** - But the benefits outweigh the cost:

- **Clear boundaries** - Renderer can't mess with database
- **Better testing** - Mock IPC, test layers independently
- **Process isolation** - Crashes contained
- **Security** - Renderer is untrusted, main is trusted
- **Familiar pattern** - Just like calling an API

## LLM Chat Features

This template includes a real LLM chat implementation:

- **Streaming responses** - Job queue handles async processing
- **Message versioning** - Regenerate/edit responses
- **File attachments** - Upload and reference files
- **Chat history** - SQLite storage with full-text search
- **Multiple models** - Support different LLM providers
- **Background jobs** - Process AI requests asynchronously

See the chat entities and services for implementation details.

## Documentation

- **[AGENT.md](./AGENT.md)** - Complete architecture guide (25KB)
- **[CONSOLE.md](./CONSOLE.md)** - Interactive REPL guide (11KB)
- **[SOFT_DELETE.md](./SOFT_DELETE.md)** - Soft delete + smart relations (18KB)
- **[cli/README.md](./cli/README.md)** - Code generation CLI guide
- **[cli/ENTITY_GENERATOR.md](./cli/ENTITY_GENERATOR.md)** - Entity generator details
- **[main/jobs/README.md](./main/jobs/README.md)** - Job system guide

## Testing

```bash
yarn test                # Run all tests
yarn test:watch          # Watch mode
yarn test:record         # Record new HTTP fixtures with Polly.js
```

**Test patterns included:**

- GraphQL query/mutation testing
- Job system testing with mocks
- HTTP recording/replay with Polly.js
- Factory patterns for test data
- Repository testing with in-memory DB

## Contributing

This is a template - fork it and make it yours!

**When adding features:**

1. Keep files under 300 lines
2. Max 5 parameters per function
3. Use decorators to eliminate boilerplate
4. Write tests
5. Update documentation

## License

MIT - Use this however you want!

---

## Meta-Programming Love ❤️

This template exists because **I love meta-programming.**

TypeScript decorators + code generation = shipping faster by writing less.

When you combine:

- **Decorators** that merge 5-7 decorators into one
- **Code generators** that create full CRUD stacks
- **Smart loading** via TypeORM subscribers
- **Type generation** from GraphQL schemas

You get **80% less boilerplate** and can focus on what makes your app unique.

The IPC "penalty" forces clear boundaries, making your codebase more testable and maintainable. The SQLite choice means zero setup. The Relay integration gives you fragment colocation and automatic caching.

Everything is designed to **remove friction** so you can **build features fast**.

**Built for web developers who want to ship desktop apps without learning Electron internals.**

---

**Questions?** Check the docs or open an issue.

**Want to contribute?** PRs welcome!

**Building something cool?** I'd love to hear about it!
