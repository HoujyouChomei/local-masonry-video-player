// electron/lib/server/static-handler.ts

import { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { sendError } from './utils';

const getMimeType = (filePath: string) => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

export const handleStatic = (_req: IncomingMessage, res: ServerResponse, url: URL) => {
  const appPath = app.getAppPath();

  const distPath = path.join(appPath, 'dist');

  let pathname = url.pathname;
  if (pathname === '/') {
    pathname = '/index.html';
  }

  const targetPath = path.join(distPath, pathname);

  if (!targetPath.startsWith(distPath)) {
    return sendError(res, 'Access Denied', 403);
  }

  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
    const mimeType = getMimeType(targetPath);
    res.writeHead(200, { 'Content-Type': mimeType });
    fs.createReadStream(targetPath).pipe(res);
    return;
  }

  if (!pathname.startsWith('/api/') && !pathname.includes('.')) {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      fs.createReadStream(indexPath).pipe(res);
      return;
    }
  }

  sendError(res, 'File Not Found', 404);
};
