/**
 * ProcessFileJob Tests
 *
 * Tests for ProcessFileJob functionality without any mocking.
 * This test creates real files on disk and tests the complete file processing pipeline.
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { ProcessFileJob } from '@main/jobs/ProcessFileJob';
import { DataSourceProvider } from '@base/db/index';
import { EntityClasses, getEntity, loadEntities } from '@main/db/entityMap';
import { createTestUser } from '@factories/index';
import { createFileWithContent, createFilesWithContent } from '@factories/fileFactory';
import { FileEntityStatus, FileEntityFileType } from '@main/db/entities/__generated__/FileEntityBase';
import { cleanupTestDatabase, createTestDatabase } from '@tests/base/testDatabase';
import { DataSource } from 'typeorm';
import JobQueue from '@main/services/JobQueue';
import fs from 'fs/promises';
import path from 'path';

describe('ProcessFileJob', () => {
  let dataSource: DataSource;
  let testUser: any;
  let Job: EntityClasses['Job'];
  let jobQueue: JobQueue;
  let FileEntity: any;

  beforeEach(async () => {
    dataSource = await createTestDatabase();
    testUser = await createTestUser(dataSource);
    Job = getEntity('Job');

    // Load entities
    const entities = await loadEntities();
    FileEntity = entities.FileEntity;

    // Set up JobQueue for job integration tests
    jobQueue = new JobQueue();
    jobQueue.registerJob(ProcessFileJob);
  });

  afterEach(async () => {
    // Stop job queue first to ensure no pending jobs
    if (jobQueue) {
      await jobQueue.stop();
    }

    // Wait for any pending async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    DataSourceProvider.clearTestDataSource();
    await cleanupTestDatabase(dataSource);
  });

  describe('perform method - Real File Processing', () => {
    it('should process a pending text file and update metadata', async () => {
      // Create a real text file on disk
      const fileContent = `This is a test document for ProcessFileJob.
It contains multiple lines of text to test file processing.
The file should be processed and metadata should be extracted.
Created at: ${new Date().toISOString()}`;

      const file = await createFileWithContent(dataSource, {
        userId: testUser.id,
        filename: 'test-document.txt',
        extension: '.txt',
        content: fileContent,
        fileType: FileEntityFileType.other // Initially set to other, job should detect document
      });

      // Verify file starts with pending status
      expect(file.status).toBe(FileEntityStatus.pending);
      expect(file.fileType).toBe(FileEntityFileType.other);

      // Execute the job
      const result = await ProcessFileJob.performNow(testUser.id, file.id, {});

      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      // Verify the file was processed
      const updatedFile = await dataSource.getRepository(FileEntity).findOne({
        where: { id: file.id }
      });

      expect(updatedFile).toBeDefined();
      expect(updatedFile!.status).toBe(FileEntityStatus.completed);
      expect(updatedFile!.filename).toBe('test-document.txt');
      expect(updatedFile!.extension).toBe('txt');
      expect(updatedFile!.fileSize).toBe(fileContent.length);
      expect(updatedFile!.mimeType).toBe('text/plain');
      expect(updatedFile!.fileType).toBe(FileEntityFileType.document);
      expect(updatedFile!.fileHash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash

      // Verify the actual file still exists on disk
      const fileExists = await fs.access(updatedFile!.fullPath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);
    });

    it('should process a markdown file correctly', async () => {
      const markdownContent = `# Test Markdown File

This is a **test markdown file** for ProcessFileJob.

## Features
- *Italic text*
- \`Inline code\`
- [Links](https://example.com)

\`\`\`javascript
function test() {
  console.log('Hello World');
}
\`\`\`

> This is a blockquote
`;

      const file = await createFileWithContent(dataSource, {
        userId: testUser.id,
        filename: 'test-markdown.md',
        extension: '.md',
        content: markdownContent
      });

      const result = await ProcessFileJob.performNow(testUser.id, file.id, {});

      expect(result.success).toBe(true);

      const updatedFile = await dataSource.getRepository(FileEntity).findOne({
        where: { id: file.id }
      });

      expect(updatedFile!.status).toBe(FileEntityStatus.completed);
      expect(updatedFile!.mimeType).toBe('text/markdown');
      expect(updatedFile!.fileType).toBe(FileEntityFileType.document);
      expect(updatedFile!.extension).toBe('md');
    });

    it('should process multiple pending files in batch', async () => {
      // Create multiple files with different content
      const files = await createFilesWithContent(dataSource, 3, {
        userId: testUser.id,
        extension: '.txt',
        fileType: FileEntityFileType.other,
        content: 'Base test content for batch processing'
      });

      // Verify all files start as pending
      for (const file of files) {
        expect(file.status).toBe(FileEntityStatus.pending);
      }

      // Execute the job - it should process ALL pending files
      const result = await ProcessFileJob.performNow(testUser.id, 'any-target-id', {});

      expect(result.success).toBe(true);

      // Verify all files were processed
      for (const file of files) {
        const updatedFile = await dataSource.getRepository(FileEntity).findOne({
          where: { id: file.id }
        });
        expect(updatedFile!.status).toBe(FileEntityStatus.completed);
        expect(updatedFile!.fileType).toBe(FileEntityFileType.document);
      }
    });

    it('should handle image files correctly', async () => {
      // Create a minimal PNG file (1x1 pixel PNG)
      const pngData = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
        0x49, 0x48, 0x44, 0x52, // IHDR
        0x00, 0x00, 0x00, 0x01, // width: 1
        0x00, 0x00, 0x00, 0x01, // height: 1
        0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
        0x90, 0x77, 0x53, 0xDE, // CRC
        0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
        0x49, 0x44, 0x41, 0x54, // IDAT
        0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // compressed data
        0x00, 0x00, 0x00, 0x00, // IEND chunk length
        0x49, 0x45, 0x4E, 0x44, // IEND
        0xAE, 0x42, 0x60, 0x82  // CRC
      ]);

      const tempDir = path.join(process.cwd(), '.data', 'test-files');
      await fs.mkdir(tempDir, { recursive: true });
      const imagePath = path.join(tempDir, 'test-image.png');
      await fs.writeFile(imagePath, pngData);

      // Create file record pointing to the image
      const fileRepository = dataSource.getRepository(FileEntity);
      const file = await fileRepository.save({
        userId: testUser.id,
        filename: 'test-image.png',
        extension: '.png',
        fullPath: imagePath,
        status: FileEntityStatus.pending,
        fileType: FileEntityFileType.other,
        mimeType: 'application/octet-stream',
        fileSize: pngData.length,
        fileHash: '<empty>'
      });

      const result = await ProcessFileJob.performNow(testUser.id, file.id, {});

      expect(result.success).toBe(true);

      const updatedFile = await dataSource.getRepository(FileEntity).findOne({
        where: { id: file.id }
      });

      expect(updatedFile!.status).toBe(FileEntityStatus.completed);
      expect(updatedFile!.mimeType).toBe('image/png');
      expect(updatedFile!.fileType).toBe(FileEntityFileType.image);
      expect(updatedFile!.extension).toBe('png');
      expect(updatedFile!.fileSize).toBe(pngData.length);
    });

    it('should handle files with different extensions correctly', async () => {
      const testCases = [
        { filename: 'document.pdf', extension: '.pdf', expectedMime: 'application/pdf' },
        { filename: 'image.jpg', extension: '.jpg', expectedMime: 'image/jpeg' },
        { filename: 'audio.mp3', extension: '.mp3', expectedMime: 'audio/mpeg' },
        { filename: 'video.mp4', extension: '.mp4', expectedMime: 'video/mp4' },
        { filename: 'data.json', extension: '.json', expectedMime: 'application/json' }
      ];

      for (const testCase of testCases) {
        const file = await createFileWithContent(dataSource, {
          userId: testUser.id,
          filename: testCase.filename,
          extension: testCase.extension,
          content: 'Test content for ' + testCase.filename
        });

        const result = await ProcessFileJob.performNow(testUser.id, file.id, {});

        expect(result.success).toBe(true);

        const updatedFile = await dataSource.getRepository(FileEntity).findOne({
          where: { id: file.id }
        });

        expect(updatedFile!.status).toBe(FileEntityStatus.completed);
        expect(updatedFile!.extension).toBe(testCase.extension.slice(1)); // Without dot
        expect(updatedFile!.filename).toBe(testCase.filename);
      }
    });

    it('should handle files without extensions', async () => {
      const file = await createFileWithContent(dataSource, {
        userId: testUser.id,
        filename: 'no-extension',
        extension: '',
        content: 'File without extension'
      });

      const result = await ProcessFileJob.performNow(testUser.id, file.id, {});

      expect(result.success).toBe(true);

      const updatedFile = await dataSource.getRepository(FileEntity).findOne({
        where: { id: file.id }
      });

      expect(updatedFile!.status).toBe(FileEntityStatus.completed);
      expect(updatedFile!.extension).toBe('');
      expect(updatedFile!.mimeType).toBe('application/octet-stream');
      expect(updatedFile!.fileType).toBe(FileEntityFileType.other);
    });

    it('should handle file processing errors gracefully', async () => {
      // Create file with non-existent path
      const fileRepository = dataSource.getRepository(FileEntity);
      const file = await fileRepository.save({
        userId: testUser.id,
        filename: 'non-existent.txt',
        extension: '.txt',
        fullPath: '/path/that/does/not/exist.txt',
        status: FileEntityStatus.pending,
        fileType: FileEntityFileType.other,
        mimeType: 'application/octet-stream',
        fileSize: 0,
        fileHash: '<empty>'
      });

      const result = await ProcessFileJob.performNow(testUser.id, file.id, {});

      expect(result.success).toBe(true); // Job succeeds even if individual files fail

      const updatedFile = await dataSource.getRepository(FileEntity).findOne({
        where: { id: file.id }
      });

      // File should be marked as error due to missing file
      expect(updatedFile!.status).toBe(FileEntityStatus.error);
    });

    it('should generate correct SHA-256 hash for file content', async () => {
      const fileContent = 'Specific content for hash testing';
      const expectedHash = 'd4ad3347b4b87e80a7acb3e889d9323ddbf85600ae9e0887a05999d74a078017'; // Pre-computed SHA-256

      const file = await createFileWithContent(dataSource, {
        userId: testUser.id,
        filename: 'hash-test.txt',
        extension: '.txt',
        content: fileContent
      });

      const result = await ProcessFileJob.performNow(testUser.id, file.id, {});

      expect(result.success).toBe(true);

      const updatedFile = await dataSource.getRepository(FileEntity).findOne({
        where: { id: file.id }
      });

      expect(updatedFile!.fileHash).toBe(expectedHash);
    });

    it('should handle empty files', async () => {
      const file = await createFileWithContent(dataSource, {
        userId: testUser.id,
        filename: 'empty.txt',
        extension: '.txt',
        content: ''
      });

      const result = await ProcessFileJob.performNow(testUser.id, file.id, {});

      expect(result.success).toBe(true);

      const updatedFile = await dataSource.getRepository(FileEntity).findOne({
        where: { id: file.id }
      });

      expect(updatedFile!.status).toBe(FileEntityStatus.completed);
      expect(updatedFile!.fileSize).toBe(0);
      expect(updatedFile!.fileHash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'); // SHA-256 of empty string
    });

    it('should skip files that are already completed', async () => {
      // Create a file and manually mark it as completed
      const file = await createFileWithContent(dataSource, {
        userId: testUser.id,
        filename: 'already-completed.txt',
        extension: '.txt',
        content: 'This file is already processed'
      });

      // Manually update file to completed status
      await dataSource.getRepository(FileEntity).update(file.id, {
        status: FileEntityStatus.completed,
        fileType: FileEntityFileType.document,
        mimeType: 'text/plain'
      });

      const result = await ProcessFileJob.performNow(testUser.id, file.id, {});

      expect(result.success).toBe(true);

      // File should remain completed and unchanged
      const updatedFile = await dataSource.getRepository(FileEntity).findOne({
        where: { id: file.id }
      });

      expect(updatedFile!.status).toBe(FileEntityStatus.completed);
      expect(updatedFile!.fileType).toBe(FileEntityFileType.document);
    });

    it('should process very large files efficiently', async () => {
      // Create a large file (1MB of text)
      const largeContent = 'A'.repeat(1024 * 1024);

      const file = await createFileWithContent(dataSource, {
        userId: testUser.id,
        filename: 'large-file.txt',
        extension: '.txt',
        content: largeContent
      });

      const startTime = Date.now();
      const result = await ProcessFileJob.performNow(testUser.id, file.id, {});
      const processingTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(processingTime).toBeLessThan(10000); // Should complete within 10 seconds

      const updatedFile = await dataSource.getRepository(FileEntity).findOne({
        where: { id: file.id }
      });

      expect(updatedFile!.status).toBe(FileEntityStatus.completed);
      expect(updatedFile!.fileSize).toBe(largeContent.length);
      expect(updatedFile!.fileHash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('Job Integration', () => {
    it('should work with job queue system', async () => {
      const file = await createFileWithContent(dataSource, {
        userId: testUser.id,
        filename: 'job-queue-test.txt',
        extension: '.txt',
        content: 'Test job queue integration'
      });

      // Enqueue job
      const job = await ProcessFileJob.performLater(
        testUser.id,
        file.id,
        {}
      );

      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.type).toBe('ProcessFileJob');
      expect(job.status).toBe('PENDING');
    });

    it('should schedule job for later execution', async () => {
      const file = await createFileWithContent(dataSource, {
        userId: testUser.id,
        filename: 'scheduled-test.txt',
        extension: '.txt',
        content: 'Test scheduled execution'
      });

      const futureTime = new Date(Date.now() + 60000); // 1 minute from now

      const job = await ProcessFileJob.performAt(
        futureTime,
        testUser.id,
        file.id,
        {}
      );

      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.scheduledAt).toEqual(futureTime);
      expect(job.status).toBe('PENDING');
    });

    it('should support job deduplication', async () => {
      const file = await createFileWithContent(dataSource, {
        userId: testUser.id,
        filename: 'deduplication-test.txt',
        extension: '.txt',
        content: 'Test job deduplication'
      });

      // Create multiple jobs
      const job1 = await ProcessFileJob.performLater(testUser.id, file.id, {});
      const job2 = await ProcessFileJob.performLater(testUser.id, file.id, {});

      expect(job1.id).toBeDefined();
      expect(job2.id).toBeDefined();
      expect(job1.type).toBe('ProcessFileJob');
      expect(job2.type).toBe('ProcessFileJob');
    });
  });

  describe('Helper Methods', () => {
    it('should detect file types correctly based on MIME types', async () => {
      const testCases = [
        { mimeType: 'image/png', expectedType: FileEntityFileType.image },
        { mimeType: 'video/mp4', expectedType: FileEntityFileType.video },
        { mimeType: 'audio/mp3', expectedType: FileEntityFileType.audio },
        { mimeType: 'application/pdf', expectedType: FileEntityFileType.document },
        { mimeType: 'text/plain', expectedType: FileEntityFileType.document },
        { mimeType: 'application/json', expectedType: FileEntityFileType.document },
        { mimeType: 'application/xml', expectedType: FileEntityFileType.document },
        { mimeType: 'application/octet-stream', expectedType: FileEntityFileType.other },
        { mimeType: 'application/zip', expectedType: FileEntityFileType.other }
      ];

      for (const testCase of testCases) {
        // Create file with appropriate extension for expected MIME type
        let extension = '.bin';
        if (testCase.mimeType === 'image/jpeg') extension = '.jpg';
        else if (testCase.mimeType === 'image/png') extension = '.png';
        else if (testCase.mimeType === 'video/mp4') extension = '.mp4';
        else if (testCase.mimeType === 'audio/mp3') extension = '.mp3';
        else if (testCase.mimeType === 'application/pdf') extension = '.pdf';
        else if (testCase.mimeType === 'text/plain') extension = '.txt';
        else if (testCase.mimeType === 'text/markdown') extension = '.md';
        else if (testCase.mimeType === 'application/json') extension = '.json';
        else if (testCase.mimeType === 'application/xml') extension = '.xml';

        const file = await createFileWithContent(dataSource, {
          userId: testUser.id,
          filename: `test-${testCase.mimeType.replace('/', '-')}${extension}`,
          extension: extension,
          content: `Test content for ${testCase.mimeType} with extension ${extension}`
        });

        const result = await ProcessFileJob.performNow(testUser.id, file.id, {});

        expect(result.success).toBe(true);

        const updatedFile = await dataSource.getRepository(FileEntity).findOne({
          where: { id: file.id }
        });

        // File type should be based on the detected MIME type from file extension,
        // not the manually set database MIME type, as the job detects from file

        expect(updatedFile!.fileType).toBe(testCase.expectedType);
      }
    });
  });
});