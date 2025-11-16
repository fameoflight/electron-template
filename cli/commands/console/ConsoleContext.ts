/**
 * Console Context Module
 *
 * Purpose: Build the complete REPL context with all utilities, helpers, and data access.
 * Single Responsibility: Populate the console environment with all available functions and objects.
 *
 * This is the "meat" of the console - it defines every function and utility available in the REPL.
 */

import { inspect } from 'util';
import { faker } from '@faker-js/faker';
import { loadEntities } from '../../../main/db/entityMap.js';
import { JobStatus } from '../../../main/db/entities/__generated__/JobBase.js';
import { showTypesHelp } from './ConsoleMessages.js';
import { cyberOutput } from '../../utils/output.js';

/**
 * Build complete REPL context with all utilities
 *
 * @param dataSource - TypeORM DataSource
 * @param services - Application services (jobQueue, etc.)
 * @param reloadCallback - Callback to reload console
 * @param graphqlCallback - Callback to execute GraphQL queries
 * @returns Populated context object
 */
export async function buildContext(
  dataSource: any,
  services: any,
  reloadCallback: () => Promise<void>,
  graphqlCallback: (query: string, variables?: any) => Promise<any>
): Promise<any> {
  const context: any = {};

  // Load entities dynamically
  const entities = await loadEntities();

  // Add entities to context
  Object.assign(context, entities);

  // Create Entity namespace for discovery (Rails-style: Entity.[TAB])
  // Add ActiveRecord-style convenience methods
  const entityMethods: any = {};
  for (const [name, entity] of Object.entries(entities)) {
    entityMethods[name] = {
      // Direct access to entity class
      class: entity,
      // ActiveRecord-style methods
      all: async () => {
        const repo = dataSource.getRepository(entity as any);
        return await repo.find();
      },
      find: async (id: string) => {
        const repo = dataSource.getRepository(entity as any);
        return await repo.findOne({ where: { id } });
      },
      where: async (conditions: any) => {
        const repo = dataSource.getRepository(entity as any);
        return await repo.find({ where: conditions });
      },
      first: async () => {
        const repo = dataSource.getRepository(entity as any);
        return await repo.findOne({ order: { createdAt: 'ASC' as any } });
      },
      last: async () => {
        const repo = dataSource.getRepository(entity as any);
        return await repo.findOne({ order: { createdAt: 'DESC' as any } });
      },
      count: async () => {
        const repo = dataSource.getRepository(entity as any);
        return await repo.count();
      },
      create: async (data: any) => {
        const repo = dataSource.getRepository(entity as any);
        const instance = repo.create(data);
        return await repo.save(instance);
      },
      // Access to repository for advanced operations
      repository: dataSource.getRepository(entity as any)
    };
  }

  context.Entity = entityMethods;

  // Add repositories to context
  for (const [name, entity] of Object.entries(entities)) {
    const repositoryName = `${name.toLowerCase()}Repository`;
    context[repositoryName] = dataSource.getRepository(entity as any);
  }

  // Add services to context
  Object.assign(context, services);

  // Add database and utilities
  context.dataSource = dataSource;
  context.query = (sql: string, params?: any[]) => dataSource.query(sql, params);

  // Add dynamic repository getter (Rails-style)
  context.getRepository = (entity: any) => {
    try {
      return dataSource.getRepository(entity);
    } catch (error) {
      cyberOutput.error('Could not get repository for entity', error instanceof Error ? error : String(error));
      cyberOutput.info('Available entities:');
      dataSource.entityMetadatas.forEach((meta: any) => {
        cyberOutput.info(`  - ${meta.name}`);
      });
      return null;
    }
  };

  // Add core helper functions
  context.reload = reloadCallback;
  context.graphql = graphqlCallback;
  context.exit = () => process.exit(0);

  // Add data generation tools
  context.faker = faker;
  context.factories = await loadFactories();
  context.create = createFactoryShortcuts(dataSource);

  // Add inspection utilities
  addInspectionUtilities(context);

  // Add database utilities
  addDatabaseUtilities(context, dataSource);

  // Add job queue utilities
  addJobQueueUtilities(context, services);

  // Add performance utilities
  addPerformanceUtilities(context);

  // Add convenience utilities
  context.clear = context.cls = () => console.clear();

  // Add type inspection helpers
  addTypeInspectionHelpers(context);

  // Make context global for easier access
  Object.assign(global, context);

  return context;
}

// Note: loadEntities is now imported from entityMap.js (no local implementation needed)

/**
 * Load test factories for data generation
 */
