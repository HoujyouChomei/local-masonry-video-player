// electron/handlers/playlists.test.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handlePlaylists } from './playlists';

// 1. Hoisted Mocks
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

const videoServiceMocks = vi.hoisted(() => ({
  ensureVideoExists: vi.fn(),
}));

// 2. Electron (修正)
const ipcHandlers = new Map<string, (...args: any[]) => any>();
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel, listener) => {
      ipcHandlers.set(channel, listener);
    }),
  },
  // ▼▼▼ 追加 ▼▼▼
  app: {
    getPath: vi.fn().mockReturnValue('/mock/user/data'),
  },
}));

// 3. Repository Mock
vi.mock('../core/repositories/playlist-repository', () => {
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

// 4. Service Mock
vi.mock('../core/services/video-service', () => {
  return {
    VideoService: class {
      ensureVideoExists = videoServiceMocks.ensureVideoExists;
    },
  };
});

// 5. Local Server
vi.mock('../lib/local-server', () => ({
  getServerPort: () => 3000,
}));

// 6. fs (Sync) for ThumbnailService
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

  it('should add video to playlist', async () => {
    const mockPlaylist = { id: 'pl-1', name: 'List', videoPaths: ['/v1.mp4'] };

    videoServiceMocks.ensureVideoExists.mockReturnValue('vid-1');
    playlistMocks.getById.mockReturnValue(mockPlaylist);

    const result = await invoke('add-video-to-playlist', 'pl-1', '/v1.mp4');

    expect(videoServiceMocks.ensureVideoExists).toHaveBeenCalledWith('/v1.mp4');
    expect(playlistMocks.addVideo).toHaveBeenCalledWith('pl-1', 'vid-1');
    expect(result).toEqual(mockPlaylist);
  });
});
