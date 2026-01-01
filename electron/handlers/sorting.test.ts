// electron/handlers/sorting.test.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleSorting } from './sorting';

// 1. Hoisted Mocks
const mocks = vi.hoisted(() => ({
  saveFolderOrder: vi.fn(),
  getFolderOrder: vi.fn(),
}));

// 2. Electron Mock
const ipcHandlers = new Map<string, (...args: any[]) => Promise<any>>();
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel, handler) => {
      ipcHandlers.set(channel, handler);
    }),
  },
}));

// 3. Service Mock (Repository MockではなくService Mockを使用)
vi.mock('../core/services/video-library-service', () => ({
  VideoLibraryService: class {
    saveFolderOrder = mocks.saveFolderOrder;
    getFolderOrder = mocks.getFolderOrder;
  },
}));

describe('handlers/sorting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ipcHandlers.clear();
    // ハンドラー登録
    handleSorting();
  });

  const invoke = async (channel: string, ...args: any[]) => {
    const handler = ipcHandlers.get(channel);
    if (!handler) {
      throw new Error(`No handler registered for ${channel}`);
    }
    return handler({} as any, ...args);
  };

  it('should delegate save-folder-order to VideoLibraryService', async () => {
    const folderPath = '/test/folder';
    const videoPaths = ['/a.mp4', '/b.mp4'];

    await invoke('save-folder-order', folderPath, videoPaths);

    expect(mocks.saveFolderOrder).toHaveBeenCalledWith(folderPath, videoPaths);
  });

  it('should delegate get-folder-order to VideoLibraryService', async () => {
    const folderPath = '/test/folder';
    const mockOrder = ['/x.mp4'];
    
    mocks.getFolderOrder.mockReturnValue(mockOrder);

    const result = await invoke('get-folder-order', folderPath);

    expect(mocks.getFolderOrder).toHaveBeenCalledWith(folderPath);
    expect(result).toEqual(mockOrder);
  });
});