async function loadFactories(): Promise<any> {
  try {
    const factories = await import('../../../__tests__/factories/index.js');
    return factories;
  } catch (error) {
    cyberOutput.warning('Could not load test factories', error instanceof Error ? error.message : String(error));
    return {};
  }
}

/**
 * Create factory shortcuts for common entities
 */
function createFactoryShortcuts(dataSource: any): any {
  return {
    user: async (overrides?: any) => {
      const { createUser } = await import('../../../__tests__/factories/userFactory.js');
      return await createUser(dataSource, overrides);
    },
    users: async (count: number = 5, overrides?: any) => {
      const { createUsers } = await import('../../../__tests__/factories/userFactory.js');
      return await createUsers(dataSource, count, overrides);
    },
    job: async (overrides?: any) => {
      const { createTestJob } = await import('../../../__tests__/factories/jobFactory.js');
      return await createTestJob(dataSource, overrides);
    }
  };
}

/**
 * Add data inspection utilities to context
 */
function addInspectionUtilities(context: any): void {
  context.inspect = (obj: any, depth: number = 3) => {
    console.log(inspect(obj, { colors: true, depth, maxArrayLength: 100 }));
  };

  context.table = (data: any[]) => {
    if (Array.isArray(data) && data.length > 0) {
      console.table(data);
    } else {
      cyberOutput.info('No data to display');
    }
  };

  context.pretty = (obj: any) => {
    console.log(JSON.stringify(obj, null, 2));
  };
}

/**
 * Add database utilities to context
 */
function addDatabaseUtilities(context: any, dataSource: any): void {
  context.tables = async () => {
    const tables = dataSource.entityMetadatas.map((meta: any) => ({
      name: meta.tableName,
      entity: meta.name
    }));
    console.table(tables);
  };

  context.schema = async (entityName?: string) => {
    if (entityName) {
      const metadata = dataSource.getMetadata(entityName);
      const columns = metadata.columns.map((col: any) => ({
        name: col.propertyName,
        type: col.type,
        nullable: col.isNullable,
        unique: col.isUnique,
        primary: col.isPrimary
      }));
      console.table(columns);
    } else {
      cyberOutput.info('Usage: schema("EntityName")');
      cyberOutput.info('Available entities:');
      dataSource.entityMetadatas.forEach((meta: any) => {
        cyberOutput.info(`  - ${meta.name}`);
      });
    }
  };

  context.truncate = async (entityName: string) => {
    const repo = dataSource.getRepository(entityName);
    const result = await repo.clear();
    cyberOutput.success(`Truncated ${entityName}`);
    return result;
  };

  context.count = async (entityName: string) => {
    const repo = dataSource.getRepository(entityName);
    const count = await repo.count();
    cyberOutput.info(`${entityName}: ${count} records`);
    return count;
  };

  context.last = async (entityName: string, n: number = 10) => {
    const repo = dataSource.getRepository(entityName);
    const records = await repo.find({
      order: { createdAt: 'DESC' as any },
      take: n
    });
    console.table(records);
    return records;
  };
}

/**
 * Add job queue utilities to context
 */
function addJobQueueUtilities(context: any, services: any): void {
  context.jobs = {
    stats: async () => {
      const stats = await services.jobQueue.getStats();
      console.table([stats]);
      return stats;
    },
    status: () => {
      const status = services.jobQueue.getStatus();
      cyberOutput.info('Job Queue Status:');
      cyberOutput.info(`Running: ${status.isRunning ? '✅' : '❌'}`);
      cyberOutput.info(`Interval: ${status.intervalMs}ms`);
      cyberOutput.info(`Concurrency: ${status.concurrency.current}/${status.concurrency.max}`);
      cyberOutput.info(`Registered Job Types (${status.jobTypes.length}):`);
      status.jobTypes.forEach((type: string) => cyberOutput.info(`  - ${type}`));

      if (status.runningJobs.length > 0) {
        cyberOutput.info(`Running Jobs (${status.runningJobs.length}):`);
        console.table(status.runningJobs.map((job: any) => ({
          ...job,
          duration: `${(job.duration / 1000).toFixed(1)}s`
        })));
      }
      return status;
    },
    pending: async () => {
      const jobRepo = context.dataSource.getRepository('Job');
      const pending = await jobRepo.find({
        where: { status: JobStatus.PENDING },
        order: { priority: 'DESC' as any, queuedAt: 'ASC' as any },
        take: 20
      });
      console.table(pending);
      return pending;
    },
    running: async () => {
      const jobRepo = context.dataSource.getRepository('Job');
      const running = await jobRepo.find({
        where: { status: JobStatus.RUNNING },
        order: { startedAt: 'ASC' as any }
      });
      console.table(running);
      return running;
    },
    failed: async () => {
      const jobRepo = context.dataSource.getRepository('Job');
      const failed = await jobRepo.find({
        where: { status: JobStatus.FAILED },
        order: { completedAt: 'DESC' as any },
        take: 20
      });
      console.table(failed);
      return failed;
    },
    completed: async () => {
      const jobRepo = context.dataSource.getRepository('Job');
      const completed = await jobRepo.find({
        where: { status: JobStatus.COMPLETED },
        order: { completedAt: 'DESC' as any },
        take: 20
      });
      console.table(completed);
      return completed;
    },
    cancel: async (jobId: string) => {
      const result = await services.jobQueue.cancelJob(jobId);
      if (result) {
        cyberOutput.success(`Cancelled job ${jobId}`);
      } else {
        cyberOutput.error(`Could not cancel job ${jobId} (not running)`);
      }
      return result;
    },
    retry: async (jobId: string) => {
      const result = await services.jobQueue.executeJobById(jobId);
      if (result) {
        cyberOutput.success(`Retrying job ${jobId}`);
      } else {
        cyberOutput.error(`Could not retry job ${jobId}`);
      }
      return result;
    }
  };
}

