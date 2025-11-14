# CLI Tools

A comprehensive CLI system for development utilities and code generation in the Electron template project.

## Overview

The CLI provides two main command interfaces:

- **Generators** (`yarn generate <command>`) - Rails-like code generation for entities, resolvers, and more
- **Utils** (`yarn utils <command>`) - Development utilities for building, cleaning, and managing the project

## Quick Start

```bash
# List all available commands
yarn generate list
yarn utils list

# Generate a new entity with attributes
yarn generate entity Post title:string content:text published:boolean

# Start development environment
yarn utils dev

# Clean build artifacts
yarn utils clean --dry-run
```

## Generator Commands

### Entity Generator

Create TypeORM entities with TypeGraphQL decorators:

```bash
yarn generate entity User name:string email:string age:number
yarn g entity Product title:string price:number description:text
```

**Features:**
- Auto-generates TypeScript interfaces
- TypeGraphQL decorators for GraphQL types
- Database columns with proper types
- Validation decorators
- Relationship support

**Generated files:**
- `main/db/entities/User.ts`
- Tests, resolvers, and policies (coming soon)

### Available Generators

```bash
yarn generate entity <name> [attributes...]     # Generate TypeORM entity
yarn generate resolver <name>                   # Generate GraphQL resolver (TODO)
yarn generate migration <name>                  # Generate database migration (TODO)
yarn generate service <name>                    # Generate service class (TODO)
yarn generate scaffold <name> [attributes...]   # Generate full CRUD stack (TODO)
```

## Utils Commands

### Development Environment

```bash
# Start full development environment
yarn utils dev

# Start with selective components
yarn utils dev --no-relay    # Skip relay compiler
yarn utils dev --no-schema   # Skip schema generation
```

**What it does:**
1. Generates GraphQL schema
2. Starts Relay compiler in watch mode
3. Launches Vite dev server
4. Runs preload fix script
5. Watches for entity/resolver changes

### Database Management

```bash
# Seed database with test data
yarn utils seed

# Seed without schema synchronization
yarn utils seed --no-synchronize

# Reset database (clean + seed)
yarn db:reset
```

### Schema Generation

```bash
# Generate GraphQL schema once
yarn utils schema

# Watch for changes and regenerate automatically
yarn utils schema --watch
```

### Project Cleaning

```bash
# Clean all default items (data, cache, build, maps, logs, js)
yarn utils clean

# Clean with selective options
yarn utils clean --dry-run --no-build
yarn utils clean --data --js --cache

# Clean specific categories
yarn utils clean --no-data --no-logs   # Skip data and logs
```

**Clean targets:**
- **Data**: `.data` directory
- **Cache**: `node_modules/.cache`, `.vite`, `.vite-temp`
- **Build**: `dist`, `out`, `build`, `release`, `.webpack`, `dist_electron`
- **Maps**: All `.js.map` files
- **Logs**: `logs` directory and `*.log` files
- **JS**: Compiled `.js` files in `ui`, `main`, `shared`

## Command Structure

### Adding New Commands

#### 1. Create Command File

Create a new command in `cli/commands/`:

```typescript
// cli/commands/MyCommand.ts
import { BaseCommand } from '../utils/BaseCommand.js';

interface MyOptions {
  option1: boolean;
  option2: string;
}

export class MyCommand extends BaseCommand {
  async run(options: MyOptions): Promise<{ success: boolean; message: string }> {
    this.info('Running my command...');

    // Your logic here

    this.success('Command completed!');
    return { success: true, message: 'My command completed successfully' };
  }
}
```

#### 2. Register Command

Add to `cli/utils-cli.ts`:

```typescript
program
  .command('my-command')
  .description('Description of my command')
  .option('-o, --option1', 'Option description', true)
  .option('-t, --option2 <value>', 'Another option', 'default')
  .action(async (options) => {
    const { MyCommand } = await import('./commands/MyCommand.js');
    const command = new MyCommand();
    await command.execute(options);
  });
```

### Adding New Generators

#### 1. Create Generator Class

```typescript
// cli/generators/MyGenerator.ts
import { BaseGenerator, GeneratorResult } from './BaseGenerator.js';

export class MyGenerator extends BaseGenerator {
  async generate(): Promise<GeneratorResult> {
    const className = this.toPascalCase(this.name);

    // Generate files using templates
    const template = this.loadTemplate('my-template.hbs');
    const content = this.renderTemplate(template, { className });

    this.writeFile(`path/to/${className}.ts`, content);

    return this.results;
  }
}
```

#### 2. Create Template

Create Handlebars template in `cli/templates/`:

```handlebars
{{!-- cli/templates/my-template.hbs --}}
export class {{pascalCase name}} {
  constructor() {
    // Generated content
  }
}
```

#### 3. Register Generator

Add to `cli/index.ts`:

```typescript
program
  .command('my-generator <name>')
  .description('Generate my custom component')
  .option('-f, --force', 'Overwrite existing files', false)
  .action(async (name: string, options) => {
    const { MyGenerator } = await import('./generators/MyGenerator.js');
    const generator = new MyGenerator({
      name,
      force: options.force,
      dryRun: options.dryRun,
    });
    await generator.run();
  });
```

## Available Helpers

### BaseCommand Methods

```typescript
// Output methods
this.info('Information message');
this.success('Success message');
this.warning('Warning message');
this.error('Error message');
this.progress('Progress message');

// Utility methods
this.sleep(1000);                    // Sleep 1 second
this.separator();                    // Print empty line
this.printData(data);                // Print structured data
this.confirm('Are you sure?');       // User confirmation
```

### BaseGenerator Methods

```typescript
// String transformations
this.toPascalCase('user_profile');   // UserProfile
this.toCamelCase('UserProfile');     // userProfile
this.toKebabCase('UserProfile');     // user-profile
this.pluralize('user');              // users
this.singularize('users');           // user

// File operations
this.loadTemplate('entity.hbs');     // Load template
this.renderTemplate(template, data); // Render with data
this.writeFile('path/file.ts', content); // Write file
this.fileExists('path/file.ts');     // Check existence
```

### Handlebars Helpers in Templates

```handlebars
{{pascalCase name}}           <!-- PascalCase -->
{{camelCase name}}            <!-- camelCase -->
{{kebabCase name}}            <!-- kebab-case -->
{{snakeCase name}}            <!-- snake_case -->
{{pluralize name}}            <!-- Plural form -->
{{singularize name}}          <!-- Singular form -->

{{#eq option "value"}}        <!-- If equals -->
{{#neq option "value"}}       <!-- If not equals -->
{{#or condition1 condition2}} <!-- Logical OR -->
{{#and condition1 condition2}}<!-- Logical AND -->

{{timestamp}}                 <!-- ISO timestamp -->
{{year}}                      <!-- Current year -->
```

## Best Practices

1. **Use BaseCommand** for utility commands to get consistent UX
2. **Use BaseGenerator** for code generators to get file helpers and templates
3. **Follow naming conventions** for commands and options
4. **Provide helpful descriptions** for all commands
5. **Support dry-run mode** for operations that modify files
6. **Use colored output** for better user experience
7. **Handle errors gracefully** with proper exit codes

## Package.json Scripts

```json
{
  "scripts": {
    "generate": "tsx cli/index.ts",
    "g": "tsx cli/index.ts",
    "utils": "tsx cli/utils-cli.ts",
    "dev": "tsx cli/utils-cli.ts dev",
    "db:seed": "tsx cli/utils-cli.ts seed",
    "graphql": "yarn utils schema && relay-compiler"
  }
}
```