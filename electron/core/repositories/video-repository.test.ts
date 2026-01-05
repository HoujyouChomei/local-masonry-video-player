// electron/core/repositories/video-repository.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VideoRepository } from './video-repository';

// --- DB Mock Setup ---
const mockRun = vi.fn();
const mockGet = vi.fn();
const mockAll = vi.fn();

const mockPrepare = vi.fn((_sql: string) => ({
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
    // デフォルトの実装をリセット
    mockPrepare.mockImplementation((_sql: string) => ({
      run: mockRun,
      get: mockGet,
      all: mockAll,
    }));

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

    it('getFavorites should return favorite videos (Rows)', () => {
      mockAll.mockReturnValue([{ id: '1', path: '/fav.mp4', is_favorite: 1 }]);
      const result = repo.getFavorites();
      expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('is_favorite = 1'));
      expect(result).toHaveLength(1);
    });

    it('getFavoriteIds should return list of IDs', () => {
      mockAll.mockReturnValue([{ id: '1' }, { id: '2' }]);
      const result = repo.getFavoriteIds();
      expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('SELECT id FROM videos'));
      expect(result).toEqual(['1', '2']);
    });

    it('toggleFavoriteById should flip is_favorite flag by ID', () => {
      // Setup: 既存レコードの取得モック
      mockPrepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM videos WHERE id = ?')) {
          return {
            get: vi.fn().mockReturnValue({ id: '1', path: '/test.mp4', is_favorite: 0 }),
            run: mockRun,
            all: mockAll,
          };
        }
        if (sql.includes('UPDATE videos SET is_favorite = ?')) {
          return {
            run: mockRun,
            get: mockGet,
            all: mockAll,
          };
        }
        return { run: mockRun, get: mockGet, all: mockAll };
      });

      repo.toggleFavoriteById('1');

      // 0 -> 1 に更新されることを確認
      expect(mockRun).toHaveBeenCalledWith(1, '1');
    });
  });
});
