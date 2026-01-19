// electron/core/services/collection/favorite-service.ts

import { MediaRepository } from '../../repositories/media/media-repository';
import { VideoMapper } from '../media/media-mapper';
import { FileIntegrityService } from '../file/file-integrity-service';
import { VideoFile } from '../../../../src/shared/types/video';
import { eventBus } from '../../events';

export class FavoriteService {
  private mediaRepo = new MediaRepository();
  private mapper = new VideoMapper();
  private integrityService = new FileIntegrityService();

  async getFavorites(): Promise<string[]> {
    return this.mediaRepo.getFavoriteIds();
  }

  async getFavoriteVideos(): Promise<VideoFile[]> {
    let rows = this.mediaRepo.getFavorites();
    const paths = rows.map((r) => r.path);

    const hasChanges = await this.integrityService.verifyAndRecover(paths);

    if (hasChanges) {
      rows = this.mediaRepo.getFavorites();
      eventBus.emit('ui:library-refresh', { force: false });
    }

    return this.mapper.toEntities(rows.filter((r) => r.status === 'available'));
  }

  async toggleFavorite(videoId: string): Promise<string[]> {
    this.mediaRepo.toggleFavoriteById(videoId);

    const row = this.mediaRepo.findById(videoId);
    if (row) {
      eventBus.emit('video:updated', { id: row.id, path: row.path });
    }

    return this.mediaRepo.getFavoriteIds();
  }
}
