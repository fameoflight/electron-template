# Refactor - Readable, DRY, Encapsulated Code

You are an expert at writing simple, readable, DRY code with excellent encapsulation. Follow these patterns strictly.

## Core Principles

1. **Maximum 5 parameters - EVER** (functions, constructors, components)
2. **Prefer `(opts: OptsType)` pattern** - Makes parameters explicit and extensible
3. **Small helper methods** - Remove friction, encapsulate complexity
4. **DRY** - Don't Repeat Yourself
5. **Simple over clever** - Boring code is good code
6. **Encapsulation** - Hide complexity behind clean interfaces
7. **Inheritance is actually good when done right** - Use base classes for shared logic

---

## Pattern 1: Options Object (The `opts` Pattern)

**When to use:** Any function/constructor with 3+ parameters OR parameters that might grow

### ✅ GOOD - Options Pattern

```typescript
// Example 1: ChatService.ts (perfect encapsulation)
interface ChatServiceOptions {
  chatId?: string;
  messageId?: string;
  messageVersionId?: string;
}

class ChatService extends BaseService {
  private chat: Chat | null = null;
  private opts: ChatServiceOptions;

  constructor(opts: ChatServiceOptions) {
    super();
    this.opts = opts;
  }

  async getChat(): Promise<Chat> {
    if (this.chat) return this.chat;
    const chat = await getChat(this.opts);
    this.chat = chat;
    return this.chat;
  }
}

// Usage
const service = new ChatService({ chatId: "123" });
const service2 = new ChatService({ messageId: "abc" });
```

**Why this works:**

- **Explicit**: `{ chatId: '123' }` is clearer than `'123'` as third parameter
- **Extensible**: Easy to add new options without breaking existing code
- **Optional**: All fields can be optional with clear defaults
- **Type-safe**: Interface documents all possibilities
- **Self-documenting**: Code reads like prose

### ❌ BAD - Too Many Positional Parameters

```typescript
// ❌ BAD - Hard to read, hard to extend
class ChatService {
  constructor(
    chatId?: string,
    messageId?: string,
    messageVersionId?: string,
    userId?: string,
    includeDeleted?: boolean,
    cacheResults?: boolean
  ) {}
}

// Usage - what do these mean?
const service = new ChatService(
  "123",
  undefined,
  undefined,
  "user-1",
  false,
  true
);
```

**Problems:**

- Unclear what each parameter means
- Must pass `undefined` for skipped parameters
- Adding new parameter requires updating all call sites
- No type hints at call site

---

## Pattern 2: Helper Methods (Friction Removal)

**When to use:** When you find yourself repeating code or transforming data multiple times

### ✅ GOOD - Helper Methods Pattern

```typescript
// Example: LLMModel.ts (removes friction)
export type LLMModelConfig = {
  modelIdentifier: string;
  baseUrl: string;
  apiKey: string;
  kind: ConnectionKind;
  customHeaders?: Record<string, string>;
  temperature: number;
  contextLength: number;
};

export class LLMModel extends LLMModelBase {
  // Small helper method that removes friction
  getModelConfig(): LLMModelConfig {
    return {
      modelIdentifier: this.modelIdentifier,
      baseUrl: this.connection.baseUrl,
      apiKey: this.connection.apiKey,
      kind: this.connection.kind,
      customHeaders: this.connection.customHeaders || {},
      temperature: scaleTemperatureForProvider(
        this.temperature,
        this.connection.kind
      ),
      contextLength: this.contextLength,
    };
  }
}

// Usage - clean and simple!
const config = llmModel.getModelConfig();
aiProvider.createChat(config);
```

**Why this works:**

- **DRY**: Single place to get all config data
- **Type-safe**: Returns typed object, not loose fields
- **Encapsulation**: Hides how config is assembled
- **Friction removal**: No manual gathering of fields
- **Easy to extend**: Add new fields in one place

