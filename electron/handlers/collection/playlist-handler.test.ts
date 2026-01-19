// electron/handlers/collection/playlist-handler.test.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handlePlaylists } from './playlist-handler';

const playlistMocks = vi.hoisted(() => ({
  existsByName: vi.fn(),
  create: vi.fn(),
  addVideo: vi.fn(),
  getById: vi.fn(),
  getAll: vi.fn(),
  delete: vi.fn(),
  updateName: vi.fn(),
  removeVideo: vi.fn(),
  reorderVideos: vi.fn(),
}));

const mediaRepoMocks = vi.hoisted(() => ({
  findById: vi.fn(),
}));

const ipcHandlers = new Map<string, (...args: any[]) => any>();
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel, listener) => {
      ipcHandlers.set(channel, listener);
    }),
  },
  app: {
    getPath: vi.fn().mockReturnValue('/mock/user/data'),
  },
}));

// パス修正: ../core/repositories/playlist-repository -> ../../core/repositories/collection/playlist-repository
vi.mock('../../core/repositories/collection/playlist-repository', () => {
  return {
    PlaylistRepository: class {
      existsByName = playlistMocks.existsByName;
      create = playlistMocks.create;
      addVideo = playlistMocks.addVideo;
      getById = playlistMocks.getById;
      getAll = playlistMocks.getAll;
      delete = playlistMocks.delete;
      updateName = playlistMocks.updateName;
      removeVideo = playlistMocks.removeVideo;
      reorderVideos = playlistMocks.reorderVideos;
    },
  };
});

vi.mock('../../core/repositories/media/media-repository', () => {
  return {
    MediaRepository: class {
      findById = mediaRepoMocks.findById;
    },
  };
});

vi.mock('../../core/services/media/media-service', () => {
  return {
    VideoService: class {},
  };
});

vi.mock('../../lib/local-server', () => ({
  getServerPort: () => 3000,
}));

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
  },
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
}));

describe('Playlist Handlers (Repository Mock)', () => {
  const invoke = async (channel: string, ...args: any[]) => {
    const handler = ipcHandlers.get(channel);
    if (!handler) throw new Error(`No handler registered for ${channel}`);
    return handler({} as any, ...args);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    ipcHandlers.clear();
    handlePlaylists();
  });

  it('should create a new playlist', async () => {
    playlistMocks.existsByName.mockReturnValue(false);

    const result = await invoke('create-playlist', 'My List');

    expect(playlistMocks.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'My List' }));
    expect(result.name).toBe('My List');
  });

  it('should handle duplicate playlist names', async () => {
    playlistMocks.existsByName.mockReturnValueOnce(true).mockReturnValue(false);

    const result = await invoke('create-playlist', 'My List');

    expect(result.name).toBe('My List (1)');
  });

  it('should add video to playlist by ID', async () => {
    const mockPlaylist = { id: 'pl-1', name: 'List', videoPaths: ['/v1.mp4'] };
    const videoId = 'vid-1';

    mediaRepoMocks.findById.mockReturnValue({ id: videoId, path: '/v1.mp4' });
    playlistMocks.getById.mockReturnValue(mockPlaylist);

    const result = await invoke('add-video-to-playlist', 'pl-1', videoId);

    expect(mediaRepoMocks.findById).toHaveBeenCalledWith(videoId);
    expect(playlistMocks.addVideo).toHaveBeenCalledWith('pl-1', videoId);
    expect(result).toEqual(mockPlaylist);
  });
});
