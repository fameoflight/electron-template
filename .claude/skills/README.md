# Claude Code Skills

This directory contains specialized skills that provide focused guidance for specific development tasks.

## Available Skills

### `refactor` - Readable, DRY, Encapsulated Code

**Purpose:** Write simple, readable, DRY code with excellent encapsulation. General coding best practices.

**When to use:**
- Refactoring any code (services, classes, functions, components)
- Code has too many parameters (> 5)
- Repetitive code patterns
- Complex constructors
- Code that's hard to read or maintain
- Want to improve encapsulation

**Key patterns covered:**
- **Maximum 5 parameters rule** - Anywhere, ever
- **Options object pattern** - `(opts: OptsType)` for clarity
- **Convenience getters** - `getRepositories()`, `getJobs()` eliminate repetition
- **Helper methods** - Small, focused methods that remove friction
- **Service encapsulation** - ChatService pattern (caching, clean API)
- **Static vs instance methods** - When to use each
- **Configuration objects** - Group related parameters
- **DRY principles** - Don't Repeat Yourself

**Real examples from codebase:**
- `ChatService.ts` - Perfect encapsulation (162 lines)
- `LLMModel.ts` - Friction removal with `getModelConfig()`
- `BaseService.ts` - Convenience getters (`getRepositories()`)
- `db/utils/index.ts` - Module-level helpers (`getRepo()`, `getJobs()`)

**How to use:**

```
"Help me refactor this service. Follow the refactor skill patterns."

"This function has 8 parameters. Use the refactor skill to simplify it."

"Review this code and apply refactor skill best practices."
```

---

### `ui-relay` - React + Relay UI Development

**Purpose:** Enforce consistent patterns for building UI components with React and Relay.

**When to use:**
- Building new pages or components
- Unsure whether to use a query or fragment
- Need examples of mutation patterns
- Want to understand the page vs component distinction

**Key patterns covered:**
- Page components (query orchestrators)
- Component fragments (data consumers)
- Real-time polling patterns
- CRUD operation patterns
- Mutation patterns (inline, standalone, component-level)
- Type safety with generated Relay types
- Common anti-patterns to avoid

**How to use:**

Simply ask Claude to help with UI development and reference the skill context:

```
"Help me build a new settings page for managing API keys. Follow the ui-relay patterns."

"I need a list component that shows user notifications. Use the ui-relay skill."

"Review this component and check if it follows ui-relay best practices."
```

**What's included:**
- ✅ Complete examples from your actual codebase
- ✅ Pattern decision trees
- ✅ Anti-pattern warnings
- ✅ Type safety guidelines
- ✅ File organization rules
- ✅ Component size guidelines
- ✅ Checklists for new components

## How Skills Work

Skills are context files that Claude reads when working on specific tasks. They provide:

1. **Pattern enforcement** - Ensure consistency across the codebase
2. **Real examples** - Show actual working code from your project
3. **Decision guidance** - Help choose the right pattern for each situation
4. **Anti-patterns** - Prevent common mistakes

## Creating New Skills

To create a new skill:

1. **Create a markdown file** in `.claude/skills/`
2. **Name it descriptively** (e.g., `database-migrations.md`, `testing-strategies.md`)
3. **Structure it with:**
   - Clear purpose statement
   - When to use the skill
   - Pattern examples (from your codebase)
   - Anti-patterns to avoid
   - Checklists
4. **Reference it in conversations** by asking Claude to use the skill

**Example skill topics:**
- `service-patterns.md` - MessageService, ChatService patterns
- `job-system.md` - Creating background jobs
- `resolver-patterns.md` - GraphQL resolver best practices
- `testing.md` - Test patterns with Vitest and Polly.js
- `migrations.md` - Database migration workflows

## Tips

- **Be specific:** Reference the skill by name when asking questions
- **Combine skills:** Claude can use multiple skills in one conversation
- **Update regularly:** Keep skills current as patterns evolve
- **Real examples:** Always include actual code from your codebase
- **Checklists:** Add verification checklists for common tasks

## Skill Template

```markdown
# [Skill Name] - [One-line purpose]

You are an expert at [specific task]. Follow these patterns strictly.

## Core Principles

1. **Principle 1** - Brief explanation
2. **Principle 2** - Brief explanation
3. **Principle 3** - Brief explanation

---

## Pattern 1: [Pattern Name]

**When to use:** [Specific use case]

### Example

```typescript
// ✅ GOOD - [Brief description]
[actual code example from codebase]
```

**Key Requirements:**
- Requirement 1
- Requirement 2
- Requirement 3

---

## Pattern 2: [Pattern Name]

[Similar structure...]

---

## Anti-Patterns

### ❌ BAD: [Anti-pattern name]

```typescript
// ❌ BAD - [Why it's bad]
[bad example]
```

```typescript
// ✅ GOOD - [Why it's better]
[good example]
```

---

## Decision Tree

```
Start: [Initial question]
│
├─ [Decision point 1]?
│  ├─ YES → [Pattern A]
│  └─ NO → [Pattern B]
│
└─ [Decision point 2]?
   ├─ YES → [Pattern C]
   └─ NO → [Pattern D]
```

---

## Checklist

- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

---

## Summary

**Always remember:**
1. Key takeaway 1
2. Key takeaway 2
3. Key takeaway 3
```

## More Information

For more about Claude Code and project-specific patterns, see:
- `CLAUDE.md` - General architecture and patterns
- `CONSOLE.md` - Interactive console guide
- `/cli/README.md` - Code generation CLI
