// electron/core/services/favorite-service.ts

import { VideoRepository } from '../repositories/video-repository';
import { VideoService } from './video-service';
import { VideoMapper } from './video-mapper';
import { FileIntegrityService } from './file-integrity-service';
import { VideoFile } from '../../../src/shared/types/video';
import { BrowserWindow } from 'electron';

export class FavoriteService {
  private videoRepo = new VideoRepository();
  private videoService = new VideoService();
  private mapper = new VideoMapper();
  private integrityService = new FileIntegrityService();

  async getFavorites(): Promise<string[]> {
    return this.videoRepo.getFavoritePaths();
  }

  async getFavoriteVideos(): Promise<VideoFile[]> {
    let rows = this.videoRepo.getFavorites();
    const paths = rows.map((r) => r.path);

    const hasChanges = await this.integrityService.verifyAndRecover(paths);

    if (hasChanges) {
      rows = this.videoRepo.getFavorites();
      const mainWindow = BrowserWindow.getAllWindows()[0];
      mainWindow?.webContents.send('on-video-update', { type: 'update', path: '' });
    }

    return this.mapper.toEntities(rows.filter((r) => r.status === 'available'));
  }

  async toggleFavorite(videoPath: string): Promise<string[]> {
    // ▼▼▼ 変更: await を追加 ▼▼▼
    await this.videoService.ensureVideoExists(videoPath);
    this.videoRepo.toggleFavorite(videoPath);
    return this.videoRepo.getFavoritePaths();
  }
}
