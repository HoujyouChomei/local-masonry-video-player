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

export const handleStatic = (req: IncomingMessage, res: ServerResponse, url: URL) => {
  // 開発環境と本番環境(パッケージ済み)でパスが異なる場合に対応
  const appPath = app.getAppPath();

  // Viteのビルド出力先 (distディレクトリ)
  // devモード: プロジェクトルート/dist
  // prodモード: resources/app/dist または resources/app.asar/dist
  // ▼▼▼ 変更: out -> dist ▼▼▼
  const distPath = path.join(appPath, 'dist');

  let pathname = url.pathname;
  if (pathname === '/') {
    pathname = '/index.html';
  }

  // 安全なパス解決
  const targetPath = path.join(distPath, pathname);

  // パストラバーサル対策: distPathの内部にあるか確認
  if (!targetPath.startsWith(distPath)) {
    return sendError(res, 'Access Denied', 403);
  }

  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
    const mimeType = getMimeType(targetPath);
    res.writeHead(200, { 'Content-Type': mimeType });
    fs.createReadStream(targetPath).pipe(res);
    return;
  }

  // ファイルが見つからない場合、SPAのために index.html にフォールバックする
  // (ただし、APIや特定のアセットへのリクエストは除く)
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