### ❌ BAD - Manual Assembly Every Time

```typescript
// ❌ BAD - Repeated everywhere, error-prone
function createChat(llmModel: LLMModel) {
  const config = {
    modelIdentifier: llmModel.modelIdentifier,
    baseUrl: llmModel.connection.baseUrl,
    apiKey: llmModel.connection.apiKey,
    kind: llmModel.connection.kind,
    customHeaders: llmModel.connection.customHeaders || {},
    temperature: scaleTemperatureForProvider(
      llmModel.temperature,
      llmModel.connection.kind
    ),
    contextLength: llmModel.contextLength,
  };
  // Use config...
}

// ❌ This code is repeated in 5 different places!
```

**Problems:**

- Code duplication (DRY violation)
- Easy to forget fields
- Hard to maintain (change in 5 places)
- No single source of truth
- Error-prone

---

## Pattern 3: Service Encapsulation (ChatService Pattern)

**When to use:** Complex data fetching, caching, or operations on entities

### ✅ GOOD - ChatService Pattern (Real Example)

```typescript
interface ChatServiceOptions {
  chatId?: string;
  messageId?: string;
  messageVersionId?: string;
}

class ChatService extends BaseService {
  private chat: Chat | null = null;
  private opts: ChatServiceOptions;
  private messageVersionFileIds: Map<string, File[]> = new Map();

  constructor(opts: ChatServiceOptions) {
    super();
    this.opts = opts;
  }

  protected getServiceName(): string {
    return "ChatService";
  }

  // Main method: fetches and caches
  async getChat(): Promise<Chat> {
    if (this.chat) return this.chat;

    const chat = await getChat(this.opts);
    if (!chat) {
      throw new Error("Chat not found for provided identifiers");
    }

    // Load with relations and cache files
    const chatWithRelations = await this.loadChatWithRelations(chat.id);
    await this.cacheMessageFiles(chatWithRelations);

    this.chat = chatWithRelations;
    return this.chat;
  }

  // Helper: Get specific message (uses cache)
  async getMessage(messageId: string): Promise<Message | null> {
    const chat = await this.getChat();
    const messages = (await chat.messages) || [];
    return messages.find((msg) => msg.id === messageId) || null;
  }

  // Helper: Get specific version (uses cache)
  async getMessageVersion(
    messageVersionId: string
  ): Promise<MessageVersion | null> {
    const chat = await this.getChat();
    const messages = (await chat.messages) || [];
    for (const message of messages) {
      const versions = (await message.versions) || [];
      const version = versions.find((v) => v.id === messageVersionId);
      if (version) return version;
    }
    return null;
  }

  // Helper: Update any entity
  async updateEntity<T extends Chat | Message | MessageVersion>(
    object: T,
    fields: Partial<T>
  ): Promise<T> {
    return super.update(object, fields);
  }

  // Private helper methods
  private async loadChatWithRelations(chatId: string): Promise<Chat> {
    const { chatRepository } = this.getRepositories();
    return await chatRepository.findOne({
      where: { id: chatId },
      relations: ["messages", "messages.versions", "messages.versions.message"],
    });
  }

  private async cacheMessageFiles(chat: Chat): Promise<void> {
    const messages = (await chat.messages) || [];
    const messageVersionIds: string[] = [];

    for (const msg of messages) {
      const versions = (await msg.versions) || [];
      messageVersionIds.push(...versions.map((v) => v.id));
    }

    const files = await this.dataSource.getRepository(MessageVersionFile).find({
      where: { messageVersionId: In(messageVersionIds) },
      relations: ["file"],
    });

    for (const mvFile of files) {
      if (!this.messageVersionFileIds.has(mvFile.messageVersionId)) {
        this.messageVersionFileIds.set(mvFile.messageVersionId, []);
      }
      this.messageVersionFileIds
        .get(mvFile.messageVersionId)!
        .push(mvFile.file);
    }
  }
}
```

