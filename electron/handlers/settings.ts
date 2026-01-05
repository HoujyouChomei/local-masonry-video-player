// electron/handlers/settings.ts

import { app, ipcMain } from 'electron';
import { store } from '../lib/store';
import { getLocalIpAddress, getServerPort, startLocalServer } from '../lib/local-server';
import { VideoLibraryService } from '../core/services/video-library-service'; // 追加
import crypto from 'crypto';

export const handleSettings = () => {
  // サービスをインスタンス化
  const libraryService = new VideoLibraryService();

  ipcMain.handle('get-settings', () => {
    return store.store;
  });

  ipcMain.handle('save-settings', async (_event, key: string, value: unknown) => {
    // 変更前の値を取得（差分検知用）
    const oldValue = store.get(key);

    // 設定を保存
    store.set(key, value);

    // ▼▼▼ 追加: ライブラリフォルダ追加時の即時再帰スキャン ▼▼▼
    if (key === 'libraryFolders' && Array.isArray(value) && Array.isArray(oldValue)) {
      const newFolders = value as string[];
      const oldFolders = oldValue as string[];

      // 新しく追加されたフォルダのみを特定
      const addedFolders = newFolders.filter((f) => !oldFolders.includes(f));

      if (addedFolders.length > 0) {
        console.log(`[Settings] New library folders detected: ${addedFolders.join(', ')}`);
        // 追加されたフォルダに対して、即座にバックグラウンドで静的再帰スキャンを実行
        // awaitはせず、レスポンスをブロックしないようにする
        Promise.all(addedFolders.map((folder) => libraryService.scanQuietly(folder)))
          .then(() => console.log('[Settings] Quiet scan for new folders completed.'))
          .catch((err) => console.error('[Settings] Quiet scan failed:', err));
      }
    }

    // モバイル接続設定の変更を検知してサーバー再起動
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
};
