/**
 * Console Messages Module
 * 
 * Purpose: All user-facing help text, welcome screens, and documentation.
 * Single Responsibility: Display formatted console documentation.
 * 
 * This file contains ZERO logic - only text formatting and console output.
 */

/**
 * Display comprehensive help with all available commands
 */
export function showHelp(context: any): void {
  console.log('\n📚 Core Commands:');
  console.log('  help()                    - Show this help message');
  console.log('  types()                   - Show type information helpers');
  console.log('  reload()                  - Reload all modules and context');
  console.log('  graphql(query, vars?)     - Execute GraphQL query');
  console.log('  exit()                    - Exit the console');
  console.log('  clear() / cls()           - Clear console screen');

  console.log('\n🔍 Type Inspection:');
  console.log('  typeOf(obj)               - Get type of any value');
  console.log('  signature(fn)             - Show function signature');
  console.log('  methods(obj)              - List object methods with signatures');
  console.log('  props(obj)                - Show properties with types');

  console.log('\n🎨 Data Inspection:');
  console.log('  inspect(obj, depth?)      - Pretty-print object with colors');
  console.log('  table(array)              - Display array as table');
  console.log('  pretty(obj)               - JSON pretty-print');
  console.log('  memory()                  - Show memory usage');
  console.log('  benchmark(fn, n?)         - Benchmark function execution');

  console.log('\n🗄️  Database Utilities:');
  console.log('  Entity.[TAB]              - List all entities with ActiveRecord methods');
  console.log('  Entity.Name.all()         - Get all records (ActiveRecord-style)');
  console.log('  Entity.Name.find(id)      - Find record by ID');
  console.log('  Entity.Name.where(query)  - Find records matching conditions');
  console.log('  Entity.Name.first()       - Get first record');
  console.log('  Entity.Name.last()        - Get last record');
  console.log('  Entity.Name.count()       - Count records');
  console.log('  Entity.Name.create(data)  - Create new record');
  console.log('  Entity.Name.repository   - Access TypeORM repository');
  console.log('  getRepository(Entity)     - Get repository for any entity (Rails-style)');
  console.log('  tables()                  - List all database tables');
  console.log('  schema(entityName?)       - Show entity schema/columns');
  console.log('  count(entityName)         - Count records in entity');
  console.log('  last(entityName, n?)      - Get last N records (default 10)');
  console.log('  truncate(entityName)      - Clear all records from entity');
  console.log('  query(sql, params?)       - Execute raw SQL query');

  console.log('\n🏭 Data Factories:');
  console.log('  faker                     - Faker.js instance for fake data');
  console.log('  create.user(overrides?)   - Create test user');
  console.log('  create.users(n, over?)    - Create N test users');
  console.log('  create.job(overrides?)    - Create test job');
  console.log('  factories.*               - All available factories');

  console.log('\n⚙️  Job Queue Management:');
  console.log('  jobs.status()             - Show queue status & running jobs');
  console.log('  jobs.stats()              - Show job statistics');
  console.log('  jobs.pending()            - List pending jobs');
  console.log('  jobs.running()            - List running jobs');
  console.log('  jobs.failed()             - List failed jobs (last 20)');
  console.log('  jobs.completed()          - List completed jobs (last 20)');
  console.log('  jobs.cancel(jobId)        - Cancel a running job');
  console.log('  jobs.retry(jobId)         - Retry a failed/pending job');

  console.log('\n📊 Available Repositories:');
  Object.keys(context)
    .filter(key => key.endsWith('Repository'))
    .forEach(key => console.log(`  ${key}`));

  console.log('\n🔷 Available Entities (also via Entity.[TAB]):');
  Object.keys(context)
    .filter(key => /^[A-Z][a-zA-Z]*$/.test(key) && !key.endsWith('Repository') && key !== 'Entity')
    .forEach(key => console.log(`  ${key}`));

  console.log('\n⚙️  Available Services:');
  Object.keys(context)
    .filter(key => key.endsWith('Service') || key.endsWith('Queue') || key.endsWith('Manager'))
    .forEach(key => console.log(`  ${key}`));

  console.log('\n💡 Quick Examples:');
  console.log('  // Create test data');
  console.log('  const user = await create.user({ name: "Alice" })');
  console.log('  const users = await create.users(10)');
  console.log('');
  console.log('  // Query database');
  console.log('  const users = await userRepository.find()');
  console.log('  table(users)  // Display as table');
  console.log('');
  console.log('  // Dynamic repository access (Rails-style)');
  console.log('  const repo = getRepository(User)');
  console.log('  const allUsers = await repo.find()');
  console.log('');
  console.log('  // Inspect job queue');
  console.log('  jobs.status()');
  console.log('  const pending = await jobs.pending()');
  console.log('');
  console.log('  // Database utilities');
  console.log('  await count("User")');
  console.log('  await last("User", 5)');
  console.log('  schema("User")');
  console.log('');
  console.log('  // Generate fake data');
  console.log('  faker.person.fullName()');
  console.log('  faker.internet.email()');
  console.log('');
}

/**
 * Display welcome message on console startup
 */
export function showWelcomeMessage(): void {
  console.log('\n🎯 Welcome to the Electron Template Interactive Console!\n');
  console.log('Enhanced REPL with powerful utilities:');
  console.log('• 🗄️  Database entities, repositories & utilities');
  console.log('• ⚙️  Application services & job queue management');
  console.log('• 🏭 Test factories & Faker.js integration');
  console.log('• 🔷 GraphQL query execution');
  console.log('• 🎨 Data inspection & formatting tools');
  console.log('• ⏱️  Performance benchmarking');
  console.log('• 🔍 Type inspection & IntelliSense helpers\n');

  console.log('💡 Pro Tips:');
  console.log('  • Press TAB to see all available options (Rails-style completion)');
  console.log('  • Use Entity.[TAB] to discover all available entities');
  console.log('  • TAB completion includes your runtime variables');
  console.log('  • Use types() to see all type inspection helpers');
  console.log('  • Use methods(obj) to explore available object methods\n');

  console.log('Quick Start:');
  console.log('  Entity.[TAB]                                        // Discover all entities');
  console.log('  const user = await create.user({ name: "Alice" })  // Create test data');
  console.log('  const repo = getRepository(Entity.User)             // Get any repository');
  console.log('  const users = await repo.find()                     // Query database');
  console.log('  table(users)                                        // Display as table');
  console.log('  methods(repo)                                       // See available methods');
  console.log('  jobs.status()                                       // Check job queue\n');

  console.log('Type help() for full command list, types() for type helpers\n');
}

/**
 * Display type inspection helpers documentation
 */
export function showTypesHelp(): void {
  console.log('═══════════════════════════════════════');
  console.log('         🔍 Type Inspection Guide');
  console.log('═══════════════════════════════════════\n');

  console.log('💡 Type Information Helpers:\n');
  console.log('  typeOf(obj)              - Get the type of any value');
  console.log('  signature(fn)            - Show function signature');
  console.log('  methods(obj)             - List all methods on an object');
  console.log('  props(obj)               - List all properties with types');
  console.log('  types()                  - Show this reference\n');

  console.log('🎯 Quick Examples:\n');
  console.log('  typeOf(User)             // "Function" (Entity class)');
  console.log('  typeOf(userRepository)   // "Repository"');
  console.log('  signature(create.user)   // "async function(overrides)"');
  console.log('  methods(userRepository)  // Lists all repository methods');
  console.log('  props(jobs)              // Shows jobs object structure\n');

  console.log('═══════════════════════════════════════\n');
}
