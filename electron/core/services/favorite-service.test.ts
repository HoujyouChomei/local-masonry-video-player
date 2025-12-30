// electron/core/services/favorite-service.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FavoriteService } from './favorite-service';

// Mocks
const repoMocks = vi.hoisted(() => ({
  getFavoritePaths: vi.fn(),
  getFavorites: vi.fn(),
  toggleFavorite: vi.fn(),
}));

const videoServiceMocks = vi.hoisted(() => ({
  ensureVideoExists: vi.fn(),
}));

// VideoRepository Mock
vi.mock('../repositories/video-repository', () => {
  return {
    VideoRepository: class {
      getFavoritePaths = repoMocks.getFavoritePaths;
      getFavorites = repoMocks.getFavorites;
      toggleFavorite = repoMocks.toggleFavorite;
    },
  };
});

// VideoService Mock
vi.mock('./video-service', () => {
  return {
    VideoService: class {
      ensureVideoExists = videoServiceMocks.ensureVideoExists;
    },
  };
});

// ▼▼▼ 追加: Electron Mock ▼▼▼
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/mock/user/data'),
  },
  BrowserWindow: {
    getAllWindows: vi.fn().mockReturnValue([]),
  },
}));

// ▼▼▼ 追加: fs Mock ▼▼▼
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

  it('should get favorite paths', async () => {
    repoMocks.getFavoritePaths.mockReturnValue(['/v/fav.mp4']);
    const result = await service.getFavorites();
    expect(result).toEqual(['/v/fav.mp4']);
  });

  it('should toggle favorite (ensure exists first)', async () => {
    const videoPath = '/v/fav.mp4';
    repoMocks.getFavoritePaths.mockReturnValue(['/v/fav.mp4']);

    const result = await service.toggleFavorite(videoPath);

    expect(videoServiceMocks.ensureVideoExists).toHaveBeenCalledWith(videoPath);
    expect(repoMocks.toggleFavorite).toHaveBeenCalledWith(videoPath);

    expect(result).toEqual(['/v/fav.mp4']);
  });
});
