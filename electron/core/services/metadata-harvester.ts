// electron/core/services/metadata-harvester.ts

import { VideoRepository, VideoRow } from '../repositories/video-repository';
import { VideoMetadataRepository } from '../repositories/video-metadata-repository';
import { FFmpegService } from './ffmpeg-service';
import { NotificationService } from './notification-service';
import { logger } from '../../lib/logger';

export class MetadataHarvester {
  private static instance: MetadataHarvester;

  private videoRepo = new VideoRepository();
  private metaRepo = new VideoMetadataRepository();
  private ffmpegService = new FFmpegService();
  private notifier = NotificationService.getInstance();

  private isRunning = false;
  private isProcessing = false;

  private onDemandQueue: string[] = [];

  private batchQueue: VideoRow[] = [];

  private readonly BATCH_SIZE = 50;
  private readonly PROCESS_INTERVAL = 200;
  private readonly IDLE_INTERVAL = 10000;

  private constructor() {
    this.startLoop();
  }

  public static getInstance(): MetadataHarvester {
    if (!MetadataHarvester.instance) {
      MetadataHarvester.instance = new MetadataHarvester();
    }
    return MetadataHarvester.instance;
  }

  public requestHarvest(videoId: string) {
    this.onDemandQueue = this.onDemandQueue.filter((id) => id !== videoId);
    this.onDemandQueue.unshift(videoId);

    if (!this.isProcessing) {
      this.tick();
    }
  }

  public stop() {
    this.isRunning = false;
  }

  private startLoop() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const stuckCount = this.metaRepo.resetStuckProcessingStatus();
      if (stuckCount > 0) {
        logger.debug(
          `[MetadataHarvester] Reset ${stuckCount} stuck 'processing' videos to 'pending'.`
        );
      }
    } catch (e) {
      logger.error('[MetadataHarvester] Failed to reset stuck processing status:', e);
    }

    try {
      const resetCount = this.metaRepo.resetIncompleteMetadataStatus();
      if (resetCount > 0) {
        logger.debug(
          `[MetadataHarvester] Scheduled ${resetCount} incomplete videos for re-scanning (FPS/Codec update).`
        );
      }
    } catch (e) {
      logger.error('[MetadataHarvester] Failed to reset incomplete metadata:', e);
    }

    logger.debug('[MetadataHarvester] Service started (Batch Mode).');
    this.tick();
  }

  private async tick() {
    if (!this.isRunning) return;

    if (!this.ffmpegService.ffprobePath) {
      setTimeout(() => this.tick(), this.IDLE_INTERVAL);
      return;
    }

    this.isProcessing = true;

    try {
      let target: VideoRow | undefined;
      let isHighPriority = false;

      if (this.onDemandQueue.length > 0) {
        const id = this.onDemandQueue.shift()!;
        target = this.videoRepo.findById(id);

        if (target && target.metadata_status === 'completed') {
          this.tick();
          return;
        }
        isHighPriority = true;
      }

      if (!target) {
        if (this.batchQueue.length === 0) {
          this.batchQueue = this.metaRepo.getPendingVideos(this.BATCH_SIZE);
          if (this.batchQueue.length > 0) {
            logger.debug(
              `[MetadataHarvester] Refilled batch queue: ${this.batchQueue.length} items.`
            );
          }
        }

        if (this.batchQueue.length === 0) {
          this.isProcessing = false;
          setTimeout(() => this.tick(), this.IDLE_INTERVAL);
          return;
        }

        target = this.batchQueue.shift();
      }

      if (!target) {
        this.tick();
        return;
      }

      await this.processVideo(target);

      const nextDelay = isHighPriority ? 0 : this.PROCESS_INTERVAL;
      setTimeout(() => this.tick(), nextDelay);
    } catch (error) {
      logger.error('[MetadataHarvester] Loop error:', error);
      setTimeout(() => this.tick(), this.IDLE_INTERVAL);
    }
  }

  private async processVideo(target: VideoRow) {
    const current = this.videoRepo.findById(target.id);
    if (!current || current.status !== 'available') return;

    logger.debug(`[MetadataHarvester] Harvesting: ${target.name}`);
    this.metaRepo.updateMetadataStatus(target.id, 'processing');

    const metadata = await this.ffmpegService.extractMetadata(target.path);

    if (metadata) {
      const params = JSON.stringify(metadata.tags || {});
      this.metaRepo.updateGenerationParams(target.id, params);

      const d = metadata.duration || target.duration || 0;
      const w = metadata.width || target.width || 0;
      const h = metadata.height || target.height || 0;
      const fps = metadata.fps;
      const codec = metadata.codec;

      if (d > 0 || w > 0 || h > 0 || fps || codec) {
        this.metaRepo.updateMetadata(target.path, d, w, h, fps, codec);
      }

      this.notifyFrontend(target.path);
    } else {
      this.metaRepo.updateMetadataStatus(target.id, 'failed');
    }
  }

  private notifyFrontend(videoPath: string) {
    const event = { type: 'update' as const, path: videoPath };
    this.notifier.notify(event);
  }
}
