// electron/core/services/file-watcher-service.ts

import { Worker } from 'worker_threads';
import path from 'path';
import { VideoService } from './video-service';
import { FFmpegService } from './ffmpeg-service';
import { NotificationService } from './notification-service';

type WorkerMessage =
  | { type: 'file-added'; path: string }
  | { type: 'file-deleted'; path: string }
  | { type: 'file-changed'; path: string };

export class FileWatcherService {
  private static instance: FileWatcherService;

  private worker: Worker | null = null;
  private videoService: VideoService;
  private ffmpegService = new FFmpegService();
  private notifier = NotificationService.getInstance();

  private constructor() {
    this.videoService = new VideoService();
    this.initWorker();
  }

  public static getInstance(): FileWatcherService {
    if (!FileWatcherService.instance) {
      FileWatcherService.instance = new FileWatcherService();
    }
    return FileWatcherService.instance;
  }

  private initWorker() {
    const workerPath = path.join(__dirname, '../../workers/file-watcher.worker.js');

    try {
      this.worker = new Worker(workerPath);

      this.worker.on('message', (msg: WorkerMessage) => {
        this.handleWorkerMessage(msg);
      });

      this.worker.on('error', (err) => {
        console.error('[FileWatcherService] Worker error:', err);
      });

      this.worker.on('exit', (code) => {
        if (code !== 0) {
          console.error(`[FileWatcherService] Worker stopped with exit code ${code}`);
        }
      });

      console.log('[FileWatcherService] Worker initialized');
    } catch (error) {
      console.error('[FileWatcherService] Failed to initialize worker:', error);
    }
  }

  public async watch(folderPath: string) {
    if (!this.worker) return;

    const hasFFmpeg = await this.ffmpegService.validatePath(
      this.ffmpegService.ffmpegPath,
      'ffmpeg'
    );

    this.worker.postMessage({
      type: 'START_WATCH',
      folderPath,
      enableExtendedExtensions: hasFFmpeg,
    });
  }

  public stop() {
    if (!this.worker) return;
    this.worker.postMessage({ type: 'STOP_WATCH' });
  }

  private async handleWorkerMessage(msg: WorkerMessage) {
    const normalizedPath = path.normalize(msg.path);

    try {
      let event: { type: 'add' | 'delete' | 'update'; path: string } | null = null;

      switch (msg.type) {
        case 'file-added':
          console.log(`[Watcher] File Added: ${normalizedPath}`);
          await this.videoService.getVideo(normalizedPath);
          event = { type: 'add', path: normalizedPath };
          break;

        case 'file-deleted': {
          console.log(`[Watcher] File Deleted: ${normalizedPath}`);
          const result = await this.videoService.handleFileMissing(normalizedPath);
          if (result === 'recovered') {
            event = { type: 'update', path: normalizedPath };
          } else {
            event = { type: 'delete', path: normalizedPath };
          }
          break;
        }

        case 'file-changed':
          console.log(`[Watcher] File Changed: ${normalizedPath}`);
          await this.videoService.getVideo(normalizedPath);
          event = { type: 'update', path: normalizedPath };
          break;
      }

      if (event) {
        this.notifier.notify(event);
      }
    } catch (error) {
      console.error(`[FileWatcherService] Error handling message ${msg.type}:`, error);
    }
  }
}
