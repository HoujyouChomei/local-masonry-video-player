// electron/core/repositories/playlist-repository.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlaylistRepository } from './playlist-repository';

// --- DB Mock Setup ---
const mockRun = vi.fn();
const mockGet = vi.fn();
const mockAll = vi.fn();
// トランザクションモック: 渡された関数を即時実行する関数を返す
const mockTransaction = vi.fn((fn) => () => fn());

const mockPrepare = vi.fn((_sql: string) => ({
  run: mockRun,
  get: mockGet,
  all: mockAll,
}));

vi.mock('../../lib/db', () => ({
  getDB: () => ({
    prepare: mockPrepare,
    transaction: mockTransaction,
  }),
}));

describe('PlaylistRepository', () => {
  let repo: PlaylistRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new PlaylistRepository();
  });

  describe('getById', () => {
    it('should return playlist with video paths', () => {
      // 1. プレイリスト情報の取得
      mockGet.mockReturnValue({
        id: 'p1',
        name: 'My Playlist',
        created_at: 1000,
        updated_at: 2000,
      });

      // 2. プレイリスト内の動画パス取得 (getVideoPaths)
      // JOINやORDER BYが含まれるクエリの戻り値をモック
      mockAll.mockReturnValue([{ path: '/v1.mp4' }, { path: '/v2.mp4' }]);

      const result = repo.getById('p1');

      expect(mockPrepare).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM playlists WHERE id = ?')
      );
      expect(mockGet).toHaveBeenCalledWith('p1');

      // getVideoPaths のクエリ確認
      expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('SELECT v.path'));
      expect(mockAll).toHaveBeenCalledWith('p1');

      expect(result).toEqual({
        id: 'p1',
        name: 'My Playlist',
        videoPaths: ['/v1.mp4', '/v2.mp4'],
        createdAt: 1000,
        updatedAt: 2000,
      });
    });

    it('should return null if playlist does not exist', () => {
      mockGet.mockReturnValue(undefined);
      const result = repo.getById('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should return all playlists with video paths', () => {
      // プレイリスト一覧
      mockAll.mockReturnValueOnce([
        { id: 'p1', name: 'P1', created_at: 100, updated_at: 100 },
        { id: 'p2', name: 'P2', created_at: 200, updated_at: 200 },
      ]);

      // p1 の動画パス取得
      mockAll.mockReturnValueOnce([{ path: '/v1.mp4' }]);
      // p2 の動画パス取得
      mockAll.mockReturnValueOnce([]);

      const result = repo.getAll();

      expect(result).toHaveLength(2);
      expect(result[0].videoPaths).toEqual(['/v1.mp4']);
      expect(result[1].videoPaths).toEqual([]);
    });
  });

  describe('create', () => {
    it('should insert playlist record', () => {
      const playlist = {
        id: 'new-id',
        name: 'New Playlist',
        videoPaths: [],
        createdAt: 1000,
        updatedAt: 1000,
      };

      repo.create(playlist);

      expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO playlists'));
      expect(mockRun).toHaveBeenCalledWith(playlist);
    });
  });

  describe('updateName', () => {
    it('should update name and updated_at', () => {
      repo.updateName('p1', 'Updated Name');

      expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE playlists'));
      expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('SET name = ?'));
      expect(mockRun).toHaveBeenCalledWith('Updated Name', expect.any(Number), 'p1');
    });
  });

  describe('delete', () => {
    it('should delete playlist by id', () => {
      repo.delete('p1');
      expect(mockPrepare).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM playlists WHERE id = ?')
      );
      expect(mockRun).toHaveBeenCalledWith('p1');
    });
  });

  describe('addVideo', () => {
    it('should add video if not exists', () => {
      // 重複チェック: 存在しない (undefined)
      mockGet.mockReturnValueOnce(undefined);

      // 最大ランク取得: 5
      mockGet.mockReturnValueOnce({ maxRank: 5 });

      repo.addVideo('p1', 'v1');

      // INSERT実行 (rank = 6)
      expect(mockPrepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO playlist_items')
      );
      expect(mockRun).toHaveBeenCalledWith('p1', 'v1', 6, expect.any(Number));

      // touch (updated_at更新) が呼ばれる
      expect(mockPrepare).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE playlists SET updated_at')
      );
    });

    it('should skip adding if video already exists in playlist', () => {
      // 重複チェック: 存在する
      mockGet.mockReturnValueOnce({ 1: 1 });

      repo.addVideo('p1', 'v1');

      // INSERTは呼ばれない
      expect(mockPrepare).not.toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO playlist_items')
      );
    });
  });

  describe('removeVideo', () => {
    it('should delete video from playlist', () => {
      repo.removeVideo('p1', 'v1');

      expect(mockPrepare).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM playlist_items')
      );
      expect(mockRun).toHaveBeenCalledWith('p1', 'v1');

      // touch が呼ばれる
      expect(mockPrepare).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE playlists SET updated_at')
      );
    });
  });

  describe('reorderVideos', () => {
    it('should update ranks in transaction', () => {
      const videoIds = ['v1', 'v2', 'v3'];

      repo.reorderVideos('p1', videoIds);

      expect(mockTransaction).toHaveBeenCalled();
      // UPDATE文の準備
      expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE playlist_items'));
      expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('SET rank = ?'));

      // 3回実行されるはず (v1->0, v2->1, v3->2)
      // 引数: index, playlistId, videoId
      expect(mockRun).toHaveBeenCalledWith(0, 'p1', 'v1');
      expect(mockRun).toHaveBeenCalledWith(1, 'p1', 'v2');
      expect(mockRun).toHaveBeenCalledWith(2, 'p1', 'v3');

      // touch が呼ばれる
      expect(mockPrepare).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE playlists SET updated_at')
      );
    });
  });
});
