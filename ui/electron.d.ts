import type { ClientAPI } from '../main/handlers/createHandler';
import type { HandlersRegistry } from '../main/handlers/registry';

declare global {
  interface Window {
    electron: ClientAPI<HandlersRegistry>;
  }

  type Recordable = string | number;

  type RelayNode = {
    id: string;
  };
}

export { };
