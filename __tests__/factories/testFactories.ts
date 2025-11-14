/**
 * Test data factories using faker.js
 *
 * Provides factory functions to generate test data
 */

import { faker } from '@faker-js/faker';
import { DataSource } from 'typeorm';
import { JobStatus } from '@main/db/entities/Job';
import { getEntity } from '@main/db/entityMap';

/**
 * Create a test user
 */
export async function createTestUser(
  dataSource: DataSource,
  overrides?: Partial<any>
): Promise<any> {
  const User = getEntity('User');
  const userRepo = dataSource.getRepository(User);

  const userData = {
    name: faker.person.fullName(),
    username: faker.internet.username() + faker.string.numeric(4),
    password: faker.internet.password(),
    metadata: {},
    ...overrides
  };

  const user = userRepo.create(userData);
  return await userRepo.save(user);
}

/**
 * Create a test job
 */
export async function createTestJob(
  dataSource: DataSource,
  user?: any,
  overrides?: Partial<any>
): Promise<any> {
  const Job = getEntity('Job');
  const jobRepo = dataSource.getRepository(Job);

  // Create a user if none provided
  const jobUser = user || await createTestUser(dataSource);

  const jobData = {
    type: 'EmailNotificationHandler',
    targetId: faker.string.uuid(),
    userId: jobUser.id,
    status: JobStatus.PENDING,
    parameters: {},
    ...overrides
  };

  const job = jobRepo.create(jobData);
  return await jobRepo.save(job);
}