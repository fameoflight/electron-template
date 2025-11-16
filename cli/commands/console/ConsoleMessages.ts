/**
 * Console Messages Module
 *
 * Purpose: All user-facing help text, welcome screens, and documentation.
 * Single Responsibility: Display formatted console documentation.
 *
 * This file contains ZERO logic - only text formatting and console output.
 */

import { cyberOutput } from '../../utils/output';

/**
 * Display comprehensive help with all available commands
 */
export function showHelp(context: any): void {
  cyberOutput.info('\nCore Commands:');
  cyberOutput.info('  help()                    - Show this help message');
  cyberOutput.info('  types()                   - Show type information helpers');
  cyberOutput.info('  reload()                  - Reload all modules and context');
  cyberOutput.info('  graphql(query, vars?)     - Execute GraphQL query');
  cyberOutput.info('  exit()                    - Exit the console');
  cyberOutput.info('  clear() / cls()           - Clear console screen');

  cyberOutput.info('\nType Inspection:');
  cyberOutput.info('  typeOf(obj)               - Get type of any value');
  cyberOutput.info('  signature(fn)             - Show function signature');
  cyberOutput.info('  methods(obj)              - List object methods with signatures');
  cyberOutput.info('  props(obj)                - Show properties with types');

  cyberOutput.info('\nData Inspection:');
  cyberOutput.info('  inspect(obj, depth?)      - Pretty-print object with colors');
  cyberOutput.info('  table(array)              - Display array as table');
  cyberOutput.info('  pretty(obj)               - JSON pretty-print');
  cyberOutput.info('  memory()                  - Show memory usage');
  cyberOutput.info('  benchmark(fn, n?)         - Benchmark function execution');

  cyberOutput.info('\nDatabase Utilities:');
  cyberOutput.info('  Entity.[TAB]              - List all entities with ActiveRecord methods');
  cyberOutput.info('  Entity.Name.all()         - Get all records (ActiveRecord-style)');
  cyberOutput.info('  Entity.Name.find(id)      - Find record by ID');
  cyberOutput.info('  Entity.Name.where(query)  - Find records matching conditions');
  cyberOutput.info('  Entity.Name.first()       - Get first record');
  cyberOutput.info('  Entity.Name.last()        - Get last record');
  cyberOutput.info('  Entity.Name.count()       - Count records');
  cyberOutput.info('  Entity.Name.create(data)  - Create new record');
  cyberOutput.info('  Entity.Name.repository   - Access TypeORM repository');
  cyberOutput.info('  getRepository(Entity)     - Get repository for any entity (Rails-style)');
  cyberOutput.info('  tables()                  - List all database tables');
  cyberOutput.info('  schema(entityName?)       - Show entity schema/columns');
  cyberOutput.info('  count(entityName)         - Count records in entity');
  cyberOutput.info('  last(entityName, n?)      - Get last N records (default 10)');
  cyberOutput.info('  truncate(entityName)      - Clear all records from entity');
  cyberOutput.info('  query(sql, params?)       - Execute raw SQL query');

  cyberOutput.info('\nData Factories:');
  cyberOutput.info('  faker                     - Faker.js instance for fake data');
  cyberOutput.info('  create.user(overrides?)   - Create test user');
  cyberOutput.info('  create.users(n, over?)    - Create N test users');
  cyberOutput.info('  create.job(overrides?)    - Create test job');
  cyberOutput.info('  factories.*               - All available factories');

  cyberOutput.info('\nJob Queue Management:');
  cyberOutput.info('  jobs.status()             - Show queue status & running jobs');
  cyberOutput.info('  jobs.stats()              - Show job statistics');
  cyberOutput.info('  jobs.pending()            - List pending jobs');
  cyberOutput.info('  jobs.running()            - List running jobs');
  cyberOutput.info('  jobs.failed()             - List failed jobs (last 20)');
  cyberOutput.info('  jobs.completed()          - List completed jobs (last 20)');
  cyberOutput.info('  jobs.cancel(jobId)        - Cancel a running job');
  cyberOutput.info('  jobs.retry(jobId)         - Retry a failed/pending job');

  cyberOutput.info('\nAvailable Repositories:');
  Object.keys(context)
    .filter(key => key.endsWith('Repository'))
    .forEach(key => cyberOutput.info(`  ${key}`));

  cyberOutput.info('\nAvailable Entities (also via Entity.[TAB]):');
  Object.keys(context)
    .filter(key => /^[A-Z][a-zA-Z]*$/.test(key) && !key.endsWith('Repository') && key !== 'Entity')
    .forEach(key => cyberOutput.info(`  ${key}`));

  cyberOutput.info('\nAvailable Services:');
  Object.keys(context)
    .filter(key => key.endsWith('Service') || key.endsWith('Queue') || key.endsWith('Manager'))
    .forEach(key => cyberOutput.info(`  ${key}`));

  cyberOutput.info('\nQuick Examples:');
  cyberOutput.info('  // Create test data');
  cyberOutput.info('  const user = await create.user({ name: "Alice" })');
  cyberOutput.info('  const users = await create.users(10)');
  cyberOutput.info('');
  cyberOutput.info('  // Query database');
  cyberOutput.info('  const users = await userRepository.find()');
  cyberOutput.info('  table(users)  // Display as table');
  cyberOutput.info('');
  cyberOutput.info('  // Dynamic repository access (Rails-style)');
  cyberOutput.info('  const repo = getRepository(User)');
  cyberOutput.info('  const allUsers = await repo.find()');
  cyberOutput.info('');
  cyberOutput.info('  // Inspect job queue');
  cyberOutput.info('  jobs.status()');
  cyberOutput.info('  const pending = await jobs.pending()');
  cyberOutput.info('');
  cyberOutput.info('  // Database utilities');
  cyberOutput.info('  await count("User")');
  cyberOutput.info('  await last("User", 5)');
  cyberOutput.info('  schema("User")');
  cyberOutput.info('');
  cyberOutput.info('  // Generate fake data');
  cyberOutput.info('  faker.person.fullName()');
  cyberOutput.info('  faker.internet.email()');
  cyberOutput.info('');
}

