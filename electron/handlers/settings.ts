// electron/handlers/settings.ts

import { app, ipcMain, shell } from 'electron';
import path from 'path';
import { SettingsService } from '../core/services/settings-service';
import { getLocalIpAddress, getServerPort } from '../lib/local-server';
import { AppSettings } from '../../src/shared/types/electron';

export const handleSettings = () => {
  const settingsService = SettingsService.getInstance();

  ipcMain.handle('get-settings', () => {
    return settingsService.getSettings();
  });

  ipcMain.handle(
    'save-settings',
    async <K extends keyof AppSettings>(
      _event: Electron.IpcMainInvokeEvent,
      key: K,
      value: AppSettings[K]
    ) => {
      return settingsService.updateSetting(key, value);
    }
  );

  ipcMain.handle('reset-access-token', () => {
    return settingsService.resetAccessToken();
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
