// electron/handlers/tags.test.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleTags } from './tags';

const mocks = vi.hoisted(() => ({
  createTag: vi.fn(),
  getAllActiveTags: vi.fn(),
  getTagsByFolder: vi.fn(),
  getAllTags: vi.fn(),
  getVideoTags: vi.fn(),
  assignTag: vi.fn(),
  unassignTag: vi.fn(),
  getVideosByTag: vi.fn(),
  assignTagToVideos: vi.fn(),
  unassignTagFromVideos: vi.fn(),
}));

const ipcHandlers = new Map<string, (...args: any[]) => Promise<any>>();

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel, handler) => {
      ipcHandlers.set(channel, handler);
    }),
  },
}));

vi.mock('../core/services/tag-service', () => ({
  TagService: class {
    createTag = mocks.createTag;
    getAllActiveTags = mocks.getAllActiveTags;
    getTagsByFolder = mocks.getTagsByFolder;
    getAllTags = mocks.getAllTags;
    getVideoTags = mocks.getVideoTags;
    assignTag = mocks.assignTag;
    unassignTag = mocks.unassignTag;
    getVideosByTag = mocks.getVideosByTag;
    assignTagToVideos = mocks.assignTagToVideos;
    unassignTagFromVideos = mocks.unassignTagFromVideos;
  },
}));

describe('handlers/tags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ipcHandlers.clear();
    handleTags();
  });

  const invoke = async (channel: string, ...args: any[]) => {
    const handler = ipcHandlers.get(channel);
    if (!handler) {
      throw new Error(`No handler registered for ${channel}`);
    }
    return handler({} as any, ...args);
  };

  it('should handle create-tag', async () => {
    const mockTag = { id: '1', name: 'New Tag' };
    mocks.createTag.mockReturnValue(mockTag);

    const result = await invoke('create-tag', 'New Tag');

    expect(mocks.createTag).toHaveBeenCalledWith('New Tag');
    expect(result).toEqual(mockTag);
  });

  it('should handle get-tags-active', async () => {
    const mockTags = [{ id: '1', name: 'Tag 1' }];
    mocks.getAllActiveTags.mockReturnValue(mockTags);

    const result = await invoke('get-tags-active');

    expect(mocks.getAllActiveTags).toHaveBeenCalled();
    expect(result).toEqual(mockTags);
  });

  it('should handle get-tags-by-folder', async () => {
    const mockTags = [{ id: '1', name: 'Tag 1' }];
    mocks.getTagsByFolder.mockReturnValue(mockTags);

    const result = await invoke('get-tags-by-folder', '/path/to/folder');

    expect(mocks.getTagsByFolder).toHaveBeenCalledWith('/path/to/folder');
    expect(result).toEqual(mockTags);
  });

  it('should handle get-tags-all', async () => {
    const mockTags = [
      { id: '1', name: 'Tag 1' },
      { id: '2', name: 'Tag 2' },
    ];
    mocks.getAllTags.mockReturnValue(mockTags);

    const result = await invoke('get-tags-all');

    expect(mocks.getAllTags).toHaveBeenCalled();
    expect(result).toEqual(mockTags);
  });

  it('should handle get-video-tags', async () => {
    const mockTags = [{ id: '1', name: 'Tag 1' }];
    mocks.getVideoTags.mockReturnValue(mockTags);

    const result = await invoke('get-video-tags', 'video-1');

    expect(mocks.getVideoTags).toHaveBeenCalledWith('video-1');
    expect(result).toEqual(mockTags);
  });

  it('should handle assign-tag', async () => {
    const mockTags = [{ id: '1', name: 'Tag 1' }];
    mocks.assignTag.mockReturnValue(mockTags);

    const result = await invoke('assign-tag', 'video-1', 'tag-1');

    expect(mocks.assignTag).toHaveBeenCalledWith('video-1', 'tag-1');
    expect(result).toEqual(mockTags);
  });

  it('should handle unassign-tag', async () => {
    const mockTags: any[] = [];
    mocks.unassignTag.mockReturnValue(mockTags);

    const result = await invoke('unassign-tag', 'video-1', 'tag-1');

    expect(mocks.unassignTag).toHaveBeenCalledWith('video-1', 'tag-1');
    expect(result).toEqual(mockTags);
  });

  it('should handle get-videos-by-tag', async () => {
    const mockEntities = [{ id: 'v1', name: 'Video 1' }];
    mocks.getVideosByTag.mockReturnValue(mockEntities);

    const tagIds = ['tag-1', 'tag-2'];
    const result = await invoke('get-videos-by-tag', tagIds);

    expect(mocks.getVideosByTag).toHaveBeenCalledWith(tagIds);
    expect(result).toEqual(mockEntities);
  });

  it('should handle assign-tag-to-videos', async () => {
    const videoIds = ['v1', 'v2'];
    const tagId = 'tag-1';

    const result = await invoke('assign-tag-to-videos', videoIds, tagId);

    expect(mocks.assignTagToVideos).toHaveBeenCalledWith(videoIds, tagId);
    expect(result).toBe(true);
  });

  it('should handle unassign-tag-from-videos', async () => {
    const videoIds = ['v1', 'v2'];
    const tagId = 'tag-1';

    const result = await invoke('unassign-tag-from-videos', videoIds, tagId);

    expect(mocks.unassignTagFromVideos).toHaveBeenCalledWith(videoIds, tagId);
    expect(result).toBe(true);
  });
});
