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

const videoRepoMocks = vi.hoisted(() => ({
  findById: vi.fn(), // addVideoでの存在確認用
}));

// 2. Electron
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

// 4. Video Repository Mock (for ID check)
vi.mock('../core/repositories/video-repository', () => {
  return {
    VideoRepository: class {
      findById = videoRepoMocks.findById;
    },
  };
});

// 5. Service Mock (VideoService is no longer used for addVideo path check)
vi.mock('../core/services/video-service', () => {
  return {
    VideoService: class {},
  };
});

// 6. Local Server
vi.mock('../lib/local-server', () => ({
  getServerPort: () => 3000,
}));

// 7. fs
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

    // ID存在確認 (findById)
    videoRepoMocks.findById.mockReturnValue({ id: videoId, path: '/v1.mp4' });
    playlistMocks.getById.mockReturnValue(mockPlaylist);

    const result = await invoke('add-video-to-playlist', 'pl-1', videoId);

    expect(videoRepoMocks.findById).toHaveBeenCalledWith(videoId);
    expect(playlistMocks.addVideo).toHaveBeenCalledWith('pl-1', videoId);
    expect(result).toEqual(mockPlaylist);
  });
});