// electron/core/services/library-scanner.test.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';
import { LibraryScanner } from './library-scanner';

// --- Mocks ---

// VideoRepository Mock (Basic Read)
const videoRepoMocks = vi.hoisted(() => ({
  findPathsByDirectory: vi.fn(),
  findManyByPaths: vi.fn(),
}));

vi.mock('../repositories/video-repository', () => ({
  VideoRepository: class {
    findPathsByDirectory = videoRepoMocks.findPathsByDirectory;
    findManyByPaths = videoRepoMocks.findManyByPaths;
  },
}));

// VideoIntegrityRepository Mock (Writes)
const integrityRepoMocks = vi.hoisted(() => ({
  markAsMissing: vi.fn(),
  upsertMany: vi.fn(),
  updateHash: vi.fn(),
}));

vi.mock('../repositories/video-integrity-repository', () => ({
  VideoIntegrityRepository: class {
    markAsMissing = integrityRepoMocks.markAsMissing;
    upsertMany = integrityRepoMocks.upsertMany;
    updateHash = integrityRepoMocks.updateHash;
  },
}));

// Singletonパターン対応
const thumbMocks = vi.hoisted(() => ({
  addToQueue: vi.fn(),
  deleteThumbnail: vi.fn(),
}));
vi.mock('./thumbnail-service', () => ({
  ThumbnailService: {
    getInstance: vi.fn().mockReturnValue({
      addToQueue: thumbMocks.addToQueue,
      deleteThumbnail: thumbMocks.deleteThumbnail,
    }),
  },
}));

const rebinderMocks = vi.hoisted(() => ({
  findCandidate: vi.fn(),
  execute: vi.fn(),
}));
vi.mock('./video-rebinder', () => ({
  VideoRebinder: class {
    findCandidate = rebinderMocks.findCandidate;
    execute = rebinderMocks.execute;
  },
}));

// FFmpegService Mock
const ffmpegMocks = vi.hoisted(() => ({
  validatePath: vi.fn(),
  ffmpegPath: '/mock/ffmpeg',
}));
vi.mock('./ffmpeg-service', () => ({
  FFmpegService: class {
    validatePath = ffmpegMocks.validatePath;
    get ffmpegPath() {
      return ffmpegMocks.ffmpegPath;
    }
  },
}));

vi.mock('fs/promises', () => ({
  default: {
    readdir: vi.fn(),
    stat: vi.fn(),
  },
}));
import fs from 'fs/promises';

