// electron/lib/server/routes/settings.ts

import { IncomingMessage, ServerResponse } from 'http';
import { SettingsService } from '../../../core/services/settings-service';
import { sendJson, sendError } from '../utils';
import { AppSettings } from '../../../../src/shared/types/electron';
import { logger } from '../../logger';

const settingsService = SettingsService.getInstance();

export const handleSettingsRequest = async (
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
) => {
  const method = req.method;
  const pathname = url.pathname;

  if (pathname === '/api/settings' && method === 'GET') {
    return sendJson(res, settingsService.getSettings());
  }

  if (pathname === '/api/settings' && method === 'POST') {
    const bodyBuffers: Buffer[] = [];
    for await (const chunk of req) {
      bodyBuffers.push(chunk);
    }
    const bodyString = Buffer.concat(bodyBuffers).toString();

    try {
      const { key, value } = JSON.parse(bodyString) as {
        key: keyof AppSettings;
        value: AppSettings[keyof AppSettings];
      };

      if (!key) return sendError(res, 'Key is required', 400);

      await settingsService.updateSetting(key, value);

      return sendJson(res, { success: true });
    } catch (e) {
      logger.error('Failed to save settings via HTTP:', e);
      return sendError(res, 'Invalid JSON or Internal Error', 400);
    }
  }

  return false;
};
