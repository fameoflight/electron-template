import { dialog, shell } from 'electron';
import { createHandler } from './createHandler';

export interface OpenFileDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
  properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles'>;
}

export interface OpenFileDialogResult {
  canceled: boolean;
  filePaths: string[];
}

export const fileDialogHandlers = {
  'open-file-dialog': createHandler<OpenFileDialogOptions, OpenFileDialogResult>(async (event, options = {}) => {
    const defaultOptions: Electron.OpenDialogOptions = {
      title: options.title || 'Select File',
      defaultPath: options.defaultPath,
      filters: options.filters || [
        {
          name: 'All Files',
          extensions: ['*']
        }
      ],
      properties: options.properties || ['openFile']
    };

    try {
      const result = await dialog.showOpenDialog(defaultOptions);
      return {
        canceled: result.canceled,
        filePaths: result.filePaths
      };
    } catch (error) {
      console.error('Error in file dialog:', error);
      return {
        canceled: true,
        filePaths: []
      };
    }
  }),
  'open-in-finder': createHandler<string, void>(async (event, filePath: string) => {
    try {
      // Use shell.showItemInFolder to open the file in the system's file manager
      await shell.showItemInFolder(filePath);
    } catch (error) {
      console.error('Error opening file in Finder:', error);
      throw error;
    }
  }),
  'open-file-with-default': createHandler<string, void>(async (event, filePath: string) => {
    try {
      // Try to open file with default application
      await shell.openPath(filePath);
    } catch (error) {
      console.error('Error opening file with default application:', error);
      // Fallback to showing in folder
      try {
        await shell.showItemInFolder(filePath);
      } catch (fallbackError) {
        console.error('Error showing file in folder:', fallbackError);
        throw error;
      }
    }
  }),
} as const;