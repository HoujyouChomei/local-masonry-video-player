// electron/handlers/media/getVideos.ts

import { ipcMain } from 'electron';
import { VideoLibraryService } from '../../core/services/media/library-service';

export const handleGetVideos = () => {
  const libraryService = new VideoLibraryService();

  ipcMain.handle('get-videos', async (_event, folderPath: string) => {
    return libraryService.loadAndWatch(folderPath);
  });
};
