// electron/core/services/library-scanner.ts

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import {
  VideoRepository,
  VideoCreateInput,
  VideoUpdateInput,
} from '../repositories/video-repository';
import { VideoIntegrityRepository } from '../repositories/video-integrity-repository'; // 追加
import { VideoFile } from '../../../src/shared/types/video';
import { VideoMapper } from './video-mapper';
import { calculateFileHash } from '../../lib/file-hash';
import { VideoRebinder, FileStat } from './video-rebinder';
import { ThumbnailService } from './thumbnail-service';
import { FFmpegService } from './ffmpeg-service';
import { NATIVE_EXTENSIONS, EXTENDED_EXTENSIONS } from '../../lib/extensions';

const CHUNK_SIZE = 500;

export class LibraryScanner {
  private videoRepo = new VideoRepository();
  private integrityRepo = new VideoIntegrityRepository(); // 追加
  private mapper = new VideoMapper();
  private rebinder = new VideoRebinder();
  private thumbnailService = ThumbnailService.getInstance();
  private ffmpegService = new FFmpegService();

  async scan(folderPath: string): Promise<VideoFile[]> {
    try {
      const hasFFmpeg = await this.ffmpegService.validatePath(
        this.ffmpegService.ffmpegPath,
        'ffmpeg'
      );
      const targetExtensions = hasFFmpeg ? EXTENDED_EXTENSIONS : NATIVE_EXTENSIONS;

      const dirents = await fs.readdir(folderPath, { withFileTypes: true });
      const videoFiles = dirents
        .filter((dirent) => {
          if (!dirent.isFile()) return false;
          const ext = path.extname(dirent.name).toLowerCase();
          return targetExtensions.has(ext);
        })
        .map((dirent) => path.join(folderPath, dirent.name));

      // フォルダ内にあるはずのないファイルをMissingにする
      const existingFileSet = new Set(videoFiles.map((p) => path.normalize(p)));
      const dbFiles = this.videoRepo.findPathsByDirectory(folderPath);

      const idsToMarkMissing = dbFiles
        .filter((row) => {
          const normalizedPath = path.normalize(row.path);
          return path.dirname(normalizedPath) === path.normalize(folderPath);
        })
        .filter((row) => !existingFileSet.has(path.normalize(row.path)))
        .map((row) => row.id);

      if (idsToMarkMissing.length > 0) {
        this.integrityRepo.markAsMissing(idsToMarkMissing); // integrityRepoを使用
      }

      if (videoFiles.length === 0) return [];

      this.thumbnailService.addToQueue(videoFiles, false);

      const statsMap = new Map<string, FileStat>();
      await Promise.all(
        videoFiles.map(async (filePath) => {
          try {
            const stat = await fs.stat(filePath);
            statsMap.set(filePath, {
              size: stat.size,
              mtime: Math.floor(stat.mtimeMs),
              birthtime: stat.birthtimeMs,
              ino: Number(stat.ino),
            });
          } catch {
            // ignore
          }
        })
      );

      const validPaths = videoFiles.filter((p) => statsMap.has(p));
      const changedPaths: string[] = [];

      for (let i = 0; i < validPaths.length; i += CHUNK_SIZE) {
        const chunkPaths = validPaths.slice(i, i + CHUNK_SIZE);
        const existingRows = this.videoRepo.findManyByPaths(chunkPaths);
        const rowMap = new Map(existingRows.map((r) => [r.path, r]));

        const toInsert: VideoCreateInput[] = [];
        const toUpdate: VideoUpdateInput[] = [];

        for (const filePath of chunkPaths) {
          const stat = statsMap.get(filePath)!;
          const row = rowMap.get(filePath);
          const fileName = path.basename(filePath);

          if (row) {
            if (
              row.mtime !== stat.mtime ||
              row.size !== stat.size ||
              row.ino !== stat.ino ||
              !row.ino ||
              row.status !== 'available'
            ) {
              toUpdate.push({
                id: row.id,
                size: stat.size,
                mtime: stat.mtime,
                duration: null,
                width: null,
                height: null,
                aspect_ratio: null,
                ino: stat.ino,
              });

              changedPaths.push(filePath);
            }
          } else {
            const match = await this.rebinder.findCandidate(filePath, stat, false);

            if (match) {
              this.rebinder.execute(
                match.id,
                filePath,
                stat.size,
                stat.mtime,
                stat.ino,
                match.file_hash,
                'Batch: Rebind detected'
              );
              continue;
            }

            const id = crypto.randomUUID();
            toInsert.push({
              id,
              path: filePath,
              name: fileName,
              size: stat.size,
              mtime: stat.mtime,
              created_at: Date.now(),
              ino: stat.ino,
            });
            calculateFileHash(filePath).then((hash) => {
              if (hash) this.integrityRepo.updateHash(id, hash); // integrityRepoを使用
            });
          }
        }
        this.integrityRepo.upsertMany(toInsert, toUpdate); // integrityRepoを使用
      }

      if (changedPaths.length > 0) {
        console.log(`[Scanner] ${changedPaths.length} files changed. Cleaning thumbnails.`);
        for (const p of changedPaths) {
          this.thumbnailService.deleteThumbnail(p);
        }
        this.thumbnailService.addToQueue(changedPaths, true);
      }

      const finalRows = this.videoRepo.findManyByPaths(validPaths);
      return this.mapper.toEntities(finalRows.filter((r) => r.status === 'available'));
    } catch (error) {
      console.error(`Failed to scan folder: ${folderPath}`, error);
      return [];
    }
  }
}
