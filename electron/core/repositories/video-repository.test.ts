// electron/core/repositories/video-repository.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => ''),
    isPackaged: false,
  },
}));

import { VideoRepository } from './video-repository';

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

    it('findById should query by id', () => {
      mockGet.mockReturnValue({ id: '1', path: '/test.mp4' });

      const result = repo.findById('1');

      expect(mockPrepare).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM videos WHERE id = ?')
      );
      expect(mockGet).toHaveBeenCalledWith('1');
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

      expect(mockRun).toHaveBeenCalledWith(1, '1');
    });

    it('deleteById should delete record', () => {
      repo.deleteById('del-id');
      expect(mockPrepare).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM videos WHERE id = ?')
      );
      expect(mockRun).toHaveBeenCalledWith('del-id');
    });
  });

  describe('Bulk & Complex Queries', () => {
    it('findManyByPaths should handle multiple paths with correct placeholders', () => {
      mockAll.mockReturnValue([]);
      const paths = ['/a.mp4', '/b.mp4', '/c.mp4'];

      repo.findManyByPaths(paths);

      expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('IN (?,?,?)'));
      expect(mockAll).toHaveBeenCalledWith('/a.mp4', '/b.mp4', '/c.mp4');
    });

    it('findManyByPaths should return empty array if input is empty', () => {
      const result = repo.findManyByPaths([]);
      expect(result).toEqual([]);
      expect(mockPrepare).not.toHaveBeenCalled();
    });

    it('findManyByTagIds should filter by tags with HAVING clause', () => {
      mockAll.mockReturnValue([]);
      const tagIds = ['tag1', 'tag2'];

      repo.findManyByTagIds(tagIds);

      expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('IN (?,?)'));
      expect(mockPrepare).toHaveBeenCalledWith(
        expect.stringContaining('HAVING COUNT(DISTINCT vt.tag_id) = ?')
      );
      expect(mockAll).toHaveBeenCalledWith('tag1', 'tag2', 2);
    });

    it('findManyByTagIds should return empty array if input is empty', () => {
      const result = repo.findManyByTagIds([]);
      expect(result).toEqual([]);
      expect(mockPrepare).not.toHaveBeenCalled();
    });

    it('findPathsByDirectory should query with LIKE prefix', () => {
      mockAll.mockReturnValue([{ id: '1', path: '/folder/video.mp4' }]);

      repo.findPathsByDirectory('/folder');

      expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('path LIKE ?'));
      expect(mockAll).toHaveBeenCalledWith('/folder%');
    });

    it('deleteManyByIds should handle multiple IDs', () => {
      const ids = ['1', '2', '3'];
      repo.deleteManyByIds(ids);

      expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('IN (?,?,?)'));
      expect(mockRun).toHaveBeenCalledWith('1', '2', '3');
    });
  });
});
