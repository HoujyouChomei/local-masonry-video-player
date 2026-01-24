// electron/core/services/media/library-service.ts

import fs from 'fs/promises';
import { LibraryScanner } from '../file/library-scanner';
import { FileWatcherService } from '../file/file-watcher-service';
import { FileMoveService } from '../file/file-move-service';
import { FFmpegService } from '../video/ffmpeg-service';
import { FileIntegrityService } from '../file/file-integrity-service';
import { MediaRepository } from '../../repositories/media/media-repository';
import { MediaIntegrityRepository } from '../../repositories/media/media-integrity';
import { MediaSearchRepository, SearchOptions } from '../../repositories/media/media-search';
import { FolderRepository } from '../../repositories/system/folder-repository';
import { MediaMapper } from './media-mapper';
import { Media } from '../../../../src/shared/schemas/media';
import { store } from '../../../lib/store';
import { MoveResponse } from '../../../../src/shared/types/electron';
import { logger } from '../../../lib/logger';
import { eventBus } from '../../events';

export class LibraryService {
  private scanner = new LibraryScanner();
  private watcher = FileWatcherService.getInstance();
  private moveService = new FileMoveService();
  private ffmpegService = new FFmpegService();
  private integrityService = new FileIntegrityService();
  private mediaRepo = new MediaRepository();
  private integrityRepo = new MediaIntegrityRepository();
  private searchRepo = new MediaSearchRepository();
  private folderRepo = new FolderRepository();
  private mapper = new MediaMapper();

  async loadAndWatch(folderPath: string): Promise<Media[]> {
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

  async moveMedia(mediaPaths: string[], targetFolderPath: string): Promise<MoveResponse> {
    const results = await this.moveService.moveMedia(mediaPaths, targetFolderPath);
    let successCount = 0;

    for (const result of results) {
      if (result.success) {
        successCount++;
        try {
          const media = this.mediaRepo.findByPath(result.oldPath);
          if (media) {
            const stat = await fs.stat(result.newPath);
            const mtime = Math.floor(stat.mtimeMs);
            this.integrityRepo.updatePath(media.id, result.newPath, mtime);
            logger.debug(`[DB] Updated path for ID ${media.id}: ${result.newPath}`);

            eventBus.emit('media:updated', { id: media.id, path: result.newPath });
          }
        } catch (e) {
          logger.error(`[DB] Failed to update DB for moved media: ${result.oldPath}`, e);
        }
      }
    }

    return { successCount, results };
  }

  async normalizeVideo(filePath: string): Promise<Media | null> {
    const outputPath = await this.ffmpegService.normalizeVideo(filePath);
    if (!outputPath) return null;
    return this.integrityService.processNewFile(outputPath);
  }

  searchMedia(query: string, tagIds: string[], options: SearchOptions): Media[] {
    try {
      if (!options.folderPath) {
        const libraryFolders = (store.get('libraryFolders') as string[]) || [];
        options.allowedRoots = libraryFolders;
      }

      const rows = this.searchRepo.search(query, tagIds, options);
      return this.mapper.toEntities(rows);
    } catch (error) {
      logger.error('[LibraryService] Search failed:', error);
      return [];
    }
  }

  saveFolderOrder(folderPath: string, mediaPaths: string[]): void {
    this.folderRepo.saveSortOrder(folderPath, mediaPaths);
  }

  getFolderOrder(folderPath: string): string[] {
    return this.folderRepo.getSortOrder(folderPath);
  }
}
