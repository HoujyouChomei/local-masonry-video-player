// electron/lib/server/router.ts

import { IncomingMessage, ServerResponse } from 'http';
import { setCorsHeaders, sendError } from './utils';
import { handleThumbnail, handleVideo } from './media-handler';
// 変更: api-handler.ts ではなく routes/index.ts をインポート
import { dispatchApiRequest } from './routes';
import { handleStatic } from './static-handler';
import { checkRequestAuth } from './security';
import { SSEHandler } from './sse-handler';

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
    return sendError(res, authResult.error || 'Access Denied', authResult.status || 403);
  }

  try {
    // 1. Media Routes
    if (pathname === '/thumbnail') {
      return handleThumbnail(req, res, url);
    }
    if (pathname === '/video') {
      return handleVideo(req, res, url);
    }

    // 2. API Routes
    if (pathname.startsWith('/api/')) {
      if (pathname === '/api/events') {
        return SSEHandler.getInstance().handleConnection(req, res);
      }
      // 変更: 新しいディスパッチャーを使用
      return dispatchApiRequest(req, res, url);
    }

    // 3. Static Files (Fallback)
    return handleStatic(req, res, url);
  } catch (err) {
    console.error('[Router] Internal Error:', err);
    if (!res.headersSent) {
      sendError(res, 'Internal Server Error');
    }
  }
};
