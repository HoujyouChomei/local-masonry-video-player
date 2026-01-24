// electron/core/services/system/settings-service.ts

import { store } from '../../../lib/store';
import { AppSettings } from '../../../../src/shared/types/electron';
import { logger } from '../../../lib/logger';
import crypto from 'crypto';
import { eventBus } from '../../events';

export class SettingsService {
  private static instance: SettingsService;

  private constructor() {}

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  getSettings(): AppSettings {
    return store.store;
  }

  async updateSetting<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ): Promise<boolean> {
    const oldValue = store.get(key);
    store.set(key, value);

    if (key === 'libraryFolders' && Array.isArray(value) && Array.isArray(oldValue)) {
      const newFolders = value as string[];
      const oldFolders = oldValue as string[];
      const addedFolders = newFolders.filter((f) => !oldFolders.includes(f));

      if (addedFolders.length > 0) {
        logger.info(`[Settings] New library folders detected: ${addedFolders.join(', ')}`);
        eventBus.emit('settings:library-folders-added', { folders: addedFolders });
      }
    }

    if (key === 'enableMobileConnection') {
      const enable = value as boolean;
      const host = enable ? '0.0.0.0' : '127.0.0.1';
      logger.info(`[Settings] Mobile connection changed to ${enable}. Emitting restart event...`);

      eventBus.emit('settings:mobile-connection-changed', { host });
    }

    return true;
  }

  resetAccessToken(): string {
    const newToken = crypto.randomUUID();
    store.set('authAccessToken', newToken);
    return newToken;
  }
}
