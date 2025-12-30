// electron/handlers/favorites.ts

import { ipcMain } from 'electron';
// ▼▼▼ 修正: FavoriteService をインポート ▼▼▼
import { FavoriteService } from '../core/services/favorite-service';

export const handleFavorites = () => {
  // ▼▼▼ 修正: FavoriteService をインスタンス化 ▼▼▼
  const service = new FavoriteService();

  ipcMain.handle('get-favorites', async () => {
    return service.getFavorites();
  });

  ipcMain.handle('get-favorite-videos', async () => {
    return service.getFavoriteVideos();
  });

  ipcMain.handle('toggle-favorite', async (_event, filePath: string) => {
    return service.toggleFavorite(filePath);
  });
};
