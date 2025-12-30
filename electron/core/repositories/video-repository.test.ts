// electron/core/repositories/video-repository.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VideoRepository } from './video-repository';

// --- DB Mock Setup ---
const mockRun = vi.fn();
const mockGet = vi.fn();
const mockAll = vi.fn();
const mockPrepare = vi.fn(() => ({
  run: mockRun,
  get: mockGet,
  all: mockAll,
}));

vi.mock('../../lib/db', () => ({
  getDB: () => ({
    prepare: mockPrepare,
  }),
}));

describe('VideoRepository (Mocked DB)', () => {
  let repo: VideoRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new VideoRepository();
  });

  describe('CRUD Operations', () => {
    it('findByPath should query by path', () => {
      mockGet.mockReturnValue({ id: '1', path: '/test.mp4' });

      const result = repo.findByPath('/test.mp4');

      expect(mockPrepare).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM videos WHERE path = ?')
      );
      expect(mockGet).toHaveBeenCalledWith('/test.mp4');
      expect(result).toEqual({ id: '1', path: '/test.mp4' });
    });

    it('create should insert video record', () => {
      const input = {
        id: '123',
        path: '/new.mp4',
        name: 'new.mp4',
        size: 100,
        mtime: 1000,
        created_at: 2000,
        ino: 999,
      };

      repo.create(input);

      expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO videos'));
      expect(mockRun).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '123',
          path: '/new.mp4',
        })
      );
    });

    it('getFavorites should return favorite videos', () => {
      mockAll.mockReturnValue([{ id: '1', path: '/fav.mp4' }]);
      const result = repo.getFavorites();
      expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('is_favorite = 1'));
      expect(result).toHaveLength(1);
    });

    it('toggleFavorite should flip is_favorite flag', () => {
      mockGet.mockReturnValue({ id: '1', path: '/test.mp4', is_favorite: 0 });
      repo.toggleFavorite('/test.mp4');
      expect(mockRun).toHaveBeenCalledWith(1, '/test.mp4');
    });
  });
});
