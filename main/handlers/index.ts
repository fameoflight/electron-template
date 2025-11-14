import { handlers } from './registry';
import { createHandlerMap } from './createHandler';

function setupHandlers(ipcMain: Electron.IpcMain) {
  const handlerMap = createHandlerMap(handlers);

  for (const [channel, handler] of Object.entries(handlerMap)) {
    ipcMain.handle(channel, handler);
  }
}

export { setupHandlers };
export { handlers } from './registry';