**Key Features:**

- **Single constructor parameter**: `opts: ChatServiceOptions`
- **Caching**: Fetch once, reuse many times
- **Helper methods**: `getMessage()`, `getMessageVersion()`, `updateEntity()`
- **Private methods**: Hide complexity (`loadChatWithRelations`, `cacheMessageFiles`)
- **Clear API**: 4 public methods, rest private
- **DRY**: Single source of truth for chat data

### ❌ BAD - No Encapsulation

```typescript
// ❌ BAD - Logic scattered everywhere
async function getChatMessages(chatId: string) {
  const chat = await chatRepository.findOne({ where: { id: chatId } });
  const messages = await messageRepository.find({ where: { chatId } });
  return messages;
}

async function getMessageVersion(messageVersionId: string) {
  const version = await messageVersionRepository.findOne({
    where: { id: messageVersionId },
  });
  const message = await messageRepository.findOne({
    where: { id: version.messageId },
  });
  const chat = await chatRepository.findOne({ where: { id: message.chatId } });
  return { chat, message, version };
}

// ❌ Repeated queries, no caching, scattered logic
```

---

## Pattern 4: Static vs Instance Methods

### When to Use Static Methods

**Use static when:**

- No internal state needed
- Pure operations
- Utility functions

```typescript
// ✅ GOOD - Static methods for stateless operations
export class MessageService {
  // Static - no instance state needed
  static async createUserMessage(
    chatId: string,
    content: string,
    opts: MessageOptions = {}
  ): Promise<Message> {
    const dataSource = DataSourceProvider.get();
    const repo = dataSource.getRepository(Message);

    const message = repo.create({
      chatId,
      content,
      role: MessageRole.user,
      ...opts,
    });

    return await repo.save(message);
  }

  // Static - stateless validation
  static validateContent(content: string): boolean {
    return content.length > 0 && content.length < 10000;
  }
}

// Usage
const message = await MessageService.createUserMessage("chat-1", "Hello");
```

### When to Use Instance Methods

**Use instance when:**

- State/caching needed
- Complex initialization
- Multiple operations on same data

```typescript
// ✅ GOOD - Instance methods for stateful operations
class ChatService {
  private chat: Chat | null = null;

  constructor(private opts: ChatServiceOptions) {}

  // Instance - uses cached state
  async getChat(): Promise<Chat> {
    if (this.chat) return this.chat;
    this.chat = await this.loadChat();
    return this.chat;
  }

  // Instance - uses cached state
  async getMessage(id: string): Promise<Message | null> {
    const chat = await this.getChat(); // Uses cache!
    return chat.messages.find((m) => m.id === id);
  }
}

// Usage
const service = new ChatService({ chatId: "123" });
const chat = await service.getChat();
const message = await service.getMessage("msg-1");
```

---

## Pattern 5: Configuration Objects

**When to use:** 3+ boolean flags OR configuration that might grow

### ✅ GOOD - Config Objects

```typescript
interface MessageCreationOptions {
  llmModelId?: string;
  priority?: number;
  timeoutMs?: number;
  attachmentIds?: string[];
  logPrefix?: string;
}

static async createMessagePairAndStream(
  chatId: string,
  userMessageContent: string,
  options: MessageCreationOptions = {}
): Promise<MessageCreationResult> {
  const {
    llmModelId,
    priority = 0,
    timeoutMs = 30000,
    attachmentIds = [],
    logPrefix = 'MessageService'
  } = options;

  // Use options...
}

// Usage - self-documenting!
await MessageService.createMessagePairAndStream(
  'chat-123',
  'Hello',
  {
    llmModelId: 'gpt-4',
    priority: 1,
    attachmentIds: ['file-1', 'file-2']
  }
);
```

### ❌ BAD - Boolean Hell

