# Entity Generator System - Refactored ✅

## Overview

The Entity Generator System has been refactored into **focused, single-responsibility generators** that follow the Single Responsibility Principle. Each generator handles one specific aspect of entity generation, making the system easier to understand, modify, and extend.

## New Architecture

### 🏗️ Separate Generators

1. **EntityGenerator** - Generate only entity files
2. **EntityInputGenerator** - Generate only GraphQL input types
3. **ResolverGenerator** - Generate only GraphQL resolvers
4. **GeneratorFactory** - Unified interface for all generators

### 🎯 Single Responsibility Focus

Each generator has **one clear purpose**:
- **EntityGenerator**: TypeScript entities with TypeORM decorators
- **EntityInputGenerator**: GraphQL input types for mutations
- **ResolverGenerator**: GraphQL resolvers with CRUD operations
- **GeneratorFactory**: Orchestrates multiple generators

## Usage

### Individual Generator Commands

```bash
# Generate entities only
yarn entities                    # All entities
yarn entity Post                 # Specific entity

# Generate inputs only
yarn graphql-inputs              # All entity inputs
yarn graphql-input Post          # Specific entity inputs

# Generate resolvers only
yarn graphql-resolvers           # All entity resolvers
yarn graphql-resolver Post       # Specific entity resolver

# Combined generation (all components)
yarn entity:generate             # Legacy command - generates everything
```

### Programmatic Usage

```typescript
import { GeneratorFactory } from './cli/generators/GeneratorFactory.js';

const factory = new GeneratorFactory({ force: true });

// Generate specific components
const entityResult = factory.generateEntity(parsedEntity);
const inputsResult = factory.generateInputs(parsedEntity);
const resolverResult = factory.generateResolver(parsedEntity);

// Or generate everything
const allResult = factory.generateAll(parsedEntity);
```

## JSON Schema Format

The system now uses **JSON schemas** instead of command-line attributes:

```json
{
  "$schema": "./entity-schema.json",
  "name": "Post",
  "description": "Blog post entity",
  "indexes": ["userId", ["userId", "createdAt"]],
  "graphql": ["create", "createUpdate", "update", "delete", "list", "array", "single"], // exclude "destroy"
  "fields": {
    "title": {
      "type": "string",
      "required": true,
      "maxLength": 255,
      "description": "Post title"
    },
    "content": {
      "type": "text",
      "required": true,
      "description": "Post content"
    },
    "published": {
      "type": "boolean",
      "required": false,
      "description": "Whether post is published"
    },
    "author": {
      "type": "relation",
      "key": "authorId",
      "required": true,
      "description": "Post author",
      "relation": {
        "entity": "User",
        "type": "many-to-one",
        "onDelete": "CASCADE"
      }
    }
  }
}
```

### Relation Format Standardization

**Standard relation format** (use this pattern):

```json
"relation": {
  "entity": "TargetEntity",
  "type": "many-to-one|one-to-many|many-to-many|one-to-one",
  "eager": true,              // Optional: for eager loading
  "onDelete": "CASCADE",      // Optional: cascade behavior
  "onUpdate": "CASCADE",      // Optional: update behavior
  "joinColumn": "columnId"    // Optional: custom join column
}
```

**❌ Avoid duplicate fields** like this:

```json
// WRONG - Don't separate foreign key and relation
"userId": {
  "type": "string",
  "foreignKey": { "targetEntity": "User" }
},
"user": {
  "relation": {
    "entity": "User",
    "type": "many-to-one",
    "joinColumn": "userId"
  }
}
```

**✅ Instead, use single relation field**:

```json
// CORRECT - Combined relation field with automatic FK generation
"author": {
  "type": "relation",
  "key": "authorId",           // Optional: custom FK name (defaults to "authorId")
  "graphql": {
    "foreignKey": false,       // Optional: hide FK from GraphQL schema
    "relation": true           // Optional: expose relation in GraphQL schema
  },
  "relation": {
    "entity": "User",
    "type": "many-to-one"
  }
}
```

## GraphQL Exposure Control

