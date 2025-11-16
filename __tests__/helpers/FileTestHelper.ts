/**
 * File Test Helper
 *
 * Provides utilities for creating and managing test files.
 * Eliminates repetition in file-related test setup.
 *
 * Following refactoring principles:
 * - Maximum 5 parameters per method
 * - Options pattern for 3+ parameters
 * - Helper methods remove friction
 * - DRY patterns for common file operations
 */

import { DataSource } from 'typeorm';
import { createTempFile } from '@tests/factories/fileFactory';
import { FileEntity } from '@main/db/entities/FileEntity';
import { FileEntityFileType } from '@main/db/entities/__generated__/FileEntityBase';
import { createUser } from '@factories/index';
import { toGlobalId } from '@main/base';

/**
 * Options for file creation in tests
 */
export interface FileCreationOptions {
  /** Filename for the test file */
  filename?: string;
  /** File extension */
  extension?: string;
  /** File content (will create temp file if provided) */
  content?: string;
  /** Full file path (overrides generated path) */
  fullPath?: string;
  /** User ID for file ownership */
  userId?: string;
  /** File size (bytes) */
  fileSize?: number;
  /** File type */
  fileType?: FileEntityFileType;
  /** File hash */
  fileHash?: string;
  /** File metadata */
  metadata?: Record<string, any>;
}

/**
 * Options for creating multiple files
 */
export interface MultipleFileCreationOptions extends FileCreationOptions {
  /** Number of files to create */
  count: number;
  /** Base filename pattern (will append index) */
  filenamePattern?: string;
  /** Whether to use unique paths for each file */
  uniquePaths?: boolean;
}

/**
 * Helper class for file-related test operations
 */
