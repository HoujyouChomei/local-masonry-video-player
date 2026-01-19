// electron/handlers/media/getVideos.test.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleGetVideos } from './getVideos';

const mocks = vi.hoisted(() => ({
  loadAndWatch: vi.fn(),
}));

const ipcHandlers = new Map<string, (...args: any[]) => Promise<any>>();

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel, handler) => {
      ipcHandlers.set(channel, handler);
    }),
  },
  app: {
    getPath: vi.fn().mockReturnValue('/mock/user/data'),
    isPackaged: false,
  },
}));

vi.mock('../../core/services/media/library-service', () => ({
  VideoLibraryService: class {
    loadAndWatch = mocks.loadAndWatch;
  },
}));

describe('handleGetVideos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ipcHandlers.clear();
    handleGetVideos();
  });

  const invoke = async (channel: string, ...args: any[]) => {
    const handler = ipcHandlers.get(channel);
    if (!handler) {
      throw new Error(`No handler registered for ${channel}`);
    }
    return handler({} as any, ...args);
  };

  it('should delegate get-videos to VideoLibraryService.loadAndWatch', async () => {
    const folderPath = '/test/videos';
    const mockVideos = [{ id: '1', path: '/test/videos/1.mp4' }];

    mocks.loadAndWatch.mockResolvedValue(mockVideos);

    const result = await invoke('get-videos', folderPath);

    expect(mocks.loadAndWatch).toHaveBeenCalledWith(folderPath);
    expect(result).toEqual(mockVideos);
  });
});
