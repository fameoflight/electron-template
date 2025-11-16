/**
 * File GraphQL Mutation Tests
 * Tests for file-related GraphQL mutations using executeGraphQLQuery
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { initializeGraphQLSchema, executeGraphQLQuery } from '@main/graphql/server';
import {
  createTestDatabase,
  cleanupTestDatabase,
} from '../../base/testDatabase';
import { createUser } from '@factories/index';
import { DataSourceProvider } from '@base/db/index';
import { setupPolly, PollyContext } from '@tests/polly/helpers';
import { createTempFile } from '@tests/factories/fileFactory';

// Mock ProcessFileJob to prevent setTimeout callback from running after database cleanup
vi.mock('@main/jobs/ProcessFileJob.js', () => ({
  ProcessFileJob: {
    performLater: vi.fn().mockResolvedValue({ id: 'mock-job-id', success: true })
  }
}));

describe('File GraphQL Mutations', () => {
  let dataSource: any;
  let testData: any;
  let pollyContext: PollyContext;

  beforeAll(async () => {
    pollyContext = setupPolly({
      recordingName: 'file-mutations',
    });
    await initializeGraphQLSchema();
  });

  beforeEach(async () => {
    dataSource = await createTestDatabase();
    testData = await createUser(dataSource);
  });

  afterEach(async () => {
    DataSourceProvider.clearTestDataSource();
    await cleanupTestDatabase(dataSource);
  });

  afterAll(async () => {
    pollyContext.stop();
  });

  function createAuthContext(user: any) {
    return { sessionKey: user.sessionKey };
  }

  describe('createFile mutation', () => {
    it('should create file with minimal required fields', async () => {
      const mutation = `
        mutation CreateFile($input: CreateFileEntityInput!) {
          createFileEntity(input: $input) {
            id
            filename
            extension
            fullPath
            status
            createdAt
          }
        }
      `;

      await createTempFile({ fullPath: '/tmp/minimal.txt', content: 'Minimal file content' });

      const variables = {
        input: {
          filename: 'minimal.txt',
          extension: 'txt',
          fullPath: '/tmp/minimal.txt'
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.createFileEntity.filename).toBe('minimal.txt');
      expect(result.data.createFileEntity.extension).toBe('txt');
      expect(result.data.createFileEntity.status).toBe('pending');

      // TODO: verify job is enqueued


    });

    it('should return error for unauthenticated user', async () => {
      const mutation = `
        mutation CreateFile($input: CreateFileEntityInput!) {
          createFileEntity(input: $input) {
            id
            filename
          }
        }
      `;
      await createTempFile({ fullPath: '/tmp/unauthorized.txt', content: 'Unauthorized file content' });

      const variables = {
        input: {
          filename: 'unauthorized.txt',
          extension: 'txt',
          fullPath: '/tmp/unauthorized.txt'
        }
      };

      const result = await executeGraphQLQuery<any>(mutation, variables);

      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.data?.createFileEntity).toBeUndefined();
    });

    it('should validate required fields', async () => {
      const mutation = `
        mutation CreateFile($input: CreateFileEntityInput!) {
          createFileEntity(input: $input) {
            id
            filename
          }
        }
      `;

      await createTempFile({ fullPath: '/tmp/incomplete.txt', content: 'Incomplete file content' });

      // Missing required fields
      const variables = {
        input: {
          filename: 'incomplete.txt'
          // Missing extension and fullPath
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle file with polymorphic relations', async () => {
      const mutation = `
        mutation CreateFile($input: CreateFileEntityInput!) {
          createFileEntity(input: $input) {
            id
            filename
            ownerId
            ownerType
          }
        }
      `;

      await createTempFile({ fullPath: '/tmp/chat-attachment.txt', content: 'Chat attachment content' });

      const variables = {
        input: {
          filename: 'chat-attachment.txt',
          extension: 'txt',
          fullPath: '/tmp/chat-attachment.txt',
          ownerId: 'chat-123',
          ownerType: 'Chat'
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.createFileEntity.ownerId).toBe('chat-123');
      expect(result.data.createFileEntity.ownerType).toBe('Chat');
    });
  });

  describe('destroyFile mutation (soft delete)', () => {
    let existingFile: any;

    beforeEach(async () => {
      // Create a file to delete
      const createMutation = `
        mutation CreateFile($input: CreateFileEntityInput!) {
          createFileEntity(input: $input) {
            id
            filename
          }
        }
      `;

      await createTempFile({ fullPath: '/tmp/file-to-delete.txt', content: 'File to be deleted' });

      const variables = {
        input: {
          filename: 'file-to-delete.txt',
          extension: 'txt',
          fullPath: '/tmp/file-to-delete.txt'
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(createMutation, variables, context);
      existingFile = result.data.createFileEntity;
    });

    it('should soft delete file', async () => {
      const mutation = `
        mutation DestroyFile($id: String!) {
          destroyFileEntity(id: $id)
        }
      `;

      const variables = { id: existingFile.id };
      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.destroyFileEntity).toBe(true);

      // Verify file is soft deleted by querying with kind="all"
      const query = `
        query FileEntitiesIncludingDeleted {
          fileEntitiesArray(kind: "all") {
            id
            filename
            deletedAt
          }
        }
      `;

      const verifyResult = await executeGraphQLQuery<any>(query, {}, context);
      expect(verifyResult.errors).toStrictEqual([]);

      const deletedFile = verifyResult.data.fileEntitiesArray.find(
        (f: any) => f.id === existingFile.id
      );
      expect(deletedFile).toBeDefined();
      expect(deletedFile.deletedAt).toBeDefined();
    });

    it('should return true when destroying already deleted file', async () => {
      const mutation = `
        mutation DestroyFile($id: String!) {
          destroyFileEntity(id: $id)
        }
      `;

      const context = createAuthContext(testData);

      // Delete once
      const firstDelete = await executeGraphQLQuery<any>(mutation, { id: existingFile.id }, context);
      expect(firstDelete.data.destroyFileEntity).toBe(true);

      // Delete again
      const secondDelete = await executeGraphQLQuery<any>(mutation, { id: existingFile.id }, context);
      expect(secondDelete.data.destroyFileEntity).toBe(true);
    });

    it('should return error for non-existent file', async () => {
      const mutation = `
        mutation DestroyFile($id: String!) {
          destroyFileEntity(id: $id)
        }
      `;

      const variables = { id: 'RmlsZTppbnZhbGlkLWlk' }; // Invalid global ID
      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should return error for unauthenticated user', async () => {
      const mutation = `
        mutation DestroyFile($id: String!) {
          destroyFileEntity(id: $id)
        }
      `;

      const result = await executeGraphQLQuery<any>(mutation, { id: existingFile.id });

      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('deleteFileEntity mutation (hard delete)', () => {
    let existingFile: any;

    beforeEach(async () => {
      // Create a file to hard delete
      const createMutation = `
        mutation CreateFile($input: CreateFileEntityInput!) {
          createFileEntity(input: $input) {
            id
            filename
          }
        }
      `;

      await createTempFile({ fullPath: '/tmp/file-to-hard-delete.txt', content: 'File to be hard deleted' });

      const variables = {
        input: {
          filename: 'file-to-hard-delete.txt',
          extension: 'txt',
          fullPath: '/tmp/file-to-hard-delete.txt'
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(createMutation, variables, context);
      existingFile = result.data.createFileEntity;
    });

    it('should hard delete fileEntity permanently', async () => {
      const mutation = `
        mutation DeleteFile($id: String!) {
          deleteFileEntity(id: $id)
        }
      `;

      const variables = { id: existingFile.id };
      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.deleteFileEntity).toBe(true);

      // Verify file is completely gone (even with kind="all")
      const query = `
        query FileEntitiesIncludingDeleted {
          fileEntitiesArray(kind: "all") {
            id
            filename
            deletedAt
          }
        }
      `;

      const verifyResult = await executeGraphQLQuery<any>(query, {}, context);
      expect(verifyResult.errors).toStrictEqual([]);

      const deletedFile = verifyResult.data.fileEntitiesArray.find(
        (f: any) => f.id === existingFile.id
      );
      expect(deletedFile).toBeUndefined();
    });

    it('should return error for unauthenticated user', async () => {
      const mutation = `
        mutation DeleteFile($id: String!) {
          deleteFileEntity(id: $id)
        }
      `;

      const result = await executeGraphQLQuery<any>(mutation, { id: existingFile.id });

      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Authorization tests', () => {
    it('should prevent user from accessing another user\'s files', async () => {
      // Create file for first user
      const user1FileMutation = `
        mutation CreateFile($input: CreateFileEntityInput!) {
          createFileEntity(input: $input) {
            id
            filename
          }
        }
      `;

      await createTempFile({ fullPath: '/tmp/user1-file.txt', content: 'User 1 file content' });

      const user1Variables = {
        input: {
          filename: 'user1-file.txt',
          extension: 'txt',
          fullPath: '/tmp/user1-file.txt'
        }
      };

      const user1Context = createAuthContext(testData);
      const user1Result = await executeGraphQLQuery<any>(user1FileMutation, user1Variables, user1Context);
      const user1FileId = user1Result.data.createFileEntity.id;

      // Create second user
      const user2 = await createUser(dataSource, {
        username: 'user2',
        name: 'User 2'
      });

      // Try to update first user's file as second user
      const updateMutation = `
        mutation UpdateFile($input: UpdateFileInput!) {
          updateFile(input: $input) {
            id
            filename
          }
        }
      `;

      const user2Context = createAuthContext(user2.sessionKey);
      const updateResult = await executeGraphQLQuery<any>(updateMutation, {
        input: {
          id: user1FileId,
          filename: 'hacked-by-user2.txt'
        }
      }, user2Context);

      expect(updateResult.errors).toBeDefined();
      expect(updateResult.errors.length).toBeGreaterThan(0);
    });

    it('should prevent user from deleting another user\'s files', async () => {
      // Create file for first user
      const user1FileMutation = `
        mutation CreateFile($input: CreateFileEntityInput!) {
          createFileEntity(input: $input) {
            id
            filename
          }
        }
      `;

      await createTempFile({ fullPath: '/tmp/user1-protected-file.txt', content: 'User 1 protected file content' });

      const user1Variables = {
        input: {
          filename: 'user1-protected-file.txt',
          extension: 'txt',
          fullPath: '/tmp/user1-protected-file.txt'
        }
      };

      const user1Context = createAuthContext(testData);
      const user1Result = await executeGraphQLQuery<any>(user1FileMutation, user1Variables, user1Context);
      const user1FileId = user1Result.data.createFileEntity.id;

      // Create second user
      const user2 = await createUser(dataSource, {
        username: 'malicious-user',
        name: 'Malicious User'
      });

      // Try to delete first user's file as second user
      const deleteMutation = `
        mutation DestroyFile($id: String!) {
          destroyFileEntity(id: $id)
        }
      `;

      const user2Context = createAuthContext(user2.sessionKey);
      const deleteResult = await executeGraphQLQuery<any>(deleteMutation, { id: user1FileId }, user2Context);

      expect(deleteResult.errors).toBeDefined();
      expect(deleteResult.errors.length).toBeGreaterThan(0);
    });
  });
});