export class FileTestHelper {
  /**
   * Create a test file with optional content
   *
   * @param dataSource - TypeORM data source
   * @param options - File creation options
   * @returns Created file entity
   */
  static async createFile(
    dataSource: DataSource,
    options: FileCreationOptions = {}
  ): Promise<FileEntity> {
    const {
      filename = 'test-file.txt',
      extension = 'txt',
      content,
      fullPath,
      userId,
      fileSize = 0,
      fileType = 'other',
      fileHash,
      metadata = {}
    } = options;

    // Generate unique full path if not provided
    const finalFullPath = fullPath || `/tmp/test-file-${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

    // Create temp file if content provided
    if (content) {
      await createTempFile({
        filename,
        extension,
        fullPath: finalFullPath,
        content
      });
    }

    // Create file entity
    const fileRepository = dataSource.getRepository(FileEntity);
    const fileData = {
      filename,
      extension,
      fullPath: finalFullPath,
      fileSize,
      fileType: (fileType || FileEntityFileType.other) as FileEntityFileType,
      fileHash: fileHash || (content ? require('crypto').createHash('sha256').update(content).digest('hex') : '<empty>'),
      metadata,
      userId
    };

    const file = fileRepository.create(fileData);
    const savedFile = await fileRepository.save(file);

    // save returns an array when passed an array, or a single entity when passed a single entity
    return Array.isArray(savedFile) ? savedFile[0] : savedFile;
  }

  /**
   * Create a test file with a user
   *
   * @param dataSource - TypeORM data source
   * @param options - File creation options (userId will be created if not provided)
   * @returns Object with created user and file
   */
  static async createFileWithUser(
    dataSource: DataSource,
    options: FileCreationOptions = {}
  ): Promise<{ user: any; file: FileEntity }> {
    const { userId, ...fileOptions } = options;

    // Create user if not provided
    let user;
    if (userId) {
      // Use existing user (simplified - in real implementation you'd fetch the user)
      user = { id: userId, sessionKey: 'test-session-key' };
    } else {
      user = await createUser(dataSource);
    }

    // Create file with user ID
    const file = await this.createFile(dataSource, {
      ...fileOptions,
      userId: user.id
    });

    return { user, file };
  }

  /**
   * Create multiple test files
   *
   * @param dataSource - TypeORM data source
   * @param options - Options for creating multiple files
   * @returns Array of created file entities
   */
  static async createMultipleFiles(
    dataSource: DataSource,
    options: MultipleFileCreationOptions
  ): Promise<FileEntity[]> {
    const {
      count,
      filenamePattern = 'test-file',
      uniquePaths = true,
      ...singleFileOptions
    } = options;

    const files: FileEntity[] = [];

    for (let i = 0; i < count; i++) {
      const filename = uniquePaths ? `${filenamePattern}-${i}.txt` : `${filenamePattern}.txt`;

      const file = await this.createFile(dataSource, {
        ...singleFileOptions,
        filename
      });

      files.push(file);
    }

    return files;
  }

  /**
   * Create files with different types for testing type-specific functionality
   *
   * @param dataSource - TypeORM data source
   * @param types - Array of file types to create
   * @param baseOptions - Base options for all files
   * @returns Array of created files with specified types
   */
  static async createFilesWithTypes(
    dataSource: DataSource,
    types: string[],
    baseOptions: FileCreationOptions = {}
  ): Promise<FileEntity[]> {
    const files: FileEntity[] = [];

    for (const type of types) {
      const file = await this.createFile(dataSource, {
        ...baseOptions,
        fileType: type as FileEntityFileType,
        filename: `${type}-test-file.txt`,
        extension: this.getExtensionForType(type)
      });

      files.push(file);
    }

    return files;
  }

  /**
   * Get a reasonable file extension for a given file type
   *
   * @param fileType - File type
   * @returns File extension
   */
  private static getExtensionForType(fileType: string): string {
    const extensions: Record<string, string> = {
      'pdf': 'pdf',
      'image': 'jpg',
      'text': 'txt',
      'code': 'ts',
      'document': 'md',
      'other': 'txt'
    };

    return extensions[fileType] || 'txt';
  }

  /**
   * Create test files for GraphQL integration tests
   *
   * @param dataSource - TypeORM data source
   * @param count - Number of files to create
   * @param options - Additional file creation options
   * @returns Object with user, files, and their global IDs
   */
  static async createFilesForGraphQL(
    dataSource: DataSource,
    count: number,
    options: FileCreationOptions = {}
  ): Promise<{
    user: any;
    files: FileEntity[];
    globalIds: string[];
  }> {
    const { user, files } = await this.createMultipleFilesForUser(dataSource, count, options);
    const globalIds = files.map(file => toGlobalId('FileEntity', file.id));

    return { user, files, globalIds };
  }

  /**
   * Create multiple files for a single user
   *
   * @param dataSource - TypeORM data source
   * @param count - Number of files to create
   * @param options - File creation options
   * @returns Object with user and created files
   */
  static async createMultipleFilesForUser(
    dataSource: DataSource,
    count: number,
    options: FileCreationOptions = {}
  ): Promise<{ user: any; files: FileEntity[] }> {
    const { user } = await this.createFileWithUser(dataSource, options);

    const files = await this.createMultipleFiles(dataSource, {
      count,
      userId: user.id,
      filenamePattern: `${options.filename || 'test-file'}-for-${user.id}`,
      ...options
    });

    return { user, files };
  }

  /**
   * Create a file with specific content for testing
   *
   * @param dataSource - TypeORM data source
   * @param content - File content
   * @param options - Additional file creation options
   * @returns Created file entity
   */
  static async createFileWithContent(
    dataSource: DataSource,
    content: string,
    options: FileCreationOptions = {}
  ): Promise<FileEntity> {
    return this.createFile(dataSource, {
      ...options,
      content,
      fileSize: Buffer.byteLength(content, 'utf8')
    });
  }

  /**
   * Clean up test files from the filesystem
   *
   * @param files - Files to clean up
   */
  static async cleanupFiles(files: FileEntity[]): Promise<void> {
    const fs = await import('fs/promises');

    for (const file of files) {
      try {
        await fs.unlink(file.fullPath);
      } catch (error) {
        // Ignore cleanup errors (file might not exist)
      }
    }
  }
}