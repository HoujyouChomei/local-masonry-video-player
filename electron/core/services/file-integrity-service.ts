// electron/core/services/file-integrity-service.ts

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { VideoRepository } from '../repositories/video-repository';
import { VideoIntegrityRepository } from '../repositories/video-integrity-repository';
import { VideoFile } from '../../../src/shared/types/video';
import { VideoMapper } from './video-mapper';
import { calculateFileHash } from '../../lib/file-hash';
import { FastPathIndexer } from './fast-path-indexer';
import { store } from '../../lib/store';
import { VideoRebinder, FileStat } from './video-rebinder';
import { ThumbnailService } from './thumbnail-service';
import { logger } from '../../lib/logger';

export class FileIntegrityService {
  private videoRepo = new VideoRepository();
  private integrityRepo = new VideoIntegrityRepository();
  private mapper = new VideoMapper();
  private pathIndexer = new FastPathIndexer();
  private rebinder = new VideoRebinder();
  private thumbnailService = ThumbnailService.getInstance();

  async processNewFile(filePath: string): Promise<VideoFile | null> {
    try {
      const fsStat = await fs.stat(filePath);
      const stat: FileStat = {
        size: fsStat.size,
        mtime: Math.floor(fsStat.mtimeMs),
        birthtime: fsStat.birthtimeMs,
        ino: Number(fsStat.ino),
      };

      logger.debug(`[Integrity] Processing NEW file: ${filePath}`);

      const pathMatchRow = this.videoRepo.findByPath(filePath);

      if (pathMatchRow) {
        const rowIno = Number(pathMatchRow.ino);
        if (
          pathMatchRow.status === 'available' &&
          (pathMatchRow.ino === null || rowIno === stat.ino)
        ) {
          if (pathMatchRow.size !== stat.size || pathMatchRow.mtime !== stat.mtime) {
            this.integrityRepo.resetMetadata(pathMatchRow.id, stat.size, stat.mtime, stat.ino);

            this.thumbnailService.deleteThumbnail(filePath);
            this.thumbnailService.addToQueue([filePath], true);

            const updated = this.videoRepo.findById(pathMatchRow.id);
            return updated ? this.mapper.toEntity(updated) : null;
          }
          this.thumbnailService.addToQueue([filePath], false);
          return this.mapper.toEntity(pathMatchRow);
        }
        if (pathMatchRow.status === 'missing') {
          logger.debug(`[Integrity] Reviving missing file at original path: ${filePath}`);
          this.integrityRepo.resetMetadata(pathMatchRow.id, stat.size, stat.mtime, stat.ino);

          this.thumbnailService.deleteThumbnail(filePath);
          this.thumbnailService.addToQueue([filePath], true);

          const updated = this.videoRepo.findById(pathMatchRow.id);
          return updated ? this.mapper.toEntity(updated) : null;
        }
      }

      const match = await this.rebinder.findCandidate(filePath, stat, true);

      if (match) {
        if (pathMatchRow && pathMatchRow.id !== match.id) {
          this.videoRepo.deleteById(pathMatchRow.id);
        }

        this.rebinder.execute(
          match.id,
          filePath,
          stat.size,
          stat.mtime,
          stat.ino,
          match.file_hash,
          '*** REBIND EXECUTE ***'
        );

        this.thumbnailService.addToQueue([filePath], false);

        const row = this.videoRepo.findById(match.id);
        return row ? this.mapper.toEntity(row) : null;
      } else if (pathMatchRow) {
        this.integrityRepo.resetMetadata(pathMatchRow.id, stat.size, stat.mtime, stat.ino);

        this.thumbnailService.deleteThumbnail(filePath);
        this.thumbnailService.addToQueue([filePath], true);

        const row = this.videoRepo.findById(pathMatchRow.id);
        return row ? this.mapper.toEntity(row) : null;
      } else {
        const id = crypto.randomUUID();
        const name = path.basename(filePath);

        this.videoRepo.create({
          id,
          path: filePath,
          name,
          size: stat.size,
          mtime: stat.mtime,
          created_at: Date.now(),
          ino: stat.ino,
        });
        calculateFileHash(filePath).then((hash) => {
          if (hash) this.integrityRepo.updateHash(id, hash);
        });

        this.thumbnailService.addToQueue([filePath], false);

        const row = this.videoRepo.findById(id);
        return row ? this.mapper.toEntity(row) : null;
      }
    } catch (error) {
      logger.error(`[Integrity] Failed to process new file: ${filePath}`, error);
      return null;
    }
  }

