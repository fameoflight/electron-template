import { BaseJob, BaseJobProps } from '@main/base/jobs/BaseJob.js';
import { Job } from '@base/jobs/decorators/Job.js';
import { z } from 'zod';
import { FileEntity as FileEntity } from '@db/entities/FileEntity';
import { FileEntityFileType, FileEntityStatus } from '@main/db/entities/__generated__/FileEntityBase';
import fsPromises from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import crypto from 'crypto';
import mime from 'mime-types';
import DataSourceProvider from '@main/base/db/DataSourceProvider';

const ProcessFileJobSchema = z.object({
  fileIds: z.array(z.string()).optional()
});

/**
 * Data cleanup job properties - the specific parameters for this job type
 * Note: userId and targetId are handled by the BaseJob API and not included here
 */
export interface ProcessFileJobProps {
  fileIds?: string[];
}

interface FileInfo {
  name: string;
  size: number;
  extension: string;
  hash: string;
  mimeType: string;
  fileType: FileEntityFileType;
  mkTime: number;
}

type ProcessFileJobResult = {
  success: boolean;
  total: number;
  processed: number;
  errors: number;
}

@Job({
  name: 'ProcessFileJob',
  description: 'Process and clean up files based on specified criteria',
  schema: ProcessFileJobSchema,
  timeoutMs: 300000,  // 5 minutes for cleanup operations
  maxRetries: 2,
  backoff: 'exponential',
  baseDelay: 2000,
  maxDelay: 30000
})
export class ProcessFileJob extends BaseJob<ProcessFileJobProps> {
  private getFiles(fileIds?: string[]): Promise<FileEntity[]> {
    const dataSource = DataSourceProvider.get();
    const fileRepo = dataSource.getRepository(FileEntity);
    const query = (fileRepo as any).raw.createQueryBuilder('file_entities').where('file_entities.status = :status', { status: FileEntityStatus.pending });

    if (fileIds && fileIds.length > 0) {
      query.andWhere('file_entities.id IN (:...fileIds)', { fileIds });
    }
    return query.getMany();
  }

  /**
   * Perform the cleanup operation
   */
  async perform(props: ProcessFileJobProps): Promise<ProcessFileJobResult> {
    const dataSource = DataSourceProvider.get();
    const fileRepo = dataSource.getRepository(FileEntity);

    const pendingFiles = await this.getFiles(props.fileIds);

    let total = pendingFiles.length;
    let processed = 0;
    let errors = 0;

    for (const file of pendingFiles) {
      try {
        const fileInfo = await this.getFileInfo(file);

        // Check for duplicate file by hash before processing
        const duplicateFile = await this.checkDuplicateByHash(fileInfo.hash, file.userId);

        if (duplicateFile) {
          // Found duplicate - delete the duplicate file record and skip processing
          this.log(`🔄 Found duplicate file: ${fileInfo.name} (original: ${duplicateFile.filename}), removing duplicate`);
          await fileRepo.remove(file);
          total -= 1; // Adjust total count since we're removing this file
          continue; // Skip to next file
        } else {
          // No duplicate - proceed with normal processing
          file.filename = fileInfo.name;
          file.fileSize = fileInfo.size;
          file.extension = fileInfo.extension;
          file.fileHash = fileInfo.hash;
          file.mimeType = fileInfo.mimeType;
          file.fileType = fileInfo.fileType;
          file.status = FileEntityStatus.completed;
          processed += 1;
        }
      } catch (error) {
        console.error(`Error processing file ID ${file.id}:`, error);
        file.status = FileEntityStatus.error;
        errors += 1;
      }

      await fileRepo.save(file);
    }

    return {
      success: true,
      total,
      processed,
      errors
    };
  }

  async getFileInfo(file: FileEntity): Promise<FileInfo> {
    const fullPath = file.fullPath;

    if (!fullPath || typeof fullPath !== 'string') {
      throw new Error('Invalid file path');
    }

    // Ensure file exists and collect stats
    const stats = await fsPromises.stat(fullPath);
    if (!stats.isFile()) {
      throw new Error('Path is not a file');
    }

    const name = path.basename(fullPath);
    const rawExt = path.extname(fullPath).toLowerCase();
    const extension = rawExt.startsWith('.') ? rawExt.slice(1) : rawExt;

    // Compute hash (streamed)
    const hash = await this.getFileHash(fullPath);

    // Detect MIME type from file extension for proper processing
    // This ensures files get correctly typed based on their actual content
    const detectedMimeType = this.getMimeType(fullPath);

    // Use detected MIME type to ensure proper file type detection
    const mimeType = detectedMimeType;

    return {
      name,
      size: Number(stats.size),
      extension,
      hash,
      mimeType,
      fileType: this.getFileType(mimeType),
      mkTime: stats.mtime.getTime()
    };
  }

  async getFileHash(filePath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = createReadStream(filePath);
      stream.on('error', (err) => reject(err));
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
    });
  }

  getMimeType(filePath: string): string {
    let mimeType = 'application/octet-stream';

    const detectedMimeType = mime.lookup(filePath);
    if (detectedMimeType) {
      mimeType = detectedMimeType;
    }

    return mimeType;
  }

  getFileType(mimeType: string): FileEntityFileType {
    if (mimeType.startsWith('image/')) {
      return FileEntityFileType.image;
    }

    if (mimeType.startsWith('video/')) {
      return FileEntityFileType.video;
    }

    if (mimeType.startsWith('audio/')) {
      return FileEntityFileType.audio;
    }

    if (mimeType === 'application/pdf' ||
      mimeType.startsWith('text/') ||
      mimeType === 'application/json' ||
      mimeType === 'application/xml') {
      return FileEntityFileType.document;
    }

    return FileEntityFileType.other;
  }

  /**
   * Check if file already exists by hash
   */
  private async checkDuplicateByHash(fileHash: string, userId: string): Promise<FileEntity | null> {
    const dataSource = DataSourceProvider.get();
    const fileRepo = dataSource.getRepository(FileEntity);

    // Look for existing completed files with the same hash
    const existingFile = await fileRepo.findOne({
      where: {
        fileHash,
        userId,
        status: FileEntityStatus.completed
      }
    });

    return existingFile || null;
  }
}



