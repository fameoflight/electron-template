# LLM Chat Electron Template - Meta-Programming for the Win

> **TL;DR:** Electron + React + GraphQL (Relay) + SQLite template that eliminates 80% of boilerplate through TypeScript decorators and code generation. Built for web developers who love meta-programming.

## Why I Built This

I **love meta-programming**. TypeScript decorators + code generation = shipping faster by writing less.

**One decorator replaces 5-7:**
```typescript
// Before: 15+ lines of decorators
// After: 3 lines
@EntityObjectType("messages")
export class Message extends BaseEntity {
  @FieldColumn(String, { required: true, maxLength: 500 })
  content!: string;
}
```

**One command generates full CRUD:**
```bash
yarn g entity Post title:string content:text
# ✅ Entity with TypeORM + GraphQL decorators
# ✅ GraphQL input types (Create/Update)
# ✅ GraphQL resolvers with CRUD operations
# ✅ Relay connections
# ✅ Validation rules
```

## The IPC "Penalty" Is Actually Good

Yes, there's overhead in communicating between Electron's main/renderer processes. **But it forces clear boundaries:**

```
React + Relay (UI) ←→ [IPC Bridge] ←→ GraphQL + SQLite (Data)
```

**Benefits:**
- UI can't directly touch database (architectural enforcement)
- Better testing (mock IPC, test layers independently)
- Process isolation (renderer crash doesn't kill data)
- It's just GraphQL queries - familiar to web devs

## Stack

**Core:** Electron 39 • React 18 • TypeScript 5.9 • Vite 7 • SQLite + TypeORM

**GraphQL:** Type-GraphQL 2.0 • Apollo Server 5 • Relay 20

**UI:** Tailwind v4 • Ant Design 5 • Framer Motion 12

**Code Gen:** Custom generators + decorators + TypeORM subscribers

## Key Features

### 🎯 Meta-Programming Goodness

- **Unified decorators** - `@EntityObjectType` combines 7 decorators into 1
- **Code generation** - Full CRUD from one command
- **Smart loading** - TypeORM subscribers eliminate N+1 queries transparently
- **Auto schema generation** - TypeScript classes → GraphQL schema automatically

### 🚀 For Web Developers

If you know **React + GraphQL**, you already know this:

```typescript
// Familiar Relay queries
const data = useLazyLoadQuery(graphql`
  query ChatQuery($chatId: ID!) {
    chat(id: $chatId) {
      messages { content }
    }
  }
`, { chatId });

// IPC is just another API
const chat = await window.electron['chat:create']({ title: 'New' });
```

### ⚡️ Production Features

- **Job system** (Rails ActiveJob style) - Background processing with retries
- **Soft deletes** - Recover deleted data easily
- **Message versioning** - Full chat history with regeneration
- **File attachments** - Upload and reference files
- **Smart relations** - Transparent lazy loading with caching
- **Migrations** - Database versioning from day one

## Code Generation Example

```bash
# Generate entity
yarn g entity BlogPost title:string content:text published:boolean

# Generates:
# ✅ main/db/entities/BlogPost.ts          (Entity with decorators)
# ✅ main/graphql/inputs/BlogPostInputs.ts (Create/Update inputs)
# ✅ main/graphql/resolvers/BlogPostResolver.ts (CRUD operations)

# Generate schema + compile Relay
yarn graphql

# Start dev server
yarn dev
```

## The Magic: Smart Loading

**No more N+1 queries or manual `relations: []` everywhere:**

```typescript
const message = await messageRepo.findOne({ where: { id } });

// Relations load transparently when accessed
const chat = await message.chat;        // Loads on-demand
const versions = await message.versions; // Loads on-demand

// Subsequent access is synchronous (cached!)
console.log(message.chat);     // No DB query
console.log(message.versions); // Already loaded
```

**How?** TypeORM EventSubscriber + Object.defineProperty + smart getters. See [SOFT_DELETE.md](./SOFT_DELETE.md).

## Why These Choices?

**SQLite** - Zero setup, fast, portable, Electron-friendly
**Relay** - Fragment colocation, smart caching, pagination built-in
**TypeORM** - Decorator-based, fits our meta-programming style
**IPC Bridge** - Clear boundaries = better structure (yes, even with overhead)
**Code Generation** - Write less, ship faster

## LLM Chat Implementation

Includes a real LLM chat with:
- Streaming responses (job queue)
- Message versioning & regeneration
- File attachments
- Chat history with SQLite
- Multiple LLM providers

## Philosophy

**Boring over clever** - But aggressively eliminate boilerplate through:
- Decorators (merge 5-7 into 1)
- Code generation (full CRUD from one command)
- Smart loading (TypeORM subscribers)
- Type generation (GraphQL → TypeScript)

**Result:** 80% less code, same functionality.

**Target:** Web developers who want desktop apps without Electron expertise.

## Quick Start

```bash
yarn install              # Install
yarn db:seed              # Seed database
yarn dev                  # Start dev server
yarn g entity Post title:string content:text  # Generate entity
yarn graphql              # Generate schema + Relay
yarn test                 # Run tests
```

## Example: The Decorator Magic

**Traditional approach (15 lines):**
```typescript
@ObjectType()
@Entity('messages')
export class Message {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => String)
  @Column({ type: 'varchar', length: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  content: string;
}
```

**Our approach (5 lines):**
```typescript
@EntityObjectType('messages')
export class Message extends BaseEntity {
  @FieldColumn(String, { required: true, maxLength: 500 })
  content!: string;
}
```

Same functionality. 67% less code. Better readability.

## Documentation

- **[README.md](./README.md)** - Full guide (this summary is for forums)
- **[AGENT.md](./AGENT.md)** - Architecture deep dive
- **[CONSOLE.md](./CONSOLE.md)** - Interactive REPL guide
- **[SOFT_DELETE.md](./SOFT_DELETE.md)** - Smart loading explained
- **[cli/](./cli/)** - Code generation docs

## Who Is This For?

✅ Web developers who want to build desktop apps
✅ Developers who love meta-programming
✅ Teams who value clear boundaries and testability
✅ Anyone tired of boilerplate

❌ Not for you if you hate "magic" (though it's documented magic!)

## License

MIT - Fork it, make it yours, ship something awesome!

---

**Built with ❤️ for developers who appreciate the power of meta-programming.**

TypeScript decorators + code generation + smart subscribers = **focus on uniqueness, not boilerplate**.

The IPC overhead is worth it for the architectural benefits. The decorator system eliminates repetition without hiding complexity. The code generation creates proper patterns, not quick hacks.

**Repository:** https://github.com/fameoflight/electron-template

**Questions? Issues? PRs welcome!**
