// src/shared/api/clients/http-client.ts

import { ApiClient } from '../types';
import { VideoFile } from '@/shared/types/video';
import {
  AppSettings,
  DirectoryEntry,
  Tag,
  VideoUpdateEvent,
  SearchOptions,
  ConnectionInfo,
} from '@/shared/types/electron';
import { Playlist } from '@/shared/types/playlist';

export class HttpClient implements ApiClient {
  private token: string | null = null;

  constructor() {
    this.initToken();
  }

  private initToken() {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');

    if (tokenFromUrl) {
      this.token = tokenFromUrl;
      localStorage.setItem('lvm_auth_token', tokenFromUrl);

      urlParams.delete('token');
      const newUrl =
        window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
      window.history.replaceState({}, '', newUrl);
    } else {
      this.token = localStorage.getItem('lvm_auth_token');
    }
  }

  private async fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    // POST/PUTの場合はContent-Typeを設定
    if (options.method === 'POST' || options.method === 'PUT') {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
    }

    const res = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401 || res.status === 403) {
      console.error('Authentication failed. Please scan the QR code again.');
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  private adaptVideo(video: VideoFile): VideoFile {
    let thumb = video.thumbnailSrc;
    if (typeof window !== 'undefined') {
      const currentHost = window.location.hostname;
      const currentPort = window.location.port;

      try {
        const url = new URL(video.thumbnailSrc);
        url.hostname = currentHost;
        url.port = currentPort;
        if (this.token) {
          url.searchParams.set('token', this.token);
        }
        thumb = url.toString();
      } catch {
        thumb = thumb.replace('127.0.0.1', currentHost);
      }
    }

    const streamUrlPath = `/video?path=${encodeURIComponent(video.path)}`;
    const streamUrl = this.token ? `${streamUrlPath}&token=${this.token}` : streamUrlPath;

    return {
      ...video,
      thumbnailSrc: thumb,
      src: streamUrl,
    };
  }

  videos = {
    getAll: async (folderPath: string): Promise<VideoFile[]> => {
      const params = new URLSearchParams();
      if (folderPath) params.set('folder', folderPath);
      const videos = await this.fetchJson<VideoFile[]>(`/videos?${params.toString()}`);
      return videos.map((v) => this.adaptVideo(v));
    },

    search: async (
      query: string,
      tagIds: string[],
      options: SearchOptions
    ): Promise<VideoFile[]> => {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      tagIds.forEach((id) => params.append('tags', id));
      if (options.playlistId) params.set('playlistId', options.playlistId);
      if (options.isFavorite) params.set('favorite', 'true');
      if (options.folderPath) params.set('folder', options.folderPath);

      const videos = await this.fetchJson<VideoFile[]>(`/videos?${params.toString()}`);
      return videos.map((v) => this.adaptVideo(v));
    },

    getDetails: async (path: string): Promise<VideoFile | null> => {
      const params = new URLSearchParams();
      params.set('path', path);
      try {
        const video = await this.fetchJson<VideoFile | null>(
          `/videos/details?${params.toString()}`
        );
        return video ? this.adaptVideo(video) : null;
      } catch {
        return null;
      }
    },

    harvestMetadata: async (_videoId: string): Promise<void> => {
      // モバイルからのメタデータ解析要求は非対応（サーバー負荷考慮）
      return;
    },

    updateMetadata: async (_videoId: string, _d: number, _w: number, _h: number): Promise<void> => {
      // 再生位置などのメタデータ更新も現状はスキップ
      return;
    },

    // --- Dangerous Operations (Disabled on Mobile) ---
    delete: async (_id: string): Promise<boolean> => {
      console.warn('Delete operation is disabled on mobile client.');
      return false;
    },

    rename: async (_id: string, _newFileName: string): Promise<VideoFile | null> => {
      console.warn('Rename operation is disabled on mobile client.');
      return null;
    },

    move: async (_paths: string[], _target: string): Promise<number> => {
      console.warn('Move operation is disabled on mobile client.');
      return 0;
    },

    download: async (_url: string, _target: string): Promise<VideoFile | null> => {
      return null;
    },

    normalize: async (_path: string): Promise<VideoFile | null> => {
      return null;
    },
  };

  playlists = {
    getAll: async (): Promise<Playlist[]> => {
      return this.fetchJson<Playlist[]>('/playlists');
    },

    create: async (name: string): Promise<Playlist | null> => {
      return this.fetchJson<Playlist>('/playlists', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
    },

    delete: async (id: string): Promise<Playlist[]> => {
      return this.fetchJson<Playlist[]>(`/playlists?id=${id}`, {
        method: 'DELETE',
      });
    },

    updateMeta: async (id: string, name: string): Promise<Playlist | null> => {
      return this.fetchJson<Playlist>('/playlists', {
        method: 'PUT',
        body: JSON.stringify({ id, name }),
      });
    },

    addVideo: async (playlistId: string, videoId: string): Promise<Playlist | null> => {
      return this.fetchJson<Playlist>('/playlists/add', {
        method: 'POST',
        body: JSON.stringify({ playlistId, videoId }),
      });
    },

    removeVideo: async (playlistId: string, videoId: string): Promise<Playlist | null> => {
      return this.fetchJson<Playlist>('/playlists/remove', {
        method: 'POST',
        body: JSON.stringify({ playlistId, videoId }),
      });
    },

    reorder: async (playlistId: string, videoIds: string[]): Promise<Playlist | null> => {
      return this.fetchJson<Playlist>('/playlists/reorder', {
        method: 'POST',
        body: JSON.stringify({ playlistId, videoIds }),
      });
    },

    getVideos: async (playlistId: string): Promise<VideoFile[]> => {
      const params = new URLSearchParams();
      params.set('playlistId', playlistId);
      const videos = await this.fetchJson<VideoFile[]>(`/videos?${params.toString()}`);
      return videos.map((v) => this.adaptVideo(v));
    },
  };

  tags = {
    create: async (name: string): Promise<Tag | null> => {
      return this.fetchJson<Tag>('/tags', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
    },

    getActive: async (): Promise<Tag[]> => {
      return this.fetchJson<Tag[]>('/tags/active');
    },

    getByFolder: async (folderPath: string): Promise<Tag[]> => {
      const params = new URLSearchParams();
      params.set('path', folderPath);
      return this.fetchJson<Tag[]>(`/tags/folder?${params.toString()}`);
    },

    getAll: async (): Promise<Tag[]> => {
      return this.fetchJson<Tag[]>('/tags/all');
    },

    getByVideo: async (videoId: string): Promise<Tag[]> => {
      const params = new URLSearchParams();
      params.set('videoId', videoId);
      return this.fetchJson<Tag[]>(`/tags/video?${params.toString()}`);
    },

    assign: async (videoId: string, tagId: string): Promise<Tag[]> => {
      return this.fetchJson<Tag[]>('/tags/assign', {
        method: 'POST',
        body: JSON.stringify({ videoId, tagId }),
      });
    },

    unassign: async (videoId: string, tagId: string): Promise<Tag[]> => {
      return this.fetchJson<Tag[]>('/tags/unassign', {
        method: 'POST',
        body: JSON.stringify({ videoId, tagId }),
      });
    },

    getVideos: async (tagIds: string[]): Promise<VideoFile[]> => {
      const params = new URLSearchParams();
      // api/tags/videos エンドポイントを使用するように変更
      tagIds.forEach((id) => params.append('tags', id));
      const videos = await this.fetchJson<VideoFile[]>(`/tags/videos?${params.toString()}`);
      return videos.map((v) => this.adaptVideo(v));
    },

    assignToVideos: async (videoIds: string[], tagId: string): Promise<void> => {
      await this.fetchJson('/tags/assign-batch', {
        method: 'POST',
        body: JSON.stringify({ videoIds, tagId }),
      });
    },

    unassignFromVideos: async (videoIds: string[], tagId: string): Promise<void> => {
      await this.fetchJson('/tags/unassign-batch', {
        method: 'POST',
        body: JSON.stringify({ videoIds, tagId }),
      });
    },
  };

  favorites = {
    getAll: async (): Promise<string[]> => {
      return this.fetchJson<string[]>('/favorites');
    },

    getVideos: async (): Promise<VideoFile[]> => {
      const params = new URLSearchParams();
      params.set('favorite', 'true');
      const videos = await this.fetchJson<VideoFile[]>(`/videos?${params.toString()}`);
      return videos.map((v) => this.adaptVideo(v));
    },

    toggle: async (videoId: string): Promise<string[]> => {
      return this.fetchJson<string[]>('/favorites/toggle', {
        method: 'POST',
        body: JSON.stringify({ videoId }),
      });
    },
  };

  settings = {
    get: async (): Promise<AppSettings> => {
      return this.fetchJson<AppSettings>('/settings');
    },

    save: async <K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<boolean> => {
      try {
        await this.fetchJson('/settings', {
          method: 'POST',
          body: JSON.stringify({ key, value }),
        });
        return true;
      } catch (error) {
        console.error('Failed to save settings:', error);
        return false;
      }
    },

    resetAccessToken: async (): Promise<string> => {
      console.warn('resetAccessToken is not available on mobile client.');
      return '';
    },
  };

  system = {
    selectFolder: async (): Promise<string | null> => null,
    selectFile: async (): Promise<string | null> => null,
    validateFFmpeg: async (_path: string): Promise<boolean> => false,
    validateFFprobe: async (_path: string): Promise<boolean> => false,
    relaunchApp: async (): Promise<void> => {},

    setFullScreen: async (enable: boolean): Promise<void> => {
      if (typeof document === 'undefined') return;

      try {
        if (enable) {
          if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
          }
        } else {
          if (document.fullscreenElement) {
            await document.exitFullscreen();
          }
        }
      } catch (e) {
        console.warn('Fullscreen toggle failed:', e);
      }
    },

    revealInExplorer: async (_videoId: string): Promise<void> => {},
    openPath: async (_filePath: string): Promise<void> => {},

    getSubdirectories: async (dirPath: string): Promise<DirectoryEntry[]> => {
      const params = new URLSearchParams();
      params.set('path', dirPath);
      try {
        return await this.fetchJson<DirectoryEntry[]>(`/directories?${params.toString()}`);
      } catch (error) {
        console.error('Failed to fetch subdirectories:', error);
        return [];
      }
    },

    getDirectoryTree: async (dirPath: string): Promise<string[]> => {
      const params = new URLSearchParams();
      params.set('path', dirPath);
      try {
        return await this.fetchJson<string[]>(`/directories/tree?${params.toString()}`);
      } catch (error) {
        console.error('Failed to fetch directory tree:', error);
        return [];
      }
    },

    getConnectionInfo: async (): Promise<ConnectionInfo | null> => {
      try {
        return await this.fetchJson<ConnectionInfo>('/connection');
      } catch {
        return null;
      }
    },

    startDrag: (_files: string | string[]): void => {},
    getFilePath: (_file: File): string => '',
  };

  sorting = {
    saveFolderOrder: async (_path: string, _videos: string[]): Promise<void> => {},
    getFolderOrder: async (_path: string): Promise<string[]> => [],
  };

  events = {
    onVideoUpdate: (callback: (events: VideoUpdateEvent[]) => void): (() => void) => {
      if (typeof EventSource === 'undefined') return () => {};

      const sseUrl = this.token ? `/api/events?token=${this.token}` : `/api/events`;
      const evtSource = new EventSource(sseUrl);

      evtSource.onmessage = (e) => {
        if (e.data.startsWith(':')) return;
        try {
          // SSEからは配列が送られてくる前提だが、念のため正規化
          const parsed = JSON.parse(e.data);
          const events = Array.isArray(parsed) ? parsed : [parsed];
          callback(events as VideoUpdateEvent[]);
        } catch (err) {
          console.error('Failed to parse SSE event:', err);
        }
      };

      evtSource.onerror = (err) => {
        console.error('SSE Error:', err);
      };

      return () => {
        evtSource.close();
      };
    },
  };
}
