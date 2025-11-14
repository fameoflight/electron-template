import { IpcMainInvokeEvent } from "electron";

// Base handler type
export type Handler<TArgs = void, TReturn = unknown> = (
  event: IpcMainInvokeEvent,
  args: TArgs
) => Promise<TReturn>;

// Helper to create a strongly typed handler
export function createHandler<TArgs = void, TReturn = unknown>(
  handler: Handler<TArgs, TReturn>
): Handler<TArgs, TReturn> {
  return handler;
}

// Extract handler map types
export type HandlerDefinitions = Record<string, Handler<any, any>>;

// Extract argument and return types from a handler
export type HandlerArgs<T> = T extends Handler<infer A, any> ? A : never;
export type HandlerReturn<T> = T extends Handler<any, infer R> ? R : never;

// Convert handler map to IPC-compatible format (for main process)
export function createHandlerMap<T extends HandlerDefinitions>(
  handlers: T
): Record<keyof T, (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>> {
  const result: Record<string, (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>> = {};

  for (const [channel, handler] of Object.entries(handlers)) {
    result[channel] = async (event: IpcMainInvokeEvent, ...args: unknown[]) => {
      return handler(event, args[0]);
    };
  }

  return result as Record<keyof T, (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>>;
}

// Convert handler map to client API (for preload/renderer)
export type ClientAPI<T extends HandlerDefinitions> = {
  [K in keyof T]: HandlerArgs<T[K]> extends void
    ? () => Promise<HandlerReturn<T[K]>>
    : (args: HandlerArgs<T[K]>) => Promise<HandlerReturn<T[K]>>;
};
