// electron/trpc/adapter.ts

import { ipcMain, BrowserWindow, IpcMainInvokeEvent } from 'electron';
import { TRPCError } from '@trpc/server';
import { appRouter } from './routers/_app';
import { createContext } from './init';
import { logger } from '../lib/logger';

interface TRPCRequest {
  path: string;
  type: 'query' | 'mutation' | 'subscription';
  input?: unknown;
}

interface SubscriptionRequest {
  id: string;
  path: string;
  input?: unknown;
}

const activeSubscriptions = new Map<
  string,
  {
    unsubscribe: () => void;
    webContentsId: number;
  }
>();

async function callProcedure(
  path: string,
  type: 'query' | 'mutation',
  input: unknown,
  _event: IpcMainInvokeEvent
): Promise<unknown> {
  const ctx = createContext();
  const caller = appRouter.createCaller(ctx);

  const parts = path.split('.');

  let current: unknown = caller;

  for (const part of parts) {
    if ((typeof current !== 'object' && typeof current !== 'function') || current === null) {
      logger.error(`[tRPC Adapter] Invalid router structure at part: '${part}' in path '${path}'`);
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Procedure not found: ${path}`,
      });
    }

    current = (current as Record<string, unknown>)[part];

    if (!current) {
      logger.error(`[tRPC Adapter] Procedure lookup failed at part: '${part}' in path '${path}'`);
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Procedure not found: ${path}`,
      });
    }
  }

  if (typeof current !== 'function') {
    logger.error(`[tRPC Adapter] Final target is not a function. Type: ${typeof current}`);
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `Procedure not found: ${path}`,
    });
  }

  return (current as (input: unknown) => Promise<unknown>)(input);
}

async function setupSubscription(
  event: Electron.IpcMainEvent,
  request: SubscriptionRequest
): Promise<void> {
  const { id, path, input } = request;
  const webContents = event.sender;
  const webContentsId = webContents.id;

  if (webContents.isDestroyed()) {
    return;
  }

  const ctx = createContext();
  const caller = appRouter.createCaller(ctx);

  const parts = path.split('.');
  let current: unknown = caller;

  for (const part of parts) {
    if ((typeof current !== 'object' && typeof current !== 'function') || current === null) {
      logger.error(`[tRPC Adapter] Invalid router structure at part: '${part}'`);
      return;
    }

    current = (current as Record<string, unknown>)[part];

    if (!current) {
      logger.error(`[tRPC Adapter] Subscription procedure lookup failed at: '${part}'`);
      return;
    }
  }

  if (typeof current !== 'function') {
    logger.error(`[tRPC Adapter] Subscription procedure not callable: ${path}`);
    return;
  }

  try {
    const result = await (current as (input: unknown) => Promise<unknown>)(input);

    if (result && typeof result === 'object' && 'subscribe' in result) {
      const obs = result as {
        subscribe: (handlers: {
          next: (data: unknown) => void;
          error: (err: unknown) => void;
          complete: () => void;
        }) => { unsubscribe: () => void };
      };

      const subscription = obs.subscribe({
        next: (data: unknown) => {
          if (!webContents.isDestroyed()) {
            webContents.send(`trpc:data:${id}`, { type: 'data', data });
          } else {
            cleanupSubscription(id);
          }
        },
        error: (err: unknown) => {
          if (!webContents.isDestroyed()) {
            let errorMsg = 'Unknown error';
            if (err instanceof Error) {
              errorMsg = err.message;
            } else if (typeof err === 'object' && err !== null && 'message' in err) {
              errorMsg = String((err as { message: unknown }).message);
            }

            webContents.send(`trpc:data:${id}`, {
              type: 'error',
              error: errorMsg,
            });
          }
          cleanupSubscription(id);
        },
        complete: () => {
          if (!webContents.isDestroyed()) {
            webContents.send(`trpc:data:${id}`, { type: 'complete' });
          }
          cleanupSubscription(id);
        },
      });

      activeSubscriptions.set(id, {
        unsubscribe: () => subscription.unsubscribe(),
        webContentsId,
      });
    } else {
      logger.warn(`[tRPC Adapter] Procedure ${path} did not return an observable.`);
    }
  } catch (error) {
    logger.error(`[tRPC Adapter] Failed to setup subscription: ${path}`, error);
  }
}

function cleanupSubscription(id: string): void {
  const sub = activeSubscriptions.get(id);
  if (sub) {
    try {
      sub.unsubscribe();
    } catch {
      // Ignore cleanup errors
    }
    activeSubscriptions.delete(id);
  }
}

function cleanupWebContentsSubscriptions(webContentsId: number): void {
  for (const [id, sub] of activeSubscriptions.entries()) {
    if (sub.webContentsId === webContentsId) {
      cleanupSubscription(id);
    }
  }
}

export function createCustomIPCHandler(): void {
  ipcMain.handle('trpc', async (event, request: TRPCRequest) => {
    const { path, type, input } = request;

    try {
      if (type === 'subscription') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Subscriptions should use trpc:subscribe channel',
        });
      }

      const result = await callProcedure(path, type, input, event);
      return { result: { data: result } };
    } catch (error) {
      logger.error(`[tRPC Adapter] Error in ${type} ${path}:`, error);

      if (error instanceof TRPCError) {
        return {
          error: {
            code: error.code,
            message: error.message,
          },
        };
      }

      return {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  });

  ipcMain.on('trpc:subscribe', (event, request: SubscriptionRequest) => {
    setupSubscription(event, request);
  });

  ipcMain.on('trpc:unsubscribe', (event, { id }: { id: string }) => {
    cleanupSubscription(id);
  });

  const cleanupOnClose = (window: BrowserWindow) => {
    window.webContents.on('destroyed', () => {
      cleanupWebContentsSubscriptions(window.webContents.id);
    });
  };

  BrowserWindow.getAllWindows().forEach(cleanupOnClose);

  logger.info('[tRPC Adapter] Custom IPC handler initialized');
}

export function getActiveSubscriptionCount(): number {
  return activeSubscriptions.size;
}
