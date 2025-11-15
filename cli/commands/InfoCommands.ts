/**
 * Info Commands
 *
 * Provides utilities for project information, routes listing, and general help
 */

import { initializeDatabase } from '../../main/db/dataSource';
import { output } from '../utils/output.js';

/**
 * Project Info - Show project health and statistics
 */
export async function projectInfoCommand() {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { execSync } = await import('child_process');

    output.info('\n📊 Project Information\n');
    output.info('═══════════════════════════════════════\n');

    // Package info
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    output.success(`📦 Package: ${pkg.name} v${pkg.version}`);
    output.info(`   ${pkg.description}\n`);

    // Git info
    try {
      const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      const commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
      const changed = execSync('git status --porcelain', { encoding: 'utf8' }).trim().split('\n').length;
      output.info(`🔀 Git: ${branch} @ ${commit}`);
      output.info(`   Changed files: ${changed || 0}\n`);
    } catch (e) {
      output.warning('🔀 Git: Not a git repository\n');
    }

    // Database info
    const dbPath = path.join(process.cwd(), '.data');
    if (fs.existsSync(dbPath)) {
      const size = await getDirectorySize(dbPath);
      output.info(`💾 Database: .data/`);
      output.info(`   Size: ${(size / 1024 / 1024).toFixed(2)} MB\n`);

      // Get record counts if possible
      try {
        const dataSource = await initializeDatabase();

        output.info('📊 Records:');
        for (const meta of dataSource.entityMetadatas) {
          const repo = dataSource.getRepository(meta.name);
          const count = await repo.count();
          output.info(`   ${meta.name.padEnd(20)} ${count.toString().padStart(6)}`);
        }
        output.info('');

        await dataSource.destroy();
      } catch (e) {
        output.warning('   (Database not accessible)\n');
      }
    } else {
      output.warning('💾 Database: Not initialized\n');
    }

    // Snapshots
    const files = await fs.promises.readdir(process.cwd());
    const snapshots = files.filter(f => f.startsWith('.data.backup-'));
    if (snapshots.length > 0) {
      output.info(`💿 Snapshots: ${snapshots.length} available`);
      output.info(`   Latest: ${snapshots.sort().reverse()[0]}\n`);
    }

    // Dependencies
    const deps = Object.keys(pkg.dependencies || {}).length;
    const devDeps = Object.keys(pkg.devDependencies || {}).length;
    output.info(`📚 Dependencies: ${deps} prod, ${devDeps} dev\n`);

    // Disk usage
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      const nmSize = await getDirectorySize(nodeModulesPath);
      output.info(`💽 Disk Usage:`);
      output.info(`   node_modules: ${(nmSize / 1024 / 1024).toFixed(2)} MB`);
    }

    output.info('\n═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    output.error('❌ Failed to get project info', errorMsg);
    process.exit(1);
  }
}

/**
 * Routes - List all GraphQL resolvers and IPC handlers
 */
export async function routesCommand() {
  try {
    const fs = await import('fs');
    const path = await import('path');

    output.info('\n📍 Application Routes\n');
    output.info('═══════════════════════════════════════\n');

    // GraphQL Resolvers
    output.success('🔷 GraphQL Resolvers:\n');
    const resolversPath = path.join(process.cwd(), 'main/graphql/resolvers');
    if (fs.existsSync(resolversPath)) {
      const files = await fs.promises.readdir(resolversPath);
      const resolverFiles = files.filter(f => f.endsWith('.ts') && !f.includes('index'));

      for (const file of resolverFiles) {
        const content = await fs.promises.readFile(
          path.join(resolversPath, file),
          'utf8'
        );

        const resolverName = file.replace('.ts', '');
        output.info(`  📄 ${resolverName}`);

        // Extract query/mutation/field resolver names
        const queries = content.match(/@Query\(\)[^]*?async\s+(\w+)/g) || [];
        const mutations = content.match(/@Mutation\(\)[^]*?async\s+(\w+)/g) || [];
        const fieldResolvers = content.match(/@FieldResolver\(\)[^]*?async\s+(\w+)/g) || [];

        if (queries.length > 0) {
          output.info(`     Queries: ${queries.map(q => q.match(/async\s+(\w+)/)?.[1]).join(', ')}`);
        }
        if (mutations.length > 0) {
          output.info(`     Mutations: ${mutations.map(m => m.match(/async\s+(\w+)/)?.[1]).join(', ')}`);
        }
        if (fieldResolvers.length > 0) {
          output.info(`     Fields: ${fieldResolvers.map(f => f.match(/async\s+(\w+)/)?.[1]).join(', ')}`);
        }
        output.info('');
      }
    }

    // IPC Handlers
    output.success('⚡ IPC Handlers:\n');
    const handlersPath = path.join(process.cwd(), 'main/handlers/registry.ts');
    if (fs.existsSync(handlersPath)) {
      const content = await fs.promises.readFile(handlersPath, 'utf8');

      // Extract handler keys
      const handlers = content.match(/'[^']+'/g) || [];
      const uniqueHandlers = [...new Set(handlers)].sort();

      const grouped: Record<string, string[]> = {};
      for (const handler of uniqueHandlers) {
        const clean = handler.replace(/'/g, '');
        const [prefix] = clean.split(':');
        if (!grouped[prefix]) grouped[prefix] = [];
        grouped[prefix].push(clean);
      }

      for (const [prefix, handlers] of Object.entries(grouped)) {
        output.info(`  📡 ${prefix}:`);
        handlers.forEach(h => output.info(`     ${h}`));
        output.info('');
      }
    }

    output.info('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    output.error('❌ Failed to list routes', errorMsg);
    process.exit(1);
  }
}

/**
 * List - Show all available utilities with categories
 */
export function listCommand() {
  output.info('\n🔧 Available Utilities:\n');
  output.info('Development:');
  output.info('  clean                    Clean build artifacts and generated files');
  output.info('  dev                      Start development environment');
  output.info('  schema                   Generate GraphQL schema');
  output.info('  console                  Start interactive REPL');
  output.info('');
  output.info('Database:');
  output.info('  seed                     Seed database with test data');
  output.info('  db:stats                 Show database table counts');
  output.info('  db:inspect [entity]      Inspect entity schema');
  output.info('  db:snapshot              Create database backup');
  output.info('  db:restore-snapshot      Restore from latest backup');
  output.info('');
  output.info('Build & Deploy:');
  output.info('  build                    Build production application');
  output.info('');
  output.info('Information:');
  output.info('  info                     Show project health dashboard');
  output.info('  routes                   List GraphQL resolvers and IPC handlers');
  output.info('  list                     Show this help');
  output.info('\n💡 Quick Commands (package.json):');
  output.info('  yarn check               Run type-check + lint + test');
  output.info('  yarn fresh               Clean + install + seed + dev');
  output.info('  yarn fix                 Auto-fix linting issues');
  output.info('  yarn type-check          Type check without building');
  output.info('  yarn clean:deep          Nuclear clean (node_modules + all)');
  output.info('');
}

/**
 * Helper: Get directory size recursively
 */
async function getDirectorySize(dirPath: string): Promise<number> {
  const fs = await import('fs');
  const path = await import('path');

  let size = 0;
  const files = await fs.promises.readdir(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = await fs.promises.stat(filePath);

    if (stats.isDirectory()) {
      size += await getDirectorySize(filePath);
    } else {
      size += stats.size;
    }
  }

  return size;
}