The `graphql` property provides fine-grained control over what appears in your GraphQL schema:

### Boolean Flag (Simple)
```json
"internalField": {
  "type": "string",
  "graphql": false,           // Hide from GraphQL entirely
  "required": true
}
```

### Object Flag (Flexible)
```json
"llmModel": {
  "type": "relation",
  "key": "llmModelId",
  "graphql": {
    "foreignKey": false,       // Hide llmModelId from GraphQL
    "relation": true           // Expose llmModel relation in GraphQL
  },
  "relation": {
    "entity": "LLMModel",
    "type": "many-to-one"
  }
}
```

**Generated Output:**
```typescript
// Entity (hidden FK, exposed relation)
@Column()
@IsString()
llmModelId!: string;                    // ❌ No @Field decorator

@Field(() => LLMModel)
@ManyToOne(() => LLMModel)
llmModel!: LLMModel;                    // ✅ Has @Field decorator

// Inputs (always use FK for mutations)
@Field(() => String)
@IsString()
llmModelId!: string;                    // ✅ Always exposed in inputs
```

### Real-world Examples

```json
// 1. Hide both FK and relation from GraphQL
"internalChat": {
  "type": "relation",
  "graphql": false,
  "relation": { "entity": "Chat", "type": "many-to-one" }
}

// 2. Hide FK but expose relation (most common)
"llmModel": {
  "type": "relation",
  "graphql": { "foreignKey": false, "relation": true },
  "relation": { "entity": "LLMModel", "type": "many-to-one" }
}

// 3. Expose both FK and relation
"author": {
  "type": "relation",
  "graphql": { "foreignKey": true, "relation": true },
  "relation": { "entity": "User", "type": "many-to-one" }
}
```

### Entity-Level GraphQL Control

The entity-level `graphql` property provides control over which GraphQL operations are generated for the entire entity:

#### Boolean Control (All or Nothing)
```json
{
  "name": "InternalConfig",
  "graphql": false,  // Skip ALL GraphQL generation (resolvers, inputs, etc.)
  "fields": { ... }
}

{
  "name": "PublicPost",
  "graphql": true,   // Generate ALL GraphQL operations (default)
  "fields": { ... }
}
```

#### Array Control (Granular Operations)
```json
{
  "name": "ReadOnlyEntity",
  "graphql": ["single", "list", "array"],  // Read-only operations only
  "fields": { ... }
}

{
  "name": "WriteOnlyEntity",
  "graphql": ["create", "update", "delete"],  // Write operations only
  "fields": { ... }
}

{
  "name": "CreateOnlyEntity",
  "graphql": ["create"],  // Create operation only
  "fields": { ... }
}
```

#### Available Operations
- **Queries**: `single`, `list`, `array`
- **Mutations**: `create`, `createUpdate`, `update`, `delete`, `destroy`

#### Examples

```json
// 1. Read-only entity (no mutations)
{
  "name": "AuditLog",
  "graphql": ["single", "list", "array"],
  "description": "Audit log entries are read-only",
  "fields": { ... }
}

// 2. Create-only entity (no updates or deletes)
{
  "name": "EventLog",
  "graphql": ["create"],
  "description": "Events can only be created, never modified",
  "fields": { ... }
}

// 3. Exclude soft delete (keep hard delete)
{
  "name": "TemporaryData",
  "graphql": ["create", "createUpdate", "update", "delete", "list", "array", "single"],
  "description": "No soft delete, only hard delete",
  "fields": { ... }
}

// 4. Completely internal entity
{
  "name": "SystemCache",
  "graphql": false,
  "description": "Internal cache, no GraphQL API needed",
  "fields": { ... }
}
```

`★ Insight ─────────────────────────────────────`
**Consistent API**: Both entity-level and field-level `graphql` properties use the same boolean/array pattern, creating an intuitive and consistent developer experience. Entity-level controls operations, field-level controls schema exposure.

**Inclusion-Based Design**: By using arrays to specify what to INCLUDE rather than what to exclude, the logic is more explicit and easier to understand. `graphql: ["create", "read"]` clearly shows what operations are available.
`─────────────────────────────────────────────────`

