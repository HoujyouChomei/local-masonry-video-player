// electron/lib/server/routes/settings.ts

import { IncomingMessage, ServerResponse } from 'http';
import { store } from '../../store';
import { sendJson, sendError } from '../utils';
import { startLocalServer } from '../../local-server';
import { VideoLibraryService } from '../../../core/services/video-library-service';

const libraryService = new VideoLibraryService();

export const handleSettingsRequest = async (
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
) => {
  const method = req.method;
  const pathname = url.pathname;

  // GET /api/settings
  if (pathname === '/api/settings' && method === 'GET') {
    return sendJson(res, store.store);
  }

  // ▼▼▼ 追加: POST /api/settings (設定保存) ▼▼▼
  if (pathname === '/api/settings' && method === 'POST') {
    const bodyBuffers: Buffer[] = [];
    for await (const chunk of req) {
      bodyBuffers.push(chunk);
    }
    const bodyString = Buffer.concat(bodyBuffers).toString();

    try {
      const { key, value } = JSON.parse(bodyString);

      if (!key) return sendError(res, 'Key is required', 400);

      // 変更前の値を取得
      const oldValue = store.get(key);

      // 設定を保存
      store.set(key, value);

      // --- サイドエフェクト処理 (Main Processのハンドラと同様のロジック) ---

      // 1. ライブラリフォルダ追加時の即時スキャン
      if (key === 'libraryFolders' && Array.isArray(value) && Array.isArray(oldValue)) {
        const newFolders = value as string[];
        const oldFolders = oldValue as string[];
        const addedFolders = newFolders.filter((f) => !oldFolders.includes(f));

        if (addedFolders.length > 0) {
          Promise.all(addedFolders.map((folder) => libraryService.scanQuietly(folder))).catch(
            console.error
          );
        }
      }

      // 2. モバイル接続設定の変更 (サーバー再起動)
      // Note: スマホから自分の接続を切る操作になるため注意が必要だが、ロジックとしては同期させる
      if (key === 'enableMobileConnection') {
        const enable = value as boolean;
        const host = enable ? '0.0.0.0' : '127.0.0.1';
        // 非同期で再起動（レスポンスを返した後に実行されることを期待）
        setTimeout(() => startLocalServer(host).catch(console.error), 100);
      }

      return sendJson(res, { success: true });
    } catch (e) {
      console.error('Failed to save settings:', e);
      return sendError(res, 'Invalid JSON', 400);
    }
  }

  return false; // Not handled
};
