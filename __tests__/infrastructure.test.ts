/**
 * Test infrastructure verification
 *
 * Simple tests to verify test setup works correctly
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DataSource } from 'typeorm';
import {
  createTestDatabase,
  cleanupTestDatabase,
} from './base/testDatabase';
import { createTestUser, createTestJob } from '@factories/index';



describe('Test Infrastructure', () => {
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = await createTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase(dataSource);
  });

  describe('Database Setup', () => {
    it('should create an initialized database', async () => {
      expect(dataSource).toBeDefined();
      expect(dataSource.isInitialized).toBe(true);
    });

    it('should have all entities registered', async () => {
      const entityNames = dataSource.entityMetadatas.map((e) => e.name);
      expect(entityNames).toContain('User');
      expect(entityNames).toContain('Job');
    });
  });

  describe('Test Factories', () => {
    it('should create user with factory', async () => {
      const user = await createTestUser(dataSource);

      expect(user.id).toBeDefined();
      expect(user.username).toBeDefined();
      expect(user.sessionKey).toHaveLength(36);
    });

    it('should create user with overrides', async () => {
      const user = await createTestUser(dataSource, {
        username: 'custom-username',
        name: 'Custom Name',
      });

      expect(user.username).toBe('custom-username');
      expect(user.name).toBe('Custom Name');
    });

    it('should create job with factory', async () => {
      const job = await createTestJob(dataSource);

      expect(job.id).toBeDefined();
      expect(job.type).toBe('EmailNotificationHandler');
      expect(job.status).toBe('PENDING'); // JobStatus enum uses uppercase
      expect(job.targetId).toBeDefined();
    });

    it('should create job with overrides', async () => {
      const job = await createTestJob(dataSource, undefined, {
        type: 'DataSyncHandler',
        targetId: 'custom-target',
      });

      expect(job.type).toBe('DataSyncHandler');
      expect(job.targetId).toBe('custom-target');
    });
  });

  describe('Database Isolation', () => {
    it('should have clean database on each test', async () => {
      const users = await dataSource.manager.find('User');
      expect(users).toHaveLength(0);
    });

    it('should not persist data between tests', async () => {
      // This test verifies that data from previous test is not present
      const users = await dataSource.manager.find('User');
      expect(users).toHaveLength(0);

      // Create a user
      await createTestUser(dataSource);
      const usersAfter = await dataSource.manager.find('User');
      expect(usersAfter).toHaveLength(1);
    });
  });
});
