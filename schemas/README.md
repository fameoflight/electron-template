# Entity Schema-Driven Code Generation

> **Schema-First Approach** - Define entities in JSON, generate TypeScript code with inheritance

## Overview

This system uses JSON schema files to generate TypeScript entity code, similar to Prisma or Rails schema.rb.

**Key Benefits:**

- 📝 **Single source of truth** - Entity structure defined in JSON
- 🔄 **Regenerate anytime** - Update schema, regenerate code
- 🧬 **Inheritance pattern** - Generated base + custom extensions
- ✅ **Type-safe** - JSON Schema validation with IDE autocomplete
- 🚀 **Integrated workflow** - `yarn graphql` does everything!

## Quick Start

### 1. Create Entity Schema

Create `schemas/Post.json`:

```json
{
  "$schema": "./entity-schema.json",
  "name": "Post",
  "description": "Blog post",
  "indexes": ["authorId", "slug"],
  "fields": {
    "title": {
      "type": "string",
      "required": true,
      "maxLength": 255,
      "description": "Post title"
    },
    "content": {
      "type": "text",
      "required": true
    },
    "authorId": {
      "type": "uuid",
      "required": true,
      "relation": {
        "entity": "User",
        "type": "many-to-one"
      }
    }
  }
}
```

### 2. Generate Everything

```bash
yarn graphql                  # Generates entities + GraphQL schema + Relay (ONE COMMAND!)

# Alternative: generate only entities
yarn entity:generate          # Generate all entities
yarn entity:generate Post     # Generate specific entity
```

**What `yarn graphql` does:**

1. ✅ Generates TypeScript entities from `schemas/*.json`
2. ✅ Generates GraphQL schema from entities
3. ✅ Runs Relay compiler

### 3. Generated Files

```
main/db/entities/
├── generated/
│   └── PostBase.ts          ← Auto-generated (DO NOT EDIT)
└── Post.ts                  ← Custom extension (EDIT HERE)

schema.graphql               ← GraphQL schema
ui/__generated__/            ← Relay types
```

### 4. Customize Extension

Edit `main/db/entities/Post.ts`:

```typescript
import { PostBase } from "./generated/PostBase.js";
import { ComputedField } from "@base/graphql/decorators/index.js";
import { BeforeInsert } from "typeorm";

export class Post extends PostBase {
  @BeforeInsert()
  generateSlug() {
    if (!this.slug && this.title) {
      this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    }
  }

  @ComputedField(String, {
    description: "Full URL path",
  })
  get url(): string {
    return `/posts/${this.slug}`;
  }

  publish(): void {
    this.published = true;
    this.publishedAt = new Date();
  }
}
```

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  schemas/Post.json                                          │
│  (JSON Schema - Source of Truth)                            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ yarn graphql (integrated!)
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  EntityJsonParser → EntityDslGenerator                      │
└────┬─────────────────────────────────────────────┬──────────┘
     │                                              │
     ▼                                              ▼
┌─────────────────────────────┐    ┌───────────────────────────┐
│ generated/PostBase.ts       │    │ Post.ts                   │
│ (Auto-generated)            │    │ (Custom extension)        │
│                             │    │                           │
│ - @EntityObjectType         │◄───┤ extends PostBase          │
│ - @FieldColumn              │    │                           │
│ - @RelationshipFieldColumn  │    │ + Custom methods          │
│ - All fields from schema    │    │ + Computed fields         │
│                             │    │ + Lifecycle hooks         │
│ ⚠️ REGENERATED ON CHANGES  │    │ ✅ PRESERVED ALWAYS       │
└─────────────┬───────────────┘    └───────────────────────────┘
              │
              │ Then generates...
              ▼
