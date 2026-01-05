// electron/core/services/thumbnail-service.ts

import { app, nativeImage } from 'electron';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { FFmpegService } from './ffmpeg-service';
import { NATIVE_EXTENSIONS } from '../../lib/extensions';
import { THUMBNAIL } from '../../../src/shared/constants/assets';
import { NotificationService } from './notification-service';

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
  private notifier = NotificationService.getInstance();

  private constructor() {
    this.thumbDir = path.join(app.getPath('userData'), THUMBNAIL.DIR_NAME);
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
      const thumbPath = path.join(this.thumbDir, `${hash}${THUMBNAIL.EXTENSION}`);

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
      const thumbPath = path.join(this.thumbDir, `${hash}${THUMBNAIL.EXTENSION}`);

      if (!force && fs.existsSync(thumbPath)) {
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const isNativeSupported = NATIVE_EXTENSIONS.has(ext);

      let success = false;

      // 1. Native
      if (isNativeSupported) {
        try {
          const image = await nativeImage.createThumbnailFromPath(filePath, {
            width: THUMBNAIL.WIDTH,
            height: THUMBNAIL.HEIGHT,
          });
          if (!image.isEmpty()) {
            const jpegBuffer = image.toJPEG(THUMBNAIL.QUALITY);
            await fs.promises.writeFile(thumbPath, jpegBuffer);
            success = true;
          }
        } catch {
          // Fallback
        }
      }

      // 2. FFmpeg
      if (!success) {
        success = await this.ffmpegService.generateThumbnail(filePath, thumbPath);
      }

      if (success) {
        const event = { type: 'thumbnail' as const, path: filePath };
        this.notifier.notify(event);
      }
    } catch (error) {
      console.warn(`[ThumbnailService] Failed to generate for ${filePath}`, error);
    }
  }
}