```typescript
// ❌ BAD - What do these mean?
function createMessage(
  chatId: string,
  content: string,
  includeAttachments: boolean,
  useHighPriority: boolean,
  enableTimeout: boolean,
  logVerbose: boolean
) {}

// Usage - unclear!
await createMessage("chat-1", "Hello", true, false, true, false);
```

---

## Pattern 6: Convenience Getters (Eliminate Repetition)

**When to use:** Repeatedly accessing the same repositories, services, or complex objects

### ✅ GOOD - Convenience Getter Methods

```typescript
// Example 1: BaseService.ts - Repository getters
export abstract class BaseService {
  protected dataSource: CustomDataSource;

  // ✅ Convenience getter - eliminates repetition
  getRepositories() {
    return {
      messageRepository: this.dataSource.getRepository(Message),
      chatRepository: this.dataSource.getRepository(Chat),
      messageVersionRepository: this.dataSource.getRepository(MessageVersion),
      messageVersionFileRepository:
        this.dataSource.getRepository(MessageVersionFile),
      fileRepository: this.dataSource.getRepository(File),
    };
  }

  // ✅ Static convenience getter
  static getRepository<T>(entity: { new (): T }) {
    const dataSource = DataSourceProvider.get();
    return dataSource.getRepository(entity);
  }
}

// Usage - clean and DRY!
class MessageService extends BaseService {
  async createMessage(chatId: string, content: string) {
    const { messageRepository, chatRepository } = this.getRepositories();
    // ✅ No repetitive dataSource.getRepository() calls

    const chat = await chatRepository.findOne({ where: { id: chatId } });
    const message = messageRepository.create({ chatId, content });
    return await messageRepository.save(message);
  }
}
```

```typescript
// Example 2: JobQueue.ts - Simple getter
export class JobQueue {
  private jobs: Map<string, typeof BaseJob> = new Map();

  // ✅ Small getter - removes friction
  getAvailableJobTypes(): string[] {
    return Array.from(this.jobs.keys());
  }
}

// Usage
```

```typescript
// Example 3: Singleton pattern
export class IconService {
  private static instance: IconService | null = null;

  // ✅ Getter for singleton - consistent access pattern
  static getInstance(): IconService {
    if (!IconService.instance) {
      IconService.instance = new IconService();
    }
    return IconService.instance;
  }
}

// Usage - no manual singleton management
const iconService = IconService.getInstance();
```

```typescript
// Example 4: db/utils/index.ts - Module-level convenience functions
export function getRepo<T extends ObjectLiteral>(
  entityClass: new () => T
): Repository<T> {
  return DataSourceProvider.get().getRepository(entityClass);
}

export function getJobs(
  targetId: string,
  types: string[],
  statuses: string[]
): Promise<Job[]> {
  const jobRepo = getRepo(Job);

  return jobRepo.find({
    where: {
      targetId,
      type: In(types),
      status: In(statuses),
    },
    order: {
      createdAt: "DESC",
    },
  });
}

export async function cancelJobs(jobs: Job[]): Promise<Job[]> {
  const jobQueue = JobQueue.getInstance();

  await Promise.all(
    jobs.map(async (job) => {
      return jobQueue?.cancelJob(job.id);
    })
  );

  return getRepo(Job).find({
    where: {
      id: In(jobs.map((job) => job.id)),
    },
  });
}

// Usage - super clean!
const jobs = await getJobs("target-123", ["EmailJob"], ["pending", "running"]);
const canceledJobs = await cancelJobs(jobs);
```

**Why convenience getters work:**

- **DRY**: Define access pattern once, use everywhere
- **Type-safe**: Return properly typed objects
- **Centralized**: Single place to change implementation
- **Consistent**: Same access pattern across codebase
- **Simple**: 2-5 lines, clear purpose

### ❌ BAD - Repetitive Access Patterns

