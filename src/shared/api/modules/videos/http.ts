// src/shared/api/modules/videos/http.ts

import { HttpBase } from '../../base/http-base';
import { VideosApi } from '../../types';
import { VideoFile } from '@/shared/types/video';
import { SearchOptions, MoveResponse } from '@/shared/types/electron';
import { logger } from '@/shared/lib/logger';

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
    return;
  }

  async updateMetadata(
    _videoId: string,
    _duration: number,
    _width: number,
    _height: number
  ): Promise<void> {
    return;
  }

  async delete(_id: string): Promise<boolean> {
    logger.warn('Delete operation is disabled on mobile client.');
    return false;
  }

  async rename(_id: string, _newFileName: string): Promise<VideoFile | null> {
    logger.warn('Rename operation is disabled on mobile client.');
    return null;
  }

  async move(_videoPaths: string[], _targetFolderPath: string): Promise<MoveResponse> {
    logger.warn('Move operation is disabled on mobile client.');
    return { successCount: 0, results: [] };
  }

  async download(_url: string, _targetFolderPath: string): Promise<VideoFile | null> {
    return null;
  }

  async normalize(_path: string): Promise<VideoFile | null> {
    return null;
  }
}
