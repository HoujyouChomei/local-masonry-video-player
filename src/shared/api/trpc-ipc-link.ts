// src/shared/api/trpc-ipc-link.ts

import { TRPCLink, TRPCClientError } from '@trpc/client';
import { observable } from '@trpc/server/observable';
import type { AnyRouter } from '@trpc/server';

let subscriptionCounter = 0;

interface TRPCResponse<T = unknown> {
  result?: { data: T };
  error?: { code: string; message: string };
}

interface SubscriptionMessage<T = unknown> {
  type: 'data' | 'error' | 'complete';
  data?: T;
  error?: string;
}

export function customIpcLink<TRouter extends AnyRouter>(): TRPCLink<TRouter> {
  return () => {
    return ({ op }) => {
      return observable((observer) => {
        const { type, path, input } = op;

        if (type === 'subscription') {
          const id = `sub-${++subscriptionCounter}-${Date.now()}`;

          const handleData = (_event: unknown, messageRaw: unknown) => {
            const message = messageRaw as SubscriptionMessage;
            if (message.type === 'data') {
              observer.next({
                result: { data: message.data },
              });
            } else if (message.type === 'error') {
              observer.error(new TRPCClientError(message.error || 'Subscription error'));
            } else if (message.type === 'complete') {
              observer.complete();
            }
          };

          window.electron.ipcRenderer.on(`trpc:data:${id}`, handleData);

          window.electron.trpc.subscribe({ id, path, input });

          return () => {
            window.electron.trpc.unsubscribe({ id });
            window.electron.ipcRenderer.off(`trpc:data:${id}`, handleData);
          };
        } else {
          window.electron.trpc
            .request({ path, type, input })
            .then((responseRaw: unknown) => {
              const response = responseRaw as TRPCResponse;
              if (response.error) {
                observer.error(new TRPCClientError(response.error.message));
              } else if (response.result) {
                observer.next({
                  result: response.result,
                });
                observer.complete();
              }
            })
            .catch((error: Error) => {
              observer.error(new TRPCClientError(error.message));
            });

          return () => {};
        }
      });
    };
  };
}
