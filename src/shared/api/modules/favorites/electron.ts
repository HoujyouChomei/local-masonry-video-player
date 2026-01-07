// src/shared/api/modules/favorites/electron.ts

import { ElectronBase } from '../../base/electron-base';
import { FavoritesApi } from '../../types';
import { VideoFile } from '@/shared/types/video';

export class ElectronFavorites extends ElectronBase implements FavoritesApi {
  getAll(): Promise<string[]> {
    return this.invoke((e) => e.getFavorites(), []);
  }

  getVideos(): Promise<VideoFile[]> {
    return this.invoke((e) => e.getFavoriteVideos(), []);
  }

  toggle(videoId: string): Promise<string[]> {
    return this.invoke((e) => e.toggleFavorite(videoId), []);
  }
}
