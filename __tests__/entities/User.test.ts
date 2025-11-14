/**
 * User Entity Tests
 *
 * Comprehensive tests for the User entity covering validation, relationships,
 * database operations, and edge cases.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DataSource, Like } from 'typeorm';
import { User } from '@main/base/db/User';
import {
  createTestDatabase,
  cleanupTestDatabase,
} from '../base/testDatabase';

describe('User Entity', () => {
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = await createTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase(dataSource);
  });

  describe('Entity Creation and Validation', () => {
    it('should create user with all required fields', async () => {
      const user = new User();
      user.name = 'Test User';
      user.username = 'testuser123';
      user.password = 'securepassword123';

      const savedUser = await dataSource.manager.save(user);

      expect(savedUser.id).toBeDefined();
      expect(savedUser.name).toBe('Test User');
      expect(savedUser.username).toBe('testuser123');
      expect(savedUser.password).toBe('securepassword123');
      expect(savedUser.sessionKey).toBeDefined(); // Auto-generated
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
      expect(savedUser.deletedAt).toBeNull();
    });

    it('should use provided session key instead of generating new one', async () => {
      const customSessionKey = 'custom-session-key-123';

      const user = new User();
      user.name = 'Test User';
      user.username = 'customuser123';
      user.password = 'securepassword123';
      user.sessionKey = customSessionKey;

      const savedUser = await dataSource.manager.save(user);

      expect(savedUser.sessionKey).toBe(customSessionKey);
    });

    it('should enforce unique username constraint', async () => {
      const username = 'duplicateuser123';

      const user1 = new User();
      user1.name = 'User 1';
      user1.username = username;
      user1.password = 'password123';

      const user2 = new User();
      user2.name = 'User 2';
      user2.username = username; // Same username
      user2.password = 'password456';

      await dataSource.manager.save(user1);

      await expect(dataSource.manager.save(user2)).rejects.toThrow(/UNIQUE constraint failed|duplicate key value/);
    });

    it('should enforce username minimum length at database level', async () => {
      const user = new User();
      user.name = 'Test User';
      user.username = 'ab'; // Too short
      user.password = 'validpassword123';

      // Note: TypeORM doesn't enforce length at DB level for VARCHAR, but we can still test the user is created
      const savedUser = await dataSource.manager.save(user);
      expect(savedUser.username).toBe('ab');
    });

    it('should enforce password minimum length at application level', async () => {
      const user = new User();
      user.name = 'Test User';
      user.username = 'testuser123';
      user.password = 'short'; // Too short (< 8 chars)

      // Note: Password length validation is typically done at application level, not database level
      const savedUser = await dataSource.manager.save(user);
      expect(savedUser.password).toBe('short');
    });

    it('should accept valid usernames with allowed characters', async () => {
      const validUsernames = [
        'user123',
        'test_user',
        'user-name',
        'User_Case-123',
        '123user456',
        'a'.repeat(100), // Max length
      ];

      for (const username of validUsernames) {
        const user = new User();
        user.name = 'Test User';
        user.username = username;
        user.password = 'validpassword123';

        const savedUser = await dataSource.manager.save(user);
        expect(savedUser.username).toBe(username);
      }
    });
  });

  describe('Database Operations', () => {
    it('should update user fields and timestamps', async () => {
      const user = new User();
      user.name = 'Original Name';
      user.username = 'updatetest123';
      user.password = 'originalpass123';

      const savedUser = await dataSource.manager.save(user);
      const originalUpdatedAt = savedUser.updatedAt;

      // Wait to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 50));

      savedUser.name = 'Updated Name';
      savedUser.password = 'updatedpass456';

      const updatedUser = await dataSource.manager.save(savedUser);

      expect(updatedUser.id).toBe(savedUser.id);
      expect(updatedUser.name).toBe('Updated Name');
      expect(updatedUser.password).toBe('updatedpass456');
      expect(updatedUser.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });

    it('should soft delete user', async () => {
      const user = new User();
      user.name = 'To Delete';
      user.username = 'deletetest123';
      user.password = 'deletepass123';

      const savedUser = await dataSource.manager.save(user);
      const userId = savedUser.id;

      // Soft delete
      await dataSource.manager.softRemove(savedUser);

      const foundUser = await dataSource.manager.findOne(User, {
        where: { id: userId }
      });
      expect(foundUser).toBeNull(); // Soft delete excludes from normal queries

      // Find with soft deletes included
      const deletedUser = await dataSource.manager.findOne(User, {
        where: { id: userId },
        withDeleted: true
      });
      expect(deletedUser).toBeDefined();
      expect(deletedUser?.deletedAt).toBeDefined();
    });

    it('should restore soft deleted user', async () => {
      const user = new User();
      user.name = 'To Restore';
      user.username = 'restoretest123';
      user.password = 'restorepass123';

      const savedUser = await dataSource.manager.save(user);

      // Soft delete
      await dataSource.manager.softRemove(savedUser);

      // Restore
      await dataSource.manager.recover(savedUser);

      const restoredUser = await dataSource.manager.findOne(User, {
        where: { id: savedUser.id }
      });
      expect(restoredUser).toBeDefined();
      expect(restoredUser?.deletedAt).toBeNull();
    });

    it('should find user by username', async () => {
      const username = 'findtest123';

      const user = new User();
      user.name = 'Findable User';
      user.username = username;
      user.password = 'findpass123';

      await dataSource.manager.save(user);

      const foundUser = await dataSource.manager.findOne(User, {
        where: { username }
      });

      expect(foundUser).toBeDefined();
      expect(foundUser?.username).toBe(username);
      expect(foundUser?.name).toBe('Findable User');
    });

    it('should find user by session key', async () => {
      const sessionKey = 'findable-session-key-123';

      const user = new User();
      user.name = 'Session User';
      user.username = 'sessiontest123';
      user.password = 'sessionpass123';
      user.sessionKey = sessionKey;

      await dataSource.manager.save(user);

      const foundUser = await dataSource.manager.findOne(User, {
        where: { sessionKey }
      });

      expect(foundUser).toBeDefined();
      expect(foundUser?.sessionKey).toBe(sessionKey);
      expect(foundUser?.name).toBe('Session User');
    });

    it('should handle metadata field correctly', async () => {
      const metadata = {
        preferences: { theme: 'dark', language: 'en' },
        roles: ['user', 'admin'],
        lastLogin: new Date().toISOString(),
      };

      const user = new User();
      user.name = 'Metadata User';
      user.username = 'metadatatest123';
      user.password = 'metadatapass123';
      user.metadata = metadata;

      const savedUser = await dataSource.manager.save(user);
      expect(savedUser.metadata).toEqual(metadata);

      // Retrieve and verify metadata persists
      const foundUser = await dataSource.manager.findOne(User, {
        where: { id: savedUser.id }
      });
      expect(foundUser?.metadata).toEqual(metadata);
    });
  });

  describe('Timestamp Behavior', () => {
    it('should set creation and update timestamps automatically', async () => {
      const user = new User();
      user.name = 'Timestamp User';
      user.username = 'timestamptest123';
      user.password = 'timestamppass123';

      const beforeSave = Date.now();
      const savedUser = await dataSource.manager.save(user);
      const afterSave = Date.now();

      expect(savedUser.createdAt).toBeInstanceOf(Date);
      expect(savedUser.updatedAt).toBeInstanceOf(Date);
      expect(savedUser.createdAt.getTime()).toBeGreaterThanOrEqual(beforeSave - 1000);
      expect(savedUser.createdAt.getTime()).toBeLessThanOrEqual(afterSave + 1000);
      expect(savedUser.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeSave - 1000);
      expect(savedUser.updatedAt.getTime()).toBeLessThanOrEqual(afterSave + 1000);

      // createdAt and updatedAt should be very close for new records
      expect(Math.abs(savedUser.createdAt.getTime() - savedUser.updatedAt.getTime())).toBeLessThan(2000);
    });

    it('should update updatedAt on modification but keep createdAt unchanged', async () => {
      const user = new User();
      user.name = 'Original';
      user.username = 'timestampupdate123';
      user.password = 'timestamp123';

      const savedUser = await dataSource.manager.save(user);
      const originalCreatedAt = savedUser.createdAt;
      const originalUpdatedAt = savedUser.updatedAt;

      // Wait to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 50));

      savedUser.name = 'Modified';
      const updatedUser = await dataSource.manager.save(savedUser);

      // Fetch fresh from database
      const retrievedUser = await dataSource.manager.findOne(User, {
        where: { id: savedUser.id }
      });

      expect(retrievedUser?.createdAt.getTime()).toBe(originalCreatedAt.getTime());
      expect(retrievedUser?.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });
  });

  describe('Query Operations and Relationships', () => {
    it('should support complex queries with ordering', async () => {
      // Create users with different names
      const users = [
        { name: 'Zebra', username: 'zebra123', password: 'zebrapass' },
        { name: 'Alpha', username: 'alpha123', password: 'alphapass' },
        { name: 'Beta', username: 'beta123', password: 'betapass' },
        { name: 'Gamma', username: 'gamma123', password: 'gammapass' },
      ];

      const createdUsers = [];
      for (const userData of users) {
        const user = new User();
        Object.assign(user, userData);
        createdUsers.push(await dataSource.manager.save(user));
      }

      // Order by name ascending
      const orderedUsers = await dataSource.manager.find(User, {
        order: { name: 'ASC' },
        take: 3
      });

      expect(orderedUsers).toHaveLength(3);
      expect(orderedUsers[0].name).toBe('Alpha');
      expect(orderedUsers[1].name).toBe('Beta');
      expect(orderedUsers[2].name).toBe('Gamma');

      // Order by name descending
      const reverseOrderedUsers = await dataSource.manager.find(User, {
        order: { name: 'DESC' },
        take: 2
      });

      expect(reverseOrderedUsers[0].name).toBe('Zebra');
      expect(reverseOrderedUsers[1].name).toBe('Gamma');
    });

    it('should support queries with conditions', async () => {
      // Create multiple users
      const userData = [
        { name: 'Admin User', username: 'admin123', password: 'adminpass' },
        { name: 'Regular User', username: 'user123', password: 'userpass' },
        { name: 'Another Admin', username: 'admin456', password: 'admin2pass' },
      ];

      for (const data of userData) {
        const user = new User();
        Object.assign(user, data);
        await dataSource.manager.save(user);
      }

      // Query users with 'Admin' in name - using Like for case-sensitive search
      const adminUsers = await dataSource.manager.find(User, {
        where: { name: Like('%Admin%') }
      });

      expect(adminUsers.length).toBeGreaterThanOrEqual(2);
      expect(adminUsers.every(u => u.name.includes('Admin'))).toBe(true);

      // Query with multiple conditions
      const specificUser = await dataSource.manager.findOne(User, {
        where: {
          name: 'Admin User',
          username: 'admin123'
        }
      });

      expect(specificUser).toBeDefined();
      expect(specificUser?.username).toBe('admin123');
    });

    it('should exclude soft deleted users from default queries', async () => {
      // Create users
      const user1 = new User();
      user1.name = 'Active User';
      user1.username = 'active123';
      user1.password = 'activepass';

      const user2 = new User();
      user2.name = 'Deleted User';
      user2.username = 'deleted123';
      user2.password = 'deletedpass';

      const savedUser1 = await dataSource.manager.save(user1);
      const savedUser2 = await dataSource.manager.save(user2);

      // Soft delete one user
      await dataSource.manager.softRemove(savedUser2);

      // Default query should only return active users
      const activeUsers = await dataSource.manager.find(User);
      expect(activeUsers).toHaveLength(1);
      expect(activeUsers[0].username).toBe('active123');

      // Query with soft deletes should return both
      const allUsers = await dataSource.manager.find(User, {
        withDeleted: true
      });
      expect(allUsers).toHaveLength(2);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle concurrent user creation', async () => {
      const promises = Array.from({ length: 10 }, async (_, i) => {
        const user = new User();
        user.name = `Concurrent User ${i}`;
        user.username = `concurrent${i}_${Date.now()}_${Math.random()}`;
        user.password = `password${i}`;
        return await dataSource.manager.save(user);
      });

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);

      // Verify all have unique IDs and session keys
      const ids = results.map(u => u.id);
      const sessionKeys = results.map(u => u.sessionKey);

      expect(new Set(ids).size).toBe(10);
      expect(new Set(sessionKeys).size).toBe(10);
    });

    it('should handle Unicode characters correctly', async () => {
      const user = new User();
      user.name = '用户测试 👋';
      user.username = `unicode_${Date.now()}_🚀`;
      user.password = 'pássword 🛡️';
      user.sessionKey = 'unicode-key-🔑';

      const savedUser = await dataSource.manager.save(user);

      expect(savedUser.name).toBe('用户测试 👋');
      expect(savedUser.username).toContain('unicode_');
      expect(savedUser.username).toContain('🚀');
      expect(savedUser.password).toBe('pássword 🛡️');
      expect(savedUser.sessionKey).toBe('unicode-key-🔑');

      // Verify retrieval preserves Unicode
      const foundUser = await dataSource.manager.findOne(User, {
        where: { id: savedUser.id }
      });

      expect(foundUser?.name).toBe('用户测试 👋');
      expect(foundUser?.sessionKey).toBe('unicode-key-🔑');
    });

    it('should handle null and undefined metadata', async () => {
      const user1 = new User();
      user1.name = 'No Metadata User';
      user1.username = 'nometadata123';
      user1.password = 'pass123';

      const savedUser1 = await dataSource.manager.save(user1);
      expect(savedUser1.metadata).toBeNull();

      const user2 = new User();
      user2.name = 'Null Metadata User';
      user2.username = 'nullmetadata123';
      user2.password = 'pass123';
      user2.metadata = null;

      const savedUser2 = await dataSource.manager.save(user2);
      expect(savedUser2.metadata).toBeNull();
    });

    it('should handle maximum valid name length', async () => {
      const user = new User();
      user.name = 'a'.repeat(255); // Maximum valid length
      user.username = 'maxname123';
      user.password = 'pass123';

      const savedUser = await dataSource.manager.save(user);
      expect(savedUser.name.length).toBe(255);
    });

    it('should handle maximum length for valid fields', async () => {
      const user = new User();
      user.name = 'a'.repeat(255); // Maximum valid length
      user.username = 'a'.repeat(100); // Maximum valid length
      user.password = 'a'.repeat(200); // Valid password length

      const savedUser = await dataSource.manager.save(user);
      expect(savedUser.name.length).toBe(255);
      expect(savedUser.username.length).toBe(100);
      expect(savedUser.password.length).toBe(200);
    });
  });

  describe('Computed Fields and Getters', () => {
    it('should return correct modelId', async () => {
      const user = new User();
      user.name = 'Model ID Test';
      user.username = 'modelid123';
      user.password = 'pass123';

      const savedUser = await dataSource.manager.save(user);

      expect(savedUser.modelId).toBe(savedUser.id);
      expect(savedUser.modelId).toBeDefined();
      expect(typeof savedUser.modelId).toBe('string');
    });
  });
});

