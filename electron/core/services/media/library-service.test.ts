// electron/core/services/media/library-service.test.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VideoLibraryService } from './library-service';
import path from 'path';

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/tmp/userData'),
  },
}));

const mediaRepoMocks = vi.hoisted(() => ({
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

const eventBusMocks = vi.hoisted(() => ({
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
}));

vi.mock('../../events', () => ({
  eventBus: eventBusMocks,
}));

vi.mock('../../repositories/media/media-repository', () => ({
  MediaRepository: class {
    findByPath = mediaRepoMocks.findByPath;
    findManyByPaths = mediaRepoMocks.findManyByPaths;
  },
}));

vi.mock('../../repositories/media/media-integrity', () => ({
  VideoIntegrityRepository: class {
    updatePath = integrityRepoMocks.updatePath;
    upsertMany = integrityRepoMocks.upsertMany;
    markAsMissing = vi.fn();
    updateHash = vi.fn();
  },
}));

vi.mock('../../repositories/media/media-search', () => ({
  VideoSearchRepository: class {
    search = searchRepoMocks.search;
  },
}));

import fs from 'fs/promises';
vi.mock('fs/promises', () => ({
  default: {
    rename: vi.fn(),
    access: vi.fn(),
    stat: vi.fn(),
    readdir: vi.fn(),
  },
}));

vi.mock('../../../lib/store', () => ({
  store: {
    get: vi.fn((key) => {
      if (key === 'libraryFolders') return ['/lib'];
      return null;
    }),
  },
}));

vi.mock('../video/ffmpeg-service', () => ({
  FFmpegService: class {
    validatePath = vi.fn().mockResolvedValue(true);
    normalizeVideo = vi.fn();
  },
}));

vi.mock('./thumbnail-service', () => ({
  ThumbnailService: {
    getInstance: () => ({
      addToQueue: vi.fn(),
      deleteThumbnail: vi.fn(),
    }),
  },
}));

vi.mock('./rebinder', () => ({
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

    it('should update DB path and emit event after successful file move', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(fs.rename).mockResolvedValue(undefined);

      mediaRepoMocks.findByPath.mockReturnValue({ id: 'v1', path: srcPath });

      vi.mocked(fs.stat).mockResolvedValue({ mtimeMs: 12345 } as any);

      const response = await service.moveVideos([srcPath], targetDir);

      expect(response.successCount).toBe(1);
      expect(fs.rename).toHaveBeenCalledWith(srcPath, destPath);
      expect(mediaRepoMocks.findByPath).toHaveBeenCalledWith(srcPath);
      expect(integrityRepoMocks.updatePath).toHaveBeenCalledWith('v1', destPath, 12345);

      expect(eventBusMocks.emit).toHaveBeenCalledWith('video:updated', {
        id: 'v1',
        path: destPath,
      });
    });

    it('should NOT update DB or emit event if file move fails', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(fs.rename).mockRejectedValue(new Error('Permission denied'));

      const response = await service.moveVideos([srcPath], targetDir);

      expect(response.successCount).toBe(0);
      expect(fs.rename).toHaveBeenCalled();
      expect(integrityRepoMocks.updatePath).not.toHaveBeenCalled();
      expect(eventBusMocks.emit).not.toHaveBeenCalledWith('video:updated', expect.anything());
    });
  });

  describe('scanQuietly (LibraryScanner + DB Integration)', () => {
    const libPath = path.normalize('/lib');

    it('should scan files and register new ones to DB', async () => {
      const dirent = {
        name: 'new-video.mp4',
        isFile: () => true,
        isDirectory: () => false,
        isSymbolicLink: () => false,
      };
      vi.mocked(fs.readdir).mockResolvedValue([dirent] as any);

      mediaRepoMocks.findManyByPaths.mockReturnValue([]);

      vi.mocked(fs.stat).mockResolvedValue({
        size: 1000,
        mtimeMs: 1000,
        birthtimeMs: 1000,
        ino: 123,
      } as any);

      await service.scanQuietly(libPath);

      expect(fs.readdir).toHaveBeenCalledWith(libPath, expect.anything());

      expect(integrityRepoMocks.upsertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            path: path.join(libPath, 'new-video.mp4'),
            size: 1000,
          }),
        ]),
        expect.anything()
      );
    });
  });

  describe('searchVideos (VideoSearchRepository + Options)', () => {
    it('should apply default library folders if scope is not provided', () => {
      searchRepoMocks.search.mockReturnValue([]);

      service.searchVideos('query', [], {});

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