## Generated Files Structure

### Entity Files
```
main/db/entities/
├── __generated__/
│   └── PostBase.ts           # Generated base class (regenerated)
└── Post.ts                   # Extension class (manual edits)
```

### Input Files
```
main/graphql/inputs/
├── __generated__/
│   └── PostInputsBase.ts     # Generated input types
└── PostInputs.ts             # Extension class (manual edits)
```

### Resolver Files
```
main/graphql/resolvers/
├── __generated__/
│   └── PostResolverBase.ts   # Generated resolver
└── PostResolver.ts           # Extension class (manual edits)
```

## Generator-Specific Features

### EntityGenerator

**Focus**: TypeScript entities with TypeORM decorators

**Features**:
- `@EntityObjectType` decorators (combines multiple decorators)
- `@FieldColumn` decorators with validation
- Automatic field type mapping
- Relationship handling
- Index generation
- Inheritance from `BaseEntity`

**Example Output**:
```typescript
@EntityObjectType("posts", {
  description: "Blog post entity",
  indexes: ["userId", ["userId", "createdAt"]]
})
export class PostBase extends BaseEntity {
  @FieldColumn({
    type: String,
    required: true,
    maxLength: 255,
    description: "Post title"
  })
  title!: string;

  @FieldColumn({
    type: 'text',
    required: true,
    description: "Post content"
  })
  content!: string;

  @RelationshipFieldColumn({
    type: 'many-to-one',
    targetEntity: 'User',
    onDelete: 'CASCADE',
    description: "Post author"
  })
  user!: User;
}
```

### EntityInputGenerator

**Focus**: GraphQL input types for mutations

**Features**:
- CreateInput, UpdateInput, CreateUpdateInput types
- Validation decorators
- Optional/required field handling
- Enum support
- JSON type support

**Example Output**:
```typescript
@InputType()
export class CreatePostInput {
  @Field(() => String, { description: "Post title" })
  @MaxLength(255)
  @IsNotEmpty()
  title!: string;

  @Field(() => String, { description: "Post content" })
  @IsNotEmpty()
  content!: string;

  @Field(() => String, { nullable: true, description: "Post author" })
  @IsOptional()
  @IsUUID()
  userId?: string;
}
```

### ResolverGenerator

**Focus**: GraphQL resolvers with CRUD operations

**Features**:
- Standard CRUD operations (create, read, update, delete)
- Relay connection support
- Ownership-aware queries
- GraphQL operations control (granular inclusion/exclusion)
- Input validation
- BaseResolver inheritance

**Example Output**:
```typescript
@Resolver(() => Post)
export class PostResolverBase extends BaseResolver {
  @Query(() => Post, { nullable: true })
  async post(@Arg('id') id: string, @Ctx() ctx: GraphQLContext): Promise<Post | null> {
    return await this.getRepository(ctx).findOne({ where: { id } });
  }

  @Mutation(() => Post)
  async createPost(
    @Arg('input') input: CreatePostInput,
    @Ctx() ctx: GraphQLContext
  ): Promise<Post> {
    return await this.getRepository(ctx).save({ ...input, userId: ctx.user?.id });
  }
}
```

## Benefits of New Architecture

### 🎯 **Easy to Read**
- **Clear separation**: Each file has one obvious purpose
- **Focused classes**: No more 300-line generator classes
- **Consistent patterns**: Same decorator usage across generators

### 🛠️ **Easy to Modify**
- **Isolated changes**: Modify input generation without affecting entities
- **Single responsibility**: Fix bugs in one generator without touching others
- **Modular testing**: Test each generator independently

### 🔄 **Decorator Synergy**
- **Type-safe generation**: Uses actual decorator functions, not strings
- **Consistent validation**: Single source of truth for validation logic
- **Leverages existing decorators**: `@FieldColumn`, `@EntityObjectType`, etc.

### 📦 **Better Organization**
- **Logical grouping**: Related functionality grouped together
- **Clear interfaces**: Each generator has clean input/output contracts
- **Factory pattern**: Centralized creation and configuration

