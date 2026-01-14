// electron/handlers/search.test.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleSearch } from './search';

const mocks = vi.hoisted(() => ({
  searchVideos: vi.fn(),
}));

const ipcHandlers = new Map<string, (...args: any[]) => Promise<any>>();

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel, handler) => {
      ipcHandlers.set(channel, handler);
    }),
  },
}));

vi.mock('../core/services/video-library-service', () => {
  return {
    VideoLibraryService: class {
      searchVideos = mocks.searchVideos;
    },
  };
});

describe('handlers/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ipcHandlers.clear();
    handleSearch();
  });

  const invoke = async (channel: string, ...args: any[]) => {
    const handler = ipcHandlers.get(channel);
    if (!handler) {
      throw new Error(`No handler registered for ${channel}`);
    }
    return handler({} as any, ...args);
  };

  it('should delegate search-videos to VideoLibraryService', async () => {
    const query = 'test query';
    const tagIds = ['tag1'];
    const options = { folderPath: '/videos' };

    const mockResults = [{ id: 'v1', name: 'v1.mp4' }];
    mocks.searchVideos.mockReturnValue(mockResults);

    const result = await invoke('search-videos', query, tagIds, options);

    expect(mocks.searchVideos).toHaveBeenCalledWith(query, tagIds, options);
    expect(result).toEqual(mockResults);
  });
});
