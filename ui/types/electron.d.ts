declare global {
  interface Window {
    electron: {
      'graphql-query': (params: {
        query: string;
        variables?: Record<string, any>;
        context?: Record<string, any>;
      }) => Promise<{
        data?: any;
        errors?: Array<{ message: string }>;
      }>;
      'open-file-dialog': (options?: {
        title?: string;
        defaultPath?: string;
        filters?: Array<{
          name: string;
          extensions: string[];
        }>;
        properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles'>;
      }) => Promise<{
        canceled: boolean;
        filePaths: string[];
      }>;
      'open-in-finder': (filePath: string) => Promise<void>;
      'file:add-path': (filePath: string) => Promise<{
        success: boolean;
        path?: string;
        kind: 'file' | 'directory';
        name?: string;
        size?: number;
        extension?: string;
        error?: string;
      }>;
      // Electron 39+ API for getting file paths from File objects
      getPathForFile?: (file: File) => string;
      ipcRenderer: {
        on: (channel: string, callback: (...args: any[]) => void) => void;
        removeListener: (channel: string, callback: (...args: any[]) => void) => void;
        removeAllListeners: (channel: string) => void;
      };
    };
  }
}

export { };