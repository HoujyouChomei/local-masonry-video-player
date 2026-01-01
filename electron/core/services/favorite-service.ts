// electron/core/services/favorite-service.ts

import { VideoRepository } from '../repositories/video-repository';
import { VideoMapper } from './video-mapper';
import { FileIntegrityService } from './file-integrity-service';
import { VideoFile } from '../../../src/shared/types/video';
import { BrowserWindow } from 'electron';

export class FavoriteService {
  private videoRepo = new VideoRepository();
  private mapper = new VideoMapper();
  private integrityService = new FileIntegrityService();

  // ▼▼▼ 変更: string[] (ID list) を返すように変更 ▼▼▼
  async getFavorites(): Promise<string[]> {
    return this.videoRepo.getFavoriteIds();
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

  // ▼▼▼ 変更: videoIdを受け取り、IDリストを返すように変更 ▼▼▼
  async toggleFavorite(videoId: string): Promise<string[]> {
    // 既にIDが渡されているため、ensureVideoExists（パスからの自動登録）は不要と判断
    // IDが存在するかどうかのチェックはRepoレベルで行われる
    this.videoRepo.toggleFavoriteById(videoId);
    return this.videoRepo.getFavoriteIds();
  }
}