// electron/core/services/favorite-service.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FavoriteService } from './favorite-service';

const repoMocks = vi.hoisted(() => ({
  getFavoriteIds: vi.fn(),
  getFavorites: vi.fn(),
  toggleFavoriteById: vi.fn(),
  findById: vi.fn(),
}));

const notifierMocks = vi.hoisted(() => ({
  notify: vi.fn(),
}));

vi.mock('../repositories/video-repository', () => {
  return {
    VideoRepository: class {
      getFavoriteIds = repoMocks.getFavoriteIds;
      getFavorites = repoMocks.getFavorites;
      toggleFavoriteById = repoMocks.toggleFavoriteById;
      findById = repoMocks.findById;
    },
  };
});

vi.mock('./video-service', () => {
  return {
    VideoService: class {},
  };
});

vi.mock('./notification-service', () => {
  return {
    NotificationService: {
      getInstance: () => ({
        notify: notifierMocks.notify,
      }),
    },
  };
});

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/mock/user/data'),
  },
  BrowserWindow: {
    getAllWindows: vi.fn().mockReturnValue([]),
  },
}));

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
  },
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
}));

vi.mock('./file-integrity-service', () => {
  return {
    FileIntegrityService: class {
      verifyAndRecover = vi.fn().mockResolvedValue(false);
    },
  };
});

vi.mock('./video-mapper', () => {
  return {
    VideoMapper: class {
      toEntities = vi.fn().mockReturnValue([]);
    },
  };
});

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
    repoMocks.findById.mockReturnValue({ id: videoId, path: '/path/to/video.mp4' });

    const result = await service.toggleFavorite(videoId);

    expect(repoMocks.toggleFavoriteById).toHaveBeenCalledWith(videoId);
    expect(notifierMocks.notify).toHaveBeenCalledWith({
      type: 'update',
      path: '/path/to/video.mp4',
    });
    expect(result).toEqual(['id-1']);
  });
});