/**
 * Display welcome message on console startup
 */
export function showWelcomeMessage(): void {
  cyberOutput.info('\nWelcome to the Electron Template Interactive Console!\n');
  cyberOutput.info('Enhanced REPL with powerful utilities:');
  cyberOutput.info('• Database entities, repositories & utilities');
  cyberOutput.info('• Application services & job queue management');
  cyberOutput.info('• Test factories & Faker.js integration');
  cyberOutput.info('• GraphQL query execution');
  cyberOutput.info('• Data inspection & formatting tools');
  cyberOutput.info('• Performance benchmarking');
  cyberOutput.info('• Type inspection & IntelliSense helpers\n');

  cyberOutput.info('Pro Tips:');
  cyberOutput.info('  • Press TAB to see all available options (Rails-style completion)');
  cyberOutput.info('  • Use Entity.[TAB] to discover all available entities');
  cyberOutput.info('  • TAB completion includes your runtime variables');
  cyberOutput.info('  • Use types() to see all type inspection helpers');
  cyberOutput.info('  • Use methods(obj) to explore available object methods\n');

  cyberOutput.info('Quick Start:');
  cyberOutput.info('  Entity.[TAB]                                        // Discover all entities');
  cyberOutput.info('  const user = await create.user({ name: "Alice" })  // Create test data');
  cyberOutput.info('  const repo = getRepository(Entity.User)             // Get any repository');
  cyberOutput.info('  const users = await repo.find()                     // Query database');
  cyberOutput.info('  table(users)                                        // Display as table');
  cyberOutput.info('  methods(repo)                                       // See available methods');
  cyberOutput.info('  jobs.status()                                       // Check job queue\n');

  cyberOutput.info('Type help() for full command list, types() for type helpers\n');
}

/**
 * Display type inspection helpers documentation
 */
export function showTypesHelp(): void {
  cyberOutput.info('═══════════════════════════════════════');
  cyberOutput.info('         Type Inspection Guide');
  cyberOutput.info('═══════════════════════════════════════\n');

  cyberOutput.info('Type Information Helpers:\n');
  cyberOutput.info('  typeOf(obj)              - Get the type of any value');
  cyberOutput.info('  signature(fn)            - Show function signature');
  cyberOutput.info('  methods(obj)             - List all methods on an object');
  cyberOutput.info('  props(obj)               - List all properties with types');
  cyberOutput.info('  types()                  - Show this reference\n');

  cyberOutput.info('Quick Examples:\n');
  cyberOutput.info('  typeOf(User)             // "Function" (Entity class)');
  cyberOutput.info('  typeOf(userRepository)   // "Repository"');
  cyberOutput.info('  signature(create.user)   // "async function(overrides)"');
  cyberOutput.info('  methods(userRepository)  // Lists all repository methods');
  cyberOutput.info('  props(jobs)              // Shows jobs object structure\n');

  cyberOutput.info('═══════════════════════════════════════\n');
}
