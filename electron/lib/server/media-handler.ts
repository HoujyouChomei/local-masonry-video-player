// electron/lib/server/media-handler.ts

import { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { app, nativeImage } from 'electron';
import { spawn } from 'child_process';
import { FFmpegService } from '../../core/services/ffmpeg-service';
import { isPathAllowed } from './security';
import { sendError } from './utils';
import {
  VIDEO_EXTENSIONS_NATIVE,
  VIDEO_MIME_TYPES,
} from '../../../src/shared/constants/file-types';
import { THUMBNAIL } from '../../../src/shared/constants/assets';

const ffmpegService = new FFmpegService();

// ブラウザ/スマホでネイティブ再生・シーク可能な形式
const DIRECT_STREAM_EXTENSIONS = new Set(VIDEO_EXTENSIONS_NATIVE);

const getThumbnailDir = () => {
  const dir = path.join(app.getPath('userData'), THUMBNAIL.DIR_NAME);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

const getMimeType = (filePath: string) => {
  const ext = path.extname(filePath).toLowerCase();
  return VIDEO_MIME_TYPES[ext] || 'application/octet-stream';
};

export const handleThumbnail = async (req: IncomingMessage, res: ServerResponse, url: URL) => {
  const filePath = url.searchParams.get('path');

  if (!filePath || !isPathAllowed(filePath)) {
    return sendError(res, 'Access Denied', 403);
  }

  try {
    const thumbDir = getThumbnailDir();
    const hash = crypto.createHash('md5').update(filePath).digest('hex');
    const thumbPath = path.join(thumbDir, `${hash}${THUMBNAIL.EXTENSION}`);

    if (fs.existsSync(thumbPath)) {
      const file = fs.createReadStream(thumbPath);
      res.writeHead(200, { 'Content-Type': THUMBNAIL.FORMAT });
      file.pipe(res);
      return;
    }

    const image = await nativeImage.createThumbnailFromPath(filePath, {
      width: THUMBNAIL.WIDTH,
      height: THUMBNAIL.HEIGHT,
    });

    if (image.isEmpty()) {
      return sendError(res, 'Thumbnail generation failed', 404);
    }

    const jpegBuffer = image.toJPEG(THUMBNAIL.QUALITY);
    fs.promises.writeFile(thumbPath, jpegBuffer).catch((err) => {
      console.error('Failed to cache thumbnail:', err);
    });

    res.writeHead(200, {
      'Content-Type': THUMBNAIL.FORMAT,
      'Content-Length': jpegBuffer.length,
    });
    res.end(jpegBuffer);
  } catch (e) {
    console.error('Thumbnail error:', e);
    sendError(res, 'Internal Server Error');
  }
};

export const handleVideo = async (req: IncomingMessage, res: ServerResponse, url: URL) => {
  const filePath = url.searchParams.get('path');

  if (!filePath) {
    return sendError(res, 'File path required', 404);
  }

  if (!isPathAllowed(filePath)) {
    console.warn(`[Security] Blocked unauthorized access: ${filePath}`);
    return sendError(res, 'Access Denied', 403);
  }

  if (!fs.existsSync(filePath)) {
    return sendError(res, 'File not found', 404);
  }

  const ext = path.extname(filePath).toLowerCase();
  const canPlayDirectly = DIRECT_STREAM_EXTENSIONS.has(ext);

  // 1. Transcoding
  // FFmpegがあり、かつダイレクト再生できない形式(MKV, AVI等)の場合のみトランスコードする
  const ffmpegPath = ffmpegService.ffmpegPath;
  if (ffmpegPath && !canPlayDirectly) {
    try {
      const startTimeParam = url.searchParams.get('t');
      const startTime = startTimeParam ? parseFloat(startTimeParam) : 0;

      // console.log(`[Media] Transcoding: ${path.basename(filePath)} @ ${startTime}s`);

      const args = ffmpegService.getTranscodeArgs(filePath, startTime);
      const ffmpegProcess = spawn(ffmpegPath, args);

      res.writeHead(200, {
        'Content-Type': 'video/mp4',
        Connection: 'keep-alive',
      });

      ffmpegProcess.stdout.pipe(res);

      ffmpegProcess.stderr.on('data', () => {}); // Drain buffer

      const cleanup = () => {
        if (ffmpegProcess && !ffmpegProcess.killed) {
          try {
            ffmpegProcess.kill();
          } catch (e) {
            console.error('[Media] Failed to kill FFmpeg:', e);
          }
        }
      };

      req.on('close', cleanup);
      res.on('finish', cleanup);
      return;
    } catch (error) {
      console.error('[Media] Transcode failed:', error);
    }
  }

  // 2. Direct Stream (Fallback or Native)
  try {
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

    // ▼▼▼ 変更: 読み込みバッファサイズを512KBに増やす ▼▼▼
    const HIGH_WATER_MARK = 512 * 1024;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;

      const file = fs.createReadStream(filePath, {
        start,
        end,
        highWaterMark: HIGH_WATER_MARK,
      });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      });

      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
      });
      fs.createReadStream(filePath, { highWaterMark: HIGH_WATER_MARK }).pipe(res);
    }
  } catch (err) {
    console.error('[Media] Stream error:', err);
    sendError(res, 'Internal Server Error');
  }
};