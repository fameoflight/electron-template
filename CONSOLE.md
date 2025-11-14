# Interactive Console Guide

The Electron Template Console is a powerful REPL environment that provides full access to your application's database, services, and utilities. It's perfect for debugging, testing queries, seeding data, and prototyping features.

**Features Rails-style tab completion!** Discover entities, repositories, and utilities by pressing TAB.

## Quick Start

```bash
yarn console        # Start interactive REPL
```

## Features Overview

### 🗄️ Database Access
- **Entities**: Direct access to all TypeORM entities (User, Post, Job)
- **Repositories**: Pre-loaded repositories for CRUD operations
- **Raw SQL**: Execute custom queries with `query()`

### ⚙️ Services
- **JobQueue**: Background job management and monitoring
- **JobService**: Job creation and scheduling
- All application services pre-loaded

### 🏭 Data Factories
- **Test Data**: Create realistic test data with factories
- **Faker.js**: Generate fake names, emails, addresses, etc.
- **Quick Creation**: Shortcuts like `create.user()`, `create.users(10)`

### 🎨 Data Inspection
- **Colored Output**: Syntax-highlighted object inspection
- **Table Display**: Format arrays as console tables
- **JSON Pretty**: Formatted JSON output

### ⏱️ Performance Tools
- **Benchmarking**: Measure function execution time
- **Memory Monitoring**: Track memory usage

### 🔍 Type Inspection & IntelliSense
- **Type Helpers**: Runtime type information with `typeOf()`, `signature()`, `methods()`, `props()`
- **Tab Completion**: Enhanced autocomplete with function signatures
- **TypeScript Declarations**: Full type definitions for IDE support
- **IDE Helper**: Write code with IntelliSense in `cli/console-ide-helper.ts`

## Improved Typing Experience

The console now has significantly better TypeScript support:

### 1. Enhanced Tab Completion

Press TAB to see autocomplete suggestions with function signatures:

```javascript
create.[TAB]        // Shows: user(, users(, job(
jobs.[TAB]          // Shows: status(), stats(), pending(), running(), etc.
userRepository.[TAB]  // Shows all Repository methods
Entity.[TAB]        // Shows: User, Job, Chat, Message, etc.
Entity.User.[TAB]   // Shows: all(), find(), where(), first(), last(), count(), create()
```

### 2. Type Inspection Helpers

```javascript
// Check types at runtime
typeOf(User)              // "Function"
typeOf(userRepository)    // "Repository"
typeOf(faker)             // "Faker"

// View function signatures
signature(create.user)    // async function(overrides)
signature(jobs.cancel)    // async function(jobId)

// List all methods on an object
methods(userRepository)   // Lists find(), findOne(), save(), etc. with signatures

// Show properties with types
props(jobs)              // Table showing status, stats, pending, etc.

// Type reference guide
types()                  // Shows all type helpers and usage
```

## Core Commands

### Help & Navigation

```javascript
help()          // Show all available commands
reload()        // Reload modules and context
clear()         // Clear console screen
exit()          // Exit console
```

### Data Inspection

```javascript
// Pretty-print with colors
inspect(user, 2)  // depth = 2

// Display as table
const users = await userRepository.find()
table(users)

// JSON formatting
pretty({ name: "Alice", age: 30 })

// Memory usage
memory()

// Benchmark function
await benchmark(async () => {
  await userRepository.count()
}, 100)  // 100 iterations
```

## Database Utilities

### Schema Exploration

```javascript
// List all tables
tables()

// Show entity schema
schema("User")    // Shows columns, types, constraints

// Available entities
schema()          // Lists all entities
```

### Data Operations

```javascript
// Count records
await count("User")           // User: 5 records

// Get last N records
await last("User", 10)        // Last 10 users (table format)

// Clear table
await truncate("Post")        // ✅ Truncated Post

// Raw SQL
await query("SELECT * FROM users WHERE name LIKE ?", ["%Alice%"])
```

## Factory & Test Data

### Quick Creation

```javascript
// Create single user
const user = await create.user({
  name: "Alice Smith",
  username: "alice"
})

// Create multiple users
const users = await create.users(10)  // 10 random users

// Create with specific data
const admin = await create.user({
  name: "Admin",
  username: "admin"
})

// Create job
const job = await create.job({
  type: "EmailJob",
  status: "pending"
})
```

### Faker.js Integration

```javascript
// Generate fake data
faker.person.fullName()              // "John Doe"
faker.internet.email()               // "john.doe@example.com"
faker.phone.number()                 // "(555) 123-4567"
faker.address.city()                 // "San Francisco"
faker.company.name()                 // "Tech Corp Inc."
faker.lorem.paragraph()              // Random text
faker.datatype.number({ min: 1, max: 100 })
faker.date.future()                  // Future date

// Use in queries
const user = await userRepository.create({
  name: faker.person.fullName(),
  username: faker.internet.username(),
  password: "testpass"
})
await userRepository.save(user)
```

### Factory Functions

```javascript
// Access all factories
factories.createUser(dataSource, { name: "Alice" })
factories.createUsers(dataSource, 5)
factories.createTestJob(dataSource, { type: "EmailJob" })
```

## Job Queue Management

### Queue Status

```javascript
// Comprehensive status
jobs.status()
// Shows:
// - Running state
// - Interval & concurrency
// - Registered job types
// - Currently running jobs

// Statistics
await jobs.stats()
// Shows counts: pending, running, completed, failed
```