```typescript
// ❌ BAD - Repeated everywhere
class MessageService {
  async createMessage(chatId: string, content: string) {
    const dataSource = DataSourceProvider.get();
    const messageRepository = dataSource.getRepository(Message);
    const chatRepository = dataSource.getRepository(Chat);
    const versionRepository = dataSource.getRepository(MessageVersion);

    // Every method repeats this boilerplate...
  }

  async updateMessage(messageId: string, content: string) {
    const dataSource = DataSourceProvider.get();
    const messageRepository = dataSource.getRepository(Message);
    const chatRepository = dataSource.getRepository(Chat);
    const versionRepository = dataSource.getRepository(MessageVersion);

    // ❌ Same repetition...
  }
}
```

**Problems:**

- Boilerplate in every method
- Easy to forget a repository
- Hard to add new common repository
- Violates DRY principle

---

## Pattern 7: Small Helper Functions

**When to use:** Repeated logic, complex transformations, or improving readability

### ✅ GOOD - Helper Functions

```typescript
// Helper function - clear, reusable
function scaleTemperatureForProvider(
  temperature: number,
  providerKind: ConnectionKind
): number {
  if (providerKind === ConnectionKind.ANTHROPIC) {
    return Math.min(temperature / 2, 1);
  }
  return temperature;
}

export class LLMModel extends LLMModelBase {
  getModelConfig(): LLMModelConfig {
    return {
      modelIdentifier: this.modelIdentifier,
      baseUrl: this.connection.baseUrl,
      apiKey: this.connection.apiKey,
      kind: this.connection.kind,
      customHeaders: this.connection.customHeaders || {},
      temperature: scaleTemperatureForProvider(
        this.temperature,
        this.connection.kind
      ), // ✅ Clear what's happening
      contextLength: this.contextLength,
    };
  }
}
```

### ❌ BAD - Inline Complex Logic

```typescript
// ❌ BAD - What's happening here?
export class LLMModel extends LLMModelBase {
  getModelConfig(): LLMModelConfig {
    return {
      modelIdentifier: this.modelIdentifier,
      baseUrl: this.connection.baseUrl,
      apiKey: this.connection.apiKey,
      kind: this.connection.kind,
      customHeaders: this.connection.customHeaders || {},
      temperature:
        this.connection.kind === ConnectionKind.ANTHROPIC
          ? Math.min(this.temperature / 2, 1)
          : this.temperature, // ❌ Unclear why this logic exists
      contextLength: this.contextLength,
    };
  }
}
```

---

## Pattern 7: The 5-Parameter Rule

**NEVER exceed 5 parameters** - If you need more, you're doing too much

### Solutions When You Hit 5 Parameters

**1. Options Object**

```typescript
// ❌ BAD - 7 parameters
function processMessage(
  chatId: string,
  content: string,
  userId: string,
  llmModelId: string,
  priority: number,
  timeoutMs: number,
  attachments: string[]
) {}

// ✅ GOOD - 2 required + 1 options
interface ProcessMessageOptions {
  llmModelId?: string;
  priority?: number;
  timeoutMs?: number;
  attachments?: string[];
}

function processMessage(
  chatId: string,
  content: string,
  userId: string,
  options: ProcessMessageOptions = {}
) {}
```

**2. Group Related Data**

```typescript
// ❌ BAD - 6 parameters
function createUser(
  email: string,
  name: string,
  age: number,
  address: string,
  phone: string,
  role: string
) {}

// ✅ GOOD - Grouped into logical objects
interface UserProfile {
  email: string;
  name: string;
  age: number;
}

interface UserContact {
  address: string;
  phone: string;
}

function createUser(profile: UserProfile, contact: UserContact, role: string) {}
```

**3. Extract to Class**

