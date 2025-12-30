// electron/core/services/metadata-harvester.ts

import { BrowserWindow } from 'electron';
import { VideoRepository, VideoRow } from '../repositories/video-repository';
import { VideoMetadataRepository } from '../repositories/video-metadata-repository';
import { FFmpegService } from './ffmpeg-service';

export class MetadataHarvester {
  private static instance: MetadataHarvester;

  private videoRepo = new VideoRepository();
  private metaRepo = new VideoMetadataRepository();
  private ffmpegService = new FFmpegService();

  private isRunning = false;
  private isProcessing = false;

  // 優先キュー (ユーザーがクリックした動画用)
  private onDemandQueue: string[] = [];

  // バッチキュー (バックグラウンド処理用)
  private batchQueue: VideoRow[] = [];

  // 設定
  private readonly BATCH_SIZE = 50; // 一度にDBから取得する件数
  private readonly PROCESS_INTERVAL = 200; // 処理間の休憩 (CPU負荷軽減)
  private readonly IDLE_INTERVAL = 10000; // 何もない時の待機時間

  private constructor() {
    this.startLoop();
  }

  public static getInstance(): MetadataHarvester {
    if (!MetadataHarvester.instance) {
      MetadataHarvester.instance = new MetadataHarvester();
    }
    return MetadataHarvester.instance;
  }

  /**
   * 特定の動画を最優先で処理する (On-Demand)
   */
  public requestHarvest(videoId: string) {
    // 重複排除して先頭に追加
    this.onDemandQueue = this.onDemandQueue.filter((id) => id !== videoId);
    this.onDemandQueue.unshift(videoId);

    // アイドル中なら即座にループを回す
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

    // 不完全なデータの再スキャンを予約
    try {
      const resetCount = this.metaRepo.resetIncompleteMetadataStatus();
      if (resetCount > 0) {
        console.log(
          `[MetadataHarvester] Scheduled ${resetCount} incomplete videos for re-scanning (FPS/Codec update).`
        );
      }
    } catch (e) {
      console.error('[MetadataHarvester] Failed to reset incomplete metadata:', e);
    }

    console.log('[MetadataHarvester] Service started (Batch Mode).');
    this.tick();
  }

  /**
   * メインループ (再帰呼び出し)
   */
  private async tick() {
    if (!this.isRunning) return;

    // FFprobeが無効なら、長い待機に入って再チェック
    if (!this.ffmpegService.ffprobePath) {
      setTimeout(() => this.tick(), this.IDLE_INTERVAL);
      return;
    }

    this.isProcessing = true;

    try {
      // 1. ターゲットの決定
      let target: VideoRow | undefined;
      let isHighPriority = false;

      // Priority 1: オンデマンドキュー
      if (this.onDemandQueue.length > 0) {
        const id = this.onDemandQueue.shift()!;
        target = this.videoRepo.findById(id);

        if (target && target.metadata_status === 'completed') {
          this.tick();
          return;
        }
        isHighPriority = true;
      }

      // Priority 2: バッチキュー (オンデマンドがない場合)
      if (!target) {
        // バッチキューが空なら補充
        if (this.batchQueue.length === 0) {
          this.batchQueue = this.metaRepo.getPendingVideos(this.BATCH_SIZE);
          if (this.batchQueue.length > 0) {
            console.log(
              `[MetadataHarvester] Refilled batch queue: ${this.batchQueue.length} items.`
            );
          }
        }

        // 補充しても空なら、処理するものが何もない -> アイドル待機
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

      // 2. 処理実行
      await this.processVideo(target);

      // 3. 次のループへ
      const nextDelay = isHighPriority ? 0 : this.PROCESS_INTERVAL;
      setTimeout(() => this.tick(), nextDelay);
    } catch (error) {
      console.error('[MetadataHarvester] Loop error:', error);
      setTimeout(() => this.tick(), this.IDLE_INTERVAL);
    }
  }

  /**
   * 個別の動画処理ロジック
   */
  private async processVideo(target: VideoRow) {
    const current = this.videoRepo.findById(target.id);
    if (!current || current.status !== 'available') return;

    console.log(`[MetadataHarvester] Harvesting: ${target.name}`);
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
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('on-video-update', {
        type: 'update',
        path: videoPath,
      });
    }
  }
}
