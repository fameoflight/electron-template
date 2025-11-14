# Database Migrations Guide

This guide covers the production migration strategy for managing database schema changes safely and efficiently.

## Overview

Our migration system provides:

- **Per-table migrations**: One migration file per changed table for better granularity
- **Automatic backups**: Database backups before any migration with automatic rollback on failure
- **Dry-run preview**: See what will be generated or applied before committing
- **Type-safe migrations**: Full TypeScript support with TypeORM integration

## Architecture

```
┌─────────────────────────────────────────┐
│  Current State (migrations/*.ts)  →  │
│  "Database A" - Apply existing         │
│  migrations to temp database           │
│                                        │
│  Desired State (entities/*.ts)   →  │
│  "Database B" - synchronize: true      │
│  from current entities                 │
│                                        │
│  DIFF (per table) ←──────────────────┘
│         │
│  ┌──────┴──────┐  ┌──────────┐  ┌──────────┐
│  │ 1234_...ts  │  │ 1235_...ts│  │ 1236_...ts│
│  │CreateUser.ts│  │UpdatePost │  │DropChat.ts│
│  └─────────────┘  │   .ts     │  └──────────┘
│                   └──────────┘
└───────────────────────────────────────┘
```

## Quick Start

### 1. Generate Migration

```bash
# Generate migrations for schema changes
yarn migration:generate AddUserEmail

# Preview what would be generated (dry run)
yarn migration:generate --dry-run
```

### 2. Review and Apply

```bash
# Preview pending migrations
yarn migration:show

# Apply migrations with backup
yarn migration:run

# Revert last migration (if needed)
yarn migration:revert
```

## Available Commands

### `yarn migration:generate [name]`

Generate migration files by comparing current database state with entity definitions.

**Options:**
- `--dry-run`: Show what migrations would be generated without creating files

**Behavior:**
- Creates temporary databases for comparison
- Generates one migration file per changed table
- Detects additions, modifications, and deletions
- Handles SQLite limitations (table recreation for column changes)

**Example:**
```bash
yarn migration:generate AddPhoneNumberToUser
# Creates: 2024-01-15_14-30-00_UpdateUser.ts
```

### `yarn migration:show`

Show pending migrations without running them (dry-run preview).

**Behavior:**
- Lists all unapplied migrations
- Shows the SQL that would be executed
- Safe to run anytime

### `yarn migration:run`

Apply pending migrations with automatic backup and rollback safety.

**Behavior:**
- Creates automatic backup before applying migrations
- Applies migrations sequentially
- On failure: automatically restores from backup
- Cleans up old backups (keeps last 5)

### `yarn migration:revert`

Revert the last applied migration with backup safety.

**Behavior:**
- Creates backup before reverting
- Reverts only the last migration
- Automatic rollback on failure
- Supports manual rollback to any backup

## Workflow

### Development Workflow

1. **Make Entity Changes**
   ```bash
   # Edit entity files
   vim main/db/entities/User.ts
   ```

2. **Regenerate GraphQL Schema**
   ```bash
   yarn graphql
   ```

3. **Generate Migration**
   ```bash
   yarn migration:generate AddUserFields
   ```

4. **Review Generated Files**
   ```bash
   ls main/db/migrations/
   cat main/db/migrations/2024-01-15_14-30-00_UpdateUser.ts
   ```

5. **Preview Changes**
   ```bash
   yarn migration:show
   ```

6. **Apply Locally**
   ```bash
   yarn migration:run
   ```

7. **Test and Commit**
   ```bash
   yarn test
   git add main/db/entities/ main/db/migrations/
   git commit -m "Add phone number and address to users"
   ```

### Production Deployment

1. **Generate Migration** (if not already done)
   ```bash
   yarn migration:generate ProductionUpdate
   ```

2. **Review Migrations**
   ```bash
   yarn migration:show
   ```

3. **Deploy Application**
   ```bash
   # Deploy the application
   # Migrations run automatically on startup
   ```

4. **Verify Deployment**
   ```bash
   # Check application logs for migration status
   tail -f logs/app.log | grep migration
   ```

## Migration File Structure

### Generated Migration Example

