// src/shared/api/modules/videos/http.ts

import { HttpBase } from '../../base/http-base';
import { VideosApi } from '../../types';
import { VideoFile } from '@/shared/types/video';
import { SearchOptions } from '@/shared/types/electron';

export class HttpVideos extends HttpBase implements VideosApi {
  async getAll(folderPath: string): Promise<VideoFile[]> {
    const videos = await this.request<VideoFile[]>('/videos', {
      params: { folder: folderPath },
    });
    return videos.map((v) => this.adaptVideo(v));
  }

  async search(query: string, tagIds: string[], options: SearchOptions): Promise<VideoFile[]> {
    const videos = await this.request<VideoFile[]>('/videos', {
      params: {
        q: query,
        tags: tagIds,
        playlistId: options.playlistId,
        favorite: options.isFavorite,
        folder: options.folderPath,
      },
    });
    return videos.map((v) => this.adaptVideo(v));
  }

  async getDetails(path: string): Promise<VideoFile | null> {
    try {
      const video = await this.request<VideoFile | null>('/videos/details', {
        params: { path },
      });
      return video ? this.adaptVideo(video) : null;
    } catch {
      return null;
    }
  }

  async harvestMetadata(_videoId: string): Promise<void> {
    // モバイルからのメタデータ解析要求は非対応
    return;
  }

  async updateMetadata(
    _videoId: string,
    _duration: number,
    _width: number,
    _height: number
  ): Promise<void> {
    // モバイルからのメタデータ更新は非対応
    return;
  }

  async delete(_id: string): Promise<boolean> {
    console.warn('Delete operation is disabled on mobile client.');
    return false;
  }

  async rename(_id: string, _newFileName: string): Promise<VideoFile | null> {
    console.warn('Rename operation is disabled on mobile client.');
    return null;
  }

  async move(_videoPaths: string[], _targetFolderPath: string): Promise<number> {
    console.warn('Move operation is disabled on mobile client.');
    return 0;
  }

  async download(_url: string, _targetFolderPath: string): Promise<VideoFile | null> {
    return null;
  }

  async normalize(_path: string): Promise<VideoFile | null> {
    return null;
  }
}
