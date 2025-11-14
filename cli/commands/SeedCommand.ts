import { BaseCommand, type CommandResult } from '../utils/BaseCommand.js';
import { getAppDataSource, getEntity } from '../../main/db/dataSource.js';
import { faker } from '@faker-js/faker';
import type { DataSource } from 'typeorm';
import { ConnectionKind } from '../../main/db/entities/__generated__/ConnectionBase.js';
import { LLMModelCapability } from '../../main/db/entities/__generated__/LLMModelBase.js';
import { Connection } from '../../main/db/entities/Connection.js';
import type { LLMModel } from '../../main/db/entities/LLMModel.js';
import { User } from '../../main/base/db/User.js';
import fs from 'fs/promises';
import { getDatabasePath } from '../../main/base/utils/common/paths.js';

interface SeedOptions {
  synchronize: boolean;
  force?: boolean; // Override safety checks
}

interface SeedResult {
  usersCreated: number;
  connectionsCreated: number;
  llmModelsCreated: number;
  credentials?: { username: string; password: string };
  alreadyExisted: boolean;
}

/**
 * Seed Command - Seed database with test data
 */
export class SeedCommand extends BaseCommand {
  async run(options: Record<string, unknown>): Promise<CommandResult<SeedResult>> {
    const seedOptions = options as unknown as SeedOptions;

    this.info('🌱 Starting database seeding...');

    let dataSource: DataSource | undefined;
    const result: SeedResult = {
      usersCreated: 0,
      connectionsCreated: 0,
      llmModelsCreated: 0,
      alreadyExisted: false
    };

    try {
      // Step 1: Safety checks
      this.step(1, 6, 'Validating database state...');

      const dbPath = getDatabasePath();

      // Check if database file exists
      try {
        await fs.access(dbPath);
        this.success('Database file exists');
      } catch (error) {
        this.error('❌ Database file not found:', dbPath);
        this.error('💡 Please run migrations first: yarn migration:run');
        return {
          success: false,
          message: `Database file not found: ${dbPath}. Run migrations first.`,
          data: result
        };
      }

      // Initialize data source for validation
      dataSource = await getAppDataSource({ synchronize: false });
      await dataSource?.initialize();
      this.success('Database connection established');

      // Check for pending migrations (unless force flag is used)
      if (!seedOptions.force) {
        this.step(2, 6, 'Checking for pending migrations...');

        const hasPendingMigrations = await dataSource?.showMigrations();
        if (hasPendingMigrations) {
          this.error('❌ Pending migrations detected');
          this.error('💡 Please run migrations first: yarn migration:run');
          this.error('💡 Or use --force flag to skip this check (not recommended)');

          await dataSource?.destroy();
          return {
            success: false,
            message: 'Pending migrations detected. Run migrations first or use --force flag.',
            data: result
          };
        }
        this.success('No pending migrations');
      } else {
        this.warning('⚠️  Skipping migration check due to --force flag');
      }

      // Close validation connection and proceed with actual data source
      await dataSource?.destroy();

      this.step(3, 6, 'Initializing database for seeding...');

      // Get data source with synchronize option
      dataSource = await getAppDataSource({ synchronize: seedOptions.synchronize });
      await dataSource?.initialize();

      if (seedOptions.synchronize) {
        this.warning('⚠️  Database initialized with synchronize enabled (bypasses migrations)');
      } else {
        this.success('Database initialized without schema synchronization');
      }

      this.step(4, 6, 'Checking existing data...');

      this.step(5, 6, 'Creating seed data...');

      // Check if test user already exists
      let user = await dataSource?.manager.findOne(User, {
        where: { username: 'test' }
      });

      if (user) {
        this.info('Test user already exists:', user.username, `(${user.username})`);
        result.credentials = {
          username: user.username,
          password: 'test'
        };
        result.alreadyExisted = true;
      } else {
        // Create test user via helper
        user = await this.createUser(dataSource!);
        result.usersCreated = 1;
        this.success(`Created user: ${user.username} (${user.username})`);
        result.credentials = {
          username: user.username,
          password: 'test'
        };
      }

      this.step(6, 6, 'Creating connections and LLM models...');

      // Check if LM Studio connection already exists for this user
      let connection = await dataSource?.manager.findOne(Connection, {
        where: {
          userId: user.id,
          name: 'LM Studio',
          provider: 'LM Studio'
        }
      });

      if (!connection) {
        // Create test connection
        connection = await this.createConnection(dataSource!, user.id);
        result.connectionsCreated = 1;
        this.success(`Created connection: ${connection.name}`);
      } else {
        this.info('LM Studio connection already exists:', connection.name);
      }

      // Check if Gemma 3 4B model already exists for this connection
      const LLMModelEntity = getEntity('LLMModel');
      const savedConnection = connection as Connection & { id: string };
      let llmModel = await dataSource?.manager.findOne(LLMModelEntity, {
        where: {
          userId: user.id,
          connectionId: savedConnection.id,
          name: 'Gemma 3 4B',
          modelIdentifier: 'google/gemma-3-4b'
        }
      });

      if (!llmModel) {
        // Create LLM model for the connection
        llmModel = await this.createLLMModel(dataSource!, user.id, savedConnection.id);
        result.llmModelsCreated = 1;
        this.success(`Created LLM model: ${llmModel.name}`);
      } else {
        this.info('Gemma 3 4B model already exists:', llmModel.name);
      }

      this.success('🎉 Database seeding completed successfully!');

      return {
        success: true,
        message: `Database seeded successfully with ${result.usersCreated} user(s)`,
        data: result
      };

    } catch (error) {
      this.error('🔴 Seeding failed:', error);

      return {
        success: false,
        message: `Seeding failed: ${error instanceof Error ? error.message : String(error)}`,
        data: result
      };
    } finally {
      if (dataSource?.isInitialized) {
        try {
          await dataSource.destroy();
          this.info('Database connection closed');
        } catch (error) {
          this.warning('Failed to close database connection:', error);
        }
      }
    }
  }

