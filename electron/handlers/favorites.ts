// electron/handlers/favorites.ts

import { ipcMain } from 'electron';
import { FavoriteService } from '../core/services/favorite-service';

export const handleFavorites = () => {
  const service = new FavoriteService();

  ipcMain.handle('get-favorites', async () => {
    return service.getFavorites();
  });

  ipcMain.handle('get-favorite-videos', async () => {
    return service.getFavoriteVideos();
  });

  // ▼▼▼ 変更: 引数を videoId に変更 ▼▼▼
  ipcMain.handle('toggle-favorite', async (_event, videoId: string) => {
    return service.toggleFavorite(videoId);
  });
};