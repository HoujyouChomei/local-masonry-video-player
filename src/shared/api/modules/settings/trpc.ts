// src/shared/api/modules/settings/trpc.ts

import { trpcClient } from '@/shared/api/trpc';
import { SettingsApi } from '../../types';
import { AppSettings } from '@/shared/types/electron';

export class TRPCSettings implements SettingsApi {
  async get(): Promise<AppSettings> {
    return trpcClient.system.settings.get.query() as Promise<AppSettings>;
  }

  async save<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<boolean> {
    return trpcClient.system.settings.update.mutate({ key, value });
  }

  async resetAccessToken(): Promise<string> {
    return trpcClient.system.settings.resetToken.mutate();
  }
}
