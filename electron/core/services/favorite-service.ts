// electron/core/services/favorite-service.ts

import { VideoRepository } from '../repositories/video-repository';
import { VideoMapper } from './video-mapper';
import { FileIntegrityService } from './file-integrity-service';
import { VideoFile } from '../../../src/shared/types/video';
import { NotificationService } from './notification-service';

export class FavoriteService {
  private videoRepo = new VideoRepository();
  private mapper = new VideoMapper();
  private integrityService = new FileIntegrityService();
  private notifier = NotificationService.getInstance();

  async getFavorites(): Promise<string[]> {
    return this.videoRepo.getFavoriteIds();
  }

  async getFavoriteVideos(): Promise<VideoFile[]> {
    let rows = this.videoRepo.getFavorites();
    const paths = rows.map((r) => r.path);

    const hasChanges = await this.integrityService.verifyAndRecover(paths);

    if (hasChanges) {
      rows = this.videoRepo.getFavorites();

      const event = { type: 'update' as const, path: '' };
      this.notifier.notify(event);
    }

    return this.mapper.toEntities(rows.filter((r) => r.status === 'available'));
  }

  async toggleFavorite(videoId: string): Promise<string[]> {
    this.videoRepo.toggleFavoriteById(videoId);

    const row = this.videoRepo.findById(videoId);
    if (row) {
      const event = { type: 'update' as const, path: row.path };
      this.notifier.notify(event);
    }

    return this.videoRepo.getFavoriteIds();
  }
}
