// electron/core/services/tag-service.ts

import { TagRepository, TagRow } from '../repositories/tag-repository';
import { VideoRepository } from '../repositories/video-repository';
import { VideoMapper } from './video-mapper';
import { VideoFile } from '../../../src/shared/types/video';

export class TagService {
  private tagRepo = new TagRepository();
  private videoRepo = new VideoRepository();
  private mapper = new VideoMapper();

  createTag(name: string): TagRow {
    return this.tagRepo.createOrGet(name);
  }

  getAllActiveTags(): TagRow[] {
    return this.tagRepo.getAllActive();
  }

  getTagsByFolder(folderPath: string): TagRow[] {
    return this.tagRepo.getTagsByFolderPath(folderPath);
  }

  getAllTags(): TagRow[] {
    return this.tagRepo.getAll();
  }

  getVideoTags(videoId: string): TagRow[] {
    return this.tagRepo.getTagsByVideoId(videoId);
  }

  assignTag(videoId: string, tagId: string): TagRow[] {
    this.tagRepo.assignTag(videoId, tagId);
    return this.tagRepo.getTagsByVideoId(videoId);
  }

  unassignTag(videoId: string, tagId: string): TagRow[] {
    this.tagRepo.unassignTag(videoId, tagId);
    return this.tagRepo.getTagsByVideoId(videoId);
  }

  getVideosByTag(tagIds: string[]): VideoFile[] {
    const rows = this.videoRepo.findManyByTagIds(tagIds);
    return this.mapper.toEntities(rows);
  }

  assignTagToVideos(videoIds: string[], tagId: string): void {
    this.tagRepo.assignTagToVideos(videoIds, tagId);
  }

  unassignTagFromVideos(videoIds: string[], tagId: string): void {
    this.tagRepo.unassignTagFromVideos(videoIds, tagId);
  }
}