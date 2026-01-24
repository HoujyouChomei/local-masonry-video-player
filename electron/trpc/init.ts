// electron/trpc/init.ts

import { initTRPC } from '@trpc/server';
import { BrowserWindow } from 'electron';

export interface TRPCContext {
  window: BrowserWindow | null;
}

export const createContext = (): TRPCContext => {
  const windows = BrowserWindow.getAllWindows();
  return {
    window: windows.length > 0 ? windows[0] : null,
  };
};

const t = initTRPC.context<TRPCContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
