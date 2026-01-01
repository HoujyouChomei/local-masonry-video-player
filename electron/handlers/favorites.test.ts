// electron/handlers/favorites.test.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleFavorites } from './favorites';

// 1. Hoisted Mocks
const mocks = vi.hoisted(() => ({
  toggleFavoriteById: vi.fn(),
  getFavoriteIds: vi.fn(),
  getFavorites: vi.fn(),
}));

// 2. Repository Mock
vi.mock('../core/repositories/video-repository', () => {
  return {
    VideoRepository: class {
      toggleFavoriteById = mocks.toggleFavoriteById;
      getFavoriteIds = mocks.getFavoriteIds;
      getFavorites = mocks.getFavorites;
    },
  };
});

// 3. Electron ipcMain & app
const ipcHandlers = new Map<string, (...args: any[]) => any>();
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel, listener) => {
      ipcHandlers.set(channel, listener);
    }),
  },
  app: {
    getPath: vi.fn().mockReturnValue('/mock/user/data'),
  },
}));

// 4. Local Server
vi.mock('../lib/local-server', () => ({
  getServerPort: () => 3000,
}));

// 5. fs
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
  },
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
}));

describe('Favorites Handlers (Repository Mock)', () => {
  const invoke = async (channel: string, ...args: any[]) => {
    const handler = ipcHandlers.get(channel);
    if (!handler) throw new Error(`No handler registered for ${channel}`);
    return handler({} as any, ...args);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    ipcHandlers.clear();
    handleFavorites();
  });

  it('should toggle favorite status by ID', async () => {
    const videoId = 'video-123';

    // 1回目はIDが含まれる状態、2回目は空の状態を返すシミュレーション
    mocks.getFavoriteIds.mockReturnValueOnce(['video-123']).mockReturnValueOnce([]);

    // Toggle ON
    const result1 = await invoke('toggle-favorite', videoId);

    expect(mocks.toggleFavoriteById).toHaveBeenCalledWith(videoId);
    expect(result1).toEqual(['video-123']);

    // Toggle OFF
    const result2 = await invoke('toggle-favorite', videoId);
    expect(result2).toEqual([]);
  });

  it('should return favorites list (IDs)', async () => {
    mocks.getFavoriteIds.mockReturnValue(['fav-id-1']);

    const favorites = await invoke('get-favorites');
    expect(favorites).toEqual(['fav-id-1']);
  });
});