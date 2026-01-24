// electron/lib/server/trpc-handler.ts

import { nodeHTTPRequestHandler } from '@trpc/server/adapters/node-http';
import { IncomingMessage, ServerResponse } from 'http';
import { appRouter } from '../../trpc/routers/_app';
import { createContext } from '../../trpc/init';
import { logger } from '../logger';

export const trpcHandler = async (req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname.replace(/^\/api\/trpc\/?/, '');

  logger.debug(`[tRPC] HTTP Request: /${path}`);

  return nodeHTTPRequestHandler({
    router: appRouter,
    req,
    res,
    path,
    createContext: () => createContext(),
  });
};
