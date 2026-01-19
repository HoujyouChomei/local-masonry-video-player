// electron/handlers/media/ops-handler.ts

import { ipcMain, shell } from 'electron';
import { VideoService } from '../../core/services/media/media-service';
import { DownloadService } from '../../core/services/file/download-service';
import { VideoLibraryService } from '../../core/services/media/library-service';
import { MediaRepository } from '../../core/repositories/media/media-repository';
import { VideoMapper } from '../../core/services/media/media-mapper';

export const handleFileOps = () => {
  const videoService = new VideoService();
  const downloadService = new DownloadService();
  const libraryService = new VideoLibraryService();
  const mediaRepo = new MediaRepository();
  const mapper = new VideoMapper();

  ipcMain.handle('delete-video', async (_event, id: string) => {
    return videoService.deleteVideo(id);
  });

  ipcMain.handle('rename-video', async (_event, id: string, newFileName: string) => {
    return videoService.renameVideo(id, newFileName);
  });

  ipcMain.handle('move-videos', async (_event, videoPaths: string[], targetFolderPath: string) => {
    return libraryService.moveVideos(videoPaths, targetFolderPath);
  });

  ipcMain.handle('download-video', async (_event, url: string, targetFolderPath: string) => {
    return downloadService.download(url, targetFolderPath);
  });

  ipcMain.handle('normalize-video', async (_event, filePath: string) => {
    return libraryService.normalizeVideo(filePath);
  });

  ipcMain.handle('reveal-in-explorer', (_event, videoId: string) => {
    return videoService.revealInExplorer(videoId);
  });

  ipcMain.handle('open-path', async (_event, filePath: string) => {
    const error = await shell.openPath(filePath);
    if (error) {
      console.error(`Failed to open path: ${filePath}`, error);
    }
  });

  ipcMain.handle(
    'update-video-metadata',
    async (_event, videoId: string, duration: number, width: number, height: number) => {
      await videoService.updateMetadata(videoId, duration, width, height);
    }
  );

  ipcMain.handle('get-video-details', async (_event, filePath: string) => {
    const row = mediaRepo.findByPath(filePath);
    return row ? mapper.toEntity(row) : null;
  });
};
