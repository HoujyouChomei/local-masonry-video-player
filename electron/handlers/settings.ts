// electron/handlers/settings.ts

import { app, ipcMain } from 'electron';
import { store } from '../lib/store';

export const handleSettings = () => {
  ipcMain.handle('get-settings', () => {
    return store.store;
  });

  ipcMain.handle('save-settings', (_event, key: string, value: unknown) => {
    store.set(key, value);
    return true;
  });

  // ▼▼▼ 追加: アプリ再起動 ▼▼▼
  ipcMain.handle('relaunch-app', () => {
    app.relaunch();
    app.exit();
  });
};