## Configuration Options

### GeneratorFactory Options
```typescript
interface GeneratorFactoryOptions {
  projectRoot?: string;     // Project root directory
  outputDir?: string;       // Custom output directory
  force?: boolean;          // Overwrite existing files
  dryRun?: boolean;         // Preview without writing
}
```

### Entity Schema Options
```typescript
interface EntitySchemaJson {
  name: string;             // Entity name
  description?: string;     // Entity description
  indexes?: string[];       // Field indexes
  graphql?: boolean | string[];  // GraphQL operations control
  fields: Record<string, FieldDefinition>; // Field definitions
}
```

## Migration from Old System

### Before (Single Generator)
```bash
yarn g entity Post title:string content:text userId:number
```

### After (JSON Schema + Separate Generators)
```bash
# 1. Create JSON schema
# schemas/Post.json (see format above)

# 2. Generate specific components
yarn entity Post              # Just entity
yarn graphql-input Post       # Just inputs
yarn graphql-resolver Post    # Just resolver

# 3. Or generate everything
yarn entities         # All entities
```

## Advanced Usage

### Custom Operations
```typescript
// Generate only specific resolver operations
const factory = new GeneratorFactory();
factory.generateCustomOperations(entity, ['create', 'update']);
```

### Individual Generator Access
```typescript
const entityGen = factory.createEntityGenerator(entity);
const inputGen = factory.createInputGenerator(entity);
const resolverGen = factory.createResolverGenerator(entity);
```

## Design Decisions

### Why Separate Generators?

1. **Single Responsibility**: Each generator has one clear job
2. **Independent Evolution**: Change input generation without affecting entities
3. **Easier Testing**: Test each generator in isolation
4. **Better Error Handling**: Failures are isolated to specific components

### Why JSON Schemas?

1. **Richer Configuration**: Supports complex options, relations, indexes
2. **Version Control**: Schemas can be versioned like code
3. **Validation**: Schema validation prevents invalid configurations
4. **Documentation**: Self-documenting field definitions

### Why Decorator Integration?

1. **Type Safety**: Use actual decorator functions instead of string building
2. **Consistency**: Same validation logic in generated and manual code
3. **Maintenance**: Single source of truth for decorator behavior
4. **Extensibility**: Easy to add new decorator features

## Files Created

```
cli/generators/
├── EntityGenerator.ts           # Entity generation only
├── EntityInputGenerator.ts      # Input generation only
├── ResolverGenerator.ts         # Resolver generation only
├── GeneratorFactory.ts          # Factory for all generators
├── BaseGenerator.ts             # Base generator class
├── managers/
│   └── TemplateManager.ts       # Template management
├── preparators/
│   ├── FieldPreparator.ts       # Field preparation logic
│   └── InputPreparator.ts       # Input preparation logic
├── generators/
│   └── EntityFileGenerator.ts   # File operations
└── utils/
    ├── TypeMapper.ts            # Type conversion utilities
    └── ValidationHelper.ts      # Validation logic
```

## Testing

```bash
# Test individual generators
yarn entities --dry-run           # Preview entity generation
yarn graphql-inputs --dry-run     # Preview input generation
yarn graphql-resolvers --dry-run  # Preview resolver generation

# Generate and test
yarn entities Post && yarn type-check
yarn graphql-input Post && yarn graphql
yarn graphql-resolver Post && yarn test
```

`★ Insight ─────────────────────────────────────`
**Separation of Concerns**: The refactored architecture demonstrates that breaking monolithic generators into focused components improves maintainability dramatically. Each generator now has a single, clear responsibility, making the codebase easier to understand and modify.

**Decorator Synergy**: By making generators use actual decorator functions instead of string concatenation, we achieve type safety and eliminate the duplication between generator logic and decorator behavior.

**JSON Schema Benefits**: Moving from command-line attributes to JSON schemas provides much richer configuration capabilities while maintaining clear, self-documenting entity definitions.
`─────────────────────────────────────────────────`

**Status**: ✅ Refactored Entity Generator System Complete - All generators separated and functional