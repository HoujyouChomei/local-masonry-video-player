// electron/core/services/collection/favorite-service.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FavoriteService } from './favorite-service';

const repoMocks = vi.hoisted(() => ({
  getFavoriteIds: vi.fn(),
  getFavorites: vi.fn(),
  toggleFavoriteById: vi.fn(),
  findById: vi.fn(),
}));

const eventBusMocks = vi.hoisted(() => ({
  emit: vi.fn(),
}));

vi.mock('../../repositories/media/media-repository', () => {
  return {
    MediaRepository: class {
      getFavoriteIds = repoMocks.getFavoriteIds;
      getFavorites = repoMocks.getFavorites;
      toggleFavoriteById = repoMocks.toggleFavoriteById;
      findById = repoMocks.findById;
    },
  };
});

vi.mock('../../events', () => ({
  eventBus: {
    emit: eventBusMocks.emit,
  },
}));

vi.mock('../media/media-mapper', () => {
  return {
    VideoMapper: class {
      toEntities = vi.fn().mockReturnValue([]);
    },
  };
});

vi.mock('../file/file-integrity-service', () => {
  return {
    FileIntegrityService: class {
      verifyAndRecover = vi.fn().mockResolvedValue(false);
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
    expect(eventBusMocks.emit).toHaveBeenCalledWith('video:updated', {
      id: videoId,
      path: '/path/to/video.mp4',
    });
    expect(result).toEqual(['id-1']);
  });
});
