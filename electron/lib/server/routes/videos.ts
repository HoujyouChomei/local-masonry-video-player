// electron/lib/server/routes/videos.ts

import { IncomingMessage, ServerResponse } from 'http';
import { VideoLibraryService } from '../../../core/services/media/library-service';
import { MediaRepository } from '../../../core/repositories/media/media-repository';
import { VideoMapper } from '../../../core/services/media/media-mapper';
import { SearchOptions } from '../../../core/repositories/media/media-search';
import { sendJson, sendError } from '../utils';
import { logger } from '../../logger';

const libraryService = new VideoLibraryService();
const mediaRepo = new MediaRepository();
const mapper = new VideoMapper();

export const handleVideosRequest = async (req: IncomingMessage, res: ServerResponse, url: URL) => {
  const method = req.method;
  const pathname = url.pathname;

  if (pathname === '/api/videos' && method === 'GET') {
    const query = url.searchParams.get('q') || '';
    const tagIds = url.searchParams.getAll('tags');
    const playlistId = url.searchParams.get('playlistId') || undefined;
    const isFavorite = url.searchParams.get('favorite') === 'true';
    const folderPath = url.searchParams.get('folder') || undefined;

    if (folderPath && !query && tagIds.length === 0 && !playlistId && !isFavorite) {
      await libraryService.scanQuietly(folderPath);
    }

    const options: SearchOptions = {
      playlistId,
      isFavorite,
      folderPath,
    };

    try {
      const videos = libraryService.searchVideos(query, tagIds, options);
      return sendJson(res, videos);
    } catch (e) {
      logger.error('Failed to fetch videos:', e);
      return sendError(res, 'Failed to fetch videos');
    }
  }

  if (pathname === '/api/videos/details' && method === 'GET') {
    const filePath = url.searchParams.get('path');
    if (!filePath) return sendError(res, 'Path required', 400);

    try {
      const row = mediaRepo.findByPath(filePath);
      return sendJson(res, row ? mapper.toEntity(row) : null);
    } catch (e) {
      logger.error(`Failed to fetch video details for: ${filePath}`, e);
      return sendError(res, 'Failed to fetch video details');
    }
  }

  return false;
};