┌─────────────────────────────────────────────────────────────┐
│  GraphQL Schema + Relay Compiler                            │
│  (schema.graphql, __generated__/)                           │
└─────────────────────────────────────────────────────────────┘
```

### Code Flow

1. **Define** - Create/edit `schemas/YourEntity.json`
2. **Generate** - Run `yarn graphql` (generates entities → GraphQL → Relay!)
3. **Extend** - Add custom logic to `main/db/entities/YourEntity.ts`
4. **Regenerate** - Modify schema, run `yarn graphql` (custom code preserved!)

## JSON Schema Format

### Field Types

| Type      | TypeScript | GraphQL | Database | Description                    |
| --------- | ---------- | ------- | -------- | ------------------------------ |
| `string`  | `string`   | String  | VARCHAR  | Short text (default 255 chars) |
| `text`    | `string`   | String  | TEXT     | Long text (unlimited)          |
| `number`  | `number`   | Number  | INTEGER  | Numeric value                  |
| `boolean` | `boolean`  | Boolean | BOOLEAN  | True/false                     |
| `date`    | `Date`     | Date    | DATETIME | Date/time value                |
| `uuid`    | `string`   | String  | UUID     | UUID string                    |
| `json`    | `any`      | Object  | JSON     | JSON data                      |

### Field Properties

```json
{
  "fieldName": {
    "type": "string", // Required: Field type
    "required": true, // NOT NULL constraint
    "unique": true, // UNIQUE constraint
    "default": "value", // Default value
    "description": "Field docs", // GraphQL description
    "maxLength": 255, // String max length
    "minLength": 3, // String min length
    "pattern": "^[a-z]+$" // Regex validation
  }
}
```

### Relationships

```json
{
  "authorId": {
    "type": "uuid",
    "required": true,
    "relation": {
      "entity": "User", // Target entity
      "type": "many-to-one", // Relationship type
      "eager": true // Optional: eager load this relationship
    },
    "description": "Post author"
  }
}
```

**Relationship Types:**

- `many-to-one` - Many posts → one user
- `one-to-many` - One user → many posts
- `many-to-many` - Many posts ↔ many tags
- `one-to-one` - One user ↔ one profile

**Relationship Options:**

- `entity` (required) - Target entity name
- `type` (required) - Relationship type (`many-to-one`, `one-to-many`, `many-to-many`, `one-to-one`)
- `eager` (optional, default: false) - Whether to eagerly load this relationship with TypeORM's `{ eager: true }` option. When true, automatically loads related entities using LEFT JOIN to avoid N+1 queries.

### Entity-Level Options

```json
{
  "name": "Post", // Entity class name (PascalCase)
  "description": "Blog post entity", // GraphQL description
  "indexes": [
    "fieldName", // Single-field index
    ["field1", "field2"] // Composite index
  ],
  "fields": {
    /* ... */
  }
}
```

## Examples

### Simple Entity

`schemas/Tag.json`:

```json
{
  "$schema": "./entity-schema.json",
  "name": "Tag",
  "description": "Content tag",
  "indexes": ["slug"],
  "fields": {
    "name": {
      "type": "string",
      "required": true,
      "maxLength": 50,
      "unique": true
    },
    "slug": {
      "type": "string",
      "required": true,
      "maxLength": 50,
      "unique": true,
      "pattern": "^[a-z0-9-]+$"
    }
  }
}
```

### With Relationships

`schemas/Comment.json`:

```json
{
  "$schema": "./entity-schema.json",
  "name": "Comment",
  "description": "Post comment",
  "indexes": ["postId", ["postId", "approved"]],
  "fields": {
    "content": {
      "type": "text",
      "required": true,
      "maxLength": 5000
    },
    "postId": {
      "type": "uuid",
      "required": true,
      "relation": {
        "entity": "Post",
        "type": "many-to-one",
        "eager": true // Auto-load post data with comment
      }
    },
    "authorId": {
      "type": "uuid",
      "required": true,
      "relation": {
        "entity": "User",
        "type": "many-to-one"
      }
    },
    "approved": {
      "type": "boolean",
      "default": false
    }
  }
}
```

### Generated Code Examples

**With Eager Loading:**

```json
"relation": {
  "entity": "Post",
  "type": "many-to-one",
  "eager": true
}
```

```typescript
// Generated TypeScript
@ManyToOne(() => Post, { eager: true })
@JoinColumn({ name: 'postId' })
post!: Post;
```

**Without Eager Loading (Default):**

```json
"relation": {
  "entity": "User",
  "type": "many-to-one"
}
```

```typescript
// Generated TypeScript
@ManyToOne(() => User)
@JoinColumn({ name: 'authorId' })
author!: User;
```

**Performance Benefits:**
- **Eager loading**: Single query with LEFT JOIN loads related data automatically
- **Lazy loading**: Separate queries for each relationship (may cause N+1 queries)

## Workflow

### Adding a New Entity

```bash
# 1. Create schema
cat > schemas/Article.json << 'EOF'
{
  "$schema": "./entity-schema.json",
  "name": "Article",
  "fields": {
    "title": { "type": "string", "required": true }
  }
}
EOF

