/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    APP_ROOT: string
    VITE_PUBLIC: string
  }
}

import type { ClientAPI } from './handlers/createHandler';
import type { HandlersRegistry } from './handlers/registry';

interface Window {
  electron: ClientAPI<HandlersRegistry>;
}
