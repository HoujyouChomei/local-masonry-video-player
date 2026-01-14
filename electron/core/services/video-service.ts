// electron/core/services/video-service.ts

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { shell } from 'electron';
import { VideoRepository } from '../repositories/video-repository';
import { VideoIntegrityRepository } from '../repositories/video-integrity-repository';
import { VideoMetadataRepository } from '../repositories/video-metadata-repository';
import { VideoFile } from '../../../src/shared/types/video';
import { LibraryScanner } from './library-scanner';
import { FileIntegrityService } from './file-integrity-service';
import { VideoMapper } from './video-mapper';
import { logger } from '../../lib/logger';

export class VideoService {
  private videoRepo = new VideoRepository();
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

  async ensureVideoExists(videoPath: string): Promise<string> {
    const existing = this.videoRepo.findByPath(videoPath);
    if (existing) return existing.id;

    try {
      const stat = await fs.stat(videoPath);
      const id = crypto.randomUUID();
      const name = path.basename(videoPath);

      this.videoRepo.create({
        id,
        path: videoPath,
        name,
        size: stat.size,
        mtime: Math.floor(stat.mtimeMs),
        created_at: Date.now(),
        ino: Number(stat.ino),
      });
      return id;
    } catch (e) {
      logger.warn(`ensureVideoExists failed for: ${videoPath}`, e);
      const id = crypto.randomUUID();
      const name = path.basename(videoPath);

      this.videoRepo.create({
        id,
        path: videoPath,
        name,
        size: 0,
        mtime: Date.now(),
        created_at: Date.now(),
        ino: null,
      });
      return id;
    }
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

    const videoRow = this.videoRepo.findById(id);
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

      const updatedRow = this.videoRepo.findById(videoRow.id);
      return updatedRow ? this.mapper.toEntity(updatedRow) : null;
    } catch (error) {
      logger.error(`Failed to rename video: ${oldPath} -> ${newPath}`, error);
      throw error;
    }
  }

  async deleteVideo(id: string): Promise<boolean> {
    const videoRow = this.videoRepo.findById(id);
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
    const videoRow = this.videoRepo.findById(id);
    if (!videoRow) {
      return;
    }
    this.metaRepo.updateMetadata(videoRow.path, duration, width, height);
  }

  async revealInExplorer(id: string): Promise<void> {
    const videoRow = this.videoRepo.findById(id);
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
