// electron/core/services/media/media-service.ts

import fs from 'fs/promises';
import path from 'path';
import { shell } from 'electron';
import { MediaRepository } from '../../repositories/media/media-repository';
import { MediaIntegrityRepository } from '../../repositories/media/media-integrity';
import { MediaMetadataRepository } from '../../repositories/media/media-metadata';
import { Media } from '../../../../src/shared/schemas/media';
import { LibraryScanner } from '../file/library-scanner';
import { FileIntegrityService } from '../file/file-integrity-service';
import { MediaMapper } from './media-mapper';
import { logger } from '../../../lib/logger';
import { eventBus } from '../../events';

export class MediaService {
  private mediaRepo = new MediaRepository();
  private integrityRepo = new MediaIntegrityRepository();
  private metaRepo = new MediaMetadataRepository();
  private scanner = new LibraryScanner();
  private integrityService = new FileIntegrityService();
  private mapper = new MediaMapper();

  async scanFolder(folderPath: string): Promise<Media[]> {
    return this.scanner.scan(folderPath);
  }

  async getMedia(filePath: string): Promise<Media | null> {
    return this.integrityService.processNewFile(filePath);
  }

  async renameMedia(id: string, newFileName: string): Promise<Media | null> {
    if (!newFileName || newFileName.trim() === '') {
      throw new Error('Filename cannot be empty');
    }

    // eslint-disable-next-line no-control-regex
    const invalidChars = /[<>:"/\\|?*\x00-\x1F]/;
    if (invalidChars.test(newFileName)) {
      throw new Error('Filename contains invalid characters');
    }

    const mediaRow = this.mediaRepo.findById(id);
    if (!mediaRow) {
      logger.warn(`Rename skipped: media not found in DB (ID: ${id})`);
      return null;
    }

    const oldPath = mediaRow.path;
    const dir = path.dirname(oldPath);
    const oldExt = path.extname(oldPath);
    const finalFileName = newFileName.endsWith(oldExt) ? newFileName : `${newFileName}${oldExt}`;
    const newPath = path.join(dir, finalFileName);

    if (oldPath === newPath) return this.mapper.toEntity(mediaRow);

    try {
      await fs.rename(oldPath, newPath);

      const stat = await fs.stat(newPath);
      const mtime = Math.floor(stat.mtimeMs);

      this.integrityRepo.updatePath(mediaRow.id, newPath, mtime);

      const updatedRow = this.mediaRepo.findById(mediaRow.id);

      if (updatedRow) {
        eventBus.emit('media:updated', { id: updatedRow.id, path: updatedRow.path });
      }

      return updatedRow ? this.mapper.toEntity(updatedRow) : null;
    } catch (error) {
      logger.error(`Failed to rename media: ${oldPath} -> ${newPath}`, error);
      throw error;
    }
  }

  async deleteMedia(id: string): Promise<boolean> {
    const mediaRow = this.mediaRepo.findById(id);
    if (!mediaRow) {
      logger.warn(`Delete skipped: media not found (ID: ${id})`);
      return false;
    }

    const filePath = mediaRow.path;

    try {
      try {
        await shell.trashItem(filePath);
      } catch (e) {
        logger.warn('File already deleted or access denied.', e);
      }

      await this.integrityService.markAsMissingById(id);

      eventBus.emit('media:deleted', { id, path: filePath });

      return true;
    } catch (error) {
      logger.error(`Failed to delete media: ${filePath}`, error);
      return false;
    }
  }

  async handleFileMissing(filePath: string): Promise<'recovered' | 'missing'> {
    logger.debug(`[MediaService] Handle Missing: ${filePath}`);
    await this.integrityService.markAsMissing(filePath);
    const recovered = await this.integrityService.verifyAndRecover([filePath]);

    if (recovered) {
      logger.debug(`[MediaService] File recovered (moved): ${filePath}`);
      return 'recovered';
    } else {
      logger.debug(`[MediaService] File verified missing: ${filePath}`);
      return 'missing';
    }
  }

  async updateMetadata(id: string, duration: number, width: number, height: number): Promise<void> {
    const mediaRow = this.mediaRepo.findById(id);
    if (!mediaRow) {
      return;
    }
    this.metaRepo.updateMetadata(mediaRow.path, duration, width, height);
    eventBus.emit('media:updated', { id: mediaRow.id, path: mediaRow.path });
  }

  async revealInExplorer(id: string): Promise<void> {
    const mediaRow = this.mediaRepo.findById(id);
    if (!mediaRow) {
      logger.warn(`Reveal skipped: media not found (ID: ${id})`);
      return;
    }
    shell.showItemInFolder(mediaRow.path);
  }

  runGarbageCollection(): void {
    const retentionDays = 30;
    const deletedCount = this.integrityRepo.deleteExpiredMissingMedia(retentionDays);
    if (deletedCount > 0) {
      logger.debug(`[MediaService] Garbage Collection complete. Removed ${deletedCount} records.`);
    }
  }
}
