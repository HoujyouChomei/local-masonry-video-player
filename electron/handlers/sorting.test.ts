// electron/handlers/sorting.test.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleSorting } from './sorting';

// 1. Hoisted Mocks
const mocks = vi.hoisted(() => ({
  saveSortOrder: vi.fn(),
  getSortOrder: vi.fn(),
}));

// 2. Repository Mock
vi.mock('../core/repositories/folder-repository', () => {
  return {
    FolderRepository: class {
      saveSortOrder = mocks.saveSortOrder;
      getSortOrder = mocks.getSortOrder;
    },
  };
});

// 3. Electron
const ipcHandlers = new Map<string, (...args: any[]) => any>();
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel, listener) => {
      ipcHandlers.set(channel, listener);
    }),
  },
}));

// 4. Local Server
vi.mock('../lib/local-server', () => ({
  getServerPort: () => 3000,
}));

describe('Sorting Handlers (Repository Mock)', () => {
  const invoke = async (channel: string, ...args: any[]) => {
    const handler = ipcHandlers.get(channel);
    if (!handler) throw new Error(`No handler registered for ${channel}`);
    return handler({} as any, ...args);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    ipcHandlers.clear();
    handleSorting();
  });

  it('should save folder order', async () => {
    const folderPath = '/test/folder';
    const videoPaths = ['/a.mp4', '/b.mp4'];

    await invoke('save-folder-order', folderPath, videoPaths);

    expect(mocks.saveSortOrder).toHaveBeenCalledWith(folderPath, videoPaths);
  });

  it('should get folder order', async () => {
    const folderPath = '/test/folder';
    const mockOrder = ['/x.mp4'];

    mocks.getSortOrder.mockReturnValue(mockOrder);

    const result = await invoke('get-folder-order', folderPath);

    expect(result).toEqual(mockOrder);
  });
});
