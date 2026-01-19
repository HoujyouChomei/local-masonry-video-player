// electron/lib/server/routes/favorites.ts

import { IncomingMessage, ServerResponse } from 'http';
import { FavoriteService } from '../../../core/services/collection/favorite-service';
import { sendJson, sendError } from '../utils';
import { logger } from '../../logger';

const favoriteService = new FavoriteService();

const readBody = async <T>(req: IncomingMessage): Promise<T> => {
  const buffers = [];
  for await (const chunk of req) {
    buffers.push(chunk);
  }
  const data = Buffer.concat(buffers).toString();
  return JSON.parse(data);
};

export const handleFavoritesRequest = async (
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
) => {
  const method = req.method;
  const pathname = url.pathname;

  if (pathname === '/api/favorites' && method === 'GET') {
    try {
      const favorites = await favoriteService.getFavorites();
      return sendJson(res, favorites);
    } catch (e) {
      logger.error('Failed to fetch favorites:', e);
      return sendError(res, 'Failed to fetch favorites');
    }
  }

  if (pathname === '/api/favorites/toggle' && method === 'POST') {
    try {
      const { videoId } = await readBody<{ videoId: string }>(req);
      if (!videoId) return sendError(res, 'Video ID is required', 400);
      const favorites = await favoriteService.toggleFavorite(videoId);
      return sendJson(res, favorites);
    } catch (e) {
      logger.error('Failed to toggle favorite:', e);
      return sendError(res, 'Failed to toggle favorite');
    }
  }

  return false;
};
