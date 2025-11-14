/**
 * Info Commands
 *
 * Provides utilities for project information, routes listing, and general help
 */

import { initializeDatabase } from '../../main/db/dataSource';

/**
 * Project Info - Show project health and statistics
 */
export async function projectInfoCommand() {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { execSync } = await import('child_process');

    console.log('\n📊 Project Information\n');
    console.log('═══════════════════════════════════════\n');

    // Package info
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log(`📦 Package: ${pkg.name} v${pkg.version}`);
    console.log(`   ${pkg.description}\n`);

    // Git info
    try {
      const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      const commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
      const changed = execSync('git status --porcelain', { encoding: 'utf8' }).trim().split('\n').length;
      console.log(`🔀 Git: ${branch} @ ${commit}`);
      console.log(`   Changed files: ${changed || 0}\n`);
    } catch (e) {
      console.log('🔀 Git: Not a git repository\n');
    }

    // Database info
    const dbPath = path.join(process.cwd(), '.data');
    if (fs.existsSync(dbPath)) {
      const size = await getDirectorySize(dbPath);
      console.log(`💾 Database: .data/`);
      console.log(`   Size: ${(size / 1024 / 1024).toFixed(2)} MB\n`);

      // Get record counts if possible
      try {
        const dataSource = await initializeDatabase();

        console.log('📊 Records:');
        for (const meta of dataSource.entityMetadatas) {
          const repo = dataSource.getRepository(meta.name);
          const count = await repo.count();
          console.log(`   ${meta.name.padEnd(20)} ${count.toString().padStart(6)}`);
        }
        console.log('');

        await dataSource.destroy();
      } catch (e) {
        console.log('   (Database not accessible)\n');
      }
    } else {
      console.log('💾 Database: Not initialized\n');
    }

    // Snapshots
    const files = await fs.promises.readdir(process.cwd());
    const snapshots = files.filter(f => f.startsWith('.data.backup-'));
    if (snapshots.length > 0) {
      console.log(`💿 Snapshots: ${snapshots.length} available`);
      console.log(`   Latest: ${snapshots.sort().reverse()[0]}\n`);
    }

    // Dependencies
    const deps = Object.keys(pkg.dependencies || {}).length;
    const devDeps = Object.keys(pkg.devDependencies || {}).length;
    console.log(`📚 Dependencies: ${deps} prod, ${devDeps} dev\n`);

    // Disk usage
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      const nmSize = await getDirectorySize(nodeModulesPath);
      console.log(`💽 Disk Usage:`);
      console.log(`   node_modules: ${(nmSize / 1024 / 1024).toFixed(2)} MB`);
    }

    console.log('\n═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to get project info:', error);
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

    console.log('\n📍 Application Routes\n');
    console.log('═══════════════════════════════════════\n');

    // GraphQL Resolvers
    console.log('🔷 GraphQL Resolvers:\n');
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
        console.log(`  📄 ${resolverName}`);

        // Extract query/mutation/field resolver names
        const queries = content.match(/@Query\(\)[^]*?async\s+(\w+)/g) || [];
        const mutations = content.match(/@Mutation\(\)[^]*?async\s+(\w+)/g) || [];
        const fieldResolvers = content.match(/@FieldResolver\(\)[^]*?async\s+(\w+)/g) || [];

        if (queries.length > 0) {
          console.log(`     Queries: ${queries.map(q => q.match(/async\s+(\w+)/)?.[1]).join(', ')}`);
        }
        if (mutations.length > 0) {
          console.log(`     Mutations: ${mutations.map(m => m.match(/async\s+(\w+)/)?.[1]).join(', ')}`);
        }
        if (fieldResolvers.length > 0) {
          console.log(`     Fields: ${fieldResolvers.map(f => f.match(/async\s+(\w+)/)?.[1]).join(', ')}`);
        }
        console.log('');
      }
    }

    // IPC Handlers
    console.log('⚡ IPC Handlers:\n');
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
        console.log(`  📡 ${prefix}:`);
        handlers.forEach(h => console.log(`     ${h}`));
        console.log('');
      }
    }

    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to list routes:', error);
    process.exit(1);
  }
}

/**
 * List - Show all available utilities with categories
 */
export function listCommand() {
  console.log('\n🔧 Available Utilities:\n');
  console.log('Development:');
  console.log('  clean                    Clean build artifacts and generated files');
  console.log('  dev                      Start development environment');
  console.log('  schema                   Generate GraphQL schema');
  console.log('  console                  Start interactive REPL');
  console.log('');
  console.log('Database:');
  console.log('  seed                     Seed database with test data');
  console.log('  db:stats                 Show database table counts');
  console.log('  db:inspect [entity]      Inspect entity schema');
  console.log('  db:snapshot              Create database backup');
  console.log('  db:restore-snapshot      Restore from latest backup');
  console.log('');
  console.log('Build & Deploy:');
  console.log('  build                    Build production application');
  console.log('');
  console.log('Information:');
  console.log('  info                     Show project health dashboard');
  console.log('  routes                   List GraphQL resolvers and IPC handlers');
  console.log('  list                     Show this help');
  console.log('\n💡 Quick Commands (package.json):');
  console.log('  yarn check               Run type-check + lint + test');
  console.log('  yarn fresh               Clean + install + seed + dev');
  console.log('  yarn fix                 Auto-fix linting issues');
  console.log('  yarn type-check          Type check without building');
  console.log('  yarn clean:deep          Nuclear clean (node_modules + all)');
  console.log('');
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