  /**
   * Create a test user and return the saved entity
   */
  private async createUser(dataSource: DataSource): Promise<User> {
    const User = getEntity('User');
    const user = new User();
    user.name = 'Test User';
    user.username = 'test';
    user.password = 'test';
    user.sessionKey = faker.string.alphanumeric(32);
    return await dataSource.manager.save(user);
  }

  /**
   * Create a test connection and return the saved entity
   */
  private async createConnection(dataSource: DataSource, userId: string): Promise<Connection> {
    const ConnectionEntity = getEntity('Connection');
    const connection = new ConnectionEntity();
    connection.name = 'LM Studio';
    connection.apiKey = 'not-required';
    connection.baseUrl = 'http://localhost:1234/v1';
    connection.kind = ConnectionKind.OPENAI;
    connection.provider = 'LM Studio';
    Object.assign(connection, { userId });
    connection.customHeaders = {
      'Content-Type': 'application/json'
    };
    return await dataSource.manager.save(connection) as Connection;
  }

  /**
   * Create a test LLM model and return the saved entity
   */
  private async createLLMModel(dataSource: DataSource, userId: string, connectionId: string): Promise<LLMModel> {
    const LLMModelEntity = getEntity('LLMModel');
    const llmModel = new LLMModelEntity();
    llmModel.name = 'Gemma 3 4B';
    llmModel.modelIdentifier = 'google/gemma-3-4b';
    llmModel.temperature = 0.7;
    llmModel.contextLength = 4096;
    llmModel.capabilities = [LLMModelCapability.TEXT, LLMModelCapability.VISION];
    Object.assign(llmModel, { userId });
    llmModel.connectionId = connectionId;
    llmModel.default = true;
    return await dataSource.manager.save(llmModel) as LLMModel;
  }

  /**
   * Print additional seed result information
   */
  protected printData(data: SeedResult): void {
    super.printData(data);

    console.log('\n📊 Seed Data Summary:');
    console.log('─'.repeat(40));

    if (data.alreadyExisted) {
      console.log('   🟢 Seed data already exists - no changes made');
    } else {
      console.log(`   - Users created: ${data.usersCreated}`);
      console.log(`   - Connections created: ${data.connectionsCreated}`);
      console.log(`   - LLM Models created: ${data.llmModelsCreated}`);
    }

    if (data.credentials) {
      console.log('\n🔑 Login Credentials:');
      console.log(`   Username: ${data.credentials.username}`);
      console.log(`   Password: ${data.credentials.password}`);
    }
    console.log('─'.repeat(40));
  }
}