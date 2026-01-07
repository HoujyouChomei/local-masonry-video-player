// src/shared/api/modules/playlists/http.ts

import { HttpBase } from '../../base/http-base';
import { PlaylistsApi } from '../../types';
import { Playlist } from '@/shared/types/playlist';
import { VideoFile } from '@/shared/types/video';

export class HttpPlaylists extends HttpBase implements PlaylistsApi {
  async getAll(): Promise<Playlist[]> {
    return this.request<Playlist[]>('/playlists');
  }

  async create(name: string): Promise<Playlist | null> {
    return this.request<Playlist>('/playlists', {
      method: 'POST',
      body: { name },
    });
  }

  async delete(id: string): Promise<Playlist[]> {
    return this.request<Playlist[]>('/playlists', {
      method: 'DELETE',
      params: { id },
    });
  }

  async updateMeta(id: string, name: string): Promise<Playlist | null> {
    return this.request<Playlist>('/playlists', {
      method: 'PUT',
      body: { id, name },
    });
  }

  async addVideo(playlistId: string, videoId: string): Promise<Playlist | null> {
    return this.request<Playlist>('/playlists/add', {
      method: 'POST',
      body: { playlistId, videoId },
    });
  }

  async removeVideo(playlistId: string, videoId: string): Promise<Playlist | null> {
    return this.request<Playlist>('/playlists/remove', {
      method: 'POST',
      body: { playlistId, videoId },
    });
  }

  async reorder(playlistId: string, newVideoIds: string[]): Promise<Playlist | null> {
    return this.request<Playlist>('/playlists/reorder', {
      method: 'POST',
      body: { playlistId, videoIds: newVideoIds },
    });
  }

  async getVideos(playlistId: string): Promise<VideoFile[]> {
    const videos = await this.request<VideoFile[]>('/videos', {
      params: { playlistId },
    });
    return videos.map((v) => this.adaptVideo(v));
  }
}
