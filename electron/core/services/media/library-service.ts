// electron/core/services/media/library-service.ts

import fs from 'fs/promises';
import { LibraryScanner } from '../file/library-scanner';
import { FileWatcherService } from '../file/file-watcher-service';
import { FileMoveService } from '../file/file-move-service';
import { FFmpegService } from '../video/ffmpeg-service';
import { FileIntegrityService } from '../file/file-integrity-service';
import { MediaRepository } from '../../repositories/media/media-repository';
import { VideoIntegrityRepository } from '../../repositories/media/media-integrity';
import { VideoSearchRepository, SearchOptions } from '../../repositories/media/media-search';
import { FolderRepository } from '../../repositories/system/folder-repository';
import { VideoMapper } from './media-mapper';
import { VideoFile } from '../../../../src/shared/types/video';
import { store } from '../../../lib/store';
import { MoveResponse } from '../../../../src/shared/types/electron';
import { logger } from '../../../lib/logger';
import { eventBus } from '../../events';

export class VideoLibraryService {
  private scanner = new LibraryScanner();
  private watcher = FileWatcherService.getInstance();
  private moveService = new FileMoveService();
  private ffmpegService = new FFmpegService();
  private integrityService = new FileIntegrityService();
  private mediaRepo = new MediaRepository();
  private integrityRepo = new VideoIntegrityRepository();
  private searchRepo = new VideoSearchRepository();
  private folderRepo = new FolderRepository();
  private mapper = new VideoMapper();

  async loadAndWatch(folderPath: string): Promise<VideoFile[]> {
    if (!folderPath) {
      this.watcher.stop();
      return [];
    }

    const videos = await this.scanner.scan(folderPath);

    this.watcher.watch(folderPath);
    return videos;
  }

  async scanQuietly(folderPath: string): Promise<void> {
    if (!folderPath) return;

    const hasChanges = await this.scanner.scanQuietly(folderPath);
    if (hasChanges) {
      logger.info(`[LibraryService] Quiet scan detected changes in: ${folderPath}`);
      eventBus.emit('ui:library-refresh', { force: false });
    }
  }

  async moveVideos(videoPaths: string[], targetFolderPath: string): Promise<MoveResponse> {
    const results = await this.moveService.moveVideos(videoPaths, targetFolderPath);
    let successCount = 0;

    for (const result of results) {
      if (result.success) {
        successCount++;
        try {
          const video = this.mediaRepo.findByPath(result.oldPath);
          if (video) {
            const stat = await fs.stat(result.newPath);
            const mtime = Math.floor(stat.mtimeMs);
            this.integrityRepo.updatePath(video.id, result.newPath, mtime);
            logger.debug(`[DB] Updated path for ID ${video.id}: ${result.newPath}`);

            eventBus.emit('video:updated', { id: video.id, path: result.newPath });
          }
        } catch (e) {
          logger.error(`[DB] Failed to update DB for moved video: ${result.oldPath}`, e);
        }
      }
    }

    return { successCount, results };
  }

  async normalizeVideo(filePath: string): Promise<VideoFile | null> {
    const outputPath = await this.ffmpegService.normalizeVideo(filePath);
    if (!outputPath) return null;
    return this.integrityService.processNewFile(outputPath);
  }

  searchVideos(query: string, tagIds: string[], options: SearchOptions): VideoFile[] {
    try {
      if (!options.folderPath) {
        const libraryFolders = (store.get('libraryFolders') as string[]) || [];
        options.allowedRoots = libraryFolders;
      }

      const rows = this.searchRepo.search(query, tagIds, options);
      return this.mapper.toEntities(rows);
    } catch (error) {
      logger.error('[VideoLibraryService] Search failed:', error);
      return [];
    }
  }

  saveFolderOrder(folderPath: string, videoPaths: string[]): void {
    this.folderRepo.saveSortOrder(folderPath, videoPaths);
  }

  getFolderOrder(folderPath: string): string[] {
    return this.folderRepo.getSortOrder(folderPath);
  }
}
