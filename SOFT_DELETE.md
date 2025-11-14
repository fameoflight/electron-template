# Soft Delete & Smart Relations Loading

> Comprehensive guide to soft delete functionality and transparent relationship loading via TypeORM subscribers

## Table of Contents

1. [Soft Delete System](#soft-delete-system)
2. [Smart Loading Subscriber](#smart-loading-subscriber)
3. [How Smart Relations Work](#how-smart-relations-work)
4. [CustomRepository Integration](#customrepository-integration)
5. [Usage Examples](#usage-examples)
6. [Advanced Patterns](#advanced-patterns)

---

## Soft Delete System

### Overview

All entities inherit from `BaseEntity` which includes a `deletedAt` field for soft deletes:

```typescript
// main/base/db/BaseEntity.ts
@DeleteDateColumn({ nullable: true })
@Field(() => GraphQLISODateTime, { nullable: true })
deletedAt?: Date;
```

### Key Features

✅ **TypeORM Native** - Uses `@DeleteDateColumn()` decorator
✅ **Automatic Filtering** - Soft-deleted records excluded by default
✅ **Easy Recovery** - Simple `recover()` method to restore
✅ **GraphQL Exposed** - `deletedAt` available in GraphQL schema
✅ **Cascade Support** - Can cascade soft deletes to relations

### Basic Operations

```typescript
// Soft delete
await repository.softDeleteById(userId);
await repository.softDelete({ email: 'user@example.com' });

// Recover
await repository.recoverById(userId);
await repository.recover(userEntity);

// Hard delete (permanent)
await repository.hardDeleteById(userId);
await repository.delete({ id: userId });

// Query including soft-deleted
await repository.findOne({
  where: { id: userId },
  withDeleted: true
});
```

---

## Smart Loading Subscriber

### What is it?

`SmartLoadingSubscriber` is a **TypeORM EntitySubscriber** that automatically makes entity relationships work transparently without needing to specify `relations: [...]` in every query.

**Location:** `main/base/db/subscribers/SmartLoadingSubscriber.ts`

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  1. TypeORM loads entity from database                      │
│     ↓                                                        │
│  2. afterLoad() hook fires (SmartLoadingSubscriber)         │
│     ↓                                                        │
│  3. Auto-detect all relationships from TypeORM metadata     │
│     ↓                                                        │
│  4. Replace each relation property with a smart getter      │
│     ↓                                                        │
│  5. Smart getter behavior:                                  │
│     • Returns already-loaded data (synchronous)             │
│     • Returns cached data if previously loaded (sync)       │
│     • Returns Promise that loads on-demand (only if needed) │
│     ↓                                                        │
│  6. Entity passed to TypeGraphQL with smart getters ready   │
└─────────────────────────────────────────────────────────────┘
```

### Core Implementation

```typescript
@EventSubscriber()
export class SmartLoadingSubscriber implements EntitySubscriberInterface<BaseEntity> {
  /**
   * Listen to all entities that extend BaseEntity
   */
  listenTo() {
    return BaseEntity;
  }

  /**
   * Called after an entity is loaded from the database
   * This is where we attach smart relationship getters
   */
  afterLoad(entity: BaseEntity, event?: LoadEvent<BaseEntity>) {
    this.attachSmartGetters(entity);
  }

  /**
   * Also called after insert/update to ensure smart getters are attached
   */
  afterInsert(event: any) {
    const entity = event.entity as BaseEntity;
    this.attachSmartGetters(entity);
  }

  afterUpdate(event: any) {
    const entity = event.entity as BaseEntity;
    if (!entity) return;
    this.attachSmartGetters(entity);
  }
}
```

---

## How Smart Relations Work

### The Magic Getter

When you access a relationship property (like `message.versions`), here's what happens:

```typescript
private attachSmartGetter(entity: any, relationName: string) {
  // Store original value if TypeORM already loaded this relation
  const descriptor = Object.getOwnPropertyDescriptor(entity, relationName);
  const originalValue = descriptor?.value;

  // Cache keys
  const cacheKey = `__loaded_${relationName}`;
  const promiseKey = `__promise_${relationName}`;

  // Replace property with smart getter
  Object.defineProperty(entity, relationName, {
    get() {
      // 1. Already loaded by TypeORM? Return synchronously ✅
      if (originalValue !== undefined) {
        return originalValue;
      }

      // 2. Already cached? Return synchronously ✅
      if (this[cacheKey] !== undefined) {
        return this[cacheKey];
      }

      // 3. Pending promise? Return it (avoid duplicate loads) ✅
      if (this[promiseKey]) {
        return this[promiseKey];
      }

      // 4. Load on-demand and cache ✅
      this[promiseKey] = loadRelation(this, relationName).then(result => {
        this[cacheKey] = result;  // Cache for future access
        delete this[promiseKey];  // Clear promise
        return result;
      });

      return this[promiseKey];
    },
    enumerable: true,
    configurable: true
  });
}
```

### Three Loading Strategies

#### Strategy 1: Eager Loading (Best Performance)

```typescript
// TypeORM loads relation upfront
const message = await repository.findOne({
  where: { id: messageId },
  relations: ['versions']  // ← Explicitly load
});

// Access is SYNCHRONOUS (already loaded)
console.log(message.versions);  // ✅ Array of versions immediately
```

#### Strategy 2: Cached Loading

```typescript
// First access triggers load
const message = await repository.findOne({ where: { id: messageId } });

const versions = await message.versions;  // ← Loads from DB, caches result
console.log(versions);  // Array of versions

// Subsequent accesses are SYNCHRONOUS (cached)
console.log(message.versions);  // ✅ Same array, no DB query
```

#### Strategy 3: On-Demand Loading

```typescript
// Access only when needed
const message = await repository.findOne({ where: { id: messageId } });

// No access = no query!
// Only loads if you actually use it
if (needVersions) {
  const versions = await message.versions;  // ← Only loads if condition is true
}
```

---

## CustomRepository Integration

### Automatic Smart Loading

`CustomRepository` ensures **every save/update triggers smart loading** by reloading the entity:

```typescript
async save<Entity extends DeepPartial<T>>(entity: Entity): Promise<Entity> {
  // Save entity
  const saved = await this.repository.save(entity as any);

  // ⚡️ CRITICAL: Reload to trigger SmartLoadingSubscriber.afterLoad()
  const reloaded = await this.reloadAndMark((saved as any).id);

  // Now entity has smart getters attached!
  return reloaded as Entity;
}
```

### The Reload Process

```typescript
private async reloadAndMark(id: string): Promise<T | null> {
  // 1. Reload from database
  const reloaded = await this.repository.findOne({
    where: { id } as FindOptionsWhere<T>
  });

  // 2. This triggers SmartLoadingSubscriber.afterLoad()
  //    which attaches smart getters to all relationships

  // 3. Mark with __typename for Relay
  return this.markEntity(reloaded);
}
```

### Plain Object Support

CustomRepository handles both entity instances and plain objects transparently:

```typescript
// ✅ Plain object → Auto-converted to entity → Smart loading
await repository.save({
  title: 'New Message',
  content: 'Hello world'
});

// ✅ Entity instance → Smart loading
const message = repository.create({ title: 'New Message' });
await repository.save(message);

// Both get smart getters attached automatically!
```

---

## Usage Examples

### Example 1: Basic Relation Access

```typescript
// Without smart loading (old way)
const message = await messageRepository.findOne({
  where: { id: messageId },
  relations: ['chat', 'versions', 'attachments']  // ❌ Must specify everything
});

// With smart loading (new way)
const message = await messageRepository.findOne({
  where: { id: messageId }  // ✅ No relations needed!
});

// Access relations transparently
const chat = await message.chat;              // Loads on-demand
const versions = await message.versions;       // Loads on-demand
const attachments = await message.attachments; // Loads on-demand

// Subsequent access is cached (synchronous)
console.log(message.chat);  // ✅ Already loaded, no DB query
```

### Example 2: Soft Delete with Relations

```typescript
// Soft delete a chat
await chatRepository.softDeleteById(chatId);

// Query won't find it (automatic filtering)
const chat = await chatRepository.findOne({
  where: { id: chatId }
});
console.log(chat);  // null

// But can still access with withDeleted
const deletedChat = await chatRepository.findOne({
  where: { id: chatId },
  withDeleted: true  // ✅ Include soft-deleted
});

// Recover it
await chatRepository.recoverById(chatId);

// Now it's back
const recovered = await chatRepository.findOne({
  where: { id: chatId }
});
console.log(recovered);  // Chat entity ✅
```

### Example 3: GraphQL Field Resolver

```typescript
@Resolver(() => Message)
export class MessageResolver extends BaseResolver {

  @FieldResolver(() => [MessageVersion])
  async versions(@Root() message: Message): Promise<MessageVersion[]> {
    // Smart getter handles this automatically!
    // If versions already loaded → returns synchronously
    // If not loaded → loads on-demand and caches
    return await message.versions;
  }

  @FieldResolver(() => Chat)
  async chat(@Root() message: Message): Promise<Chat> {
    // Same magic here!
    return await message.chat;
  }
}
```

### Example 4: Service Layer

```typescript
export class MessageService {
  static async createMessageWithVersions(
    chatId: string,
    content: string
  ): Promise<Message> {
    const repo = this.getRepository();

    // Create message (plain object)
    const message = await repo.save({
      chatId,
      content,
      role: 'user'
    });

    // ✅ message now has smart getters attached!

    // Create initial version
    const versionRepo = this.getVersionRepository();
    await versionRepo.save({
      messageId: message.id,
      content,
      version: 1,
      isCurrent: true
    });

    // Access versions transparently (will load on-demand)
    const versions = await message.versions;
    console.log(`Created ${versions.length} versions`);

    return message;
  }
}
```

---

## Advanced Patterns

### Pattern 1: Conditional Loading

```typescript
async function displayMessage(
  message: Message,
  includeVersionHistory: boolean
) {
  console.log(message.content);

  // Only load versions if needed
  if (includeVersionHistory) {
    const versions = await message.versions;  // ← Only loads if true
    versions.forEach(v => console.log(`v${v.version}: ${v.content}`));
  }

  // No DB query if includeVersionHistory is false!
}
```

### Pattern 2: Parallel Loading

```typescript
// Load multiple relations in parallel
const message = await repository.findOne({ where: { id: messageId } });

const [chat, versions, attachments] = await Promise.all([
  message.chat,
  message.versions,
  message.attachments
]);

// All 3 relations loaded in parallel, then cached
console.log(chat);        // ✅ Synchronous (cached)
console.log(versions);    // ✅ Synchronous (cached)
console.log(attachments); // ✅ Synchronous (cached)
```

### Pattern 3: Nested Relations

```typescript
// Load nested relations transparently
const message = await repository.findOne({ where: { id: messageId } });

// Access nested relation chain
const chat = await message.chat;
const user = await chat.user;
const profile = await user.profile;

// All automatically cached after first access
console.log(message.chat);        // ✅ Cached
console.log(message.chat.user);   // ✅ Cached
console.log(message.chat.user.profile); // ✅ Cached
```

### Pattern 4: Soft Delete Cascade

```typescript
// Soft delete with cascade (if configured)
const chat = await chatRepository.findOne({
  where: { id: chatId },
  relations: ['messages']
});

// Soft delete chat
await chatRepository.softDelete({ id: chatId });

// Messages might also be soft-deleted if cascade is configured
// Check the @OneToMany decorator for cascade: true
```

---

## Key Benefits

### 🚀 Performance

- **Lazy Loading**: Only loads relations when accessed
- **Caching**: Subsequent accesses are synchronous (no DB query)
- **Parallel Loading**: Load multiple relations concurrently
- **No N+1**: DataLoader integration (future) will batch queries

### 💡 Developer Experience

- **Transparent**: Access relations like regular properties
- **Type-Safe**: Full TypeScript support
- **Zero Config**: Auto-detects all relationships from metadata
- **GraphQL Ready**: Works seamlessly with TypeGraphQL field resolvers

### 🔒 Safety

- **Soft Delete by Default**: Automatically filters deleted records
- **Easy Recovery**: Simple `recover()` method
- **Cascade Support**: Optional cascade on delete
- **Constructor Preservation**: Plain objects handled correctly

---

## Configuration

### Disable Smart Loading (CLI mode)

```bash
# SmartLoadingSubscriber automatically disabled in CLI processes
CLI=true yarn db:seed  # ✅ Smart loading skipped for performance
```

### Enable withDeleted Globally

```typescript
// In specific queries
const entity = await repository.findOne({
  where: { id },
  withDeleted: true  // ✅ Include soft-deleted
});
```

---

## Testing

```typescript
describe('Smart Loading Subscriber', () => {
  it('should attach smart getters after entity load', async () => {
    const message = await messageRepository.findOne({
      where: { id: messageId }
    });

    // Versions should be loadable
    const versions = await message.versions;
    expect(versions).toBeInstanceOf(Array);
  });

  it('should cache relation after first access', async () => {
    const message = await messageRepository.findOne({
      where: { id: messageId }
    });

    // First access loads from DB
    const versions1 = await message.versions;

    // Second access is synchronous (cached)
    const versions2 = message.versions;

    expect(versions1).toBe(versions2);  // Same reference
  });

  it('should work with soft delete', async () => {
    await messageRepository.softDeleteById(messageId);

    // Excluded by default
    const message = await messageRepository.findOne({
      where: { id: messageId }
    });
    expect(message).toBeNull();

    // Can query with withDeleted
    const deleted = await messageRepository.findOne({
      where: { id: messageId },
      withDeleted: true
    });
    expect(deleted).toBeDefined();
    expect(deleted.deletedAt).toBeDefined();
  });
});
```

---

## Troubleshooting

### Relations returning `undefined`

**Problem**: `await message.versions` returns `undefined`

**Solutions**:
1. Check that the relationship is defined in your entity:
   ```typescript
   @OneToMany(() => MessageVersion, version => version.message)
   versions!: MessageVersion[];
   ```

2. Verify SmartLoadingSubscriber is registered:
   ```typescript
   // main/db/dataSource.ts
   subscribers: [SmartLoadingSubscriber]
   ```

3. Check you're not in CLI mode (smart loading disabled for performance)

### Performance Issues

**Problem**: Too many DB queries

**Solution**: Eagerly load commonly accessed relations:
```typescript
const message = await repository.findOne({
  where: { id: messageId },
  relations: ['versions', 'chat']  // ✅ Load upfront for better performance
});
```

### TypeScript Errors

**Problem**: Property 'versions' does not exist on type 'Message'

**Solution**: Ensure your entity has the relationship defined:
```typescript
@OneToMany(() => MessageVersion, version => version.message)
versions!: MessageVersion[];  // ✅ Must be defined in entity class
```

---

`★ Insight ─────────────────────────────────────`
**Smart Loading Pattern**: The SmartLoadingSubscriber demonstrates how TypeORM's event system can be leveraged to create transparent, lazy-loaded relationships. By using Object.defineProperty with smart getters, we achieve a "magical" developer experience where relations Just Work™ without explicit configuration.

**Three-Tier Caching**: The system intelligently handles three scenarios: (1) already loaded by TypeORM (synchronous), (2) previously accessed and cached (synchronous), (3) needs loading (asynchronous with caching). This provides optimal performance while maintaining simplicity.

**Soft Delete Integration**: By combining TypeORM's native `@DeleteDateColumn` with CustomRepository's automatic filtering, soft deletes become transparent to developers while remaining recoverable when needed.
`─────────────────────────────────────────────────`

---

## Summary

This system provides:

✅ **Transparent Soft Deletes** - Records marked as deleted but recoverable
✅ **Smart Relationship Loading** - Access relations without specifying them in queries
✅ **Automatic Caching** - Subsequent accesses are synchronous
✅ **TypeGraphQL Integration** - Works seamlessly with GraphQL resolvers
✅ **Zero Configuration** - Auto-detects relationships from TypeORM metadata
✅ **Production Ready** - Used in all entity operations throughout the codebase

All managed through:
- `SmartLoadingSubscriber` - Attaches smart getters after entity load
- `CustomRepository` - Ensures smart loading on save/update
- `BaseEntity` - Provides soft delete field and common functionality
