import { BaseEntity, DataSource, In, ObjectLiteral, Repository } from 'typeorm';
import { SmartLoadingSubscriber } from '@base/db/subscribers/SmartLoadingSubscriber.js';
import { CustomDataSource } from '@main/base/CustomDataSource.js';
import DataSourceProvider from '@main/base/db/DataSourceProvider';
import { Job } from '@main/db/entities/Job';
import JobQueue from '@main/services/JobQueue';
import { FileEntity } from '@main/db/entities/FileEntity';

type CreateDataSourceOpts = {
  database: string;
  entities: any[];
  synchronize: boolean;
  migrations: string[];
  logging?: boolean;
};

export async function createDataSource(opts: CreateDataSourceOpts): Promise<CustomDataSource> {
  // console.log('🔧 DataSource config:', opts);

  return new CustomDataSource({
    type: 'sqlite',
    database: opts.database,
    entities: opts.entities,
    migrations: opts.migrations,
    subscribers: [SmartLoadingSubscriber],
    synchronize: opts.synchronize,
    logging: opts.logging || false,
    // Safety: Throw errors on null/undefined values in where conditions
    // This prevents dangerous queries like `findOne({ where: { id: null } })`
    // which can return arbitrary records
    invalidWhereValuesBehavior: {
      null: 'throw',
      undefined: 'throw'
    },
    extra: {
      pragma: {
        foreign_keys: 'ON'
      }
    }
  });
}

export function getRepo<T extends ObjectLiteral>(entityClass: new () => T): Repository<T> {
  return DataSourceProvider.get().getRepository(entityClass);
}

export function getJobs(targetId: string, types: string[], statuses: string[]): Promise<Job[]> {
  const jobRepo = getRepo(Job);

  return jobRepo.find({
    where: {
      targetId,
      type: In(types),
      status: In(statuses)
    },
    order: {
      createdAt: 'DESC'
    }
  });
}

export async function cancelJobs(jobs: Job[]): Promise<Job[]> {
  // Get the job queue and cancel the job
  const jobQueue = JobQueue.getInstance();

  await Promise.all(
    jobs.map(async (job) => {
      return jobQueue?.cancelJob(job.id);
    })
  );

  return getRepo(Job).find({
    where: {
      id: In(jobs.map((job) => job.id))
    }
  });
}

/**
 * Create a message with its first version correctly
 *
 * @param param0 - Object containing message creation parameters
 * @returns Object containing both the created message and version
 */
export async function createMessageWithVersion({
  chatId,
  role,
  userId,
  content,
  llmModelId,
  status = 'completed',
  messageType = 'user'
}: {
  chatId: string;
  role: string;
  userId: string;
  content: string;
  llmModelId?: string;
  status?: string;
  messageVersionId?: string;
  messageType?: string;
}) {
  const dataSource = DataSourceProvider.get();

  // Get repositories
  const messageRepo = dataSource.getRepository('Message');
  const versionRepo = dataSource.getRepository('MessageVersion');

  // Step 1: Create message version first with messageId: null
  const version = await versionRepo.save({
    content,
    status,
    userId,
    messageId: null, // Will be set after creating the message
    llmModelId
  });

  // Step 2: Create message with currentVersionId pointing to the version
  const message = await messageRepo.save({
    chatId,
    role,
    userId,
    currentVersionId: version.id,
    llmModelId
  });

  // Step 3: Update version with the correct messageId
  await versionRepo.update(version.id, { messageId: message.id });

  // Step 4: Refresh to get updated data
  const updatedVersion = await versionRepo.findOne({ where: { id: version.id } });
  const updatedMessage = await messageRepo.findOne({
    where: { id: message.id },
    relations: ['currentVersion']
  });

  return {
    message: updatedMessage,
    version: updatedVersion
  };
}

/**
 * Perform cleanup operations after streaming sessions
 * Good to call after long streaming jobs to free up resources
 */
export const optimizeAfterStreaming = async (): Promise<void> => {
  console.log('🧹 Performing post-streaming cleanup...');

  // do it after a short delay to allow any pending operations to complete

  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    const dataSource = DataSourceProvider.get();

    // Recommended: Use WAL mode for concurrent reads/writes, but checkpoint less aggressively
    // Avoid TRUNCATE checkpoint during streaming (can block writers/readers)
    // Instead, use PASSIVE or RESTART, or skip checkpointing entirely during heavy streaming

    // Optionally checkpoint WAL (non-blocking)
    await dataSource.query('PRAGMA wal_checkpoint(PASSIVE)');
    console.log('  ✅ WAL checkpoint (PASSIVE) completed');

    // Optionally shrink memory (safe, but not always needed)
    await dataSource.query('PRAGMA shrink_memory');
    console.log('  ✅ Memory cleaned up');

    console.log('🎉 Post-streaming cleanup completed');
  } catch (error) {
    console.warn('  ⚠️  Warning: Could not complete post-streaming cleanup:', error);
  }
};

export async function getFiles(opt: { ownerId: string; ownerType: string }): Promise<FileEntity[]> {
  const dataSource = DataSourceProvider.get();
  const fileRepository = dataSource.getRepository(FileEntity);

  return await fileRepository.find({
    where: {
      ownerId: opt.ownerId,
      ownerType: opt.ownerType
    }
  });
}