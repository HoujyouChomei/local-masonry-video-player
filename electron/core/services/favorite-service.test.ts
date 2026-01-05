// electron/core/services/favorite-service.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FavoriteService } from './favorite-service';

// Mocks
const repoMocks = vi.hoisted(() => ({
  getFavoriteIds: vi.fn(),
  getFavorites: vi.fn(),
  toggleFavoriteById: vi.fn(),
  findById: vi.fn(),
}));

const notifierMocks = vi.hoisted(() => ({
  notify: vi.fn(),
}));

// VideoRepository Mock
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

// VideoService Mock
vi.mock('./video-service', () => {
  return {
    VideoService: class {},
  };
});

// NotificationService Mock (変更点: SSEHandlerではなくこちらをモック)
vi.mock('./notification-service', () => {
  return {
    NotificationService: {
      getInstance: () => ({
        notify: notifierMocks.notify,
      }),
    },
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

// FileIntegrityService Mock
vi.mock('./file-integrity-service', () => {
  return {
    FileIntegrityService: class {
      verifyAndRecover = vi.fn().mockResolvedValue(false);
    },
  };
});

// VideoMapper Mock
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
    // Mock findById to return a dummy row
    repoMocks.findById.mockReturnValue({ id: videoId, path: '/path/to/video.mp4' });

    const result = await service.toggleFavorite(videoId);

    expect(repoMocks.toggleFavoriteById).toHaveBeenCalledWith(videoId);
    // NotificationService.notify が呼ばれたか確認 (updateイベント)
    expect(notifierMocks.notify).toHaveBeenCalledWith({
      type: 'update',
      path: '/path/to/video.mp4',
    });
    expect(result).toEqual(['id-1']);
  });
});
