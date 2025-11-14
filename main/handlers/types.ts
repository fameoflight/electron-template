import { IpcMainInvokeEvent } from "electron";

export type IPCHandler = (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>
export type HandlerMap = Record<string, IPCHandler>;