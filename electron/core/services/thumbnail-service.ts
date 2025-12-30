// electron/core/services/thumbnail-service.ts

import { app, nativeImage, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { FFmpegService } from './ffmpeg-service';
import { NATIVE_EXTENSIONS } from '../../lib/extensions'; // Import

interface QueueItem {
  path: string;
  force: boolean;
}

export class ThumbnailService {
  private static instance: ThumbnailService;

  private queue: QueueItem[] = [];
  private isProcessing = false;
  private thumbDir: string;
  private ffmpegService = new FFmpegService();

  private constructor() {
    this.thumbDir = path.join(app.getPath('userData'), 'thumbnails');
    if (!fs.existsSync(this.thumbDir)) {
      fs.mkdirSync(this.thumbDir, { recursive: true });
    }
  }

  public static getInstance(): ThumbnailService {
    if (!ThumbnailService.instance) {
      ThumbnailService.instance = new ThumbnailService();
    }
    return ThumbnailService.instance;
  }

  public deleteThumbnail(videoPath: string): void {
    try {
      const hash = crypto.createHash('md5').update(videoPath).digest('hex');
      const thumbPath = path.join(this.thumbDir, `${hash}.jpg`);

      if (fs.existsSync(thumbPath)) {
        fs.unlinkSync(thumbPath);
        console.log(`[ThumbnailService] Deleted thumbnail for: ${path.basename(videoPath)}`);
      }
    } catch (error) {
      console.warn(`[ThumbnailService] Failed to delete thumbnail for: ${videoPath}`, error);
    }
  }

  public addToQueue(videoPaths: string[], force = false) {
    for (const p of videoPaths) {
      const existingIndex = this.queue.findIndex((item) => item.path === p);

      if (existingIndex !== -1) {
        if (force) {
          this.queue[existingIndex].force = true;
        }
      } else {
        this.queue.push({ path: p, force });
      }
    }

    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const item = this.queue.shift();

        if (item) {
          await this.generateThumbnail(item.path, item.force);
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('[ThumbnailService] Error during processing:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async generateThumbnail(filePath: string, force: boolean): Promise<void> {
    try {
      const hash = crypto.createHash('md5').update(filePath).digest('hex');
      const thumbPath = path.join(this.thumbDir, `${hash}.jpg`);

      if (!force && fs.existsSync(thumbPath)) {
        return;
      }

      // ▼▼▼ 修正: 拡張子によるルーティング ▼▼▼
      const ext = path.extname(filePath).toLowerCase();
      // .mp4, .webm 等が含まれるかチェック
      const isNativeSupported = NATIVE_EXTENSIONS.has(ext);

      let success = false;

      // 1. Native対応形式なら、まずNative生成を試す (高速)
      if (isNativeSupported) {
        try {
          const image = await nativeImage.createThumbnailFromPath(filePath, {
            width: 480,
            height: 270,
          });
          if (!image.isEmpty()) {
            const jpegBuffer = image.toJPEG(80);
            await fs.promises.writeFile(thumbPath, jpegBuffer);
            success = true;
          }
        } catch {
          // 失敗したらログを出してFFmpegへフォールバック
          // console.warn(`[ThumbnailService] Native generation failed for supported format: ${filePath}`);
        }
      }

      // 2. Native非対応、またはNative生成に失敗した場合はFFmpegを使用
      if (!success) {
        // console.log(`[ThumbnailService] Using FFmpeg for: ${path.basename(filePath)}`);
        success = await this.ffmpegService.generateThumbnail(filePath, thumbPath);

        if (success) {
          // FFmpegで生成できた場合はフロントエンドに通知
          const mainWindow = BrowserWindow.getAllWindows()[0];
          mainWindow?.webContents.send('on-video-update', { type: 'thumbnail', path: filePath });
        }
      }
    } catch (error) {
      console.warn(`[ThumbnailService] Failed to generate for ${filePath}`, error);
    }
  }
}
