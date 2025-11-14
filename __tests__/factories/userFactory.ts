/**
 * User factory for creating test users
 */

import { DataSource } from 'typeorm';
import { getEntity } from '@main/db/entityMap';
import { faker } from '@faker-js/faker';
import { randomUUID } from 'node:crypto';
import { User } from '@main/base/db/User';

/**
 * Create a test user with all required fields
 */
export async function createUser(
  dataSource: DataSource,
  overrides?: Partial<User>
): Promise<User> {
  const User = getEntity('User');
  const userRepo = dataSource.getRepository(User);

  const userData = {
    name: faker.person.fullName(),
    username: faker.internet.username() + new Date().getTime(), // Ensure uniqueness
    password: 'testpass', // Default test password for easy login testing
    sessionKey: randomUUID(), // Generate session key explicitly
    ...overrides
  };

  const user = userRepo.create(userData);
  return await userRepo.save(user);
}

/**
 * Create multiple test users
 */
export async function createUsers(
  dataSource: DataSource,
  count: number,
  overrides?: Partial<any>
): Promise<any[]> {
  const users: any[] = [];
  for (let i = 0; i < count; i++) {
    const user = await createUser(dataSource, overrides);
    users.push(user);
  }
  return users;
}