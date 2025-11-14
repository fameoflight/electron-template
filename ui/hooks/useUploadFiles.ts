import { useState, useCallback } from 'react';
import { graphql } from 'react-relay/hooks';
import { notification } from 'antd';
import { useCompatMutation } from './relay';
import { isElectron } from '@ui/Components/utils';
import type { useUploadFilesCreateFileMutation } from './__generated__/useUploadFilesCreateFileMutation.graphql';

const CreateFileMutation = graphql`
  mutation useUploadFilesCreateFileMutation($input: CreateFileInput!) {
    createFile(input: $input) {
      id
      filename
      fullPath
      fileSize
      mimeType
    }
  }
`;

interface UploadOptions {
  /** Whether to show success/error notifications */
  showNotifications?: boolean;
  /** Function to call when each file upload completes */
  onFileUploaded?: (file: File, fileId: string) => void;
  /** Function to call when a file upload fails */
  onUploadError?: (file: File, error: Error) => void;
  /** Function to call when all uploads complete */
  onComplete?: (results: { file: File; fileId: string | null }[]) => void;
}

interface UploadResult {
  /** Upload the given files and return their IDs */
  uploadFiles: (files: File[], options?: UploadOptions) => Promise<string[]>;
  /** Whether any uploads are currently in progress */
  isUploading: boolean;
  /** Clear any upload state */
  clearState: () => void;
}

/**
 * Custom hook for uploading files using the createFile GraphQL mutation
 *
 * Handles:
 * - Converting File objects to database records
 * - Error handling and notifications
 * - Progress tracking
 * - Electron file path access
 *
 * @example
 * ```tsx
 * const { uploadFiles, isUploading } = useUploadFiles();
 *
 * const handleUpload = async (files: File[]) => {
 *   try {
 *     const fileIds = await uploadFiles(files, {
 *       showNotifications: true,
 *       onFileUploaded: (file, fileId) => {
 *         console.log(`Uploaded ${file.name} as ${fileId}`);
 *       }
 *     });
 *     console.log('All files uploaded:', fileIds);
 *   } catch (error) {
 *     console.error('Upload failed:', error);
 *   }
 * };
 * ```
 */
export function useUploadFiles(): UploadResult {
  const [isUploading, setIsUploading] = useState(false);
  const [commitCreateFile] = useCompatMutation<useUploadFilesCreateFileMutation>(CreateFileMutation);

  const clearState = useCallback(() => {
    setIsUploading(false);
  }, []);

  /**
   * Convert array of File objects to array of file paths
   */
  const getFilePaths = useCallback(async (files: File[]): Promise<string[]> => {
    if (!isElectron()) {
      throw new Error('File upload only works in Electron environment');
    }

    // Type assertion for the electron API with getPathForFile
    const electronWithFilePath = window.electron as {
      'file:add-path': (path: string) => Promise<any>;
      getPathForFile?: (file: File) => string;
    };

    const getFilePath = async (file: File): Promise<string> => {
      try {
        // Try the modern Electron 39+ API first
        if (electronWithFilePath.getPathForFile) {
          const filePath = electronWithFilePath.getPathForFile(file);
          console.log('✅ Got file path using webUtils.getPathForFile:', filePath);
          return filePath;
        } else {
          // Fallback to legacy File.path property (older Electron versions)
          const filePath = (file as any).path as string;
          console.log('⚠️  Using legacy File.path:', filePath);
          return filePath;
        }
      } catch (error) {
        console.error('❌ Failed to get file path:', error);
        throw new Error(`Unable to get file path for: ${file.name}. Make sure you're running in Electron, not a browser.`);
      }
    };

    // Convert all files to paths in parallel
    return Promise.all(files.map(getFilePath));
  }, []);

  /**
   * Upload a single file and return its ID
   */
  const uploadSingleFile = useCallback(async (file: File, filePath: string): Promise<string | null> => {

    return new Promise((resolve) => {
      commitCreateFile({
        variables: {
          input: {
            filename: file.name,
            fullPath: filePath,
            extension: file.name.split('.').pop() || '',
          }
        },
        onCompleted: (response) => {
          console.log('File created with response:', response);
          if (response?.createFile?.id) {
            resolve(response.createFile.id);
          } else {
            resolve(null);
          }
        },
        onError: (error) => {
          console.error('Error creating file record:', error);
          resolve(null);
        }
      });
    });
  }, [commitCreateFile]);

  const uploadFiles = useCallback(async (
    files: File[],
    options: UploadOptions = {}
  ): Promise<string[]> => {
    const {
      showNotifications = true,
      onFileUploaded,
      onUploadError,
      onComplete
    } = options;

    setIsUploading(true);
    const results: { file: File; fileId: string | null }[] = [];

    try {
      // Step 1: Convert all files to paths
      const filePaths = await getFilePaths(files);

      // Step 2: Upload all files in parallel
      const uploadPromises = files.map(async (file, index) => {
        try {
          const filePath = filePaths[index];
          const fileId = await uploadSingleFile(file, filePath);

          const result = { file, fileId };

          if (fileId) {
            onFileUploaded?.(file, fileId);
          } else {
            onUploadError?.(file, new Error(`Failed to create file record for ${file.name}`));
          }

          return result;
        } catch (error) {
          const uploadError = error instanceof Error ? error : new Error('Unknown upload error');
          onUploadError?.(file, uploadError);

          if (showNotifications) {
            notification.error({
              message: 'Upload failed',
              description: `Failed to upload ${file.name}: ${uploadError.message}`
            });
          }

          return { file, fileId: null };
        }
      });

      // Step 3: Wait for all uploads to complete
      const uploadResults = await Promise.allSettled(uploadPromises);

      console.log('All upload promises settled:', uploadResults);

      // Step 4: Process results
      const fileIds: string[] = [];
      uploadResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
          if (result.value.fileId) {
            fileIds.push(result.value.fileId);
          }
        } else {
          console.error('Upload promise rejected:', result.reason);
        }
      });

      onComplete?.(results);

      if (showNotifications && fileIds.length > 0) {
        notification.success({
          message: 'Files uploaded successfully',
          description: `Uploaded ${fileIds.length} of ${files.length} file(s)`
        });
      }

      return fileIds;

    } catch (error) {
      console.error('Upload failed:', error);

      if (showNotifications) {
        notification.error({
          message: 'Upload failed',
          description: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      return [];
    } finally {
      setIsUploading(false);
    }
  }, [getFilePaths, uploadSingleFile]);

  return {
    uploadFiles,
    isUploading,
    clearState
  };
}