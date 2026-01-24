// electron/preload.ts

import { contextBridge, ipcRenderer, IpcRendererEvent, webUtils } from 'electron';

interface FileWithPath extends File {
  path: string;
}

contextBridge.exposeInMainWorld('electron', {
  onAppReady: (callback: () => void) => {
    const subscription = (_event: IpcRendererEvent) => callback();
    ipcRenderer.on('app-ready', subscription);
    return () => {
      ipcRenderer.removeListener('app-ready', subscription);
    };
  },

  checkBackendReady: () => {
    ipcRenderer.send('check-backend-ready');
  },

  startDrag: (files: string | string[]) => {
    ipcRenderer.invoke('trpc', {
      path: 'system.app.startDrag',
      type: 'mutation',
      input: { files },
    });
  },

  getFilePath: (file: File): string => {
    try {
      return webUtils.getPathForFile(file);
    } catch {
      return (file as FileWithPath).path || '';
    }
  },

  trpc: {
    request: (params: { path: string; type: 'query' | 'mutation'; input?: unknown }) =>
      ipcRenderer.invoke('trpc', params),
    subscribe: (params: { id: string; path: string; input?: unknown }) =>
      ipcRenderer.send('trpc:subscribe', params),
    unsubscribe: (params: { id: string }) => ipcRenderer.send('trpc:unsubscribe', params),
  },

  ipcRenderer: {
    on: (channel: string, handler: (event: unknown, ...args: unknown[]) => void) => {
      ipcRenderer.on(channel, handler as (event: IpcRendererEvent, ...args: unknown[]) => void);
    },
    off: (channel: string, handler: (event: unknown, ...args: unknown[]) => void) => {
      ipcRenderer.removeListener(
        channel,
        handler as (event: IpcRendererEvent, ...args: unknown[]) => void
      );
    },
  },
});