  async verifyAndRecover(videoPaths: string[]): Promise<boolean> {
    if (videoPaths.length === 0) return false;

    const missingPaths: string[] = [];
    const existingPaths: string[] = [];

    await Promise.all(
      videoPaths.map(async (p) => {
        try {
          await fs.access(p);
          existingPaths.push(p);
        } catch {
          missingPaths.push(p);
        }
      })
    );

    let hasChanges = false;

    if (existingPaths.length > 0) {
      const existingRows = this.videoRepo.findManyByPaths(existingPaths);
      const ghosts = existingRows.filter(
        (r) => r.status === 'missing' || r.last_scan_attempt_at !== null
      );

      if (ghosts.length > 0) {
        logger.debug(`[Integrity] Self-healing ${ghosts.length} files found at original paths.`);
        for (const row of ghosts) {
          try {
            const stat = await fs.stat(row.path);
            this.integrityRepo.restore(
              row.id,
              row.path,
              stat.size,
              Math.floor(stat.mtimeMs),
              Number(stat.ino)
            );

            this.thumbnailService.deleteThumbnail(row.path);
            this.thumbnailService.addToQueue([row.path], true);
          } catch {
            this.integrityRepo.restore(row.id, row.path, row.size, row.mtime, row.ino);
          }
        }
        hasChanges = true;
      }
    }

    if (missingPaths.length === 0) return hasChanges;

    logger.debug(`[Integrity] Verification detected ${missingPaths.length} missing files.`);

    const missingRows = this.videoRepo.findManyByPaths(missingPaths);
    if (missingRows.length === 0) return hasChanges;

    const targetsToScan = missingRows.filter((row) => row.last_scan_attempt_at === null);

    const scannedButAvailable = missingRows.filter(
      (row) => row.last_scan_attempt_at !== null && row.status === 'available'
    );
    if (scannedButAvailable.length > 0) {
      this.integrityRepo.markAsMissing(scannedButAvailable.map((r) => r.id));
      hasChanges = true;
    }

    if (targetsToScan.length === 0) {
      return hasChanges;
    }

    const libraryFolders = store.get('libraryFolders') || [];
    const currentFolder = store.get('folderPath');
    if (currentFolder && !libraryFolders.includes(currentFolder)) {
      libraryFolders.push(currentFolder);
    }

    await this.pathIndexer.build(libraryFolders);

    const idsToMarkAttempted: string[] = [];

    for (const row of targetsToScan) {
      const fileName = path.basename(row.path);
      const candidates = this.pathIndexer.getCandidates(fileName);

      let found = false;

      for (const candidatePath of candidates) {
        if (candidatePath === row.path) continue;

        try {
          const stat = await fs.stat(candidatePath);
          const size = stat.size;
          const mtime = Math.floor(stat.mtimeMs);
          const ino = Number(stat.ino);

          if (size === row.size) {
            this.rebinder.execute(
              row.id,
              candidatePath,
              size,
              mtime,
              ino,
              row.file_hash,
              'RECOVERED'
            );

            this.thumbnailService.addToQueue([candidatePath], false);

            found = true;
            hasChanges = true;
            break;
          }
        } catch {
          // ignore error
        }
      }

      if (!found) {
        idsToMarkAttempted.push(row.id);
      }
    }

    if (idsToMarkAttempted.length > 0) {
      this.integrityRepo.markAsMissing(idsToMarkAttempted);
      this.integrityRepo.markScanAttempted(idsToMarkAttempted);
      hasChanges = true;
    }

    return hasChanges;
  }

  async markAsMissing(filePath: string): Promise<void> {
    this.integrityRepo.markAsMissingByPath(filePath);
  }

  async markAsMissingById(id: string): Promise<void> {
    this.integrityRepo.markAsMissing([id]);
  }
}