### Job Inspection

```javascript
// View pending jobs
await jobs.pending()    // Top 20 pending (by priority)

// View running jobs
await jobs.running()

// View failed jobs
await jobs.failed()     // Last 20 failed

// View completed jobs
await jobs.completed()  // Last 20 completed
```

### Job Control

```javascript
// Cancel running job
await jobs.cancel("job-id-123")
// ✅ Cancelled job job-id-123

// Retry failed job
await jobs.retry("job-id-456")
// ✅ Retrying job job-id-456
```

## Repository Operations

All repositories are pre-loaded and ready to use:

```javascript
// Find operations
const users = await userRepository.find()
const user = await userRepository.findOne({ where: { username: "alice" } })
const users = await userRepository.find({
  where: { deletedAt: IsNull() },
  order: { createdAt: "DESC" },
  take: 10
})

// Create & save
const user = userRepository.create({
  name: "Bob Smith",
  username: "bob",
  password: "secret"
})
await userRepository.save(user)

// Update
user.name = "Robert Smith"
await userRepository.save(user)

// Delete (hard delete)
await userRepository.remove(user)

// Soft delete
await userRepository.softRemove(user)

// Count
const count = await userRepository.count()
const activeCount = await userRepository.count({
  where: { deletedAt: IsNull() }
})
```

## GraphQL Queries

```javascript
// Simple query
const result = await graphql(`
  query {
    users {
      id
      name
      email
    }
  }
`)
console.log(result)

// Query with variables
const result = await graphql(`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      posts {
        id
        title
      }
    }
  }
`, { id: "user-123" })
```

## Advanced Examples

### Create Test Dataset

```javascript
// Create 10 users with posts
for (let i = 0; i < 10; i++) {
  const user = await create.user({
    name: faker.person.fullName(),
    username: faker.internet.username()
  })

  // Create 3 posts per user
  for (let j = 0; j < 3; j++) {
    const post = postRepository.create({
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(3),
      authorId: user.id
    })
    await postRepository.save(post)
  }
}

console.log("✅ Created 10 users with 30 posts")
```

### Bulk Data Analysis

```javascript
// Find all users with their post counts
const users = await userRepository.find()
const stats = await Promise.all(users.map(async user => ({
  name: user.name,
  posts: await postRepository.count({ where: { authorId: user.id } })
})))

table(stats)
```

### Performance Testing

```javascript
// Benchmark query performance
const result = await benchmark(async () => {
  await userRepository.find({ take: 100 })
}, 50)

// Result: Total: 245.23ms, Iterations: 50, Average: 4.90ms
```

### Data Migration

```javascript
// Update all users' metadata
const users = await userRepository.find()
for (const user of users) {
  user.metadata = {
    ...user.metadata,
    migrated: true,
    migratedAt: new Date()
  }
  await userRepository.save(user)
}
console.log(`✅ Updated ${users.length} users`)
```

## CLI Shortcuts

In addition to the console, new CLI commands are available:

```bash
# Show database statistics
yarn db:stats
# Output:
#   Job                  0 records
#   User                 5 records
#   Post                12 records

# Inspect entity schema
yarn db:inspect User
# Shows table with columns, types, constraints, indexes

# List all entities
yarn db:inspect
# Shows all available entities

# Other useful commands
yarn utils list          # List all utility commands
yarn console            # Start interactive console
```

## Tips & Tricks

### Auto-completion

The REPL supports tab completion for all loaded objects and functions.

### History

Command history is saved to `~/.app_console_history` and persists across sessions.

### Async/Await

The console automatically handles async/await. No need to wrap in async functions:

```javascript
// This works directly:
const users = await userRepository.find()

// No need for:
(async () => {
  const users = await userRepository.find()
})()
```

### Multi-line Input

For complex queries, you can use `.editor` mode:

```javascript
.editor
// Enter multi-line mode
const users = await userRepository.find({
  where: { deletedAt: IsNull() },
  order: { createdAt: "DESC" }
})
table(users)
// Press Ctrl+D to execute
```

### Error Handling

Errors are displayed with full stack traces for easier debugging:

```javascript
try {
  await userRepository.findOne({ where: { id: "invalid" } })
} catch (error) {
  console.error(error)
}
```

## Troubleshooting

**Module not found errors:**
Run `reload()` to refresh the context with latest code changes.

**Database locked:**
Only one console instance can run at a time. Exit other instances.

**Memory issues:**
Use `memory()` to check usage. Clear large variables with `delete variableName`.

**Slow queries:**
Use `benchmark()` to identify bottlenecks. Add indexes if needed.

## Best Practices

1. **Use factories for test data** instead of manual creation
2. **Use `table()` for arrays** to see data in a readable format
3. **Inspect schemas** with `schema()` before querying unfamiliar entities
4. **Monitor jobs** with `jobs.status()` to debug async operations
5. **Benchmark** performance-critical queries before production
6. **Save useful snippets** in your shell history for quick access

## Next Steps

- Explore the [AUTOCRUD.md](./AUTOCRUD.md) documentation for GraphQL resolver patterns
- Check [CLAUDE.md](./CLAUDE.md) for overall project architecture
- Review entity definitions in `main/db/entities/`

---

**Happy debugging!** 🎉
