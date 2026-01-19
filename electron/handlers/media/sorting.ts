// electron/handlers/media/sorting.ts

import { ipcMain } from 'electron';
import { VideoLibraryService } from '../../core/services/media/library-service';
import { logger } from '../../lib/logger';

export const handleSorting = () => {
  const service = new VideoLibraryService();

  ipcMain.handle('save-folder-order', (_event, folderPath: string, videoPaths: string[]) => {
    try {
      service.saveFolderOrder(folderPath, videoPaths);
    } catch (error) {
      logger.error(`Failed to save folder order: ${folderPath}`, error);
      throw error;
    }
  });

  ipcMain.handle('get-folder-order', (_event, folderPath: string) => {
    try {
      return service.getFolderOrder(folderPath);
    } catch (error) {
      logger.error(`Failed to get folder order: ${folderPath}`, error);
      return [];
    }
  });
};
