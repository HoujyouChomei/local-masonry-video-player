// electron/handlers/window.ts

import { ipcMain, BrowserWindow } from 'electron';
import { UIService } from '../core/services/ui-service';

export const handleWindowControls = () => {
  // ステート(previousFullScreenState)を保持するため、ここでインスタンス化する
  const uiService = new UIService();

  ipcMain.handle('set-fullscreen', (event, enable: boolean) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;

    uiService.setFullscreen(win, enable);
  });
};