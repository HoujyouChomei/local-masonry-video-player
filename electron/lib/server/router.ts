// electron/lib/server/router.ts

import { IncomingMessage, ServerResponse } from 'http';
import { setCorsHeaders, sendError } from './utils';
import { handleThumbnail, handleVideo } from './media-handler';
import { handleStatic } from './static-handler';
import { checkRequestAuth } from './security';
import { SSEHandler } from './sse-handler';
import { logger } from '../logger';
import { trpcHandler } from './trpc-handler';

export const handleRequest = async (
  req: IncomingMessage,
  res: ServerResponse,
  serverPort: number
) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '', `http://localhost:${serverPort}`);
  const pathname = url.pathname;

  const isStaticResource =
    !pathname.startsWith('/api/') && pathname !== '/video' && pathname !== '/thumbnail';

  const authResult = checkRequestAuth(req, isStaticResource);

  if (!authResult.allowed) {
    if (pathname.startsWith('/api/')) {
      logger.warn(`[Security] Blocked unauthorized API access: ${pathname}`);
    }
    return sendError(res, authResult.error || 'Access Denied', authResult.status || 403);
  }

  try {
    if (pathname === '/thumbnail') {
      return handleThumbnail(req, res, url);
    }
    if (pathname === '/video') {
      return handleVideo(req, res, url);
    }

    if (pathname.startsWith('/api/')) {
      if (pathname.startsWith('/api/trpc')) {
        return await trpcHandler(req, res);
      }
      if (pathname === '/api/events') {
        return SSEHandler.getInstance().handleConnection(req, res);
      }

      return sendError(res, 'API Endpoint Not Found', 404);
    }

    return handleStatic(req, res, url);
  } catch (err) {
    logger.error('[Router] Internal Error:', err);
    if (!res.headersSent) {
      sendError(res, 'Internal Server Error');
    }
  }
};
