// electron/handlers/window.ts

import { ipcMain, BrowserWindow } from 'electron';
import { UIService } from '../core/services/ui-service';
import { WindowState } from '../../src/shared/types/electron';

export const handleWindowControls = () => {
  const uiService = new UIService();

  ipcMain.handle('set-fullscreen', (event, enable: boolean) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;

    uiService.setFullscreen(win, enable);
  });

  ipcMain.handle('window-minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.minimize();
  });

  ipcMain.handle('window-toggle-maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    }
  });

  ipcMain.handle('window-close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.close();
  });

  ipcMain.handle('get-window-state', (event): WindowState => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return { isMaximized: false, isFullScreen: false };
    return {
      isMaximized: win.isMaximized(),
      isFullScreen: win.isFullScreen(),
    };
  });
};

export const registerWindowEvents = (win: BrowserWindow) => {
  const sendState = () => {
    if (win.isDestroyed()) return;
    const state: WindowState = {
      isMaximized: win.isMaximized(),
      isFullScreen: win.isFullScreen(),
    };
    win.webContents.send('window-state-changed', state);
  };

  win.on('maximize', sendState);
  win.on('unmaximize', sendState);
  win.on('enter-full-screen', sendState);
  win.on('leave-full-screen', sendState);
};
