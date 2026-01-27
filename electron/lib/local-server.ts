// electron/lib/local-server.ts

import http from 'http';
import os from 'os';
import { AddressInfo } from 'net';
import { handleRequest } from './server/router';
import { setServerPort, getServerPort } from './server-state';
import { logger } from './logger';

let localIpAddress = '127.0.0.1';
let server: http.Server | null = null;

const DEFAULT_PORT = 54321;

const getLocalIp = (): string => {
  const nets = os.networkInterfaces();
  let firstCandidate: string | null = null;

  for (const name of Object.keys(nets)) {
    const lowerName = name.toLowerCase();

    if (
      lowerName.includes('docker') ||
      lowerName.includes('vethernet') ||
      lowerName.includes('wsl') ||
      lowerName.includes('virtual') ||
      lowerName.includes('vmware') ||
      lowerName.includes('vbox') ||
      lowerName.includes('tun') ||
      lowerName.includes('tap') ||
      lowerName.includes('ppp') ||
      lowerName.includes('vpn') ||
      lowerName.includes('tailscale') ||
      lowerName.includes('zerotier') ||
      lowerName.includes('proton')
    ) {
      continue;
    }

    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        if (net.address.startsWith('192.168.')) {
          return net.address;
        }
        if (!firstCandidate) {
          firstCandidate = net.address;
        }
      }
    }
  }
  return firstCandidate || '127.0.0.1';
};

export const startLocalServer = (host = '127.0.0.1'): Promise<number> => {
  return new Promise((resolve, reject) => {
    if (server) {
      logger.debug('[LocalServer] Stopping existing server...');
      server.closeAllConnections();
      server.close((err) => {
        if (err) logger.warn('[LocalServer] Error closing server:', err);
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
  const storedPort = getServerPort();
  const port = storedPort > 0 ? storedPort : DEFAULT_PORT;

  const tryListen = (currentPort: number) => {
    server = http.createServer((req, res) => {
      handleRequest(req, res, currentPort);
    });

    server.keepAliveTimeout = 60000;
    server.headersTimeout = 61000;

    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        logger.warn(`[LocalServer] Port ${currentPort} is busy, trying ${currentPort + 1}...`);
        server = null;
        tryListen(currentPort + 1);
      } else {
        reject(err);
      }
    });

    server.listen(currentPort, host, () => {
      server?.removeAllListeners('error');

      const address = server!.address() as AddressInfo;
      const actualPort = address.port;

      setServerPort(actualPort);
      localIpAddress = getLocalIp();

      logger.info(`[LocalServer] Running at http://${host}:${actualPort}`);
      if (host === '0.0.0.0') {
        logger.info(
          `[LocalServer] LAN Address: http://${localIpAddress}:${actualPort} (Public Mode)`
        );
      } else {
        logger.info(`[LocalServer] Localhost Only (Secure Mode)`);
      }

      server?.on('error', (err) => logger.error('[LocalServer] Runtime Error:', err));

      resolve(actualPort);
    });
  };

  tryListen(port);
};

export { getServerPort };
export const getLocalIpAddress = () => localIpAddress;