// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, webUtils, clipboard } from 'electron';
import type { HandlersRegistry, handlers } from './handlers/registry';
import type { ClientAPI } from './handlers/createHandler';


// TODO: Auto-generate this list from the handlers/registry
// right now there is some issue with require etc, so we hardcode it here.
const handlerChannels = [
  'graphql-query',
  'open-file-dialog',
  'open-in-finder',
  'file:add-path',
  'systemTray:getJobQueueStatus',
  'systemTray:forceQuit',
  'systemTray:quitWithConfirmation',
  'systemTray:cancelJob',
  'systemTray:getAvailableJobTypes',
] as const;

// Auto-generate the client API from handler channels
function createClientAPI(channels: readonly string[]): ClientAPI<HandlersRegistry> {
  const api: Record<string, (args?: unknown) => Promise<unknown>> = {};

  for (const channel of channels) {
    api[channel] = (args?: unknown) => {
      return ipcRenderer.invoke(channel, args);
    };
  }

  return api as ClientAPI<HandlersRegistry>;
}

// Create the API with handler channels
const electronHandler = createClientAPI(handlerChannels);

// Also expose ipcRenderer methods needed for menu event listening
// and webUtils for file path access (Electron 39+)
const electronHandlerWithIpc = {
  ...electronHandler,
  ipcRenderer: {
    on: (channel: string, callback: (...args: any[]) => void) => {
      ipcRenderer.on(channel, callback);
    },
    removeListener: (channel: string, callback: (...args: any[]) => void) => {
      ipcRenderer.removeListener(channel, callback);
    },
    removeAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel);
    }
  },
  // Expose getPathForFile for drag and drop (Electron 39+ API)
  getPathForFile: (file: File) => {
    return webUtils.getPathForFile(file);
  },
  clipboard: {
    writeText: (text: string) => {
      clipboard.writeText(text);

    },
    readText: (): string => {
      return clipboard.readText();
    }
  }
};

contextBridge.exposeInMainWorld('electron', electronHandlerWithIpc);

export type ElectronHandler = ClientAPI<HandlersRegistry>;
