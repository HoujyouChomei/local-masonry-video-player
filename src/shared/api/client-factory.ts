// src/shared/api/client-factory.ts

import { ApiClient } from './types';
import { ElectronClient } from './clients/electron-client';

// シングルトンインスタンスを保持
let clientInstance: ApiClient | null = null;

export const getApiClient = (): ApiClient => {
  if (clientInstance) {
    return clientInstance;
  }

  // 環境判定: window.electron が存在するかどうか
  // (将来的に window.electron がない場合は HttpClient を返すように分岐を追加する)
  if (typeof window !== 'undefined' && window.electron) {
    console.log('[ApiClientFactory] Initializing ElectronClient');
    clientInstance = new ElectronClient();
  } else {
    console.warn('[ApiClientFactory] window.electron not found. Fallback to ElectronClient (might be SSR or Dev).');
    // 現時点ではフォールバックとして ElectronClient を使用
    // (将来はここで HttpApiClient をインスタンス化する)
    clientInstance = new ElectronClient();
  }

  return clientInstance;
};