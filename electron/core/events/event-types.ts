// electron/core/events/event-types.ts

export interface AppEvents {
  'media:deleted': { id: string; path: string };
  'media:added': { id: string; path: string };
  'media:updated': { id: string; path: string };
  'media:missing': { id: string; path: string };
  'media:recovered': { id: string; path: string };

  'thumbnail:request': { paths: string[]; regenerate: boolean };
  'thumbnail:delete': { path: string };
  'thumbnail:generated': { path: string; thumbnailPath: string };

  'settings:changed': { key: string; value: unknown };
  'settings:library-folders-added': { folders: string[] };

  'settings:mobile-connection-changed': { host: string };

  'library:scan-started': { folderPath: string };
  'library:scan-completed': { folderPath: string; count: number };

  'ui:library-refresh': { force?: boolean };

  'system:install-progress': { progress: number; status: string };
}

export type AppEventName = keyof AppEvents;

export type AppEventPayload<T extends AppEventName> = AppEvents[T];