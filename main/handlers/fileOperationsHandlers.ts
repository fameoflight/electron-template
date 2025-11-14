import { createHandler } from './createHandler';
import * as fs from 'fs';
import * as path from 'path';


export interface AddPathResult {
  success: boolean;
  path?: string;
  kind: 'file' | 'directory';
  name?: string;
  size?: number;
  extension?: string;
  error?: string;
}

/**
 * Get file or directory information from a path
 */
function getPathInfo(filePath: string): AddPathResult | null {
  try {
    const stats = fs.statSync(filePath);
    const fileName = path.basename(filePath);
    const extension = path.extname(filePath).slice(1);

    return {
      success: true,
      path: filePath,
      kind: stats.isDirectory() ? 'directory' : 'file',
      name: fileName,
      size: stats.size,
      extension: stats.isDirectory() ? undefined : (extension || undefined),
    };
  } catch (error) {
    console.error('Error getting path info:', error);
    return null;
  }
}

export const fileOperationsHandlers = {
  /**
   * Add a file or folder and return its metadata
   */
  'file:add-path': createHandler<string, AddPathResult>(async (event, filePath: string) => {
    try {
      // Validate that the path exists
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          kind: 'file',
          error: 'Path does not exist',
        };
      }

      // Get path info (file or directory)
      const pathInfo = getPathInfo(filePath);

      if (!pathInfo) {
        return {
          success: false,
          kind: 'file',
          error: 'Unable to read path information',
        };
      }

      // Log appropriate message based on type
      if (pathInfo.kind === 'file') {
        console.log('📄 File added:', pathInfo.path);
      } else {
        console.log('📁 Folder added:', pathInfo.path);
      }

      return pathInfo;
    } catch (error) {
      console.error('Error adding path:', error);
      return {
        success: false,
        kind: 'file',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }),
} as const;
