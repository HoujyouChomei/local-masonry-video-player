// electron/handlers/media/transcode-handler.ts

import { ipcMain, dialog, BrowserWindow } from 'electron';
import { FFmpegService } from '../../core/services/video/ffmpeg-service';

export const handleFFmpeg = () => {
  const service = new FFmpegService();

  ipcMain.handle('select-file', async () => {
    const mainWindow = BrowserWindow.getFocusedWindow();
    if (!mainWindow) return null;

    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Executables', extensions: ['exe', ''] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (canceled || filePaths.length === 0) {
      return null;
    }

    return filePaths[0];
  });

  ipcMain.handle('validate-ffmpeg-path', async (_event, path: string) => {
    return service.validatePath(path, 'ffmpeg');
  });

  ipcMain.handle('validate-ffprobe-path', async (_event, path: string) => {
    return service.validatePath(path, 'ffprobe');
  });
};
