// src/shared/api/modules/favorites/http.ts

import { HttpBase } from '../../base/http-base';
import { FavoritesApi } from '../../types';
import { VideoFile } from '@/shared/types/video';

export class HttpFavorites extends HttpBase implements FavoritesApi {
  async getAll(): Promise<string[]> {
    return this.request<string[]>('/favorites');
  }

  async getVideos(): Promise<VideoFile[]> {
    const videos = await this.request<VideoFile[]>('/videos', {
      params: { favorite: true },
    });
    return videos.map((v) => this.adaptVideo(v));
  }

  async toggle(videoId: string): Promise<string[]> {
    return this.request<string[]>('/favorites/toggle', {
      method: 'POST',
      body: { videoId },
    });
  }
}
