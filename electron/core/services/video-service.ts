// electron/core/services/video-service.ts

import fs from 'fs/promises';
// import { statSync } from 'fs'; // 削除済み (前回の修正で非同期化したため)
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

export class VideoService {
  private videoRepo = new VideoRepository();
  private integrityRepo = new VideoIntegrityRepository();
  private metaRepo = new VideoMetadataRepository();
  private scanner = new LibraryScanner();
  private integrityService = new FileIntegrityService();
  private mapper = new VideoMapper();

  // ... (scanFolder, getVideo, ensureVideoExists は変更なし) ...

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
      console.warn(`ensureVideoExists failed for: ${videoPath}`, e);
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

  // ▼▼▼ 修正: バリデーションを追加 ▼▼▼
  async renameVideo(oldPath: string, newFileName: string): Promise<VideoFile | null> {
    // 1. バリデーション
    if (!newFileName || newFileName.trim() === '') {
      throw new Error('Filename cannot be empty');
    }

    // Windows/Unix共通の禁止文字 + 制御文字
    // < > : " / \ | ? *
    const invalidChars = /[<>:"/\\|?*\x00-\x1F]/;
    if (invalidChars.test(newFileName)) {
      throw new Error('Filename contains invalid characters');
    }

    const videoRow = this.videoRepo.findByPath(oldPath);
    if (!videoRow) {
      console.warn(`Rename skipped: video not found in DB (${oldPath})`);
      return null;
    }

    const dir = path.dirname(oldPath);
    const oldExt = path.extname(oldPath);
    // 拡張子の二重付与防止 & 拡張子維持
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
      console.error(`Failed to rename video: ${oldPath} -> ${newPath}`, error);
      throw error;
    }
  }

  async deleteVideo(filePath: string): Promise<boolean> {
    try {
      try {
        await shell.trashItem(filePath);
      } catch (e) {
        console.warn('File already deleted or access denied.', e);
      }

      await this.integrityService.markAsMissing(filePath);
      return true;
    } catch (error) {
      console.error(`Failed to delete video: ${filePath}`, error);
      return false;
    }
  }

  async handleFileMissing(filePath: string): Promise<'recovered' | 'missing'> {
    console.log(`[VideoService] Handle Missing: ${filePath}`);
    await this.integrityService.markAsMissing(filePath);
    const recovered = await this.integrityService.verifyAndRecover([filePath]);

    if (recovered) {
      console.log(`[VideoService] File recovered (moved): ${filePath}`);
      return 'recovered';
    } else {
      console.log(`[VideoService] File verified missing: ${filePath}`);
      return 'missing';
    }
  }

  async updateMetadata(
    path: string,
    duration: number,
    width: number,
    height: number
  ): Promise<void> {
    this.metaRepo.updateMetadata(path, duration, width, height);
  }

  runGarbageCollection(): void {
    const retentionDays = 30;
    const deletedCount = this.integrityRepo.deleteExpiredMissingVideos(retentionDays);
    if (deletedCount > 0) {
      console.log(`[VideoService] Garbage Collection complete. Removed ${deletedCount} records.`);
    }
  }
}
