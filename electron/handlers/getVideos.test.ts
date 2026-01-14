// electron/handlers/getVideos.test.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';
import { getVideos } from './getVideos';
import fs from 'fs/promises';

const mocks = vi.hoisted(() => ({
  findManyByPaths: vi.fn(),
  findPathsByDirectory: vi.fn(),

  upsertMany: vi.fn(),
  findByInode: vi.fn(),
  updateHash: vi.fn(),
  markAsMissing: vi.fn(),

  watch: vi.fn(),
  stop: vi.fn(),
}));

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/mock/user/data'),
  },
  BrowserWindow: {
    getAllWindows: vi.fn().mockReturnValue([]),
  },
}));

vi.mock('../core/repositories/video-repository', () => {
  return {
    VideoRepository: class {
      findManyByPaths = mocks.findManyByPaths;
      findPathsByDirectory = mocks.findPathsByDirectory;
    },
  };
});

vi.mock('../core/repositories/video-integrity-repository', () => {
  return {
    VideoIntegrityRepository: class {
      upsertMany = mocks.upsertMany;
      findByInode = mocks.findByInode;
      updateHash = mocks.updateHash;
      markAsMissing = mocks.markAsMissing;
    },
  };
});

vi.mock('../core/services/file-watcher-service', () => {
  return {
    FileWatcherService: {
      getInstance: vi.fn().mockReturnValue({
        watch: mocks.watch,
        stop: mocks.stop,
      }),
    },
  };
});

vi.mock('fs/promises', () => {
  const readdirMock = vi.fn();
  const statMock = vi.fn();
  return {
    default: {
      readdir: readdirMock,
      stat: statMock,
    },
    readdir: readdirMock,
    stat: statMock,
  };
});

vi.mock('../lib/local-server', () => ({
  getServerPort: () => 3000,
}));

vi.mock('../lib/file-hash', () => ({
  calculateFileHash: vi.fn().mockResolvedValue('mock-hash'),
}));

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
  },
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
}));

vi.mock('../core/services/ffmpeg-service', () => ({
  FFmpegService: class {
    validatePath = vi.fn().mockResolvedValue(false);
    get ffmpegPath() {
      return '/mock/ffmpeg';
    }
  },
}));

describe('getVideos (Handler)', () => {
  const dummyFolderPath = '/test/videos';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should scan files, upsert to repository, and start watching', async () => {
    const mockDirents = [{ name: 'movie1.mp4', isFile: () => true }];
    const mockStats = {
      size: 1000,
      mtimeMs: 1600000000000,
      birthtimeMs: 1600000000000,
      ino: 12345,
    };

    vi.mocked(fs.readdir).mockResolvedValue(mockDirents as any);
    vi.mocked(fs.stat).mockResolvedValue(mockStats as any);

    mocks.findPathsByDirectory.mockReturnValue([]);
    mocks.findByInode.mockReturnValue([]);

    const expectedRecord = {
      id: 'mock-id',
      path: path.join(dummyFolderPath, 'movie1.mp4'),
      size: 1000,
      mtime: 1600000000000,
      created_at: 1600000000000,
      duration: null,
      status: 'available',
    };

    mocks.findManyByPaths.mockReturnValueOnce([]).mockReturnValueOnce([expectedRecord]);

    const videos = await getVideos(dummyFolderPath);

    expect(fs.readdir).toHaveBeenCalledWith(dummyFolderPath, expect.anything());

    expect(mocks.upsertMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          path: path.join(dummyFolderPath, 'movie1.mp4'),
          size: 1000,
        }),
      ]),
      []
    );

    expect(videos).toHaveLength(1);
    expect(videos[0].path).toContain('movie1.mp4');

    expect(mocks.watch).toHaveBeenCalledWith(dummyFolderPath);
  });
});