vi.mock('fs', () => ({
  default: { existsSync: vi.fn(), mkdirSync: vi.fn() },
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

vi.mock('electron', () => ({
  app: { getPath: vi.fn().mockReturnValue('/mock') },
}));

vi.mock('../../lib/local-server', () => ({ getServerPort: () => 3000 }));
vi.mock('../../lib/file-hash', () => ({ calculateFileHash: vi.fn().mockResolvedValue('hash') }));

describe('LibraryScanner', () => {
  let scanner: LibraryScanner;
  const dummyFolder = path.normalize('/videos');

  beforeEach(() => {
    vi.clearAllMocks();
    scanner = new LibraryScanner();
    ffmpegMocks.validatePath.mockResolvedValue(false);
  });

  describe('scan', () => {
    it('should insert new files with correct names', async () => {
      const mockDirents = [{ name: 'new.mp4', isFile: () => true }];
      vi.mocked(fs.readdir).mockResolvedValue(mockDirents as any);
      vi.mocked(fs.stat).mockResolvedValue({ size: 100, mtimeMs: 100, ino: 1 } as any);

      videoRepoMocks.findPathsByDirectory.mockReturnValue([]);
      videoRepoMocks.findManyByPaths.mockReturnValue([]);
      rebinderMocks.findCandidate.mockResolvedValue(undefined);

      await scanner.scan(dummyFolder);

      expect(integrityRepoMocks.upsertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            path: path.join(dummyFolder, 'new.mp4'),
            name: 'new.mp4',
          }),
        ]),
        []
      );
    });

    it('should queue thumbnails for found files in scan', async () => {
      const mockDirents = [{ name: 'video.mp4', isFile: () => true }];
      vi.mocked(fs.readdir).mockResolvedValue(mockDirents as any);
      vi.mocked(fs.stat).mockResolvedValue({ size: 100, mtimeMs: 100, ino: 1 } as any);

      videoRepoMocks.findPathsByDirectory.mockReturnValue([]);
      videoRepoMocks.findManyByPaths.mockReturnValue([]);
      rebinderMocks.findCandidate.mockResolvedValue(undefined);

      await scanner.scan(dummyFolder);

      expect(thumbMocks.addToQueue).toHaveBeenCalledWith(
        expect.arrayContaining([path.join(dummyFolder, 'video.mp4')]),
        false
      );
    });

    it('should update changed files (reset metadata) and regenerate thumbnails', async () => {
      const filename = 'updated.mp4';
      const filePath = path.join(dummyFolder, filename);
      const mockDirents = [{ name: filename, isFile: () => true }];

      vi.mocked(fs.readdir).mockResolvedValue(mockDirents as any);
      vi.mocked(fs.stat).mockResolvedValue({
        size: 2000,
        mtimeMs: 9999,
        birthtimeMs: 1000,
        ino: 12345,
      } as any);

      const oldRow = {
        id: '1',
        path: filePath,
        size: 1000,
        mtime: 5000,
        status: 'available',
        ino: 12345,
      };
      videoRepoMocks.findPathsByDirectory.mockReturnValue([oldRow]);
      videoRepoMocks.findManyByPaths.mockReturnValue([oldRow]);

      await scanner.scan(dummyFolder);

      expect(integrityRepoMocks.upsertMany).toHaveBeenCalledWith(
        [],
        expect.arrayContaining([expect.objectContaining({ id: '1', size: 2000 })])
      );

      expect(thumbMocks.deleteThumbnail).toHaveBeenCalledWith(filePath);
      expect(thumbMocks.addToQueue).toHaveBeenCalledWith([filePath], true);
    });

    it('should mark missing files as missing', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([]);

      const missingFile = { id: 'missing-id', path: path.join(dummyFolder, 'gone.mp4') };
      videoRepoMocks.findPathsByDirectory.mockReturnValue([missingFile]);

      await scanner.scan(dummyFolder);

      expect(integrityRepoMocks.markAsMissing).toHaveBeenCalledWith(['missing-id']);
    });

    it('should attempt batch rebind when finding a new file in batch scan', async () => {
      const newFilePath = path.join(dummyFolder, 'moved.mp4');
      const mockDirents = [{ name: 'moved.mp4', isFile: () => true }];

      vi.mocked(fs.readdir).mockResolvedValue(mockDirents as any);
      vi.mocked(fs.stat).mockResolvedValue({ size: 5000, mtimeMs: 1000, ino: 99 } as any);

      videoRepoMocks.findPathsByDirectory.mockReturnValue([]);
      videoRepoMocks.findManyByPaths.mockReturnValue([]);

      rebinderMocks.findCandidate.mockResolvedValue({ id: 'moved-id', file_hash: 'hash' });

      await scanner.scan(dummyFolder);

      expect(rebinderMocks.execute).toHaveBeenCalledWith(
        'moved-id',
        newFilePath,
        5000,
        1000,
        99,
        'hash',
        expect.stringContaining('Batch')
      );

      expect(integrityRepoMocks.upsertMany).toHaveBeenCalledWith([], []);
    });

    it('should handle fs.readdir errors gracefully', async () => {
      vi.mocked(fs.readdir).mockRejectedValue(new Error('Permission denied'));

      const result = await scanner.scan(dummyFolder);

      expect(result).toEqual([]);
    });
  });
});
