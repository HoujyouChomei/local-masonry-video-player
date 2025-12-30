// electron/handlers/favorites.test.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleFavorites } from './favorites';

// 1. Hoisted Mocks
const mocks = vi.hoisted(() => ({
  toggleFavorite: vi.fn(),
  getFavoritePaths: vi.fn(),
  getFavorites: vi.fn(),
  findByPath: vi.fn(),
}));

// 2. Repository Mock
vi.mock('../core/repositories/video-repository', () => {
  return {
    VideoRepository: class {
      toggleFavorite = mocks.toggleFavorite;
      getFavoritePaths = mocks.getFavoritePaths;
      getFavorites = mocks.getFavorites;
      findByPath = mocks.findByPath;
    },
  };
});

// 3. Electron ipcMain & app (修正)
const ipcHandlers = new Map<string, (...args: any[]) => any>();
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel, listener) => {
      ipcHandlers.set(channel, listener);
    }),
  },
  // ▼▼▼ 追加 ▼▼▼
  app: {
    getPath: vi.fn().mockReturnValue('/mock/user/data'),
  },
  // FavoriteService -> LibraryScanner -> ThumbnailService -> fs
}));

// 4. Local Server
vi.mock('../lib/local-server', () => ({
  getServerPort: () => 3000,
}));

// 5. fs (Sync) for ThumbnailService (追加)
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

  it('should toggle favorite status', async () => {
    const videoPath = '/video1.mp4';

    mocks.getFavoritePaths.mockReturnValueOnce(['/video1.mp4']).mockReturnValueOnce([]);

    mocks.findByPath.mockReturnValue({ id: '1' });

    // Toggle ON
    const result1 = await invoke('toggle-favorite', videoPath);

    expect(mocks.toggleFavorite).toHaveBeenCalledWith(videoPath);
    expect(result1).toEqual(['/video1.mp4']);

    // Toggle OFF
    const result2 = await invoke('toggle-favorite', videoPath);
    expect(result2).toEqual([]);
  });

  it('should return favorites list', async () => {
    mocks.getFavoritePaths.mockReturnValue(['/fav.mp4']);

    const favorites = await invoke('get-favorites');
    expect(favorites).toEqual(['/fav.mp4']);
  });
});
