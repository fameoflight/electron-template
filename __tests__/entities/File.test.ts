/**
 * File Entity Tests
 *
 * Tests for File entity defaults and field validation based on schemas/File.json
 * Verifies that all default values from the schema are correctly applied
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DataSource, MoreThanOrEqual } from 'typeorm';
import { FileEntity } from '@main/db/entities/FileEntity';
import { FileEntityStatus, FileEntityFileType } from '@main/db/entities/__generated__/FileEntityBase';
import { cleanupTestDatabase, createTestDatabase } from '../base/testDatabase';
import { createTestUser } from '@factories/index';

describe('File Entity Defaults', () => {
  let dataSource: DataSource;
  let testUser: any;
  let fileRepository: any;

  beforeEach(async () => {
    dataSource = await createTestDatabase();
    testUser = await createTestUser(dataSource);
    fileRepository = dataSource.getRepository(FileEntity);
  });

  afterEach(async () => {
    await cleanupTestDatabase(dataSource);
  });

  describe('Schema Default Values', () => {
    it('should set correct default values when creating file with minimal required fields', async () => {
      // Only provide required fields, let defaults handle the rest
      const file = new FileEntity();
      file.filename = 'test-file.txt';
      file.extension = 'txt';
      file.fullPath = '/tmp/test-file.txt';
      file.userId = testUser.id;

      const savedFile = await fileRepository.save(file);

      // Verify all default values from schemas/File.json
      expect(savedFile.id).toBeDefined();
      expect(savedFile.userId).toBe(testUser.id);

      // Required fields we provided
      expect(savedFile.filename).toBe('test-file.txt');
      expect(savedFile.extension).toBe('txt');
      expect(savedFile.fullPath).toBe('/tmp/test-file.txt');

      // Default values from schema
      expect(savedFile.status).toBe(FileEntityStatus.pending); // default: "pending"
      expect(savedFile.fileSize).toBe(0); // default: 0
      expect(savedFile.mimeType).toBe('application/octet-stream'); // default: "application/octet-stream"
      expect(savedFile.fileType).toBe(FileEntityFileType.other); // default: "other"
      expect(savedFile.fileHash).toBe('<empty>'); // default: "<empty>"

      // Optional fields should be null/undefined
      expect(savedFile.metadata).toBeNull(); // required: false
      expect(savedFile.ownerId).toBeNull(); // required: false
      expect(savedFile.ownerType).toBeNull(); // required: false

      // BaseEntity inherited fields
      expect(savedFile.createdAt).toBeInstanceOf(Date);
      expect(savedFile.updatedAt).toBeInstanceOf(Date);
      expect(savedFile.deletedAt).toBeNull();
    });

    it('should handle status enum default correctly', async () => {
      const file = new FileEntity();
      file.filename = 'status-test.pdf';
      file.extension = 'pdf';
      file.fullPath = '/tmp/status-test.pdf';
      file.userId = testUser.id;

      // Don't set status - should default to pending
      const savedFile = await fileRepository.save(file);

      expect(savedFile.status).toBe(FileEntityStatus.pending);

      // Verify it's a valid enum value
      expect(Object.values(FileEntityStatus)).toContain(savedFile.status);
    });

    it('should handle fileType enum default correctly', async () => {
      const file = new FileEntity();
      file.filename = 'type-test.jpg';
      file.extension = 'jpg';
      file.fullPath = '/tmp/type-test.jpg';
      file.userId = testUser.id;

      // Don't set fileType - should default to other
      const savedFile = await fileRepository.save(file);

      expect(savedFile.fileType).toBe(FileEntityFileType.other);

      // Verify it's a valid enum value
      expect(Object.values(FileEntityFileType)).toContain(savedFile.fileType);
    });

    it('should use provided values instead of defaults when explicitly set', async () => {
      const file = new FileEntity();
      file.filename = 'custom-defaults.doc';
      file.extension = 'doc';
      file.fullPath = '/tmp/custom-defaults.doc';
      file.userId = testUser.id;

      // Explicitly set values that have defaults
      file.status = FileEntityStatus.completed;
      file.fileSize = 1024;
      file.mimeType = 'application/msword';
      file.fileType = FileEntityFileType.document;
      file.fileHash = 'custom-hash-123';
      file.metadata = { author: 'Test User', created: new Date() };

      const savedFile = await fileRepository.save(file);

      // Should use provided values, not defaults
      expect(savedFile.status).toBe(FileEntityStatus.completed);
      expect(savedFile.fileSize).toBe(1024);
      expect(savedFile.mimeType).toBe('application/msword');
      expect(savedFile.fileType).toBe(FileEntityFileType.document);
      expect(savedFile.fileHash).toBe('custom-hash-123');
      expect(savedFile.metadata).toEqual({ author: 'Test User', created: expect.any(String) });
    });

    it('should handle polymorphic owner defaults correctly', async () => {
      const file = new FileEntity();
      file.filename = 'owned-file.txt';
      file.extension = 'txt';
      file.fullPath = '/tmp/owned-file.txt';
      file.userId = testUser.id;

      // Don't set owner fields - should default to null
      const savedFile = await fileRepository.save(file);

      expect(savedFile.ownerId).toBeNull();
      expect(savedFile.ownerType).toBeNull();

      // Test with owner fields set
      const fileWithOwner = new FileEntity();
      fileWithOwner.filename = 'chat-attachment.pdf';
      fileWithOwner.extension = 'pdf';
      fileWithOwner.fullPath = '/tmp/chat-attachment.pdf';
      fileWithOwner.userId = testUser.id;
      fileWithOwner.ownerId = 'chat-123';
      fileWithOwner.ownerType = 'Chat';

      const savedFileWithOwner = await fileRepository.save(fileWithOwner);

      expect(savedFileWithOwner.ownerId).toBe('chat-123');
      expect(savedFileWithOwner.ownerType).toBe('Chat');
    });
  });

  describe('Field Validation and Constraints', () => {
    it('should enforce required fields', async () => {
      const file = new FileEntity();
      file.userId = testUser.id;
      // Missing required fields: filename, extension, fullPath

      await expect(fileRepository.save(file)).rejects.toThrow();
    });


    it('should accept valid enum values', async () => {
      // Test all valid status values
      const statusValues = Object.values(FileEntityStatus);
      for (const status of statusValues) {
        const file = new FileEntity();
        file.filename = `test-${status}.txt`;
        file.extension = 'txt';
        file.fullPath = `/tmp/test-${status}.txt`;
        file.userId = testUser.id;
        file.status = status;

        const savedFile = await fileRepository.save(file);
        expect(savedFile.status).toBe(status);
      }

      // Test all valid fileType values
      const fileTypeValues = Object.values(FileEntityFileType);
      for (const fileType of fileTypeValues) {
        const file = new FileEntity();
        file.filename = `test-${fileType}.txt`;
        file.extension = 'txt';
        file.fullPath = `/tmp/test-${fileType}.txt`;
        file.userId = testUser.id;
        file.fileType = fileType;

        const savedFile = await fileRepository.save(file);
        expect(savedFile.fileType).toBe(fileType);
      }
    });

    it('should handle JSON metadata field correctly', async () => {
      const complexMetadata = {
        dimensions: { width: 1920, height: 1080 },
        exif: {
          camera: 'Canon EOS R5',
          lens: 'RF 24-70mm f/2.8L IS USM',
          iso: 400,
          aperture: 2.8,
          shutter: '1/125'
        },
        tags: ['landscape', 'nature', 'sunset'],
        location: {
          latitude: 37.7749,
          longitude: -122.4194
        },
        processed: true,
        versions: ['original', 'thumbnail', 'preview']
      };

      const file = new FileEntity();
      file.filename = 'complex-metadata.jpg';
      file.extension = 'jpg';
      file.fullPath = '/tmp/complex-metadata.jpg';
      file.userId = testUser.id;
      file.metadata = complexMetadata;

      const savedFile = await fileRepository.save(file);

      expect(savedFile.metadata).toEqual(complexMetadata);
      expect(savedFile.metadata.dimensions.width).toBe(1920);
      expect(savedFile.metadata.exif.camera).toBe('Canon EOS R5');
      expect(savedFile.metadata.tags).toContain('landscape');
    });
  });

  describe('Database Indexes and Constraints', () => {
    it('should create files with unique IDs', async () => {
      const files = [];

      // Create multiple files
      for (let i = 0; i < 5; i++) {
        const file = new FileEntity();
        file.filename = `test-${i}.txt`;
        file.extension = 'txt';
        file.fullPath = `/tmp/test-${i}.txt`;
        file.userId = testUser.id;

        const savedFile = await fileRepository.save(file);
        files.push(savedFile);
      }

      // All IDs should be unique
      const ids = files.map(f => f.id);
      const uniqueIds = [...new Set(ids)];
      expect(uniqueIds).toHaveLength(files.length);

      // All IDs should be valid UUIDs
      for (const id of ids) {
        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      }
    });

    it('should handle fileHash field for deduplication', async () => {
      const hashValue = 'a1b2c3d4e5f6789012345678901234567890abcd1234567890abcdef1234567890';

      // Create multiple files with same hash
      const file1 = new FileEntity();
      file1.filename = 'duplicate1.txt';
      file1.extension = 'txt';
      file1.fullPath = '/tmp/duplicate1.txt';
      file1.userId = testUser.id;
      file1.fileHash = hashValue;

      const file2 = new FileEntity();
      file2.filename = 'duplicate2.txt';
      file2.extension = 'txt';
      file2.fullPath = '/tmp/duplicate2.txt';
      file2.userId = testUser.id;
      file2.fileHash = hashValue;

      const savedFile1 = await fileRepository.save(file1);
      const savedFile2 = await fileRepository.save(file2);

      expect(savedFile1.fileHash).toBe(hashValue);
      expect(savedFile2.fileHash).toBe(hashValue);

      // Should be able to query by fileHash (testing the index)
      const filesByHash = await fileRepository.find({
        where: { fileHash: hashValue }
      });

      expect(filesByHash).toHaveLength(2);
    });

    it('should support queries by fileType and createdAt (composite index)', async () => {
      const files = [];
      const baseTime = new Date('2024-01-01T00:00:00Z');

      // Create files with different types and times
      for (let i = 0; i < 10; i++) {
        const file = new FileEntity();
        file.filename = `index-test-${i}.txt`;
        file.extension = 'txt';
        file.fullPath = `/tmp/index-test-${i}.txt`;
        file.userId = testUser.id;
        file.fileType = i % 2 === 0 ? FileEntityFileType.document : FileEntityFileType.image;
        file.createdAt = new Date(baseTime.getTime() + i * 60000); // 1 minute apart

        const savedFile = await fileRepository.save(file);
        files.push(savedFile);
      }

      // Query by fileType (should use index)
      const documentFiles = await fileRepository.find({
        where: { fileType: FileEntityFileType.document },
        order: { createdAt: 'ASC' }
      });

      expect(documentFiles).toHaveLength(5);
      documentFiles.forEach((file: FileEntity) => {
        expect(file.fileType).toBe(FileEntityFileType.document);
      });

      // Query by fileType and date range (should use composite index)
      const recentDocuments = await fileRepository.find({
        where: {
          fileType: FileEntityFileType.document,
          createdAt: MoreThanOrEqual(new Date(baseTime.getTime() + 4 * 60000))
        },
        order: { createdAt: 'ASC' }
      });

      expect(recentDocuments.length).toBeGreaterThan(0);
      recentDocuments.forEach((file: FileEntity) => {
        expect(file.fileType).toBe(FileEntityFileType.document);
        expect(file.createdAt.getTime()).toBeGreaterThanOrEqual(baseTime.getTime() + 4 * 60000);
      });
    });
  });

  describe('Timestamps and Soft Delete', () => {
    it('should set createdAt and updatedAt timestamps automatically', async () => {
      const beforeCreation = new Date();

      const file = new FileEntity();
      file.filename = 'timestamp-test.txt';
      file.extension = 'txt';
      file.fullPath = '/tmp/timestamp-test.txt';
      file.userId = testUser.id;

      const savedFile = await fileRepository.save(file);
      const afterCreation = new Date();

      expect(savedFile.createdAt).toBeInstanceOf(Date);
      expect(savedFile.updatedAt).toBeInstanceOf(Date);
      expect(savedFile.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime() - 1000);
      expect(savedFile.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime() + 1000);
      expect(savedFile.updatedAt.getTime()).toBeGreaterThanOrEqual(savedFile.createdAt.getTime());
    });

    it('should update updatedAt timestamp on modification', async () => {
      const file = new FileEntity();
      file.filename = 'update-test.txt';
      file.extension = 'txt';
      file.fullPath = '/tmp/update-test.txt';
      file.userId = testUser.id;

      const savedFile = await fileRepository.save(file);
      const originalUpdatedAt = savedFile.updatedAt;

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update the file
      savedFile.fileSize = 2048;
      savedFile.mimeType = 'text/plain';
      const updatedFile = await fileRepository.save(savedFile);

      expect(updatedFile.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should support soft delete functionality', async () => {
      const file = new FileEntity();
      file.filename = 'soft-delete-test.txt';
      file.extension = 'txt';
      file.fullPath = '/tmp/soft-delete-test.txt';
      file.userId = testUser.id;

      const savedFile = await fileRepository.save(file);

      // Should not be deleted initially
      expect(savedFile.deletedAt).toBeNull();

      // Soft delete the file
      const deleteTime = new Date();
      savedFile.deletedAt = deleteTime;
      const deletedFile = await fileRepository.save(savedFile);

      expect(deletedFile.deletedAt).toEqual(deleteTime);

      // Should not appear in normal queries
      const activeFiles = await fileRepository.find({
        where: { userId: testUser.id }
      });
      expect(activeFiles).not.toContainEqual(
        expect.objectContaining({ id: deletedFile.id })
      );

      // Should appear in queries with withDeleted
      const allFiles = await fileRepository.find({
        where: { userId: testUser.id },
        withDeleted: true
      });
      expect(allFiles).toContainEqual(
        expect.objectContaining({ id: deletedFile.id })
      );
    });
  });

  describe('Entity Relationships', () => {
    it('should associate with user correctly', async () => {
      const file = new FileEntity();
      file.filename = 'user-relationship-test.txt';
      file.extension = 'txt';
      file.fullPath = '/tmp/user-relationship-test.txt';
      file.userId = testUser.id;

      const savedFile = await fileRepository.save(file);

      // Load file with user relationship
      const fileWithUser = await fileRepository.findOne({
        where: { id: savedFile.id },
        relations: ['user']
      });

      expect(fileWithUser).toBeDefined();
      expect(fileWithUser!.user.id).toBe(testUser.id);
      expect(fileWithUser!.user.username).toBe(testUser.username);
    });

    it('should handle polymorphic owner relationship', async () => {
      const file = new FileEntity();
      file.filename = 'polymorphic-test.pdf';
      file.extension = 'pdf';
      file.fullPath = '/tmp/polymorphic-test.pdf';
      file.userId = testUser.id;
      file.ownerId = 'chat-456';
      file.ownerType = 'Chat';

      const savedFile = await fileRepository.save(file);

      expect(savedFile.ownerId).toBe('chat-456');
      expect(savedFile.ownerType).toBe('Chat');

      // Test the getOwner method if it exists
      if (typeof savedFile.getOwner === 'function') {
        // Note: This would only work if the Chat entity exists
        // For now, just verify the fields are set correctly
        expect(savedFile.ownerId).toBe('chat-456');
        expect(savedFile.ownerType).toBe('Chat');
      }
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    it('should handle empty string values correctly', async () => {
      const file = new FileEntity();
      file.filename = 'empty-test.txt';
      file.extension = 'txt';
      file.fullPath = '/tmp/empty-test.txt';
      file.userId = testUser.id;
      file.fileHash = ''; // Empty string instead of default

      const savedFile = await fileRepository.save(file);

      expect(savedFile.fileHash).toBe('');
    });

    it('should handle zero values correctly', async () => {
      const file = new FileEntity();
      file.filename = 'zero-test.txt';
      file.extension = 'txt';
      file.fullPath = '/tmp/zero-test.txt';
      file.userId = testUser.id;
      file.fileSize = 0; // Explicitly set to 0

      const savedFile = await fileRepository.save(file);

      expect(savedFile.fileSize).toBe(0);
    });

    it('should handle special characters in filename', async () => {
      const specialFilename = 'test file (1) [important].txt';
      const file = new FileEntity();
      file.filename = specialFilename;
      file.extension = 'txt';
      file.fullPath = '/tmp/' + specialFilename;
      file.userId = testUser.id;

      const savedFile = await fileRepository.save(file);

      expect(savedFile.filename).toBe(specialFilename);
      expect(savedFile.fullPath).toBe('/tmp/' + specialFilename);
    });
  });
});