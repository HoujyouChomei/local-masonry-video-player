// electron/core/services/video-library-service.test.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VideoLibraryService } from './video-library-service';
import path from 'path';

// --- Mocks Setup ---

// ▼▼▼ 追加: Electron Mock (VideoMapper用) ▼▼▼
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/tmp/userData'),
  },
}));

// 1. Database Layer Mocks (Repository)
// 実際のDBを使わず、呼び出しだけを監視します
const videoRepoMocks = vi.hoisted(() => ({
  findByPath: vi.fn(),
  findManyByPaths: vi.fn(),
}));

const integrityRepoMocks = vi.hoisted(() => ({
  updatePath: vi.fn(),
  upsertMany: vi.fn(),
}));

const searchRepoMocks = vi.hoisted(() => ({
  search: vi.fn(),
}));

vi.mock('../repositories/video-repository', () => ({
  VideoRepository: class {
    findByPath = videoRepoMocks.findByPath;
    findManyByPaths = videoRepoMocks.findManyByPaths;
  },
}));

vi.mock('../repositories/video-integrity-repository', () => ({
  VideoIntegrityRepository: class {
    updatePath = integrityRepoMocks.updatePath;
    upsertMany = integrityRepoMocks.upsertMany;
    markAsMissing = vi.fn();
    updateHash = vi.fn();
  },
}));

vi.mock('../repositories/video-search-repository', () => ({
  VideoSearchRepository: class {
    search = searchRepoMocks.search;
  },
}));

// 2. File System Mock (fs/promises)
// 実際のファイル操作を行わず、成功/失敗をシミュレートします
import fs from 'fs/promises';
vi.mock('fs/promises', () => ({
  default: {
    rename: vi.fn(), // 移動用
    access: vi.fn(), // 存在確認用
    stat: vi.fn(), // 情報取得用
    readdir: vi.fn(), // スキャン用
  },
}));

// 3. Other Dependencies Mock
vi.mock('../../lib/store', () => ({
  store: {
    get: vi.fn((key) => {
      if (key === 'libraryFolders') return ['/lib'];
      return null;
    }),
  },
}));

// FFmpegService (スキャン時に呼ばれるため)
vi.mock('./ffmpeg-service', () => ({
  FFmpegService: class {
    validatePath = vi.fn().mockResolvedValue(true);
    normalizeVideo = vi.fn();
  },
}));

// ThumbnailService (スキャン時に呼ばれるため)
vi.mock('./thumbnail-service', () => ({
  ThumbnailService: {
    getInstance: () => ({
      addToQueue: vi.fn(),
      deleteThumbnail: vi.fn(),
    }),
  },
}));

// VideoRebinder (スキャン時に呼ばれるため)
vi.mock('./video-rebinder', () => ({
  VideoRebinder: class {
    findCandidate = vi.fn();
    execute = vi.fn();
  },
}));

describe('VideoLibraryService Integration', () => {
  let service: VideoLibraryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new VideoLibraryService();
  });

  describe('moveVideos (FileMoveService + DB Integration)', () => {
    const srcPath = path.normalize('/source/video.mp4');
    const targetDir = path.normalize('/target');
    const destPath = path.join(targetDir, 'video.mp4');

    it('should update DB path after successful file move', async () => {
      // Setup
      // 1. ファイル移動: 成功させる
      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT')); // 移動先にファイルなし
      vi.mocked(fs.rename).mockResolvedValue(undefined); // 移動成功

      // 2. DB検索: 移動前のファイルが見つかる
      videoRepoMocks.findByPath.mockReturnValue({ id: 'v1', path: srcPath });

      // 3. 移動後のstat取得: 成功
      vi.mocked(fs.stat).mockResolvedValue({ mtimeMs: 12345 } as any);

      // Execute
      const movedCount = await service.moveVideos([srcPath], targetDir);

      // Verify
      expect(movedCount).toBe(1);
      // FileMoveServiceが呼ばれたことの確認
      expect(fs.rename).toHaveBeenCalledWith(srcPath, destPath);
      // Repositoryが正しく呼ばれたことの確認
      expect(videoRepoMocks.findByPath).toHaveBeenCalledWith(srcPath);
      expect(integrityRepoMocks.updatePath).toHaveBeenCalledWith('v1', destPath, 12345);
    });

    it('should NOT update DB if file move fails', async () => {
      // Setup
      // 1. ファイル移動: 失敗させる
      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(fs.rename).mockRejectedValue(new Error('Permission denied'));

      // Execute
      const movedCount = await service.moveVideos([srcPath], targetDir);

      // Verify
      expect(movedCount).toBe(0);
      expect(fs.rename).toHaveBeenCalled();
      // DB更新は呼ばれないはず
      expect(integrityRepoMocks.updatePath).not.toHaveBeenCalled();
    });
  });

  describe('scanQuietly (LibraryScanner + DB Integration)', () => {
    const libPath = path.normalize('/lib');

    it('should scan files and register new ones to DB', async () => {
      // Setup
      // 1. readdir: 1つのファイルを返す
      const dirent = {
        name: 'new-video.mp4',
        isFile: () => true,
        isDirectory: () => false,
        isSymbolicLink: () => false,
      };
      vi.mocked(fs.readdir).mockResolvedValue([dirent] as any);

      // 2. DB: 既存データなし (findManyByPathsが空を返す)
      videoRepoMocks.findManyByPaths.mockReturnValue([]);

      // 3. stat: ファイル情報
      vi.mocked(fs.stat).mockResolvedValue({
        size: 1000,
        mtimeMs: 1000,
        birthtimeMs: 1000,
        ino: 123,
      } as any);

      // Execute
      await service.scanQuietly(libPath);

      // Verify
      // Scannerが正しくfsを呼んだか
      expect(fs.readdir).toHaveBeenCalledWith(libPath, expect.anything());

      // 未登録ファイルを検知してDB登録(upsertMany)を呼んだか
      expect(integrityRepoMocks.upsertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            path: path.join(libPath, 'new-video.mp4'),
            size: 1000,
          }),
        ]),
        expect.anything() // update list (empty)
      );
    });
  });

  describe('searchVideos (VideoSearchRepository + Options)', () => {
    it('should apply default library folders if scope is not provided', () => {
      // Setup
      searchRepoMocks.search.mockReturnValue([]);

      // Execute
      service.searchVideos('query', [], {});

      // Verify
      // allowedRoots に store.get('libraryFolders') の値 ('/lib') がセットされているか
      expect(searchRepoMocks.search).toHaveBeenCalledWith(
        'query',
        [],
        expect.objectContaining({
          allowedRoots: ['/lib'],
        })
      );
    });
  });
});
