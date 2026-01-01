// electron/handlers/file-ops.test.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleFileOps } from './file-ops';

// --- 1. Hoisted Mocks ---
const mocks = vi.hoisted(() => ({
  // VideoService
  deleteVideo: vi.fn(),
  renameVideo: vi.fn(),
  updateMetadata: vi.fn(),
  revealInExplorer: vi.fn(), // 追加
  
  // DownloadService
  download: vi.fn(),
  
  // VideoLibraryService (New)
  moveVideos: vi.fn(),
  normalizeVideo: vi.fn(),
  
  // VideoRepository
  findByPath: vi.fn(),
  
  // VideoMapper
  toEntity: vi.fn(),
  
  // Electron shell
  showItemInFolder: vi.fn(),
  openPath: vi.fn(),
}));

// --- 2. Electron Mock ---
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

// --- 3. Service Mocks ---
vi.mock('../core/services/video-service', () => ({
  VideoService: class {
    deleteVideo = mocks.deleteVideo;
    renameVideo = mocks.renameVideo;
    updateMetadata = mocks.updateMetadata;
    revealInExplorer = mocks.revealInExplorer; // 追加
  },
}));

vi.mock('../core/services/download-service', () => ({
  DownloadService: class {
    download = mocks.download;
  },
}));

// ▼▼▼ VideoLibraryService Mock ▼▼▼
vi.mock('../core/services/video-library-service', () => ({
  VideoLibraryService: class {
    moveVideos = mocks.moveVideos;
    normalizeVideo = mocks.normalizeVideo;
  },
}));

vi.mock('../core/services/video-mapper', () => ({
  VideoMapper: class {
    toEntity = mocks.toEntity;
  },
}));

vi.mock('../core/repositories/video-repository', () => ({
  VideoRepository: class {
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
    // ハンドラは Service に委譲する
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