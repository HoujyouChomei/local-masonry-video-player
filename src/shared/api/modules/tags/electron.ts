// src/shared/api/modules/tags/electron.ts

import { ElectronBase } from '../../base/electron-base';
import { TagsApi } from '../../types';
import { Tag } from '@/shared/types/electron';
import { VideoFile } from '@/shared/types/video';

export class ElectronTags extends ElectronBase implements TagsApi {
  create(name: string): Promise<Tag | null> {
    return this.invoke((e) => e.createTag(name), null);
  }

  getActive(): Promise<Tag[]> {
    return this.invoke((e) => e.getTagsActive(), []);
  }

  getByFolder(folderPath: string): Promise<Tag[]> {
    return this.invoke((e) => e.getTagsByFolder(folderPath), []);
  }

  getAll(): Promise<Tag[]> {
    return this.invoke((e) => e.getTagsAll(), []);
  }

  getByVideo(videoId: string): Promise<Tag[]> {
    return this.invoke((e) => e.getVideoTags(videoId), []);
  }

  assign(videoId: string, tagId: string): Promise<Tag[]> {
    return this.invoke((e) => e.assignTag(videoId, tagId), []);
  }

  unassign(videoId: string, tagId: string): Promise<Tag[]> {
    return this.invoke((e) => e.unassignTag(videoId, tagId), []);
  }

  getVideos(tagIds: string[]): Promise<VideoFile[]> {
    return this.invoke((e) => e.getVideosByTag(tagIds), []);
  }

  assignToVideos(videoIds: string[], tagId: string): Promise<void> {
    return this.invoke((e) => e.assignTagToVideos(videoIds, tagId), undefined);
  }

  unassignFromVideos(videoIds: string[], tagId: string): Promise<void> {
    return this.invoke((e) => e.unassignTagFromVideos(videoIds, tagId), undefined);
  }
}
