# GraphQL Decorators System

## Overview

This directory contains the unified decorator system that eliminates code duplication between entity and input decorators while providing consistent behavior across all field types.

## Architecture

```
BaseField (214 lines)
├── FieldColumn (76 lines)     → BaseField('entity', options, type)
├── FieldInput (97 lines)      → BaseField('input', options, type)
└── Context-aware logic for GraphQL + validation

BaseFieldEnum (134 lines)
├── FieldColumnEnum (87 lines) → BaseFieldEnum('entity', enumType, options)
├── FieldInputEnum (106 lines) → BaseFieldEnum('input', enumType, options)
└── Enum registration + array handling

BaseFieldJSON (111 lines)
├── FieldColumnJSON (81 lines) → BaseFieldJSON('entity', schema, options)
├── FieldInputJSON (94 lines)  → BaseFieldJSON('input', schema, options)
└── Zod schema validation + type generation
```

## Available Decorators

### Entity Decorators

**@FieldColumn(type, options)** - Basic fields
```typescript
@FieldColumn(String, { description: 'Name', required: true })
name!: string;

@FieldColumn(Number, { min: 0, max: 120, description: 'Age' })
age!: number;

@FieldColumn(Boolean, { defaultValue: false, description: 'Active' })
isActive?: boolean;
```

**@FieldColumnEnum(enumType, options)** - Enum fields
```typescript
enum Status {
  DRAFT = 'draft',
  PUBLISHED = 'published'
}

@FieldColumnEnum(Status, { description: 'Post status', defaultValue: Status.DRAFT })
status!: Status;

@FieldColumnEnum(Status, { array: true, description: 'Multiple statuses' })
statuses?: Status[];
```

**@FieldColumnJSON(schema, options)** - JSON fields with validation
```typescript
const MetadataSchema = z.object({
  views: z.number(),
  likes: z.number()
}).describe('PostMetadata: Engagement metrics');

@FieldColumnJSON(MetadataSchema, { description: 'Post metadata', required: false })
metadata?: PostMetadata;
```

### Input Decorators

**@FieldInput(type, options)** - Input fields with context awareness
```typescript
@FieldInput(String, { inputType: 'create', description: 'Name', required: true })
name!: string;

@FieldInput(String, { inputType: 'update', description: 'Name (optional for update)' })
name?: string;
```

**@FieldInputEnum(enumType, options)** - Input enum fields
```typescript
@FieldInputEnum(Status, { inputType: 'create', description: 'Post status', required: true })
status!: Status;

@FieldInputEnum(Status, { inputType: 'update', description: 'Post status (optional)' })
status?: Status;
```

**@FieldInputJSON(schema, options)** - Input JSON fields
```typescript
@FieldInputJSON(MetadataSchema, { inputType: 'create', description: 'Post metadata' })
metadata?: PostMetadata;
```

## Context-Aware Behavior

### Input Types

- **create**: Fields are required by default (unless explicitly set to optional)
- **update**: Fields are optional by default (for partial updates)
- **createUpdate**: Fields are optional by default (for upsert operations)

### Array Handling

Use `array: true` for array fields across all decorators:

```typescript
// Entity
@FieldColumn(String, { array: true, description: 'Tags' })
tags?: string[];

@FieldColumnEnum(Status, { array: true, description: 'Statuses' })
statuses?: Status[];

// Input
@FieldInput(String, { array: true, inputType: 'create', description: 'Tags' })
tags?: string[];

@FieldInputEnum(Status, { array: true, inputType: 'update', description: 'Statuses' })
statuses?: Status[];
```

### Database Storage

- **SQLite**: Arrays stored as JSON with automatic ArrayTransformer
- **PostgreSQL**: Native array support when available
- **Enum Arrays**: Stored as JSON with EnumTransformer for string ↔ enum conversion

## Validation Options

All decorators support consistent validation options:

```typescript
@FieldColumn(String, {
  required: true,           // Field is required
  minLength: 1,             // Minimum length
  maxLength: 255,           // Maximum length
  pattern: /^[a-zA-Z]+$/,    // Regex pattern
  email: true,              // Email validation
  isUrl: true,              // URL validation
  isUUID: true,             // UUID validation
  customValidators: [       // Custom validation functions
    (value) => value.startsWith('prefix')
  ]
})
```

### Array Validation

```typescript
@FieldColumn(String, {
  array: true,
  minArraySize: 1,           // Minimum array length
  maxArraySize: 10,          // Maximum array length
  arrayUnique: true,         // Unique array values
})
```

## Code Generation Integration

The CLI automatically generates input decorators with context-aware behavior:

```typescript
// Generated for LLMModel entity
@FieldInputEnum(LLMModelCapability, {
  inputType: 'create',
  description: 'Input: LLM capability types. Required field.',
  required: true,
  array: true
})
capabilities!: LLMModelCapability[];

@FieldInputEnum(LLMModelCapability, {
  inputType: 'update',
  description: 'Input: LLM capability types. Required field.',
  array: true
})
capabilities?: LLMModelCapability[];
```

## Migration Guide

### From Manual Decorators to Unified System

**Before:**
```typescript
@Field(() => String, { description: 'Title' })
@Column({ type: 'text', nullable: false })
@IsString()
@MaxLength(255)
title!: string;

@Field(() => [Status!], { description: 'Statuses' })
@Column({ type: 'simple-json' })
@IsEnum(Status)
@ArrayMinSize(1)
statuses!: Status[];
```

**After:**
```typescript
@FieldColumn(String, { description: 'Title', required: true, maxLength: 255 })
title!: string;

@FieldColumnEnum(Status, { array: true, minArraySize: 1, description: 'Statuses' })
statuses!: Status[];
```

## Key Benefits

1. **Zero Code Duplication**: Single BaseField handles all GraphQL + validation logic
2. **Consistent API**: Same options across entity and input decorators
3. **Context Awareness**: Automatic behavior adjustment for input types
4. **Type Safety**: Unified interfaces with proper TypeScript support
5. **Array Support**: Consistent array handling across all field types
6. **Auto-Generation**: CLI generates correct input decorators automatically

## Files

- **BaseField.ts** - Core unified decorator (214 lines)
- **BaseFieldEnum.ts** - Enum handling with registration (134 lines)
- **BaseFieldJSON.ts** - JSON schema validation (111 lines)
- **FieldColumn/FieldInput** - Thin wrapper decorators (76-97 lines each)
- **FieldColumnEnum/FieldInputEnum** - Enum wrapper decorators (87-106 lines each)
- **FieldColumnJSON/FieldInputJSON** - JSON wrapper decorators (81-94 lines each)
- **types.ts** - Unified type definitions and interfaces
- **utils.ts** - Shared utility functions for all decorators

## Usage in Generated Code

The CLI automatically uses these decorators when generating entities and inputs:

```bash
yarn g entity Post title:string content:text status:enum
```

This generates:
- Entity with `@FieldColumn` and `@FieldColumnEnum` decorators
- Input classes with `@FieldInput` and `@FieldInputEnum` decorators
- Context-aware behavior for different input types
- Proper array handling where specified