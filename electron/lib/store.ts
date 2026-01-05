// electron/lib/store.ts

import Store from 'electron-store';
import crypto from 'crypto';
import { AppSettings } from '../../src/shared/types/electron';
import { DEFAULT_SETTINGS } from '../../src/shared/constants/defaults';

export const store = new Store<AppSettings>({
  defaults: {
    ...DEFAULT_SETTINGS,
    // 初回起動時にトークンを自動生成する (定数ファイルには動的ロジックを含めないためここで上書き)
    authAccessToken: crypto.randomUUID(),
  },
});
