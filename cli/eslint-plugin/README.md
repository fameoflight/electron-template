# CodeBlocks ESLint Plugin

A collection of custom ESLint rules for the CodeBlocks AI project, following the project's architecture and coding standards.

## Structure

```
cli/eslint-plugin/
├── index.js                 # Main plugin file - imports all rules
├── rules/                   # Individual rule implementations
│   ├── class-props-limit.js
│   ├── file-size-limit.js
│   ├── graphql-colocation.js
│   └── graphql-mix.js
└── README.md                # This file
```

## Available Rules

### `@codeblocks/class-props-limit`
Enforces maximum number of properties in classes (constructor params + class fields).

**Options:**
- `max` (number, default: 5) - Maximum allowed properties

### `@codeblocks/file-size-limit`
Enforces maximum file size in lines to prevent monolithic files.

**Options:**
- `max` (number, default: 300) - Maximum allowed non-empty lines

### `@codeblocks/graphql-mix`
Detects files that contain both GraphQL queries and fragments, encouraging separation of concerns.

**Features:**
- Allows mixing for pagination patterns (`@refetchable`, `@connection`)
- Supports both 'strict' and 'lenient' modes
- File naming convention checking in lenient mode

**Options:**
- `mode` ('strict' | 'lenient', default: 'strict')
- `ignoreTestFiles` (boolean, default: true)
- `ignoreGenerated` (boolean, default: true)

### `@codeblocks/graphql-colocation`
Enforces co-location of GraphQL queries/mutations with their components.

**Features:**
- Detects files with GraphQL-specific suffixes (`.mutations.ts`, `.queries.ts`, `.fragments.ts`)
- Content-based detection for pure GraphQL files
- Configurable non-GraphQL content ratio

**Options:**
- `allowedSuffixes` (array, default: ['.mutations.ts', '.queries.ts', '.fragments.ts'])
- `maxNonGraphQLRatio` (number, default: 0.3)
- `ignoreTestFiles` (boolean, default: true)
- `ignoreGenerated` (boolean, default: true)

## Architecture

- **JavaScript Implementation**: All rules implemented in JavaScript (`*.js`) files for ESLint compatibility
- **Modular Design**: Each rule in its own file for easy maintenance
- **ES Module Support**: Uses `import/export` syntax for clean module loading
- **No Compilation Required**: Works directly with ESLint without build steps

## Usage

```javascript
// eslint.config.mjs
import codeblocksPlugin from './cli/eslint-plugin/index.js';

export default defineConfig({
  plugins: {
    '@codeblocks': codeblocksPlugin
  },
  rules: {
    '@codeblocks/class-props-limit': ['error', { max: 5 }],
    '@codeblocks/file-size-limit': ['error', { max: 300 }],
    '@codeblocks/graphql-mix': ['error'],
    '@codeblocks/graphql-colocation': ['error']
  }
});
```

## Adding New Rules

1. Create a new rule file in `rules/` directory
2. Follow the standard ESLint rule structure
3. Import and export in `index.js`
4. Add to ESLint configuration

See existing rules for patterns and best practices.