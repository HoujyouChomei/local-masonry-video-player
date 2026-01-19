// electron/core/services/media/media-service.ts

import fs from 'fs/promises';
import path from 'path';
import { shell } from 'electron';
import { MediaRepository } from '../../repositories/media/media-repository';
import { VideoIntegrityRepository } from '../../repositories/media/media-integrity';
import { VideoMetadataRepository } from '../../repositories/media/media-metadata';
import { VideoFile } from '../../../../src/shared/types/video';
import { LibraryScanner } from '../file/library-scanner';
import { FileIntegrityService } from '../file/file-integrity-service';
import { VideoMapper } from './media-mapper';
import { logger } from '../../../lib/logger';
import { eventBus } from '../../events';

export class VideoService {
  private mediaRepo = new MediaRepository();
  private integrityRepo = new VideoIntegrityRepository();
  private metaRepo = new VideoMetadataRepository();
  private scanner = new LibraryScanner();
  private integrityService = new FileIntegrityService();
  private mapper = new VideoMapper();

  async scanFolder(folderPath: string): Promise<VideoFile[]> {
    return this.scanner.scan(folderPath);
  }

  async getVideo(filePath: string): Promise<VideoFile | null> {
    return this.integrityService.processNewFile(filePath);
  }

  async renameVideo(id: string, newFileName: string): Promise<VideoFile | null> {
    if (!newFileName || newFileName.trim() === '') {
      throw new Error('Filename cannot be empty');
    }

    // eslint-disable-next-line no-control-regex
    const invalidChars = /[<>:"/\\|?*\x00-\x1F]/;
    if (invalidChars.test(newFileName)) {
      throw new Error('Filename contains invalid characters');
    }

    const videoRow = this.mediaRepo.findById(id);
    if (!videoRow) {
      logger.warn(`Rename skipped: video not found in DB (ID: ${id})`);
      return null;
    }

    const oldPath = videoRow.path;
    const dir = path.dirname(oldPath);
    const oldExt = path.extname(oldPath);
    const finalFileName = newFileName.endsWith(oldExt) ? newFileName : `${newFileName}${oldExt}`;
    const newPath = path.join(dir, finalFileName);

    if (oldPath === newPath) return this.mapper.toEntity(videoRow);

    try {
      await fs.rename(oldPath, newPath);

      const stat = await fs.stat(newPath);
      const mtime = Math.floor(stat.mtimeMs);

      this.integrityRepo.updatePath(videoRow.id, newPath, mtime);

      const updatedRow = this.mediaRepo.findById(videoRow.id);

      if (updatedRow) {
        eventBus.emit('video:updated', { id: updatedRow.id, path: updatedRow.path });
      }

      return updatedRow ? this.mapper.toEntity(updatedRow) : null;
    } catch (error) {
      logger.error(`Failed to rename video: ${oldPath} -> ${newPath}`, error);
      throw error;
    }
  }

  async deleteVideo(id: string): Promise<boolean> {
    const videoRow = this.mediaRepo.findById(id);
    if (!videoRow) {
      logger.warn(`Delete skipped: video not found (ID: ${id})`);
      return false;
    }

    const filePath = videoRow.path;

    try {
      try {
        await shell.trashItem(filePath);
      } catch (e) {
        logger.warn('File already deleted or access denied.', e);
      }

      await this.integrityService.markAsMissingById(id);

      eventBus.emit('video:deleted', { id, path: filePath });

      return true;
    } catch (error) {
      logger.error(`Failed to delete video: ${filePath}`, error);
      return false;
    }
  }

  async handleFileMissing(filePath: string): Promise<'recovered' | 'missing'> {
    logger.debug(`[VideoService] Handle Missing: ${filePath}`);
    await this.integrityService.markAsMissing(filePath);
    const recovered = await this.integrityService.verifyAndRecover([filePath]);

    if (recovered) {
      logger.debug(`[VideoService] File recovered (moved): ${filePath}`);
      return 'recovered';
    } else {
      logger.debug(`[VideoService] File verified missing: ${filePath}`);
      return 'missing';
    }
  }

  async updateMetadata(id: string, duration: number, width: number, height: number): Promise<void> {
    const videoRow = this.mediaRepo.findById(id);
    if (!videoRow) {
      return;
    }
    this.metaRepo.updateMetadata(videoRow.path, duration, width, height);
    eventBus.emit('video:updated', { id: videoRow.id, path: videoRow.path });
  }

  async revealInExplorer(id: string): Promise<void> {
    const videoRow = this.mediaRepo.findById(id);
    if (!videoRow) {
      logger.warn(`Reveal skipped: video not found (ID: ${id})`);
      return;
    }
    shell.showItemInFolder(videoRow.path);
  }

  runGarbageCollection(): void {
    const retentionDays = 30;
    const deletedCount = this.integrityRepo.deleteExpiredMissingVideos(retentionDays);
    if (deletedCount > 0) {
      logger.debug(`[VideoService] Garbage Collection complete. Removed ${deletedCount} records.`);
    }
  }
}
