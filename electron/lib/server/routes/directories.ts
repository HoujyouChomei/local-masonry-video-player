// electron/lib/server/routes/directories.ts

import { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import { isPathAllowed } from '../security';
import { sendJson, sendError } from '../utils';

// 同期版の再帰スキャン (HTTPサーバー用)
const scanDirectoriesRecursivelySync = (dir: string, list: string[]) => {
  try {
    const dirents = fs.readdirSync(dir, { withFileTypes: true });
    for (const dirent of dirents) {
      if (dirent.isDirectory()) {
        if (dirent.name.startsWith('.') || dirent.name === 'node_modules') continue;
        const fullPath = path.join(dir, dirent.name);
        list.push(fullPath);
        scanDirectoriesRecursivelySync(fullPath, list);
      }
    }
  } catch {
    // ignore
  }
};

export const handleDirectoriesRequest = async (
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
) => {
  const method = req.method;
  const pathname = url.pathname;

  const dirPath = url.searchParams.get('path');

  // GET /api/directories
  if (pathname === '/api/directories' && method === 'GET') {
    if (!dirPath) return sendError(res, 'Path parameter required', 400);
    if (!isPathAllowed(dirPath)) return sendError(res, 'Access Denied', 403);

    try {
      const dirents = fs.readdirSync(dirPath, { withFileTypes: true });
      const directories = dirents
        .filter((dirent) => dirent.isDirectory() && !dirent.name.startsWith('.'))
        .map((dirent) => ({
          name: dirent.name,
          path: path.join(dirPath, dirent.name),
        }));
      return sendJson(res, directories);
    } catch (e) {
      console.error(`Failed to read directory: ${dirPath}`, e);
      return sendError(res, 'Failed to read directory');
    }
  }

  // ▼▼▼ 追加: GET /api/directories/tree ▼▼▼
  if (pathname === '/api/directories/tree' && method === 'GET') {
    if (!dirPath) return sendError(res, 'Path parameter required', 400);
    if (!isPathAllowed(dirPath)) return sendError(res, 'Access Denied', 403);

    try {
      const results: string[] = [];
      scanDirectoriesRecursivelySync(dirPath, results);
      return sendJson(res, results);
    } catch (e) {
      console.error(`Failed to read directory tree: ${dirPath}`, e);
      return sendError(res, 'Failed to read directory tree');
    }
  }

  return false; // Not handled
};