# 2. Generate everything (entities + GraphQL + Relay)
yarn graphql

# 3. Review generated files
#    - main/db/entities/generated/ArticleBase.ts (auto-generated)
#    - main/db/entities/Article.ts (customize here)
#    - schema.graphql (GraphQL schema)
#    - ui/__generated__/ (Relay types)

# 4. Add custom logic to Article.ts

# 5. Type check
yarn type-check
```

### Modifying an Existing Entity

```bash
# 1. Edit schema
vim schemas/Post.json

# 2. Regenerate everything (custom code preserved!)
yarn graphql

# 3. Type check
yarn type-check
```

**Note:** `yarn graphql` now automatically:

1. Generates entities from `schemas/*.json`
2. Generates GraphQL schema from entities
3. Runs Relay compiler

One command does it all! 🚀

### Watch Mode

```bash
yarn utils schema --watch  # Auto-regenerate on file changes

# Watches for changes in:
# - schemas/*.json (entity schemas)
# - main/db/entities/*.ts (entities)
# - main/graphql/resolvers/*.ts (resolvers)
```

## Best Practices

### ✅ DO

- Define all fields in schema JSON
- Run `yarn graphql` after schema changes (generates everything!)
- Add custom logic in `main/db/entities/YourEntity.ts`
- Use computed fields for derived values
- Add lifecycle hooks (@BeforeInsert, @BeforeUpdate) in extension
- Commit both schema JSON and custom TypeScript files

### ❌ DON'T

- Edit files in `main/db/entities/generated/` (auto-regenerated!)
- Add fields directly to TypeScript (use schema instead)
- Commit generated base files (optional, can be regenerated)
- Manually run `yarn entity:generate` (use `yarn graphql` instead)

## IDE Support

### VS Code

Install **Red Hat YAML** extension for JSON Schema autocomplete:

```json
{
  "$schema": "./entity-schema.json",
  "name": "Post",
  "fields": {
    "title": {
      // Autocomplete suggests: type, required, unique, etc.
    }
  }
}
```

## Advanced

### Custom Base Class Modifications

If you need to modify the generated base:

1. Edit schema JSON
2. Run `yarn graphql`
3. Base class regenerates with your changes

### Multiple Entities

Generate all at once:

```bash
yarn graphql  # Generates all schemas/*.json
```

Output:

```
Generating entities from 3 schema file(s)...
Entities: 1 new, 2 updated
Generating GraphQL schema...
GraphQL schema generated successfully!
[Relay compiler output...]
```

## Troubleshooting

### "Entity file not found"

Make sure your JSON file is in `schemas/` directory:

```bash
ls schemas/*.json
```

### "Cannot find module '../User.js'"

Related entity doesn't exist yet:

```bash
yarn graphql  # Will generate all entities
```

### Type errors after generation

Run type check:

```bash
yarn type-check
```

## Commands Reference

```bash
# Recommended: One command for everything
yarn graphql                    # Generate entities + GraphQL + Relay

# Advanced: Individual commands
yarn entity:generate            # Generate all entities only
yarn entity:generate Post       # Generate specific entity only
yarn utils schema               # Generate GraphQL schema only
yarn relay                      # Run Relay compiler only

# Watch mode
yarn utils schema --watch       # Auto-regenerate on changes
```

## Future Enhancements

Possible additions:

- [ ] Watch mode for `yarn graphql`
- [ ] Migration generation from schema changes
- [ ] Resolver generation from entities
- [ ] Input type generation
- [ ] Validation decorator generation
- [ ] Database seeding from schema

## Related

- [Entity Generator](/cli/README.md#entity-generator) - Original attribute-based generator
- [GraphQL Schema](/main/graphql/) - GraphQL setup
- [TypeORM Entities](/main/db/entities/) - Entity directory

---

**Schema-driven development** puts your data model first, generating type-safe code automatically. One command (`yarn graphql`) generates entities, GraphQL schema, and Relay types. Modify the schema, regenerate, and your custom extensions are preserved!
