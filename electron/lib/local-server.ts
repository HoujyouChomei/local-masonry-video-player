// electron/lib/local-server.ts

import { store } from './store'; // ← import文の一番上に追加
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { AddressInfo } from 'net';
import { app, nativeImage } from 'electron';
import { spawn } from 'child_process';
import { FFmpegService } from '../core/services/ffmpeg-service';

let serverPort = 0;

// サムネイル保存先ディレクトリの準備
const getThumbnailDir = () => {
  const dir = path.join(app.getPath('userData'), 'thumbnails');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

const getMimeType = (filePath: string) => {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.mp4':
      return 'video/mp4';
    case '.webm':
      return 'video/webm';
    case '.ogg':
      return 'video/ogg';
    case '.mov':
      return 'video/quicktime';
    default:
      return 'application/octet-stream';
  }
};

export const startLocalServer = (): Promise<number> => {
  return new Promise((resolve, reject) => {
    const ffmpegService = new FFmpegService();

    const server = http.createServer(async (req, res) => {
      // 基本ヘッダー
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
      res.setHeader('Access-Control-Allow-Headers', 'Range');

      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Connection', 'close');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      try {
        const urlParams = new URL(req.url || '', `http://localhost:${serverPort}`);
        const pathname = urlParams.pathname;
        const filePath = urlParams.searchParams.get('path');

        if (!filePath) {
          res.writeHead(404);
          res.end('File path required');
          return;
        }

        // ▼▼▼ 【ここから追加】セキュリティチェック ▼▼▼

        // 1. アプリで許可されているフォルダ一覧を取得
        // (設定ファイルから「ライブラリ」と「現在開いているフォルダ」を取得)
        const libraryFolders = (store.get('libraryFolders') as string[]) || [];
        const currentFolder = store.get('folderPath') as string;

        // 重複を除去してリスト化
        const allowedRoots = [...libraryFolders];
        if (currentFolder && !allowedRoots.includes(currentFolder)) {
          allowedRoots.push(currentFolder);
        }

        // 2. パスの正規化 (Windowsの "\" と "/" の揺れや ".." を解決)
        // これをしないと "C:/User/MyVideos/../../Windows/System32" みたいな攻撃を通してしまう
        const normalizedTarget = path.normalize(filePath);

        // 3. ターゲットが許可フォルダの「中身」かどうかチェック
        const isAllowed = allowedRoots.some((root) => {
          const normalizedRoot = path.normalize(root);
          // 要求されたパスが、許可ルートで始まっているか確認
          return normalizedTarget.startsWith(normalizedRoot);
        });

        if (!isAllowed) {
          console.warn(`[Security] Blocked unauthorized access: ${filePath}`);
          res.writeHead(403); // 403 Forbidden (立ち入り禁止)
          res.end('Access Denied');
          return;
        }
        // ▲▲▲ 【ここまで追加】 ▲▲▲

        // ▼▼▼ サムネイル処理 (/thumbnail) ▼▼▼
        if (pathname === '/thumbnail') {
          try {
            const thumbDir = getThumbnailDir();
            const hash = crypto.createHash('md5').update(filePath).digest('hex');
            const thumbPath = path.join(thumbDir, `${hash}.jpg`);

            if (fs.existsSync(thumbPath)) {
              const file = fs.createReadStream(thumbPath);
              res.writeHead(200, { 'Content-Type': 'image/jpeg' });
              file.pipe(res);
              return;
            }

            const image = await nativeImage.createThumbnailFromPath(filePath, {
              width: 480,
              height: 270,
            });

            if (image.isEmpty()) {
              res.writeHead(404);
              res.end('Thumbnail generation failed');
              return;
            }

            const jpegBuffer = image.toJPEG(80);
            fs.promises.writeFile(thumbPath, jpegBuffer).catch((err) => {
              console.error('Failed to cache thumbnail:', err);
            });

            res.writeHead(200, {
              'Content-Type': 'image/jpeg',
              'Content-Length': jpegBuffer.length,
            });
            res.end(jpegBuffer);
          } catch (e) {
            console.error('Thumbnail error:', e);
            res.writeHead(500);
            res.end('Internal Server Error');
          }
          return;
        }
        // ▲▲▲ サムネイル処理ここまで ▲▲▲

        // ▼▼▼ 動画ストリーミング処理 (/video) ▼▼▼
        if (!fs.existsSync(filePath)) {
          res.writeHead(404);
          res.end('File not found');
          return;
        }

        // 1. トランスコード判定
        const ffmpegPath = ffmpegService.ffmpegPath;

        // ▼▼▼ 修正: デバッグログの追加 ▼▼▼
        console.log(`[LocalServer] Request: ${filePath}`);
        console.log(
          `[LocalServer] FFmpeg Path Configured: ${ffmpegPath ? 'YES' : 'NO'} (${ffmpegPath})`
        );

        if (ffmpegPath) {
          try {
            const startTimeParam = urlParams.searchParams.get('t');
            const startTime = startTimeParam ? parseFloat(startTimeParam) : 0;

            console.log(
              `[LocalServer] Starting transcode for: ${path.basename(filePath)} at ${startTime}s`
            );

            const args = ffmpegService.getTranscodeArgs(filePath, startTime);

            // Spawn FFmpeg process
            const ffmpegProcess = spawn(ffmpegPath, args);

            res.writeHead(200, {
              'Content-Type': 'video/mp4',
              Connection: 'keep-alive',
            });

            ffmpegProcess.stdout.pipe(res);

            // ▼▼▼ 修正: ESLintエラー解消 & ログ出力 ▼▼▼
            ffmpegProcess.stderr.on('data', (data) => {
              // ログが多すぎる場合はコメントアウトしてください
              console.log(`[FFmpeg STDERR] ${data}`);
            });

            const cleanup = () => {
              if (ffmpegProcess && !ffmpegProcess.killed) {
                try {
                  ffmpegProcess.kill();
                  console.log('[LocalServer] FFmpeg process killed');
                } catch (e) {
                  console.error('[LocalServer] Failed to kill FFmpeg process:', e);
                }
              }
            };

            req.on('close', cleanup);
            res.on('finish', cleanup);

            return;
          } catch (error) {
            console.error('[LocalServer] Transcode start failed:', error);
          }
        } else {
          console.warn(
            '[LocalServer] Transcoding skipped (FFmpeg path not set). Falling back to direct stream.'
          );
        }

        // 2. フォールバック: 生ファイル配信
        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;
        const contentType = getMimeType(filePath);

        if (req.method === 'HEAD') {
          res.writeHead(200, {
            'Content-Length': fileSize,
            'Content-Type': contentType,
            'Accept-Ranges': 'bytes',
          });
          res.end();
          return;
        }

        if (range) {
          const parts = range.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
          const chunksize = end - start + 1;

          const file = fs.createReadStream(filePath, { start, end });

          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': contentType,
          });

          const cleanup = () => file.destroy();
          file.on('error', (err) => {
            console.error('Stream error:', err);
            cleanup();
          });
          file.pipe(res).on('finish', cleanup);
          req.on('close', cleanup);
        } else {
          res.writeHead(200, {
            'Content-Length': fileSize,
            'Content-Type': contentType,
            'Accept-Ranges': 'bytes',
          });

          const file = fs.createReadStream(filePath);
          const cleanup = () => file.destroy();
          file.on('error', (err) => {
            console.error('Stream error:', err);
            cleanup();
          });
          file.pipe(res).on('finish', cleanup);
          req.on('close', cleanup);
        }
      } catch (err) {
        console.error('Server internal error:', err);
        if (!res.headersSent) {
          res.writeHead(500);
          res.end('Internal Server Error');
        }
      }
    });

    server.keepAliveTimeout = 1000;
    server.headersTimeout = 2000;

    server.listen(0, '127.0.0.1', () => {
      const address = server.address() as AddressInfo;
      serverPort = address.port;
      console.log(`Local video server running at http://127.0.0.1:${serverPort}`);
      resolve(serverPort);
    });

    server.on('error', (err) => {
      reject(err);
    });
  });
};

export const getServerPort = () => serverPort;
