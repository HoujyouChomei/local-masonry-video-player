// electron/handlers/dialog.ts

import { ipcMain, BrowserWindow } from 'electron';
import { UIService } from '../core/services/ui-service';

export const handleDialog = () => {
  const uiService = new UIService();

  ipcMain.handle('select-folder', async () => {
    const mainWindow = BrowserWindow.getFocusedWindow();
    if (!mainWindow) return null;

    return uiService.selectFolder(mainWindow);
  });
};