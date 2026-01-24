// electron/core/services/file/file-watcher-service.ts

import { Worker } from 'worker_threads';
import path from 'path';
import { MediaService } from '../media/media-service';
import { FFmpegService } from '../video/ffmpeg-service';
import { logger } from '../../../lib/logger';
import { eventBus } from '../../events';

type WorkerMessage =
  | { type: 'file-added'; path: string }
  | { type: 'file-deleted'; path: string }
  | { type: 'file-changed'; path: string };

export class FileWatcherService {
  private static instance: FileWatcherService;

  private worker: Worker | null = null;
  private mediaService: MediaService;
  private ffmpegService = new FFmpegService();
  private currentWatchedPath: string | null = null;

  private constructor() {
    this.mediaService = new MediaService();
    this.initWorker();
  }

  public static getInstance(): FileWatcherService {
    if (!FileWatcherService.instance) {
      FileWatcherService.instance = new FileWatcherService();
    }
    return FileWatcherService.instance;
  }

  private initWorker() {
    const workerPath = path.join(__dirname, 'worker.js');

    try {
      this.worker = new Worker(workerPath);

      this.worker.on('message', (msg: WorkerMessage) => {
        this.handleWorkerMessage(msg);
      });

      this.worker.on('error', (err) => {
        logger.error('[FileWatcherService] Worker error:', err);
      });

      this.worker.on('exit', (code) => {
        if (code !== 0) {
          logger.error(`[FileWatcherService] Worker stopped with exit code ${code}`);
        }
        this.currentWatchedPath = null;
      });

      logger.debug('[FileWatcherService] Worker initialized');
    } catch (error) {
      logger.error('[FileWatcherService] Failed to initialize worker:', error);
    }
  }

  public async watch(folderPath: string) {
    if (!this.worker) return;

    if (this.currentWatchedPath === folderPath) {
      logger.debug(`[FileWatcherService] Already watching: ${folderPath}`);
      return;
    }

    const hasFFmpeg = await this.ffmpegService.validatePath(
      this.ffmpegService.ffmpegPath,
      'ffmpeg'
    );

    this.currentWatchedPath = folderPath;

    this.worker.postMessage({
      type: 'START_WATCH',
      folderPath,
      enableExtendedExtensions: hasFFmpeg,
    });
  }

  public stop() {
    if (!this.worker) return;

    if (this.currentWatchedPath === null) return;

    this.currentWatchedPath = null;
    this.worker.postMessage({ type: 'STOP_WATCH' });
  }

  private async handleWorkerMessage(msg: WorkerMessage) {
    const normalizedPath = path.normalize(msg.path);

    try {
      switch (msg.type) {
        case 'file-added': {
          logger.debug(`[Watcher] File Added: ${normalizedPath}`);
          const media = await this.mediaService.getMedia(normalizedPath);
          if (media) {
            eventBus.emit('media:added', { id: media.id, path: normalizedPath });
          }
          break;
        }

        case 'file-deleted': {
          logger.debug(`[Watcher] File Deleted: ${normalizedPath}`);

          const result = await this.mediaService.handleFileMissing(normalizedPath);
          if (result === 'recovered') {
            eventBus.emit('media:recovered', { id: '', path: normalizedPath });
            eventBus.emit('media:updated', { id: '', path: normalizedPath });
          } else {
            eventBus.emit('media:deleted', { id: '', path: normalizedPath });
          }
          break;
        }

        case 'file-changed': {
          logger.debug(`[Watcher] File Changed: ${normalizedPath}`);
          const media = await this.mediaService.getMedia(normalizedPath);
          if (media) {
            eventBus.emit('media:updated', { id: media.id, path: normalizedPath });
          }
          break;
        }
      }
    } catch (error) {
      logger.error(`[FileWatcherService] Error handling message ${msg.type}:`, error);
    }
  }
}
