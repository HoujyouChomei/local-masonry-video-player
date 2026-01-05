// src/shared/api/client-factory.ts

import { ApiClient } from './types';
import { ElectronClient } from './clients/electron-client';
import { HttpClient } from './clients/http-client'; // 追加

// シングルトンインスタンスを保持
let clientInstance: ApiClient | null = null;

// APIサーバーが起動しているかどうかのフラグ (Electron側から設定される)
// declare global {
//   interface Window {
//     apiServerAvailable: boolean;
//   }
// }

// export const getApiClient = (): ApiClient => {
//   if (clientInstance) {
//     return clientInstance;
//   }

//   // 環境判定:
//   // 1. Electron 環境 かつ APIサーバーが利用可能なら ElectronClient
//   // 2. それ以外 (ブラウザ or APIサーバー未起動) なら HttpClient
//   // Note: `window.apiServerAvailable` は Electron 側で設定される想定
//   if (typeof window !== 'undefined' && window.electron && window.apiServerAvailable) {
//     console.log('[ApiClientFactory] Initializing ElectronClient');
//     clientInstance = new ElectronClient();
//   } else {
//     // APIサーバーが利用できない場合はHttpClientを使用
//     console.log('[ApiClientFactory] Initializing HttpClient (API Server potentially unavailable)');
//     clientInstance = new HttpClient();
//   }

//   return clientInstance;
// };


// ▼▼▼ 修正: APIサーバーの起動状況を考慮した判定 ▼▼▼
// Electron側で `window.apiServerAvailable` を true に設定するのを待つ、
// または、fetch が失敗した場合に HttpClient にフォールバックするなどのロジックが必要。
//
// 一旦、よりシンプルな判定ロジックで実装:
// Electron環境かどうかの判定を優先し、Electron環境であれば ElectronClient を使う
// (APIサーバーが利用可能かは、fetchの失敗でハンドリングする)
export const getApiClient = (): ApiClient => {
  if (clientInstance) {
    return clientInstance;
  }

  // Electron環境で window.electron が存在すれば、ElectronClient を使用
  if (typeof window !== 'undefined' && window.electron) {
    console.log('[ApiClientFactory] Initializing ElectronClient');
    clientInstance = new ElectronClient();
  } else {
    // Electron環境でない、または window.electron がない場合 (WebビルドやSSRなど)
    // または、Electron環境だがAPIサーバーが起動していない可能性も考慮
    console.log('[ApiClientFactory] Initializing HttpClient');
    clientInstance = new HttpClient();
  }

  return clientInstance;
};