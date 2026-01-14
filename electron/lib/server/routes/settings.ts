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

  if (pathname === '/api/settings' && method === 'GET') {
    return sendJson(res, store.store);
  }

  if (pathname === '/api/settings' && method === 'POST') {
    const bodyBuffers: Buffer[] = [];
    for await (const chunk of req) {
      bodyBuffers.push(chunk);
    }
    const bodyString = Buffer.concat(bodyBuffers).toString();

    try {
      const { key, value } = JSON.parse(bodyString);

      if (!key) return sendError(res, 'Key is required', 400);

      const oldValue = store.get(key);

      store.set(key, value);

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

      if (key === 'enableMobileConnection') {
        const enable = value as boolean;
        const host = enable ? '0.0.0.0' : '127.0.0.1';
        setTimeout(() => startLocalServer(host).catch(console.error), 100);
      }

      return sendJson(res, { success: true });
    } catch (e) {
      console.error('Failed to save settings:', e);
      return sendError(res, 'Invalid JSON', 400);
    }
  }

  return false;
};
