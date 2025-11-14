/**
 * File Factory
 * Factory functions for creating file test data
 */

import { randomUUID } from 'node:crypto';
import fs from 'fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { File } from '@main/db/entities/File.js';
import { FileFileType } from '@main/db/entities/__generated__/FileBase.js';

export interface CreateFileOptions {
  userId?: string;
  filename?: string;
  fileType?: string;
  extension?: string;
  fullPath?: string;
  size?: number;
  metadata?: Record<string, any>;
}

export interface CreateFileWithContentOptions {
  userId?: string;
  filename?: string;
  extension?: string;
  fileType?: string;
  content?: string;
  metadata?: Record<string, any>;
  ownerId?: string;
  ownerType?: string;
}

export async function createFile(
  dataSource: any,
  options: CreateFileOptions = {}
) {
  const fileRepository = dataSource.getRepository(File);

  const defaultOptions = {
    filename: 'test-file.txt',
    fileType: FileFileType.document,
    extension: '.txt',
    fullPath: '/tmp/test-file.txt',
    fileSize: 100,
    fileHash: 'test-file-hash',
    mimeType: 'text/plain',
    metadata: {},
    userId: options.userId || 'test-user-id',
    ...options
  };

  const file = await fileRepository.save(defaultOptions);
  return file;
}

/**
 * Create a file with actual content on disk
 * - Generates unique filename if not provided
 * - Creates temporary file with actual content
 * - Returns file entity record
 */
export async function createFileWithContent(
  dataSource: any,
  options: CreateFileWithContentOptions = {}
) {
  const fileRepository = dataSource.getRepository(File);

  // Generate unique filename if not provided
  const uniqueId = randomUUID().substring(0, 8);
  const filename = options.filename || `test-file-${uniqueId}.txt`;
  const extension = options.extension || '.txt';

  // Create temp directory path
  const tempDir = path.join(process.cwd(), '.data', 'test-files');
  await fs.mkdir(tempDir, { recursive: true });

  // Generate file path
  const fullPath = path.join(tempDir, filename);

  // Default content based on file type (only if no content provided)
  let content = options.content !== undefined ? options.content : undefined;
  if (content === undefined) {
    switch (options.fileType || FileFileType.document) {
      case FileFileType.document:
        if (extension === '.md') {
          content = `# Test Markdown File

This is a test markdown file created by the file factory.

## Features
- **Bold text**
- *Italic text*

### Lists
1. First item
2. Second item
3. Third item

> This is a blockquote for testing.

Created at: ${new Date().toISOString()}`;
        } else {
          content = `This is a test file created by the file factory. It contains enough content to test various text processing features. The content is generated randomly for each test run to ensure test isolation. Created at ${new Date().toISOString()}.`;
        }
        break;
      default:
        content = 'Default test content for file factory.';
    }
  }

  // Write content to file
  await fs.writeFile(fullPath, content, 'utf-8');

  // Generate file hash
  const fileHash = createHash('sha256').update(content).digest('hex');

  // Determine MIME type based on extension
  let mimeType = 'text/plain';
  if (extension === '.md') {
    mimeType = 'text/markdown';
  } else if (extension === '.pdf') {
    mimeType = 'application/pdf';
  } else if (extension === '.jpg' || extension === '.jpeg') {
    mimeType = 'image/jpeg';
  } else if (extension === '.png') {
    mimeType = 'image/png';
  }

  // Create file record
  const fileOptions = {
    filename,
    fileType: options.fileType || FileFileType.document,
    extension,
    fullPath,
    fileSize: content.length,
    fileHash,
    mimeType,
    metadata: options.metadata || {},
    userId: options.userId || 'test-user-id',
    ownerId: options.ownerId,
    ownerType: options.ownerType
  };

  const file = await fileRepository.save(fileOptions);
  return file;
}

export async function createFiles(
  dataSource: any,
  count: number,
  options: CreateFileOptions = {}
) {
  const files = [];
  for (let i = 0; i < count; i++) {
    const file = await createFile(dataSource, {
      ...options,
      filename: options.filename ? `${options.filename.replace('.', `-${i + 1}.`)}` : `test-file-${i + 1}.txt`,
      extension: options.extension || '.txt'
    });
    files.push(file);
  }
  return files;
}

/**
 * Create multiple files with content
 */
export async function createFilesWithContent(
  dataSource: any,
  count: number,
  options: CreateFileWithContentOptions = {}
) {
  const files = [];
  for (let i = 0; i < count; i++) {
    const file = await createFileWithContent(dataSource, {
      ...options,
      filename: options.filename ? `${path.parse(options.filename).name}-${i + 1}${path.parse(options.filename).ext}` : undefined,
      content: options.content ? `${options.content}\n\nContent variation ${i + 1}` : undefined
    });
    files.push(file);
  }
  return files;
}