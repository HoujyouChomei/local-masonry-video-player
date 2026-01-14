// src/shared/api/modules/settings/http.ts

import { HttpBase } from '../../base/http-base';
import { SettingsApi } from '../../types';
import { AppSettings } from '@/shared/types/electron';
import { logger } from '@/shared/lib/logger';

export class HttpSettings extends HttpBase implements SettingsApi {
  async get(): Promise<AppSettings> {
    return this.request<AppSettings>('/settings');
  }

  async save<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<boolean> {
    try {
      await this.request('/settings', {
        method: 'POST',
        body: { key, value },
      });
      return true;
    } catch (error) {
      logger.error('Failed to save settings:', error);
      return false;
    }
  }

  async resetAccessToken(): Promise<string> {
    logger.warn('resetAccessToken is not available on mobile client.');
    return '';
  }
}