/**
 * Add performance utilities to context
 */
function addPerformanceUtilities(context: any): void {
  context.benchmark = async (fn: Function, iterations: number = 1) => {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      await fn();
    }
    const end = performance.now();
    const total = end - start;
    const avg = total / iterations;
    cyberOutput.info('Benchmark Results:');
    cyberOutput.info(`Total: ${total.toFixed(2)}ms`);
    cyberOutput.info(`Iterations: ${iterations}`);
    cyberOutput.info(`Average: ${avg.toFixed(2)}ms`);
    return { total, iterations, average: avg };
  };

  context.memory = () => {
    const mem = process.memoryUsage();
    const formatted = {
      rss: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      external: `${(mem.external / 1024 / 1024).toFixed(2)} MB`
    };
    console.table([formatted]);
    return mem;
  };
}

/**
 * Add type inspection helpers to context
 */
function addTypeInspectionHelpers(context: any): void {
  context.typeOf = (obj: any) => {
    const type = typeof obj;
    if (type === 'object') {
      if (obj === null) return 'null';
      if (Array.isArray(obj)) return `Array<${obj.length} items>`;
      if (obj.constructor && obj.constructor.name !== 'Object') {
        return obj.constructor.name;
      }
      return 'Object';
    }
    return type;
  };

  context.signature = (fn: Function) => {
    if (typeof fn !== 'function') {
      cyberOutput.error('Not a function');
      return;
    }

    const fnStr = fn.toString();
    const match = fnStr.match(/^(?:async\s+)?function\s*\w*\s*\((.*?)\)|^\((.*?)\)\s*=>|^(\w+)\s*=>/);

    if (match) {
      const params = match[1] || match[2] || match[3] || '';
      const isAsync = fnStr.startsWith('async');
      cyberOutput.info(`${isAsync ? 'async ' : ''}function(${params})`);
    } else {
      cyberOutput.info(fnStr.substring(0, 100));
    }
  };

  context.methods = (obj: any) => {
    if (!obj || typeof obj !== 'object') {
      cyberOutput.error('Provide an object to inspect');
      return;
    }

    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(obj))
      .filter(name => {
        try {
          return typeof obj[name] === 'function' && name !== 'constructor';
        } catch {
          return false;
        }
      });

    cyberOutput.info(`Available methods (${methods.length}):`);
    methods.forEach(method => {
      try {
        const fn = obj[method];
        const fnStr = fn.toString();
        const match = fnStr.match(/\((.*?)\)/);
        const params = match ? match[1] : '';
        cyberOutput.info(`  ${method}(${params})`);
      } catch {
        cyberOutput.info(`  ${method}()`);
      }
    });

    return methods;
  };

  context.props = (obj: any) => {
    if (!obj || typeof obj !== 'object') {
      cyberOutput.error('Provide an object to inspect');
      return;
    }

    const props = Object.keys(obj).filter(key => typeof obj[key] !== 'function');
    const formatted = props.map(key => ({
      property: key,
      type: context.typeOf(obj[key]),
      value: obj[key]
    }));

    console.table(formatted);
    return formatted;
  };

  context.types = showTypesHelp;
}
