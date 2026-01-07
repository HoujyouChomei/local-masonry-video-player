// src/shared/api/modules/settings/electron.ts

import { ElectronBase } from '../../base/electron-base';
import { SettingsApi } from '../../types';
import { AppSettings } from '@/shared/types/electron';
import { DEFAULT_SETTINGS } from '@/shared/constants/defaults';

export class ElectronSettings extends ElectronBase implements SettingsApi {
  get(): Promise<AppSettings> {
    return this.invoke((e) => e.getSettings(), DEFAULT_SETTINGS);
  }

  save<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<boolean> {
    return this.invoke((e) => e.saveSettings(key, value), false);
  }

  resetAccessToken(): Promise<string> {
    return this.invoke((e) => e.resetAccessToken(), '');
  }
}
