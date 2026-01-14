// electron/lib/store.ts

import Store from 'electron-store';
import crypto from 'crypto';
import { AppSettings } from '../../src/shared/types/electron';
import { DEFAULT_SETTINGS } from '../../src/shared/constants/defaults';

export const store = new Store<AppSettings>({
  defaults: {
    ...DEFAULT_SETTINGS,
    authAccessToken: crypto.randomUUID(),
  },
});
