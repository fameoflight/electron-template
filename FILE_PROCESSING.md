# File Processing with ProcessFileJob

This document explains how file processing works in the application and how the `ProcessFileJob` is automatically enqueued when files are uploaded.

## Overview

The file processing system consists of:

1. **File Upload**: Users upload files via GraphQL mutations
2. **Automatic Job Enqueueing**: `ProcessFileJob` is automatically queued to process the file
3. **File Processing**: The job extracts metadata, calculates hashes, detects file types, and updates the file record
4. **Status Updates**: Files progress from `pending` → `processing` → `completed` or `error`

## How ProcessFileJob Gets Enqueued

### 1. During File Creation (Automatic)

When a file is created via the `createFile` mutation, the `ProcessFileJob` is automatically enqueued:

```typescript
// FileResolver.ts
async createFile(input: any, ctx: GraphQLContext): Promise<File> {
  // Create the file record first
  const file = await super.createFile(input, ctx);

  // Automatically enqueue processing job
  await ProcessFileJob.performLater(
    ctx.user!.id,
    file.id,
    {}, // No additional parameters needed
    {
      priority: 50, // Medium priority
      timeoutMs: 300000 // 5 minutes
    }
  );

  return file;
}
```

### 2. During File Updates (Conditional)

If a file's `fullPath` or `filename` changes during an update, the job is re-enqueued:

```typescript
// FileResolver.ts
async updateFile(input: any, ctx: GraphQLContext): Promise<File> {
  const originalFile = await this.getRepository(ctx).findOne({
    where: { id: fromGlobalIdToLocalId(input.id) }
  });

  const updatedFile = await super.updateFile(input, ctx);

  // Re-process if critical properties changed
  const shouldReprocess = originalFile && (
    originalFile.fullPath !== updatedFile.fullPath ||
    originalFile.filename !== updatedFile.filename
  );

  if (shouldReprocess) {
    await ProcessFileJob.performLater(ctx.user!.id, updatedFile.id, {});
  }

  return updatedFile;
}
```

### 3. Manual Processing (On-demand)

Users can manually re-process files using the `processFile` mutation:

```graphql
mutation ProcessFile($id: String!) {
  processFile(id: $id) {
    id
    filename
    status
    fileSize
    mimeType
    fileType
  }
}
```

## File Upload Flow

### Frontend Upload (using useUploadFiles hook)

```typescript
// React component
import { useUploadFiles } from '@ui/hooks/useUploadFiles';

const { uploadFiles, isUploading } = useUploadFiles();

const handleFileUpload = async (files: File[]) => {
  try {
    const fileIds = await uploadFiles(files, {
      showNotifications: true,
      onFileUploaded: (file, fileId) => {
        console.log(`Uploaded ${file.name} as ${fileId}`);
        // ProcessFileJob is automatically enqueued at this point
      }
    });
    console.log('All files uploaded:', fileIds);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### GraphQL Mutation

The `useUploadFiles` hook sends this GraphQL mutation:

```graphql
mutation CreateFile($input: CreateFileInput!) {
  createFile(input: $input) {
    id
    filename
    fullPath
    fileSize
    mimeType
  }
}
```

With variables like:
```json
{
  "input": {
    "filename": "document.pdf",
    "fullPath": "/path/to/document.pdf",
    "extension": "pdf"
  }
}
```

## ProcessFileJob Details

### What the Job Does

1. **File Validation**: Checks if the file exists on disk
2. **Metadata Extraction**:
   - File size
   - SHA-256 hash for integrity
   - MIME type detection
   - File type categorization (image, document, audio, video, other)
3. **Database Updates**: Updates the file record with extracted metadata
4. **Status Management**: Sets status to `completed` or `error`

### Job Configuration

```typescript
@Job({
  name: 'ProcessFileJob',
  description: 'Process and clean up files based on specified criteria',
  schema: ProcessFileJobSchema,
  timeoutMs: 300000,  // 5 minutes
  maxRetries: 2,
  backoff: 'exponential',
  baseDelay: 2000,
  maxDelay: 30000
})
```

### Processing Logic

```typescript
async perform(props: ProcessFileJobProps): Promise<void> {
  const fileRepo = getRepo(File);

  // Find all pending files (batch processing)
  const pendingFiles = await fileRepo.find({
    where: { status: FileStatus.pending },
  });

  for (const file of pendingFiles) {
    try {
      const fileInfo = await this.getFileInfo(file);

      // Update file with extracted metadata
      file.filename = fileInfo.name;
      file.fileSize = fileInfo.size;
      file.extension = fileInfo.extension;
      file.fileHash = fileInfo.hash;
      file.mimeType = fileInfo.mimeType;
      file.fileType = fileInfo.fileType;
      file.status = FileStatus.completed;

    } catch (error) {
      console.error(`Error processing file ID ${file.id}:`, error);
      file.status = FileStatus.error;
    }

    await fileRepo.save(file);
  }
}
```

## File Type Detection

The job automatically categorizes files based on MIME type:

```typescript
private getFileType(mimeType: string): FileFileType {
  if (mimeType.startsWith('image/')) {
    return FileFileType.image;
  }
  if (mimeType.startsWith('video/')) {
    return FileFileType.video;
  }
  if (mimeType.startsWith('audio/')) {
    return FileFileType.audio;
  }
  if (mimeType === 'application/pdf' || mimeType.startsWith('text/')) {
    return FileFileType.document;
  }
  return FileFileType.other;
}
```

## Testing File Processing

### Creating Test Files

```typescript
import { createFileWithContent } from '@factories/fileFactory';