```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Update User table
 *
 * Generated on: 2024-01-15T14:30:00.000Z
 */
export class 20240115_143000_UpdateUser implements MigrationInterface {
    name = '20240115_143000_UpdateUser';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "users_temp_1705340400000" (
              "id" varchar(36) PRIMARY KEY NOT NULL,
              "name" varchar(255) NOT NULL,
              "email" varchar(255) NOT NULL,
              "phoneNumber" varchar(20) NOT NULL,
              "address" text NOT NULL
            );
        `);
        await queryRunner.query(`
            INSERT INTO "users_temp_1705340400000" ("id", "name", "email") SELECT "id", "name", "email" FROM "User";
        `);
        await queryRunner.query(`DROP TABLE "User";`);
        await queryRunner.query(`ALTER TABLE "users_temp_1705340400000" RENAME TO "User";`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "users_temp_1705340400001" (
              "id" varchar(36) PRIMARY KEY NOT NULL,
              "name" varchar(255) NOT NULL,
              "email" varchar(255) NOT NULL
            );
        `);
        await queryRunner.query(`
            INSERT INTO "users_temp_1705340400001" ("id", "name", "email") SELECT "id", "name", "email" FROM "User";
        `);
        await queryRunner.query(`DROP TABLE "User";`);
        await queryRunner.query(`ALTER TABLE "users_temp_1705340400001" RENAME TO "User";`);
    }
}
```

### Manual Migration (Advanced)

For complex changes that can't be auto-generated:

```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class CustomComplexMigration implements MigrationInterface {
    name = 'CustomComplexMigration';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Custom SQL with transactions
        await queryRunner.startTransaction();

        try {
            await queryRunner.query(`-- Custom SQL here`);
            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Rollback SQL
    }
}
```

## Backup and Restore

### Automatic Backups

The system automatically creates backups:
- Before running migrations
- Before reverting migrations
- Keeps last 5 backups by default

### Backup Location

```
.data/
├── codeblocks.db              # Current database
└── backups/                   # Backup directory
    ├── codeblocks-2024-01-15T14-30-00.db
    ├── codeblocks-2024-01-14T09-15-30.db
    └── codeblocks-2024-01-13T16-45-20.db
```

### Manual Backup and Restore

```bash
# Create snapshot
yarn utils db:snapshot --name before-big-update

# List available snapshots
ls .data.*

# Restore from snapshot
yarn utils db:restore-snapshot --name before-big-update
```

### Restore from Automatic Backup

```bash
# View available backups
ls .data/backups/

# Manual restore (emergency only)
cp .data/backups/codeblocks-2024-01-15T14-30-00.db .data/codeblocks.db
```

## Safety Features

### Rollback on Failure

If a migration fails:
1. Automatically detects failure
2. Restores database from backup
3. Logs the error and rollback status
4. Exits with error code

### Migration Validation

- Validates SQL syntax before execution
- Checks for data loss operations
- Requires explicit confirmation for destructive operations

### Test Environment Support

- Migrations are disabled in test environment by default
- Test database uses `synchronize: true` for fast setup
- Can be explicitly enabled for integration tests

## Best Practices

### 1. Small, Focused Changes
- ✅ Add one column at a time
- ✅ Split large changes into multiple migrations
- ❌ Change multiple tables in one migration

### 2. Backwards Compatibility
- ✅ Add nullable columns first
- ✅ Add new tables before foreign key relationships
- ❌ Remove columns that existing code uses

### 3. Data Safety
- ✅ Always test migrations on staging first
- ✅ Verify data integrity after migration
- ✅ Keep migration files focused on schema, not data

### 4. Review Process
- ✅ Review generated SQL before applying
- ✅ Test both up and down migrations
- ✅ Document complex migrations

### 5. Production Deployment
- ✅ Schedule maintenance windows for complex migrations
- ✅ Monitor application performance post-migration
- ✅ Keep rollback plan ready

## Troubleshooting

### Migration Generation Issues

**No changes detected:**
```bash
# Check if entities are properly loaded
yarn utils db:stats
yarn utils db:inspect User
```

**Empty migration files:**
```bash
# Clean and regenerate
yarn clean
yarn graphql
yarn migration:generate UpdateName
```

### Migration Runtime Issues

**Migration fails to run:**
```bash
# Check SQL syntax
yarn migration:show

# Manual database inspection
yarn utils db:inspect

# Restore from backup
yarn utils db:restore-snapshot
```

**Rollback fails:**
```bash
# Manual restore from backup
ls .data/backups/
cp .data/backups/codeblocks-*.db .data/codeblocks.db
```

### SQLite Specific Issues

**Table locked errors:**
- Ensure no application instances are running
- Close all database connections
- Restart application after migration

**Column type changes:**
- SQLite recreates entire table (handled automatically)
- Large tables may require extra time
- Monitor disk space during migration

## Advanced Topics

### Custom Migration Utilities

```typescript
// main/db/utils/customMigrations.ts
export async function addColumnWithDefault(
  queryRunner: QueryRunner,
  table: string,
  column: string,
  type: string,
  defaultValue: any
): Promise<void> {
  // Add column nullable first
  await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${type}`);

  // Update existing rows
  await queryRunner.query(`UPDATE "${table}" SET "${column}" = ?`, [defaultValue]);

  // Make column NOT NULL
  await queryRunner.query(`CREATE TABLE "${table}_temp" (...)`);
  // ... recreate table logic
}
```

### Migration Hooks

```typescript
// main/db/hooks/migrationHooks.ts
export async function beforeMigration(migrationName: string): Promise<void> {
  console.log(`Starting migration: ${migrationName}`);
  // Custom logic, notifications, etc.
}

export async function afterMigration(migrationName: string): Promise<void> {
  console.log(`Completed migration: ${migrationName}`);
  // Cache invalidation, notifications, etc.
}
```

### Data Migration Example

```typescript
export class DataPopulationMigration implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        // Populate new field based on existing data
        await queryRunner.query(`
            UPDATE User
            SET fullName = firstName || ' ' || lastName
            WHERE fullName IS NULL
        `);
    }
}
```

## Resources

- [TypeORM Migrations Documentation](https://typeorm.io/migrations)
- [SQLite ALTER TABLE Limitations](https://sqlite.org/lang_altertable.html)
- [Database Backup Strategies](https://www.sqlite.org/backup.html)

---

**Remember:** Always test migrations thoroughly and maintain proper backups before applying to production databases.