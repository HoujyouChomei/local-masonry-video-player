// electron/core/services/library-scanner.test.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';
import { LibraryScanner } from './library-scanner';

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

vi.mock('fs/promises', () => {
  const readdir = vi.fn();
  const stat = vi.fn();
  return {
    default: { readdir, stat },
    readdir,
    stat,
  };
});
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
  const dummyFolder = process.platform === 'win32' ? 'C:\\videos' : '/videos';

  beforeEach(() => {
    vi.clearAllMocks();
    scanner = new LibraryScanner();
    ffmpegMocks.validatePath.mockResolvedValue(false);

    vi.mocked(fs.readdir).mockResolvedValue([]);
    vi.mocked(fs.stat).mockResolvedValue({
      size: 100,
      mtimeMs: 100,
      birthtimeMs: 100,
      ino: 1,
    } as any);
    videoRepoMocks.findManyByPaths.mockReturnValue([]);
    videoRepoMocks.findPathsByDirectory.mockReturnValue([]);
    rebinderMocks.findCandidate.mockResolvedValue(undefined);
  });

  describe('scan', () => {
    it('should insert new files with correct names', async () => {
      const mockDirents = [{ name: 'new.mp4', isFile: () => true }];
      vi.mocked(fs.readdir).mockResolvedValue(mockDirents as any);

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

      await scanner.scan(dummyFolder);

      expect(thumbMocks.addToQueue).toHaveBeenCalledWith(
        expect.arrayContaining([path.join(dummyFolder, 'video.mp4')]),
        false
      );
    });

    it('should update changed files and regenerate thumbnails', async () => {
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

    it('should process files in batches to prevent resource exhaustion', async () => {
      const mockDirents = Array.from({ length: 150 }, (_, i) => ({
        name: `video${i}.mp4`,
        isFile: () => true,
      }));
      vi.mocked(fs.readdir).mockResolvedValue(mockDirents as any);

      await scanner.scan(dummyFolder);

      expect(fs.stat).toHaveBeenCalledTimes(150);

      expect(integrityRepoMocks.upsertMany).toHaveBeenCalledTimes(1);
      const calls = integrityRepoMocks.upsertMany.mock.calls;
      expect(calls[0][0]).toHaveLength(150);
    });
  });

  describe('scanQuietly', () => {
    it('should recursively find files in scanQuietly', async () => {
      const subDirName = 'subdir';
      const rootFile = 'root.mp4';
      const subFile = 'sub.mp4';
      const subDirPath = path.join(dummyFolder, subDirName);

      // Note: On Windows test environment, input path might be "C:\videos\subdir" or "C:/videos/subdir"
      const normalize = (p: string) => String(p).replace(/[\\/]/g, '/').toLowerCase();

      vi.mocked(fs.readdir).mockImplementation(async (p: any) => {
        const pNorm = normalize(p);

        if (pNorm.includes(subDirName.toLowerCase())) {
          return [
            {
              name: subFile,
              isFile: () => true,
              isSymbolicLink: () => false,
              isDirectory: () => false,
            },
          ] as any;
        }

        return [
          {
            name: rootFile,
            isFile: () => true,
            isSymbolicLink: () => false,
            isDirectory: () => false,
          },
          {
            name: subDirName,
            isFile: () => false,
            isSymbolicLink: () => false,
            isDirectory: () => true,
          },
        ] as any;
      });

      vi.mocked(fs.stat).mockResolvedValue({
        size: 100,
        mtimeMs: 100,
        birthtimeMs: 100,
        ino: 1,
      } as any);

      videoRepoMocks.findManyByPaths.mockReturnValue([]);

      rebinderMocks.findCandidate.mockResolvedValue(undefined);

      await scanner.scanQuietly(dummyFolder);

      expect(integrityRepoMocks.upsertMany).toHaveBeenCalled();

      const calls = integrityRepoMocks.upsertMany.mock.calls;
      const allInserted = calls.flatMap((c: any) => c[0]);
      const insertedPaths = allInserted.map((item: any) => item.path);

      expect(insertedPaths).toContain(path.join(dummyFolder, rootFile));
      expect(insertedPaths).toContain(path.join(subDirPath, subFile));
    });

    it('should respect max depth in scanQuietly', async () => {
      vi.mocked(fs.readdir).mockImplementation(async () => {
        return [
          {
            name: 'deep_dir',
            isFile: () => false,
            isSymbolicLink: () => false,
            isDirectory: () => true,
          },
        ] as any;
      });

      await scanner.scanQuietly(dummyFolder);

      expect(fs.readdir).toHaveBeenCalledTimes(21);
    });
  });
});
