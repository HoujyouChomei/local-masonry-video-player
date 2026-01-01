// electron/core/services/favorite-service.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FavoriteService } from './favorite-service';

// Mocks
const repoMocks = vi.hoisted(() => ({
  getFavoriteIds: vi.fn(), // getFavoritePaths -> getFavoriteIds
  getFavorites: vi.fn(),
  toggleFavoriteById: vi.fn(), // toggleFavorite -> toggleFavoriteById
}));

// VideoRepository Mock
vi.mock('../repositories/video-repository', () => {
  return {
    VideoRepository: class {
      getFavoriteIds = repoMocks.getFavoriteIds;
      getFavorites = repoMocks.getFavorites;
      toggleFavoriteById = repoMocks.toggleFavoriteById;
    },
  };
});

// VideoService Mock (もう使用しないが、依存解決のため残す場合は空実装)
vi.mock('./video-service', () => {
  return {
    VideoService: class {},
  };
});

// Electron Mock
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/mock/user/data'),
  },
  BrowserWindow: {
    getAllWindows: vi.fn().mockReturnValue([]),
  },
}));

// fs Mock
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
  },
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
}));

describe('FavoriteService', () => {
  let service: FavoriteService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FavoriteService();
  });

  it('should get favorite IDs', async () => {
    repoMocks.getFavoriteIds.mockReturnValue(['id-1', 'id-2']);
    const result = await service.getFavorites();
    expect(result).toEqual(['id-1', 'id-2']);
  });

  it('should toggle favorite by ID', async () => {
    const videoId = 'id-1';
    repoMocks.getFavoriteIds.mockReturnValue(['id-1']);

    const result = await service.toggleFavorite(videoId);

    // ensureVideoExists の呼び出しチェックは削除 (IDベースのため不要になった)
    expect(repoMocks.toggleFavoriteById).toHaveBeenCalledWith(videoId);

    expect(result).toEqual(['id-1']);
  });
});