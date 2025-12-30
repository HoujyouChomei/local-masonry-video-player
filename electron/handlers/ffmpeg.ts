// electron/handlers/ffmpeg.ts

import { ipcMain, dialog, BrowserWindow } from 'electron';
import { FFmpegService } from '../core/services/ffmpeg-service';

export const handleFFmpeg = () => {
  const service = new FFmpegService();

  // ファイル選択ダイアログ
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

  // FFmpegパス検証 (厳格モード)
  ipcMain.handle('validate-ffmpeg-path', async (_event, path: string) => {
    // 拡張子チェックなどを入れたいところですが、リネームされている可能性もあるため
    // 実際に叩いて出力を確認するのが最も確実です。
    return service.validatePath(path, 'ffmpeg');
  });

  // FFprobeパス検証 (厳格モード)
  ipcMain.handle('validate-ffprobe-path', async (_event, path: string) => {
    return service.validatePath(path, 'ffprobe');
  });
};
