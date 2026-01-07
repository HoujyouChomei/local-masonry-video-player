// src/shared/api/modules/tags/http.ts

import { HttpBase } from '../../base/http-base';
import { TagsApi } from '../../types';
import { Tag } from '@/shared/types/electron';
import { VideoFile } from '@/shared/types/video';

export class HttpTags extends HttpBase implements TagsApi {
  async create(name: string): Promise<Tag | null> {
    return this.request<Tag>('/tags', {
      method: 'POST',
      body: { name },
    });
  }

  async getActive(): Promise<Tag[]> {
    return this.request<Tag[]>('/tags/active');
  }

  async getByFolder(folderPath: string): Promise<Tag[]> {
    return this.request<Tag[]>('/tags/folder', {
      params: { path: folderPath },
    });
  }

  async getAll(): Promise<Tag[]> {
    return this.request<Tag[]>('/tags/all');
  }

  async getByVideo(videoId: string): Promise<Tag[]> {
    return this.request<Tag[]>('/tags/video', {
      params: { videoId },
    });
  }

  async assign(videoId: string, tagId: string): Promise<Tag[]> {
    return this.request<Tag[]>('/tags/assign', {
      method: 'POST',
      body: { videoId, tagId },
    });
  }

  async unassign(videoId: string, tagId: string): Promise<Tag[]> {
    return this.request<Tag[]>('/tags/unassign', {
      method: 'POST',
      body: { videoId, tagId },
    });
  }

  async getVideos(tagIds: string[]): Promise<VideoFile[]> {
    const videos = await this.request<VideoFile[]>('/tags/videos', {
      params: { tags: tagIds },
    });
    return videos.map((v) => this.adaptVideo(v));
  }

  async assignToVideos(videoIds: string[], tagId: string): Promise<void> {
    await this.request('/tags/assign-batch', {
      method: 'POST',
      body: { videoIds, tagId },
    });
  }

  async unassignFromVideos(videoIds: string[], tagId: string): Promise<void> {
    await this.request('/tags/unassign-batch', {
      method: 'POST',
      body: { videoIds, tagId },
    });
  }
}
