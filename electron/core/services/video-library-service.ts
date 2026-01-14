// electron/core/services/video-library-service.ts

import fs from 'fs/promises';
import { LibraryScanner } from './library-scanner';
import { FileWatcherService } from './file-watcher-service';
import { FileMoveService } from './file-move-service';
import { FFmpegService } from './ffmpeg-service';
import { FileIntegrityService } from './file-integrity-service';
import { VideoRepository } from '../repositories/video-repository';
import { VideoIntegrityRepository } from '../repositories/video-integrity-repository';
import { VideoSearchRepository, SearchOptions } from '../repositories/video-search-repository';
import { FolderRepository } from '../repositories/folder-repository';
import { VideoMapper } from './video-mapper';
import { VideoFile } from '../../../src/shared/types/video';
import { store } from '../../lib/store';
import { MoveResponse } from '../../../src/shared/types/electron';
import { logger } from '../../lib/logger';

export class VideoLibraryService {
  private scanner = new LibraryScanner();
  private watcher = FileWatcherService.getInstance();
  private moveService = new FileMoveService();
  private ffmpegService = new FFmpegService();
  private integrityService = new FileIntegrityService();
  private videoRepo = new VideoRepository();
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
    await this.scanner.scanQuietly(folderPath);
  }

  async moveVideos(videoPaths: string[], targetFolderPath: string): Promise<MoveResponse> {
    const results = await this.moveService.moveVideos(videoPaths, targetFolderPath);
    let successCount = 0;

    for (const result of results) {
      if (result.success) {
        successCount++;
        try {
          const video = this.videoRepo.findByPath(result.oldPath);
          if (video) {
            const stat = await fs.stat(result.newPath);
            const mtime = Math.floor(stat.mtimeMs);
            this.integrityRepo.updatePath(video.id, result.newPath, mtime);
            logger.debug(`[DB] Updated path for ID ${video.id}: ${result.newPath}`);
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
