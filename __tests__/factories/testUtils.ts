/**
 * High-level test utilities for common setup patterns
 *
 * Provides convenience functions that combine multiple setup steps
 */

import { DataSource } from 'typeorm';
import { getEntity } from '@main/db/entityMap';
import { faker } from '@faker-js/faker';

/**
 * Create a test user with default settings
 */
export async function createUser(
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