```typescript
// ❌ BAD - Too many parameters for function
function executeQuery(
  query: string,
  params: any[],
  timeout: number,
  retries: number,
  cache: boolean,
  logLevel: string
) {}

// ✅ GOOD - Class with builder pattern
class QueryExecutor {
  constructor(private query: string, private params: any[]) {}

  withTimeout(ms: number): this {
    this.timeout = ms;
    return this;
  }

  withRetries(count: number): this {
    this.retries = count;
    return this;
  }

  withCache(): this {
    this.cache = true;
    return this;
  }

  async execute(): Promise<any> {}
}

// Usage
const result = await new QueryExecutor(query, params)
  .withTimeout(5000)
  .withRetries(3)
  .withCache()
  .execute();
```

---

## Anti-Patterns to Avoid

### ❌ God Classes

```typescript
// ❌ BAD - Doing everything
class MessageManager {
  createMessage() {}
  updateMessage() {}
  deleteMessage() {}
  sendMessage() {}
  receiveMessage() {}
  validateMessage() {}
  transformMessage() {}
  cacheMessage() {}
  logMessage() {}
  notifyMessage() {}
  // 50 more methods...
}
```

**Fix:** Split into focused services:

- `MessageService` - CRUD operations
- `MessageValidator` - Validation
- `MessageNotifier` - Notifications
- `MessageCache` - Caching

### ❌ Primitive Obsession

```typescript
// ❌ BAD - Passing primitives everywhere
function processOrder(
  userId: string,
  productId: string,
  quantity: number,
  price: number,
  currency: string,
  shippingAddress: string,
  billingAddress: string
) {}
```

**Fix:** Create domain objects:

```typescript
// ✅ GOOD - Domain objects
interface Order {
  userId: string;
  product: Product;
  quantity: number;
  pricing: Pricing;
  addresses: Addresses;
}

function processOrder(order: Order) {}
```

### ❌ Leaky Abstractions

```typescript
// ❌ BAD - Exposing implementation details
class ChatService {
  // ❌ Exposing repository
  getRepository() {
    return this.chatRepository;
  }

  // ❌ Exposing internal state
  getChatCache() {
    return this.chatCache;
  }
}

// Users can mess with internals:
service.getRepository().delete(allChats); // Oops!
```

**Fix:** Hide internals:

```typescript
// ✅ GOOD - Clean interface
class ChatService {
  // Public API only
  async getChat(): Promise<Chat> {}
  async updateChat(chat: Chat, fields: Partial<Chat>): Promise<Chat> {}
  async deleteChat(chatId: string): Promise<void> {}

  // Private internals
  private chatCache: Map<string, Chat> = new Map();
  private getRepository() {
    return this.dataSource.getRepository(Chat);
  }
}
```

---

## Decision Tree: How to Structure Code

```
Start: I need to write a function/class
│
├─ Does it need state/caching?
│  ├─ YES → Instance class (ChatService pattern)
│  │   └─ Constructor: (opts: OptsType)
│  │
│  └─ NO → Static class (MessageService pattern)
│      └─ Methods: static methodName(required, opts: OptsType)
│
├─ How many parameters?
│  ├─ 0-2 → Direct parameters OK
│  ├─ 3-5 → Options object recommended
│  └─ 6+ → Refactor! (split function, group params, or extract class)
│
├─ Is logic repeated?
│  ├─ YES → Extract helper method
│  │   └─ Small, focused, single responsibility
│  │
│  └─ NO → Keep inline (but watch for future duplication)
│
├─ Is complexity hidden from users?
│  ├─ YES → Good encapsulation ✅
│  │
│  └─ NO → Extract private methods, hide internals
│
└─ Can I delete code instead of adding?
   ├─ YES → DELETE IT! Best code is no code
   └─ NO → Keep it simple, add minimal code needed
```

---

## Refactoring Checklist

When refactoring code, check these:

### Functions

- [ ] ≤ 5 parameters (prefer 2-3 with options object)
- [ ] Single responsibility
- [ ] Clear name describing what it does
- [ ] No side effects (unless explicitly named, e.g., `createAndSave`)
- [ ] Options object for 3+ parameters
- [ ] Type-safe parameters and return type

