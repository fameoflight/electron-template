/**
 * Job factory for creating test jobs
 */

import { DataSource } from 'typeorm';
import { JobStatus } from '@main/db/entities/Job';
import { getEntity } from '@main/db/entityMap';
import { faker } from '@faker-js/faker';
import { createUser } from './userFactory';

/**
 * Create a test job with a user
 */
export async function createTestJob(
  dataSource: DataSource,
  user?: any,
  overrides?: Partial<any>
): Promise<any> {
  const Job = getEntity('Job');
  const jobRepo = dataSource.getRepository(Job);

  // Create a user if none provided
  const jobUser = user || await createUser(dataSource);

  const jobData = {
    type: 'EmailNotificationHandler',
    targetId: faker.string.uuid(),
    userId: jobUser.id,
    status: JobStatus.PENDING, // Use enum value
    parameters: {},
    ...overrides
  };

  const job = jobRepo.create(jobData);
  return await jobRepo.save(job);
}

/**
 * Create multiple test jobs
 */
export async function createTestJobs(
  dataSource: DataSource,
  count: number,
  user?: any,
  overrides?: Partial<any>
): Promise<any[]> {
  const jobs: any[] = [];
  for (let i = 0; i < count; i++) {
    const job = await createTestJob(dataSource, user, overrides);
    jobs.push(job);
  }
  return jobs;
}