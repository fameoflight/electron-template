import { graphqlHandlers } from './graphqlHandlers';
import { fileDialogHandlers } from './fileDialogHandlers';
import { fileOperationsHandlers } from './fileOperationsHandlers';
import { systemTrayHandlers } from './systemTrayHandlers';

// Single source of truth for all handlers
export const handlers = {
  ...graphqlHandlers,
  ...fileDialogHandlers,
  ...fileOperationsHandlers,
  ...systemTrayHandlers,
} as const;

export type HandlersRegistry = typeof handlers;
