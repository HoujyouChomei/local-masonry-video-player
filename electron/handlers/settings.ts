// electron/handlers/settings.ts

import { app, ipcMain, shell } from 'electron';
import path from 'path';
import { store } from '../lib/store';
import { getLocalIpAddress, getServerPort, startLocalServer } from '../lib/local-server';
import { VideoLibraryService } from '../core/services/video-library-service';
import crypto from 'crypto';

export const handleSettings = () => {
  const libraryService = new VideoLibraryService();

  ipcMain.handle('get-settings', () => {
    return store.store;
  });

  ipcMain.handle('save-settings', async (_event, key: string, value: unknown) => {
    const oldValue = store.get(key);

    store.set(key, value);

    if (key === 'libraryFolders' && Array.isArray(value) && Array.isArray(oldValue)) {
      const newFolders = value as string[];
      const oldFolders = oldValue as string[];

      const addedFolders = newFolders.filter((f) => !oldFolders.includes(f));

      if (addedFolders.length > 0) {
        console.log(`[Settings] New library folders detected: ${addedFolders.join(', ')}`);
        Promise.all(addedFolders.map((folder) => libraryService.scanQuietly(folder)))
          .then(() => console.log('[Settings] Quiet scan for new folders completed.'))
          .catch((err) => console.error('[Settings] Quiet scan failed:', err));
      }
    }

    if (key === 'enableMobileConnection') {
      const enable = value as boolean;
      const host = enable ? '0.0.0.0' : '127.0.0.1';
      console.log(
        `[Settings] Mobile connection changed to ${enable}. Restarting server on ${host}...`
      );

      try {
        await startLocalServer(host);
      } catch (e) {
        console.error('[Settings] Failed to restart server:', e);
      }
    }

    return true;
  });

  ipcMain.handle('reset-access-token', () => {
    const newToken = crypto.randomUUID();
    store.set('authAccessToken', newToken);
    return newToken;
  });

  ipcMain.handle('relaunch-app', () => {
    app.relaunch();
    app.exit();
  });

  ipcMain.handle('get-connection-info', () => {
    return {
      ip: getLocalIpAddress(),
      port: getServerPort(),
    };
  });

  ipcMain.handle('open-log-folder', async () => {
    const logsDir = path.join(app.getPath('userData'), 'logs');
    await shell.openPath(logsDir);
  });
};
