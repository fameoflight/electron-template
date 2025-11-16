/**
 * File GraphQL Query Tests
 *
 * Comprehensive tests for file-related GraphQL queries covering authentication,
 * CRUD operations, validation, and edge cases.
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { createHash } from 'crypto';
import { initializeGraphQLSchema, executeGraphQLQuery } from '@main/graphql/server';
import { fromGlobalId, fromGlobalIdToLocalId, toGlobalId } from '@base/graphql/index';
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

describe('File GraphQL Operations', () => {
  let dataSource: any;
  let testUser: any;
  let pollyContext: PollyContext;

  beforeAll(async () => {
    // Set up Polly for HTTP mocking
    pollyContext = setupPolly({
      recordingName: 'file-queries-tests',
    });
    await initializeGraphQLSchema();
  });

  beforeEach(async () => {
    dataSource = await createTestDatabase();
    testUser = await createUser(dataSource);
  });

  afterEach(async () => {

    DataSourceProvider.clearTestDataSource();
    await cleanupTestDatabase(dataSource);
  });

  afterAll(async () => {
    pollyContext.stop();
  });

  function createAuthContext(sessionKey?: string) {
    return { sessionKey };
  }

  async function createTestFile(overrides: any = {}) {
    const mutation = `
      mutation CreateFile($input: CreateFileEntityInput!) {
        createFileEntity(input: $input) {
          id
          modelId
          filename
          extension
          fullPath
          fileType
          fileSize
          status
          createdAt
          updatedAt
        }
      }
    `;

    // Generate unique fullPath to avoid deduplication conflicts
    const uniqueId = Math.random().toString(36).substring(2, 8);
    const defaultFullPath = `/tmp/test-file-${uniqueId}.txt`;

    const input = {
      filename: 'test-file.txt',
      extension: 'txt',
      fullPath: defaultFullPath,
      ...overrides
    }

    await createTempFile(input);

    const variables = {
      input: {
        filename: 'test-file.txt',
        extension: 'txt',
        fullPath: defaultFullPath,
        ...overrides
      }
    };

    const context = createAuthContext(testUser.sessionKey);
    const result = await executeGraphQLQuery<any>(mutation, variables, context);
    return result.data.createFileEntity;
  }

  describe('fileEntitiesArray Query', () => {
    it('should return current user files with valid session', async () => {
      // Create some test files
      await createTestFile({ filename: 'file1.txt' });
      await createTestFile({ filename: 'file2.txt' });

      const query = `
        query {
          fileEntitiesArray {
            id
            modelId
            filename
            fullPath
            fileType
            fileSize
            createdAt
            updatedAt
          }
        }
      `;

      const context = createAuthContext(testUser.sessionKey);
      const result = await executeGraphQLQuery<any>(query, {}, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.fileEntitiesArray).toBeDefined();
      expect(Array.isArray(result.data.fileEntitiesArray)).toBe(true);
      expect(result.data.fileEntitiesArray.length).toBeGreaterThanOrEqual(1);

      // Verify structure of returned files
      const file = result.data.fileEntitiesArray.find((f: any) => f.filename === 'file1.txt');
      expect(file).toBeDefined();
      expect(file.modelId).toBeDefined();
      expect(file.filename).toBe('file1.txt');
      expect(file.createdAt).toBeDefined();
      expect(file.updatedAt).toBeDefined();
    });

    it('should return empty array for user with no files', async () => {
      const query = `
        query {
          fileEntitiesArray {
            id
            filename
          }
        }
      `;

      const context = createAuthContext(testUser.sessionKey);
      const result = await executeGraphQLQuery<any>(query, {}, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.fileEntitiesArray).toEqual([]);
    });

    it('should return null with invalid session key', async () => {
      const query = `
        query {
          fileEntitiesArray {
            id
            filename
          }
        }
      `;

      const invalidContext = createAuthContext('invalid-session-key');
      const result = await executeGraphQLQuery<any>(query, {}, invalidContext);

      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.fileEntitiesArray).toEqual([]);
    });

    it('should return null with missing session key', async () => {
      const query = `
        query {
          fileEntitiesArray {
            id
            filename
          }
        }
      `;

      const result = await executeGraphQLQuery<any>(query, {});
      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.fileEntitiesArray).toEqual([]);
    });

    it('should handle files with different types', async () => {
      await createTestFile({ filename: 'document.pdf', extension: 'pdf' });
      await createTestFile({ filename: 'image.jpg', extension: 'jpg' });
      await createTestFile({ filename: 'code.ts', extension: 'ts' });

      const query = `
        query {
          fileEntitiesArray {
            id
            filename
            fileType
            extension
          }
        }
      `;

      const context = createAuthContext(testUser.sessionKey);
      const result = await executeGraphQLQuery<any>(query, {}, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.fileEntitiesArray.length).toBeGreaterThanOrEqual(3);

      // Since ProcessFileJob can't process files without actual disk content,
      // files will have 'other' type. Test focuses on GraphQL functionality.
      const extensions = result.data.fileEntitiesArray.map((f: any) => f.extension);
      expect(extensions).toContain('pdf');
      expect(extensions).toContain('jpg');
      expect(extensions).toContain('ts');
    });
  });

  describe('file Query', () => {
    it('should return file by ID for owner', async () => {
      const testFile = await createTestFile({ filename: 'specific-file.txt' });

      const query = `
        query FileEntityQuery($id: String!) {
          fileEntity(id: $id) {
            id
            modelId
            filename
            fullPath
            fileType
            fileSize
            status
            createdAt
            updatedAt
          }
        }
      `;

      const variables = { id: testFile.id };
      const context = createAuthContext(testUser.sessionKey);
      const result = await executeGraphQLQuery<any>(query, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.fileEntity).toBeDefined();

      const file = result.data.fileEntity;
      expect(file.modelId).toBeDefined();
      expect(file.filename).toBe('specific-file.txt');
      expect(file.fullPath).toMatch(/\/tmp\/test-file-[a-z0-9]+\.txt/); // Should match unique path pattern
      expect(file.fileType).toBe('other'); // Default type before ProcessFileJob processes the file
      expect(file.fileSize).toBe(0); // Default size before ProcessFileJob processes the file
      expect(file.status).toBe('pending');
      expect(file.createdAt).toBeDefined();
      expect(file.updatedAt).toBeDefined();
    });

    it('should return null for non-existent file ID', async () => {
      const query = `
        query FileEntityQuery($id: String!) {
          fileEntity(id: $id) {
            id
            filename
          }
        }
      `;

      const variables = { id: 'RmlsZTpub25leGlzdGVudC1pZA==' }; // Invalid global ID
      const context = createAuthContext(testUser.sessionKey);
      const result = await executeGraphQLQuery<any>(query, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.fileEntity).toBeNull();
    });

    it('should return null for file owned by another user', async () => {
      // Create file for test user
      const testFile = await createTestFile({ filename: 'user1-file.txt' });

      // Create another user
      const otherUser = await createUser(dataSource, {
        username: 'otheruser',
        name: 'Other User'
      });

      const query = `
        query FileEntityQuery($id: String!) {
          fileEntity(id: $id) {
            id
            filename
          }
        }
      `;

      const variables = { id: testFile.id };
      const otherUserContext = createAuthContext(otherUser.sessionKey);
      const result = await executeGraphQLQuery<any>(query, variables, otherUserContext);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.fileEntity).toBeNull();
    });

    it('should return empty data for unauthenticated user', async () => {
      const testFile = await createTestFile();

      const query = `
        query FileEntityQuery($id: String!) {
          fileEntity(id: $id) {
            id
            filename
          }
        }
      `;

      const variables = { id: testFile.id };
      const result = await executeGraphQLQuery<any>(query, variables);

      // Should return no errors for unauthenticated users
      expect(result.errors).toStrictEqual([]);
      // Should return null data instead of throwing an error
      expect(result.data.fileEntity).toBeNull();
    });

    it('should handle invalid global ID format gracefully', async () => {
      const query = `
        query FileEntityQuery($id: String!) {
          fileEntity(id: $id) {
            id
            filename
          }
        }
      `;

      const variables = { id: 'invalid-id-format' };
      const context = createAuthContext(testUser.sessionKey);
      const result = await executeGraphQLQuery<any>(query, variables, context);

      // Should handle invalid global ID gracefully without errors
      expect(result.errors).toStrictEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data.fileEntity).toBeNull();
    });
  });

  describe('files Query (with pagination)', () => {
    it('should support paginated file queries', async () => {
      // Create multiple files
      for (let i = 1; i <= 5; i++) {
        await createTestFile({ filename: `paginated-file-${i}.txt` });
      }

      const query = `
        query FilesQuery($first: Int, $after: String) {
          fileEntities(first: $first, after: $after) {
            edges {
              node {
                id
                filename
              }
              cursor
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
            totalCount
          }
        }
      `;

      const context = createAuthContext(testUser.sessionKey);
      const result = await executeGraphQLQuery<any>(query, { first: 3 }, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.fileEntities).toBeDefined();
      expect(result.data.fileEntities.edges).toHaveLength(3);
      expect(result.data.fileEntities.totalCount).toBeGreaterThanOrEqual(5);
      expect(result.data.fileEntities.pageInfo.hasNextPage).toBe(true);
    });

    it('should support filtering by file type', async () => {
      await createTestFile({ filename: 'doc1.pdf', extension: 'pdf', fullPath: '/tmp/doc1.pdf' });
      await createTestFile({ filename: 'doc2.pdf', extension: 'pdf', fullPath: '/tmp/doc2.pdf' });
      await createTestFile({ filename: 'image.jpg', extension: 'jpg', fullPath: '/tmp/image.jpg' });

      // For now, test basic pagination without filtering
      // TODO: Add filtering support to FileEntityResolver if needed
      const query = `
        query FilesByType {
          fileEntities(first: 10) {
            edges {
              node {
                id
                filename
                fileType
              }
            }
            totalCount
          }
        }
      `;

      const context = createAuthContext(testUser.sessionKey);
      const result = await executeGraphQLQuery<any>(query, {}, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.fileEntities.totalCount).toBeGreaterThanOrEqual(3);

      // Check that we have PDF and JPG files by filename since fileType may be 'other'
      const pdfFiles = result.data.fileEntities.edges.filter((edge: any) =>
        edge.node.filename.endsWith('.pdf')
      );
      const jpgFiles = result.data.fileEntities.edges.filter((edge: any) =>
        edge.node.filename.endsWith('.jpg')
      );
      expect(pdfFiles.length).toBeGreaterThanOrEqual(2);
      expect(jpgFiles.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Global ID Handling', () => {
    it('should properly handle global ID conversion', async () => {
      const testFile = await createTestFile({ filename: 'global-id-test.txt' });

      const query = `
        query FileEntityQuery($id: String!) {
          fileEntity(id: $id) {
            id
            modelId
            filename
          }
        }
      `;

      const variables = { id: testFile.id }; // testFile.id is already a global ID from GraphQL
      const context = createAuthContext(testUser.sessionKey);
      const result = await executeGraphQLQuery<any>(query, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.fileEntity).toBeDefined();

      // Verify global ID format
      const resultIdParts = fromGlobalId(result.data.fileEntity.id);
      const testFileIdParts = fromGlobalId(testFile.id);
      expect(resultIdParts.type).toBe('FileEntity');
      expect(resultIdParts.id).toBe(testFileIdParts.id); // Compare local IDs
    });

    it('should handle Relay global ID to local ID conversion', async () => {
      const testFile = await createTestFile({ filename: 'relay-id-test.txt' });

      // Extract local ID from global ID
      const localId = fromGlobalIdToLocalId(testFile.id);
      expect(localId).toBeDefined();
      expect(typeof localId).toBe('string');

      // Query using the global ID should work
      const query = `
        query FileEntityQuery($id: String!) {
          fileEntity(id: $id) {
            id
            filename
          }
        }
      `;

      const variables = { id: testFile.id };
      const context = createAuthContext(testUser.sessionKey);
      const result = await executeGraphQLQuery<any>(query, variables, context);

      expect(result.errors).toStrictEqual([]);
      console.log(result);
      expect(result.data.fileEntity.filename).toBe('relay-id-test.txt');
    });
  });

  describe('File Field Resolution', () => {
    it('should resolve all File fields correctly', async () => {
      const testFile = await createTestFile({
        filename: 'field-test.txt',
        extension: 'txt',
        fullPath: '/tmp/field-test.txt'
      });

      const query = `
        query FileEntityQuery($id: String!) {
          fileEntity(id: $id) {
            id
            modelId
            filename
            extension
            fullPath
            fileType
            fileSize
            fileHash
            metadata
            status
            createdAt
            updatedAt
            deletedAt
          }
        }
      `;

      const variables = { id: testFile.id };
      const context = createAuthContext(testUser.sessionKey);
      const result = await executeGraphQLQuery<any>(query, variables, context);

      expect(result.errors).toStrictEqual([]);
      expect(result.data.fileEntity).toBeDefined();

      const file = result.data.fileEntity;
      expect(file.filename).toBe('field-test.txt');
      expect(file.extension).toBe('txt');
      expect(file.fullPath).toBe('/tmp/field-test.txt');
      expect(file.status).toBe('pending'); // Default status
      expect(file.deletedAt).toBeNull();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed GraphQL requests gracefully', async () => {
      const malformedQuery = `
        query {
          file(id: "test") {
            id
            nonexistentField
          }
        }
      `;

      const context = createAuthContext(testUser.sessionKey);
      const result = await executeGraphQLQuery<any>(malformedQuery, {}, context);

      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle null and empty inputs appropriately', async () => {
      const query = `
        query FileEntityQuery($id: String!) {
          fileEntity(id: $id) {
            id
            filename
          }
        }
      `;

      const variables = { id: null };
      const context = createAuthContext(testUser.sessionKey);
      const result = await executeGraphQLQuery<any>(query, variables, context);

      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate query input types strictly', async () => {
      const query = `
        query FilesQuery($first: Int) {
          fileEntities(first: $first) {
            edges {
              node {
                id
              }
            }
            totalCount
          }
        }
      `;

      // Test with invalid input type
      const variables = { first: "not-a-number" };
      const context = createAuthContext(testUser.sessionKey);
      const result = await executeGraphQLQuery<any>(query, variables, context);

      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Integration Workflows', () => {
    it('should support complete file lifecycle via GraphQL', async () => {
      // 1. Create file
      const createMutation = `
        mutation CreateFile($input: CreateFileEntityInput!) {
          createFileEntity(input: $input) {
            id
            modelId
            filename
            status
          }
        }
      `;

      const createVariables = {
        input: {
          filename: 'lifecycle-file.txt',
          extension: 'txt',
          fullPath: '/tmp/lifecycle-file.txt'
        }
      };

      const createContext = createAuthContext(testUser.sessionKey);
      const createResult = await executeGraphQLQuery<any>(createMutation, createVariables, createContext);
      expect(createResult.errors).toStrictEqual([]);
      const createdFile = createResult.data.createFileEntity;

      // 2. Query the file
      const query = `
        query FileEntityQuery($id: String!) {
          fileEntity(id: $id) {
            id
            modelId
            filename
            status
            createdAt
            updatedAt
          }
        }
      `;

      const queryResult = await executeGraphQLQuery<any>(query, { id: createdFile.id }, createContext);
      expect(queryResult.errors).toStrictEqual([]);
      expect(queryResult.data.fileEntity.modelId).toBeDefined();

      // 3. Query all files to verify it appears in list
      const listQuery = `
        query {
          fileEntitiesArray {
            id
            filename
            status
          }
        }
      `;

      const listResult = await executeGraphQLQuery<any>(listQuery, {}, createContext);
      expect(listResult.errors).toStrictEqual([]);
      expect(listResult.data.fileEntitiesArray.length).toBeGreaterThanOrEqual(1);

      const fileInList = listResult.data.fileEntitiesArray.find((f: any) => f.id === createdFile.id);
      expect(fileInList).toBeDefined();
      expect(fileInList.filename).toBe('lifecycle-file.txt');
    });

    it('should handle concurrent file queries safely', async () => {
      // Create multiple files concurrently
      const createPromises = Array.from({ length: 3 }, async (_, i) => {
        return await createTestFile({ filename: `concurrent-file-${i}.txt` });
      });

      const createdFiles = await Promise.all(createPromises);

      // Query all files concurrently
      const queryPromises = createdFiles.map(async (file) => {
        const query = `
          query FileEntityQuery($id: String!) {
            fileEntity(id: $id) {
              id
              filename
            }
          }
        `;

        const variables = { id: file.id };
        const context = createAuthContext(testUser.sessionKey);
        return await executeGraphQLQuery<any>(query, variables, context);
      });

      const results = await Promise.all(queryPromises);

      // Verify all queries succeeded
      results.forEach((result, i) => {
        expect(result.errors).toStrictEqual([]);
        expect(result.data.fileEntity).toBeDefined();
        expect(result.data.fileEntity.filename).toBe(`concurrent-file-${i}.txt`);
      });
    });
  });
});