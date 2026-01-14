// electron/lib/server/routes/system.ts

import { IncomingMessage, ServerResponse } from 'http';
import { getLocalIpAddress, getServerPort } from '../../local-server';
import { sendJson } from '../utils';

export const handleSystemRequest = async (req: IncomingMessage, res: ServerResponse, url: URL) => {
  const method = req.method;
  const pathname = url.pathname;

  if (pathname === '/api/connection' && method === 'GET') {
    return sendJson(res, {
      ip: getLocalIpAddress(),
      port: getServerPort(),
    });
  }

  return false;
};