// Create a file with actual content on disk
const file = await createFileWithContent(dataSource, {
  userId: testUser.id,
  filename: 'test-document.txt',
  extension: '.txt',
  content: 'This is test content for file processing'
});
```

### Testing Job Execution

```typescript
import { ProcessFileJob } from '@main/jobs/ProcessFileJob';

// Execute job immediately (synchronous for testing)
const result = await ProcessFileJob.performNow(
  testUser.id,
  file.id
);

expect(result.success).toBe(true);

// Verify file was processed
const updatedFile = await dataSource.getRepository('File').findOne({
  where: { id: file.id }
});

expect(updatedFile.status).toBe(FileStatus.completed);
expect(updatedFile.fileHash).toMatch(/^[a-f0-9]{64}$/);
expect(updatedFile.fileType).toBe(FileFileType.document);
```

### Testing with Job Queue

```typescript
// Enqueue job (asynchronous)
const job = await ProcessFileJob.performLater(
  testUser.id,
  file.id,
  {},
  {
    priority: 50,
    timeoutMs: 300000
  }
);

expect(job.type).toBe('ProcessFileJob');
expect(job.status).toBe('PENDING');
```

## Error Handling

### File Not Found

If the file doesn't exist on disk:
```typescript
// Job marks file status as 'error'
file.status = FileStatus.error;
console.error(`Error processing file ID ${file.id}: File not found`);
```

### Job Queue Failures

If job enqueueing fails during file creation:
```typescript
try {
  await ProcessFileJob.performLater(/*...*/);
} catch (error) {
  console.error(`❌ Failed to enqueue ProcessFileJob:`, error);
  // Don't fail the file creation - file can be processed manually later
}
```

## Monitoring File Processing

### Check File Status

```graphql
query GetFile($id: String!) {
  file(id: $id) {
    id
    filename
    status
    fileSize
    mimeType
    fileType
    fileHash
    createdAt
    updatedAt
  }
}
```

### List Pending Files

```graphql
query PendingFiles {
  filesArray(kind: "all") {
    id
    filename
    status
  }
}
```

## Manual Job Management

### Process All Pending Files

```typescript
// Execute job to process ALL pending files
await ProcessFileJob.performNow(userId, 'batch-processing-target');
```

### Re-process Specific File

```graphql
mutation ReProcessFile($fileId: String!) {
  processFile(id: $fileId) {
    id
    filename
    status
  }
}
```

## Best Practices

1. **Automatic Processing**: Files are automatically processed when uploaded
2. **Error Recovery**: Failed processing can be retried via the `processFile` mutation
3. **Batch Processing**: The job processes all pending files efficiently
4. **Non-blocking**: File upload returns immediately; processing happens asynchronously
5. **Monitoring**: Check file status to track processing progress

## Configuration

### Job Priority Levels

- **80**: Manual processing (highest)
- **50**: New file uploads (medium)
- **40**: File re-processing (low-medium)

### Timeout Settings

- **Default**: 5 minutes (300,000ms)
- **Large files**: May need longer timeouts
- **Network storage**: Consider network latency

## Troubleshooting

### Common Issues

1. **File Not Found**: Check `fullPath` is correct and accessible
2. **Permission Denied**: Ensure app has read access to file location
3. **Timeout**: Increase timeout for large files or slow storage
4. **Job Queue Not Running**: Ensure JobQueue service is started

### Debug Logs

Enable debug logging to see job execution:

```typescript
// Job execution logs
console.log(`✅ Enqueued ProcessFileJob for file ${file.id} (${file.filename})`);
console.log(`✅ Processed file ${file.id}: ${updatedFile.fileSize} bytes`);
```

### Database Queries

Check job and file status:

```sql
-- View pending files
SELECT id, filename, status, created_at FROM files WHERE status = 'pending';

-- View processing jobs
SELECT id, type, status, created_at FROM jobs WHERE type = 'ProcessFileJob';
```