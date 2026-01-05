// electron/lib/local-server.ts

import http from 'http';
import os from 'os';
import { AddressInfo } from 'net';
import { handleRequest } from './server/router';
import { setServerPort, getServerPort } from './server-state';

let localIpAddress = '127.0.0.1';
let server: http.Server | null = null;

// ▼▼▼ 修正: 競合しにくいポート番号に変更 (54321) ▼▼▼
// 30000番台は Kubernetes (NodePort) 等で使用されるため回避
const DEFAULT_PORT = 54321;

const getLocalIp = (): string => {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
};

/**
 * ローカルサーバーを起動または再起動する
 * @param host リッスンするホスト (デフォルト: 127.0.0.1)
 */
export const startLocalServer = (host = '127.0.0.1'): Promise<number> => {
  return new Promise((resolve, reject) => {
    // 既存サーバーがあれば停止してから再作成
    if (server) {
      console.log('[LocalServer] Stopping existing server...');
      server.closeAllConnections();
      server.close((err) => {
        if (err) console.warn('[LocalServer] Error closing server:', err);
        server = null;
        createNewServer(host, resolve, reject);
      });
    } else {
      createNewServer(host, resolve, reject);
    }
  });
};

const createNewServer = (
  host: string,
  resolve: (port: number) => void,
  reject: (err: Error) => void
) => {
  // 以前のポート(再起動時)があればそれを使う。なければ固定の DEFAULT_PORT を使う。
  const storedPort = getServerPort();
  // ▼▼▼ 修正: let -> const (ESLint fix) ▼▼▼
  const port = storedPort > 0 ? storedPort : DEFAULT_PORT;

  const tryListen = (currentPort: number) => {
    server = http.createServer((req, res) => {
      handleRequest(req, res, currentPort);
    });

    server.keepAliveTimeout = 1000;
    server.headersTimeout = 2000;

    // エラーハンドリング (ポート競合時のリトライ)
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[LocalServer] Port ${currentPort} is busy, trying ${currentPort + 1}...`);
        server = null;
        tryListen(currentPort + 1); // 再帰的に次のポートを試す
      } else {
        reject(err);
      }
    });

    server.listen(currentPort, host, () => {
      // 成功したらリスナーを削除して解決
      server?.removeAllListeners('error');

      const address = server!.address() as AddressInfo;
      const actualPort = address.port;

      setServerPort(actualPort);
      localIpAddress = getLocalIp();

      console.log(`[LocalServer] Running at http://${host}:${actualPort}`);
      if (host === '0.0.0.0') {
        console.log(
          `[LocalServer] LAN Address: http://${localIpAddress}:${actualPort} (Public Mode)`
        );
      } else {
        console.log(`[LocalServer] Localhost Only (Secure Mode)`);
      }

      // 通常のエラーハンドラに戻す
      server?.on('error', (err) => console.error('[LocalServer] Runtime Error:', err));

      resolve(actualPort);
    });
  };

  tryListen(port);
};

export { getServerPort };
export const getLocalIpAddress = () => localIpAddress;
