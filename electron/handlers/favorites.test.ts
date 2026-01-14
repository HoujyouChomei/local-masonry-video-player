// electron/handlers/favorites.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IpcMainInvokeEvent } from 'electron';
import { handleFavorites } from './favorites';

const ipcHandlers = new Map<
  string,
  (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>
>();

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel, handler) => {
      ipcHandlers.set(channel, handler);
    }),
  },
  BrowserWindow: {
    getAllWindows: vi.fn().mockReturnValue([
      {
        webContents: {
          send: vi.fn(),
        },
      },
    ]),
  },
  app: {
    getPath: vi.fn().mockReturnValue('/tmp'),
  },
}));

const repoMocks = vi.hoisted(() => ({
  getFavoriteIds: vi.fn(),
  getFavorites: vi.fn(),
  toggleFavoriteById: vi.fn(),
  findById: vi.fn(),
}));

const sseMocks = vi.hoisted(() => ({
  broadcast: vi.fn(),
}));

vi.mock('../core/repositories/video-repository', () => ({
  VideoRepository: class {
    getFavoriteIds = repoMocks.getFavoriteIds;
    getFavorites = repoMocks.getFavorites;
    toggleFavoriteById = repoMocks.toggleFavoriteById;
    findById = repoMocks.findById;
  },
}));

vi.mock('../lib/server/sse-handler', () => ({
  SSEHandler: {
    getInstance: () => ({
      broadcast: sseMocks.broadcast,
    }),
  },
}));

vi.mock('../core/services/video-mapper', () => ({
  VideoMapper: class {
    toEntities = vi.fn((rows) => rows);
  },
}));

vi.mock('../core/services/file-integrity-service', () => ({
  FileIntegrityService: class {
    verifyAndRecover = vi.fn().mockResolvedValue(false);
  },
}));

const invoke = async (channel: string, ...args: unknown[]) => {
  const handler = ipcHandlers.get(channel);
  if (!handler) throw new Error(`No handler for ${channel}`);
  return handler({} as IpcMainInvokeEvent, ...args);
};

describe('Favorites Handlers (Repository Mock)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ipcHandlers.clear();
    handleFavorites();
  });

  it('should return favorites list (IDs)', async () => {
    const mockIds = ['video-123'];
    repoMocks.getFavoriteIds.mockReturnValue(mockIds);

    const favorites = await invoke('get-favorites');
    expect(favorites).toEqual(mockIds);
    expect(repoMocks.getFavoriteIds).toHaveBeenCalled();
  });

  it('should toggle favorite status by ID', async () => {
    const videoId = 'video-123';
    repoMocks.findById.mockReturnValue({ id: videoId, path: '/test.mp4' });
    repoMocks.getFavoriteIds.mockReturnValue([videoId]);

    const result = await invoke('toggle-favorite', videoId);

    expect(repoMocks.toggleFavoriteById).toHaveBeenCalledWith(videoId);
    expect(result).toEqual([videoId]);
  });
});
