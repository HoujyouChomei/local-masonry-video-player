// src/shared/types/electron.ts

export type { AppSettings, GridStyle, LayoutMode } from '../schemas/settings';
export type { Tag } from '../schemas/tag';
export type {
  DirectoryEntry,
  ConnectionInfo,
  WindowState,
  MoveResultDetail,
  MoveResponse,
  MediaUpdateEvent,
} from '../schemas/system';

export type { MediaSearchOptions as SearchOptions } from '../schemas/media';

export interface IElectronAPI {
  onAppReady: (callback: () => void) => () => void;
  checkBackendReady: () => void;

  startDrag: (files: string | string[]) => void;
  getFilePath: (file: File) => string;

  trpc: {
    request: (params: {
      path: string;
      type: 'query' | 'mutation';
      input?: unknown;
    }) => Promise<unknown>;
    subscribe: (params: { id: string; path: string; input?: unknown }) => void;
    unsubscribe: (params: { id: string }) => void;
  };
  ipcRenderer: {
    on: (channel: string, handler: (event: unknown, ...args: unknown[]) => void) => void;
    off: (channel: string, handler: (event: unknown, ...args: unknown[]) => void) => void;
  };
}
