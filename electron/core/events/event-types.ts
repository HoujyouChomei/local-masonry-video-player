// electron/core/events/event-types.ts

export interface AppEvents {
  'video:deleted': { id: string; path: string };
  'video:added': { id: string; path: string };
  'video:updated': { id: string; path: string };
  'video:missing': { id: string; path: string };
  'video:recovered': { id: string; path: string };

  'thumbnail:request': { paths: string[]; regenerate: boolean };
  'thumbnail:delete': { path: string };
  'thumbnail:generated': { path: string; thumbnailPath: string };

  'settings:changed': { key: string; value: unknown };

  'settings:mobile-connection-changed': { host: string };

  'library:scan-started': { folderPath: string };
  'library:scan-completed': { folderPath: string; count: number };

  'ui:library-refresh': { force?: boolean };
}

export type AppEventName = keyof AppEvents;

export type AppEventPayload<T extends AppEventName> = AppEvents[T];
