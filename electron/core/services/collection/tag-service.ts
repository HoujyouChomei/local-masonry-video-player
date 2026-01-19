// electron/core/services/collection/tag-service.ts

import { TagRepository, TagRow } from '../../repositories/collection/tag-repository';
import { MediaRepository } from '../../repositories/media/media-repository';
import { VideoMapper } from '../media/media-mapper';
import { VideoFile } from '../../../../src/shared/types/video';
import { eventBus } from '../../events';

export class TagService {
  private tagRepo = new TagRepository();
  private mediaRepo = new MediaRepository();
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

    const video = this.mediaRepo.findById(videoId);
    if (video) {
      eventBus.emit('video:updated', { id: video.id, path: video.path });
    }

    return this.tagRepo.getTagsByVideoId(videoId);
  }

  unassignTag(videoId: string, tagId: string): TagRow[] {
    this.tagRepo.unassignTag(videoId, tagId);

    const video = this.mediaRepo.findById(videoId);
    if (video) {
      eventBus.emit('video:updated', { id: video.id, path: video.path });
    }

    return this.tagRepo.getTagsByVideoId(videoId);
  }

  getVideosByTag(tagIds: string[]): VideoFile[] {
    const rows = this.mediaRepo.findManyByTagIds(tagIds);
    return this.mapper.toEntities(rows);
  }

  assignTagToVideos(videoIds: string[], tagId: string): void {
    this.tagRepo.assignTagToVideos(videoIds, tagId);
    eventBus.emit('ui:library-refresh', { force: false });
  }

  unassignTagFromVideos(videoIds: string[], tagId: string): void {
    this.tagRepo.unassignTagFromVideos(videoIds, tagId);
    eventBus.emit('ui:library-refresh', { force: false });
  }
}
