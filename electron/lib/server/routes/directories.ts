// electron/lib/server/routes/directories.ts

import { IncomingMessage, ServerResponse } from 'http';
import { FileSystemService } from '../../../core/services/file/file-system-service';
import { isPathAllowed } from '../security';
import { sendJson, sendError } from '../utils';
import { logger } from '../../logger';

const fileService = new FileSystemService();

export const handleDirectoriesRequest = async (
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
) => {
  const method = req.method;
  const pathname = url.pathname;

  const dirPath = url.searchParams.get('path');

  if (pathname === '/api/directories' && method === 'GET') {
    if (!dirPath) return sendError(res, 'Path parameter required', 400);
    if (!isPathAllowed(dirPath)) return sendError(res, 'Access Denied', 403);

    try {
      const directories = await fileService.getSubdirectories(dirPath);
      return sendJson(res, directories);
    } catch (e) {
      logger.error(`Failed to read directory: ${dirPath}`, e);
      return sendError(res, 'Failed to read directory');
    }
  }

  if (pathname === '/api/directories/tree' && method === 'GET') {
    if (!dirPath) return sendError(res, 'Path parameter required', 400);
    if (!isPathAllowed(dirPath)) return sendError(res, 'Access Denied', 403);

    try {
      const results = await fileService.getDirectoryTree(dirPath);
      return sendJson(res, results);
    } catch (e) {
      logger.error(`Failed to read directory tree: ${dirPath}`, e);
      return sendError(res, 'Failed to read directory tree');
    }
  }

  return false;
};
