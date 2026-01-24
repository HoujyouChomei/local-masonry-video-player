// electron/core/services/file/library-scanner.ts

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import {
  MediaRepository,
  MediaCreateInput,
  MediaUpdateInput,
} from '../../repositories/media/media-repository';
import { MediaIntegrityRepository } from '../../repositories/media/media-integrity';
import { Media } from '../../../../src/shared/schemas/media';
import { MediaMapper } from '../media/media-mapper';
import { calculateFileHash } from '../../../lib/file-hash';
import { MediaRebinder, FileStat } from '../media/rebinder';
import { eventBus } from '../../events';
import { FFmpegService } from '../video/ffmpeg-service';
import { NATIVE_EXTENSIONS, EXTENDED_EXTENSIONS } from '../../../lib/extensions';

const CHUNK_SIZE = 500;
const MAX_SCAN_DEPTH = 20;
const BATCH_LIMIT = 50;

export class LibraryScanner {
  private mediaRepo = new MediaRepository();
  private integrityRepo = new MediaIntegrityRepository();
  private mapper = new MediaMapper();
  private rebinder = new MediaRebinder();
  private ffmpegService = new FFmpegService();

  async scan(folderPath: string): Promise<Media[]> {
    try {
      const hasFFmpeg = await this.ffmpegService.validatePath(
        this.ffmpegService.ffmpegPath,
        'ffmpeg'
      );
      const targetExtensions = hasFFmpeg ? EXTENDED_EXTENSIONS : NATIVE_EXTENSIONS;

      const dirents = await fs.readdir(folderPath, { withFileTypes: true });
      const mediaFiles = dirents
        .filter((dirent) => {
          if (!dirent.isFile()) return false;
          const ext = path.extname(dirent.name).toLowerCase();
          return targetExtensions.has(ext);
        })
        .map((dirent) => path.join(folderPath, dirent.name));

      const existingFileSet = new Set(mediaFiles.map((p) => path.normalize(p)));
      const dbFiles = this.mediaRepo.findPathsByDirectory(folderPath);

      const idsToMarkMissing = dbFiles
        .filter((row) => {
          const normalizedPath = path.normalize(row.path);
          return path.dirname(normalizedPath) === path.normalize(folderPath);
        })
        .filter((row) => !existingFileSet.has(path.normalize(row.path)))
        .map((row) => row.id);

      if (idsToMarkMissing.length > 0) {
        this.integrityRepo.markAsMissing(idsToMarkMissing);
      }

      if (mediaFiles.length === 0) return [];

      eventBus.emit('thumbnail:request', { paths: mediaFiles, regenerate: false });

      const statsMap = new Map<string, FileStat>();

      for (let i = 0; i < mediaFiles.length; i += BATCH_LIMIT) {
        const batch = mediaFiles.slice(i, i + BATCH_LIMIT);
        await Promise.all(
          batch.map(async (filePath) => {
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
      }

      const validPaths = mediaFiles.filter((p) => statsMap.has(p));
      const changedPaths: string[] = [];

      for (let i = 0; i < validPaths.length; i += CHUNK_SIZE) {
        const chunkPaths = validPaths.slice(i, i + CHUNK_SIZE);
        const existingRows = this.mediaRepo.findManyByPaths(chunkPaths);
        const rowMap = new Map(existingRows.map((r) => [r.path, r]));

        const toInsert: MediaCreateInput[] = [];
        const toUpdate: MediaUpdateInput[] = [];

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
              type: 'video',
              size: stat.size,
              mtime: stat.mtime,
              created_at: Date.now(),
              ino: stat.ino,
            });
            calculateFileHash(filePath).then((hash) => {
              if (hash) this.integrityRepo.updateHash(id, hash);
            });
          }
        }
        this.integrityRepo.upsertMany(toInsert, toUpdate);
      }

      if (changedPaths.length > 0) {
        console.log(`[Scanner] ${changedPaths.length} files changed. Cleaning thumbnails.`);
        for (const p of changedPaths) {
          eventBus.emit('thumbnail:delete', { path: p });
        }
        eventBus.emit('thumbnail:request', { paths: changedPaths, regenerate: true });
      }

      const finalRows = this.mediaRepo.findManyByPaths(validPaths);
      return this.mapper.toEntities(finalRows.filter((r) => r.status === 'available'));
    } catch (error) {
      console.error(`Failed to scan folder: ${folderPath}`, error);
      return [];
    }
  }

  private async scanDirRecursively(
    dirPath: string,
    extensions: Set<string>,
    depth: number,
    results: string[]
  ): Promise<void> {
    if (depth > MAX_SCAN_DEPTH) return;

    try {
      const dirents = await fs.readdir(dirPath, { withFileTypes: true });

      for (const dirent of dirents) {
        if (dirent.isSymbolicLink()) continue;

        const fullPath = path.join(dirPath, dirent.name);

        if (dirent.isDirectory()) {
          if (dirent.name.startsWith('.')) continue;

          await this.scanDirRecursively(fullPath, extensions, depth + 1, results);
        } else if (dirent.isFile()) {
          const ext = path.extname(dirent.name).toLowerCase();
          if (extensions.has(ext)) {
            results.push(fullPath);
          }
        }
      }
    } catch {
      // ignore
    }
  }

  async scanQuietly(folderPath: string): Promise<boolean> {
    let hasChanges = false;
    try {
      const hasFFmpeg = await this.ffmpegService.validatePath(
        this.ffmpegService.ffmpegPath,
        'ffmpeg'
      );
      const targetExtensions = hasFFmpeg ? EXTENDED_EXTENSIONS : NATIVE_EXTENSIONS;

      const mediaFiles: string[] = [];

      console.log(`[LibraryScanner] Starting quiet recursive scan for: ${folderPath}`);
      await this.scanDirRecursively(folderPath, targetExtensions, 0, mediaFiles);

      if (mediaFiles.length === 0) return false;

      for (let i = 0; i < mediaFiles.length; i += CHUNK_SIZE) {
        const chunkPaths = mediaFiles.slice(i, i + CHUNK_SIZE);
        const existingRows = this.mediaRepo.findManyByPaths(chunkPaths);
        const existingPathSet = new Set(existingRows.map((r) => r.path));

        const newPaths = chunkPaths.filter((p) => !existingPathSet.has(p));

        if (newPaths.length === 0) continue;

        const toInsert: MediaCreateInput[] = [];

        for (let j = 0; j < newPaths.length; j += BATCH_LIMIT) {
          const batch = newPaths.slice(j, j + BATCH_LIMIT);

          await Promise.all(
            batch.map(async (filePath) => {
              try {
                const stat = await fs.stat(filePath);
                const fileName = path.basename(filePath);

                const candidate = await this.rebinder.findCandidate(
                  filePath,
                  {
                    size: stat.size,
                    mtime: Math.floor(stat.mtimeMs),
                    birthtime: stat.birthtimeMs,
                    ino: Number(stat.ino),
                  },
                  false
                );

                if (candidate) {
                  this.rebinder.execute(
                    candidate.id,
                    filePath,
                    stat.size,
                    Math.floor(stat.mtimeMs),
                    Number(stat.ino),
                    candidate.file_hash,
                    'Quiet Rebind'
                  );
                } else {
                  toInsert.push({
                    id: crypto.randomUUID(),
                    path: filePath,
                    name: fileName,
                    type: 'video',
                    size: stat.size,
                    mtime: Math.floor(stat.mtimeMs),
                    created_at: Date.now(),
                    ino: Number(stat.ino),
                  });
                }
              } catch {
                // ignore
              }
            })
          );
        }

        if (toInsert.length > 0) {
          console.log(`[LibraryScanner] Registered ${toInsert.length} new files.`);
          this.integrityRepo.upsertMany(toInsert, []);
          hasChanges = true;
        }
      }
    } catch (error) {
      console.error(`[LibraryScanner] Quiet scan failed for: ${folderPath}`, error);
    }
    return hasChanges;
  }
}