### Classes

- [ ] ≤ 2 constructor parameters (preferably 1 options object)
- [ ] Clear purpose (service, repository, helper, etc.)
- [ ] Private methods for internals
- [ ] Public API is minimal and clear
- [ ] No God classes (keep focused)
- [ ] Instance state only if needed (otherwise static)

### Helper Methods

- [ ] Small (< 20 lines)
- [ ] Single purpose
- [ ] Clear name
- [ ] Reusable
- [ ] Removes friction
- [ ] Extracted from repeated code

### Options Objects

- [ ] Interface defines all options
- [ ] All fields optional (with sensible defaults)
- [ ] Grouped logically
- [ ] Clear names
- [ ] Type-safe

### Encapsulation

- [ ] Complexity hidden behind clean interfaces
- [ ] Private methods for implementation details
- [ ] Public API is minimal
- [ ] No leaky abstractions
- [ ] Easy to use, hard to misuse

---

## Real-World Examples Summary

### ChatService.ts ⭐ Perfect Encapsulation

- **162 lines** - Clear, focused service
- **Options pattern**: `constructor(opts: ChatServiceOptions)`
- **Caching**: Fetch once, use many times
- **Helper methods**: `getMessage()`, `getMessageVersion()`, `updateEntity()`
- **Private methods**: Hide complexity
- **Clean API**: 4 public methods

### LLMModel.ts ⭐ Friction Removal

- **52 lines** - Small, focused entity extension
- **Helper method**: `getModelConfig()` - removes friction
- **Type-safe**: Returns `LLMModelConfig` object
- **Encapsulation**: Hides how config is assembled
- **DRY**: Single source of truth for config

### MessageService.ts ⭐ Static Methods Pattern

- **Static methods**: No instance state needed
- **Options pattern**: 2-3 required params + options object
- **Helper methods**: Compose smaller operations
- **Clear API**: ~10 public static methods

---

## Quick Reference

### Constructor Patterns

```typescript
// ✅ GOOD - Zero parameters
constructor() {
  this.dataSource = DataSourceProvider.get();
}

// ✅ GOOD - Options object
constructor(opts: ServiceOptions) {
  super();
  this.opts = opts;
}

// ✅ GOOD - Single dependency
constructor(mainWindow: BrowserWindow) {
  this.mainWindow = mainWindow;
}

// ❌ BAD - Too many parameters
constructor(repo1, repo2, queue, logger, cache, validator) { }
```

### Function Patterns

```typescript
// ✅ GOOD - 2 required + options
static async createMessage(
  chatId: string,
  content: string,
  options: MessageOptions = {}
): Promise<Message> { }

// ✅ GOOD - Options only
async getChat(opts: ChatServiceOptions): Promise<Chat> { }

// ❌ BAD - Too many parameters
function process(a, b, c, d, e, f, g) { }
```

### Helper Method Patterns

```typescript
// ✅ GOOD - Removes friction
getModelConfig(): LLMModelConfig {
  return {
    // Assembled config
  };
}

// ✅ GOOD - Hides complexity
private async loadChatWithRelations(chatId: string): Promise<Chat> {
  return await this.repository.findOne({
    where: { id: chatId },
    relations: ['messages', 'messages.versions']
  });
}
```

---

## Summary

**Always remember:**

1. **Maximum 5 parameters** - anywhere, ever
2. **Prefer `(opts: OptsType)`** - explicit and extensible
3. **Helper methods** - remove friction, hide complexity
4. **DRY** - don't repeat yourself
5. **Simple over clever** - boring code wins
6. **Encapsulation** - clean interfaces, private internals

**The Golden Rules:**

> "Can I delete code instead of adding it?"
>
> "If I need more than 5 parameters, I'm doing too much"
>
> "Helper methods should remove friction, not add complexity"

Now go write beautiful, boring, maintainable code! 🚀
