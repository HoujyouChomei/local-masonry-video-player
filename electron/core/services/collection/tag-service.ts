// electron/core/services/collection/tag-service.ts

import { TagRepository, TagRow } from '../../repositories/collection/tag-repository';
import { MediaRepository } from '../../repositories/media/media-repository';
import { MediaMapper } from '../media/media-mapper';
import { Media } from '../../../../src/shared/schemas/media';
import { eventBus } from '../../events';

export class TagService {
  private tagRepo = new TagRepository();
  private mediaRepo = new MediaRepository();
  private mapper = new MediaMapper();

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

  getMediaTags(mediaId: string): TagRow[] {
    return this.tagRepo.getTagsByMediaId(mediaId);
  }

  assignTag(mediaId: string, tagId: string): TagRow[] {
    this.tagRepo.assignTag(mediaId, tagId);

    const media = this.mediaRepo.findById(mediaId);
    if (media) {
      eventBus.emit('media:updated', { id: media.id, path: media.path });
    }

    return this.tagRepo.getTagsByMediaId(mediaId);
  }

  unassignTag(mediaId: string, tagId: string): TagRow[] {
    this.tagRepo.unassignTag(mediaId, tagId);

    const media = this.mediaRepo.findById(mediaId);
    if (media) {
      eventBus.emit('media:updated', { id: media.id, path: media.path });
    }

    return this.tagRepo.getTagsByMediaId(mediaId);
  }

  getMediaByTag(tagIds: string[]): Media[] {
    const rows = this.mediaRepo.findManyByTagIds(tagIds);
    return this.mapper.toEntities(rows);
  }

  assignTagToMedia(mediaIds: string[], tagId: string): void {
    this.tagRepo.assignTagToMedia(mediaIds, tagId);
    eventBus.emit('ui:library-refresh', { force: false });
  }

  unassignTagFromMedia(mediaIds: string[], tagId: string): void {
    this.tagRepo.unassignTagFromMedia(mediaIds, tagId);
    eventBus.emit('ui:library-refresh', { force: false });
  }
}
