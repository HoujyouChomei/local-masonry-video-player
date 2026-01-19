// electron/handlers/media/ops-handler.test.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleFileOps } from './ops-handler';

const mocks = vi.hoisted(() => ({
  deleteVideo: vi.fn(),
  renameVideo: vi.fn(),
  updateMetadata: vi.fn(),
  revealInExplorer: vi.fn(),

  download: vi.fn(),

  moveVideos: vi.fn(),
  normalizeVideo: vi.fn(),

  findByPath: vi.fn(),

  toEntity: vi.fn(),

  showItemInFolder: vi.fn(),
  openPath: vi.fn(),
}));

const ipcHandlers = new Map<string, (...args: any[]) => Promise<any>>();

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel, handler) => {
      ipcHandlers.set(channel, handler);
    }),
  },
  shell: {
    showItemInFolder: mocks.showItemInFolder,
    openPath: mocks.openPath,
  },
}));

// パス修正: ../core/services/video-service -> ../../core/services/media/media-service
vi.mock('../../core/services/media/media-service', () => ({
  VideoService: class {
    deleteVideo = mocks.deleteVideo;
    renameVideo = mocks.renameVideo;
    updateMetadata = mocks.updateMetadata;
    revealInExplorer = mocks.revealInExplorer;
  },
}));

vi.mock('../../core/services/file/download-service', () => ({
  DownloadService: class {
    download = mocks.download;
  },
}));

vi.mock('../../core/services/media/library-service', () => ({
  VideoLibraryService: class {
    moveVideos = mocks.moveVideos;
    normalizeVideo = mocks.normalizeVideo;
  },
}));

vi.mock('../../core/services/media/media-mapper', () => ({
  VideoMapper: class {
    toEntity = mocks.toEntity;
  },
}));

vi.mock('../../core/repositories/media/media-repository', () => ({
  MediaRepository: class {
    findByPath = mocks.findByPath;
  },
}));

describe('handlers/file-ops', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ipcHandlers.clear();
    handleFileOps();
  });

  const invoke = async (channel: string, ...args: any[]) => {
    const handler = ipcHandlers.get(channel);
    if (!handler) {
      throw new Error(`No handler registered for ${channel}`);
    }
    return handler({} as any, ...args);
  };

  it('should handle delete-video', async () => {
    mocks.deleteVideo.mockResolvedValue(true);
    const result = await invoke('delete-video', 'video-id');
    expect(mocks.deleteVideo).toHaveBeenCalledWith('video-id');
    expect(result).toBe(true);
  });

  it('should handle rename-video', async () => {
    const mockResult = { id: '1', path: '/new.mp4' };
    mocks.renameVideo.mockResolvedValue(mockResult);
    const result = await invoke('rename-video', 'video-id', 'new');
    expect(mocks.renameVideo).toHaveBeenCalledWith('video-id', 'new');
    expect(result).toEqual(mockResult);
  });

  it('should delegate move-videos to VideoLibraryService', async () => {
    const videoPaths = ['/a.mp4'];
    const target = '/target';
    mocks.moveVideos.mockResolvedValue(1);

    const result = await invoke('move-videos', videoPaths, target);

    expect(mocks.moveVideos).toHaveBeenCalledWith(videoPaths, target);
    expect(result).toBe(1);
  });

  it('should handle download-video', async () => {
    const mockVideo = { id: 'dl-1' };
    mocks.download.mockResolvedValue(mockVideo);
    const result = await invoke('download-video', 'http://url', '/target');
    expect(mocks.download).toHaveBeenCalledWith('http://url', '/target');
    expect(result).toEqual(mockVideo);
  });

  it('should delegate normalize-video to VideoLibraryService', async () => {
    const mockVideo = { id: 'norm-1' };
    mocks.normalizeVideo.mockResolvedValue(mockVideo);

    const result = await invoke('normalize-video', '/input.mp4');

    expect(mocks.normalizeVideo).toHaveBeenCalledWith('/input.mp4');
    expect(result).toEqual(mockVideo);
  });

  it('should handle reveal-in-explorer', async () => {
    await invoke('reveal-in-explorer', 'video-id');
    expect(mocks.revealInExplorer).toHaveBeenCalledWith('video-id');
  });

  it('should handle open-path', async () => {
    await invoke('open-path', '/path.mp4');
    expect(mocks.openPath).toHaveBeenCalledWith('/path.mp4');
  });

  it('should handle update-video-metadata', async () => {
    await invoke('update-video-metadata', 'video-id', 100, 1920, 1080);
    expect(mocks.updateMetadata).toHaveBeenCalledWith('video-id', 100, 1920, 1080);
  });

  it('should handle get-video-details', async () => {
    const dbRow = { id: '1', path: '/path.mp4' };
    const entity = { id: '1', name: 'video' };
    mocks.findByPath.mockReturnValue(dbRow);
    mocks.toEntity.mockReturnValue(entity);

    const result = await invoke('get-video-details', '/path.mp4');

    expect(mocks.findByPath).toHaveBeenCalledWith('/path.mp4');
    expect(mocks.toEntity).toHaveBeenCalledWith(dbRow);
    expect(result).toEqual(entity);
  });
});
