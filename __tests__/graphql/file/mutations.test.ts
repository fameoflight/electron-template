/**
 * File GraphQL Mutation Tests
 * Tests for file-related GraphQL mutations using executeGraphQLQuery
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { initializeGraphQLSchema, executeGraphQLQuery } from '@main/graphql/server';
import { fromGlobalIdToLocalId } from '@base/graphql/index';
import {
  createTestDatabase,
  cleanupTestDatabase,
} from '../../base/testDatabase';
import { createUser } from '@factories/index';
import { DataSourceProvider } from '@base/db/index';
import { FileStatus, FileFileType } from '@main/db/entities/__generated__/FileBase';
import { setupPolly, PollyContext } from '@tests/polly/helpers';

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
        mutation CreateFile($input: CreateFileInput!) {
          createFile(input: $input) {
            id
            filename
            extension
            fullPath
            status
            createdAt
          }
        }
      `;

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
      expect(result.data.createFile.filename).toBe('minimal.txt');
      expect(result.data.createFile.extension).toBe('txt');
      expect(result.data.createFile.status).toBe('pending');

      // TODO: verify job is enqueued


    });

    it('should return error for unauthenticated user', async () => {
      const mutation = `
        mutation CreateFile($input: CreateFileInput!) {
          createFile(input: $input) {
            id
            filename
          }
        }
      `;

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
      expect(result.data?.createFile).toBeUndefined();
    });

    it('should validate required fields', async () => {
      const mutation = `
        mutation CreateFile($input: CreateFileInput!) {
          createFile(input: $input) {
            id
            filename
          }
        }
      `;

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
        mutation CreateFile($input: CreateFileInput!) {
          createFile(input: $input) {
            id
            filename
            ownerId
            ownerType
          }
        }
      `;

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
      expect(result.data.createFile.ownerId).toBe('chat-123');
      expect(result.data.createFile.ownerType).toBe('Chat');
    });
  });

  describe('destroyFile mutation (soft delete)', () => {
    let existingFile: any;

    beforeEach(async () => {
      // Create a file to delete
      const createMutation = `
        mutation CreateFile($input: CreateFileInput!) {
          createFile(input: $input) {
            id
            filename
          }
        }
      `;

      const variables = {
        input: {
          filename: 'file-to-delete.txt',
          extension: 'txt',
          fullPath: '/tmp/file-to-delete.txt'
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(createMutation, variables, context);
      existingFile = result.data.createFile;
    });

    it('should soft delete file', async () => {
      const mutation = `
        mutation DestroyFile($id: String!) {
          destroyFile(id: $id)
        }
      `;

      const variables = { id: existingFile.id };
      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.destroyFile).toBe(true);

      // Verify file is soft deleted by querying with kind="all"
      const query = `
        query FilesIncludingDeleted {
          filesArray(kind: "all") {
            id
            filename
            deletedAt
          }
        }
      `;

      const verifyResult = await executeGraphQLQuery<any>(query, {}, context);
      expect(verifyResult.errors).toStrictEqual([]);

      const deletedFile = verifyResult.data.filesArray.find(
        (f: any) => f.id === existingFile.id
      );
      expect(deletedFile).toBeDefined();
      expect(deletedFile.deletedAt).toBeDefined();
    });

    it('should return true when destroying already deleted file', async () => {
      const mutation = `
        mutation DestroyFile($id: String!) {
          destroyFile(id: $id)
        }
      `;

      const context = createAuthContext(testData);

      // Delete once
      const firstDelete = await executeGraphQLQuery<any>(mutation, { id: existingFile.id }, context);
      expect(firstDelete.data.destroyFile).toBe(true);

      // Delete again
      const secondDelete = await executeGraphQLQuery<any>(mutation, { id: existingFile.id }, context);
      expect(secondDelete.data.destroyFile).toBe(true);
    });

    it('should return error for non-existent file', async () => {
      const mutation = `
        mutation DestroyFile($id: String!) {
          destroyFile(id: $id)
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
          destroyFile(id: $id)
        }
      `;

      const result = await executeGraphQLQuery<any>(mutation, { id: existingFile.id });

      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('deleteFile mutation (hard delete)', () => {
    let existingFile: any;

    beforeEach(async () => {
      // Create a file to hard delete
      const createMutation = `
        mutation CreateFile($input: CreateFileInput!) {
          createFile(input: $input) {
            id
            filename
          }
        }
      `;

      const variables = {
        input: {
          filename: 'file-to-hard-delete.txt',
          extension: 'txt',
          fullPath: '/tmp/file-to-hard-delete.txt'
        }
      };

      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(createMutation, variables, context);
      existingFile = result.data.createFile;
    });

    it('should hard delete file permanently', async () => {
      const mutation = `
        mutation DeleteFile($id: String!) {
          deleteFile(id: $id)
        }
      `;

      const variables = { id: existingFile.id };
      const context = createAuthContext(testData);
      const result = await executeGraphQLQuery<any>(mutation, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.deleteFile).toBe(true);

      // Verify file is completely gone (even with kind="all")
      const query = `
        query FilesIncludingDeleted {
          filesArray(kind: "all") {
            id
            filename
            deletedAt
          }
        }
      `;

      const verifyResult = await executeGraphQLQuery<any>(query, {}, context);
      expect(verifyResult.errors).toStrictEqual([]);

      const deletedFile = verifyResult.data.filesArray.find(
        (f: any) => f.id === existingFile.id
      );
      expect(deletedFile).toBeUndefined();
    });

    it('should return error for unauthenticated user', async () => {
      const mutation = `
        mutation DeleteFile($id: String!) {
          deleteFile(id: $id)
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
        mutation CreateFile($input: CreateFileInput!) {
          createFile(input: $input) {
            id
            filename
          }
        }
      `;

      const user1Variables = {
        input: {
          filename: 'user1-file.txt',
          extension: 'txt',
          fullPath: '/tmp/user1-file.txt'
        }
      };

      const user1Context = createAuthContext(testData);
      const user1Result = await executeGraphQLQuery<any>(user1FileMutation, user1Variables, user1Context);
      const user1FileId = user1Result.data.createFile.id;

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
        mutation CreateFile($input: CreateFileInput!) {
          createFile(input: $input) {
            id
            filename
          }
        }
      `;

      const user1Variables = {
        input: {
          filename: 'user1-protected-file.txt',
          extension: 'txt',
          fullPath: '/tmp/user1-protected-file.txt'
        }
      };

      const user1Context = createAuthContext(testData);
      const user1Result = await executeGraphQLQuery<any>(user1FileMutation, user1Variables, user1Context);
      const user1FileId = user1Result.data.createFile.id;

      // Create second user
      const user2 = await createUser(dataSource, {
        username: 'malicious-user',
        name: 'Malicious User'
      });

      // Try to delete first user's file as second user
      const deleteMutation = `
        mutation DestroyFile($id: String!) {
          destroyFile(id: $id)
        }
      `;

      const user2Context = createAuthContext(user2.sessionKey);
      const deleteResult = await executeGraphQLQuery<any>(deleteMutation, { id: user1FileId }, user2Context);

      expect(deleteResult.errors).toBeDefined();
      expect(deleteResult.errors.length).toBeGreaterThan(0);
    });
  });
});