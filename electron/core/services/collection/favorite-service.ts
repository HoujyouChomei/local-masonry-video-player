// electron/core/services/collection/favorite-service.ts

import { MediaRepository } from '../../repositories/media/media-repository';
import { MediaMapper } from '../media/media-mapper';
import { FileIntegrityService } from '../file/file-integrity-service';
import { Media } from '../../../../src/shared/schemas/media';
import { eventBus } from '../../events';

export class FavoriteService {
  private mediaRepo = new MediaRepository();
  private mapper = new MediaMapper();
  private integrityService = new FileIntegrityService();

  async getFavorites(): Promise<string[]> {
    return this.mediaRepo.getFavoriteIds();
  }

  async getFavoriteMedia(): Promise<Media[]> {
    let rows = this.mediaRepo.getFavorites();
    const paths = rows.map((r) => r.path);

    const hasChanges = await this.integrityService.verifyAndRecover(paths);

    if (hasChanges) {
      rows = this.mediaRepo.getFavorites();
      eventBus.emit('ui:library-refresh', { force: false });
    }

    return this.mapper.toEntities(rows.filter((r) => r.status === 'available'));
  }

  async toggleFavorite(mediaId: string): Promise<string[]> {
    this.mediaRepo.toggleFavoriteById(mediaId);

    const row = this.mediaRepo.findById(mediaId);
    if (row) {
      eventBus.emit('media:updated', { id: row.id, path: row.path });
    }

    return this.mediaRepo.getFavoriteIds();
  }
}
