// electron/handlers/collection/favorite-handler.ts

import { ipcMain } from 'electron';
import { FavoriteService } from '../../core/services/collection/favorite-service';

export const handleFavorites = () => {
  const service = new FavoriteService();

  ipcMain.handle('get-favorites', async () => {
    return service.getFavorites();
  });

  ipcMain.handle('get-favorite-videos', async () => {
    return service.getFavoriteVideos();
  });

  ipcMain.handle('toggle-favorite', async (_event, videoId: string) => {
    return service.toggleFavorite(videoId);
  });
};
