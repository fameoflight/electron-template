/**
 * Console Manager - Main Orchestrator
 *
 * Purpose: Coordinate the initialization and lifecycle of the interactive REPL console.
 * Single Responsibility: Orchestrate modules (Context, REPL, Messages, Completion).
 *
 * This is the entry point that ties everything together.
 */

import { Command } from 'commander';
import * as path from 'path';
import * as os from 'os';
import { REPLServer } from 'repl';
import 'reflect-metadata';
import { initializeDatabase } from '../../../main/db/dataSource.js';
import { initializeGraphQLSchema } from '../../../main/graphql/server.js';
import { GraphQLVariables } from '../../../shared/types.js';
import { buildContext } from './ConsoleContext.js';
import { startReplServer, executeGraphQL } from './ConsoleRepl.js';
import { showHelp, showWelcomeMessage } from './ConsoleMessages.js';

export class ConsoleManager {
  private replServer: REPLServer | null = null;
  private historyPath: string;
  private context: any = {};
  private dataSource: any = null;

  constructor() {
    this.historyPath = path.join(os.homedir(), '.app_console_history');
    console.log('🚀 Initializing Electron Template Console...\n');
  }

  /**
   * Start the interactive REPL with full application context
   */
  async start(): Promise<void> {
    try {
      // Initialize database connection
      console.log('📊 Initializing database connection...');
      this.dataSource = await initializeDatabase();
      console.log('✅ Database connected');

      // Initialize GraphQL schema
      console.log('🔷 Initializing GraphQL schema...');
      await initializeGraphQLSchema();
      console.log('✅ GraphQL schema ready');

      // Initialize services
      console.log('⚙️  Loading application services...');
      const services = await this.initializeServices();
      console.log('✅ Services loaded');

      // Build REPL context
      this.context = await buildContext(
        this.dataSource,
        services,
        this.reload.bind(this),
        this.executeGraphQLQuery.bind(this)
      );

      // Add help to context
      this.context.help = () => showHelp(this.context);

      // Show welcome message BEFORE starting REPL to avoid prompt issues
      console.log('\n🎉 Console ready!');
      showWelcomeMessage();

      // Start REPL server (must be last to avoid prompt display issues)
      this.replServer = startReplServer(
        this.historyPath,
        this.context,
        (repl) => {
          // Ensure prompt is displayed after all initialization
          setImmediate(() => {
            repl.displayPrompt();
          });
        }
      );

    } catch (error) {
      console.error('\n❌ Failed to initialize console:', error);
      process.exit(1);
    }
  }

  /**
   * Initialize application services
   */
  private async initializeServices() {
    const JobQueueClass = (await import('../../../main/services/JobQueue.js')).default;

    return {
      jobQueue: new JobQueueClass(),
      // Add more services as needed
    };
  }

  /**
   * Reload modules and context
   */
  private async reload(): Promise<void> {
    console.log('🔄 Reloading modules...');

    try {
      // Clear require cache to force reload
      Object.keys(require.cache).forEach(key => {
        if (key.includes('/main/') || key.includes('/shared/')) {
          delete require.cache[key];
        }
      });

      // Re-initialize services and context
      const services = await this.initializeServices();
      this.context = await buildContext(
        this.dataSource,
        services,
        this.reload.bind(this),
        this.executeGraphQLQuery.bind(this)
      );

      // Add help to context
      this.context.help = () => showHelp(this.context);

      // Update global context
      Object.assign(global, this.context);

      console.log('✅ Reload complete');
    } catch (error) {
      console.error('❌ Reload failed:', error);
    }
  }

  /**
   * Execute GraphQL query helper
   */
  private async executeGraphQLQuery(query: string, variables?: GraphQLVariables): Promise<any> {
    return executeGraphQL(query, variables);
  }
}

/**
 * Console command definition
 */
export const consoleCommand = new Command('console')
  .description('Start interactive REPL with full application context')
  .option('--no-history', 'Disable command history persistence', false)
  .option('--no-services', 'Skip loading application services', false)
  .action(async (options) => {
    try {
      const consoleManager = new ConsoleManager();
      await consoleManager.start();
    } catch (error) {
      console.error('❌ Console failed to start:', error);
      process.exit(1);
    }
  });
