// electron/core/services/file/file-integrity-service.ts

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { MediaRepository } from '../../repositories/media/media-repository';
import { MediaIntegrityRepository } from '../../repositories/media/media-integrity';
import { Media } from '../../../../src/shared/schemas/media';
import { MediaMapper } from '../media/media-mapper';
import { calculateFileHash } from '../../../lib/file-hash';
import { FastPathIndexer } from './fast-path-indexer';
import { store } from '../../../lib/store';
import { MediaRebinder, FileStat } from '../media/rebinder';
import { eventBus } from '../../events';
import { logger } from '../../../lib/logger';

export class FileIntegrityService {
  private mediaRepo = new MediaRepository();
  private integrityRepo = new MediaIntegrityRepository();
  private mapper = new MediaMapper();
  private pathIndexer = new FastPathIndexer();
  private rebinder = new MediaRebinder();

  async processNewFile(filePath: string): Promise<Media | null> {
    try {
      const fsStat = await fs.stat(filePath);
      const stat: FileStat = {
        size: fsStat.size,
        mtime: Math.floor(fsStat.mtimeMs),
        birthtime: fsStat.birthtimeMs,
        ino: Number(fsStat.ino),
      };

      logger.debug(`[Integrity] Processing NEW file: ${filePath}`);

      const pathMatchRow = this.mediaRepo.findByPath(filePath);

      if (pathMatchRow) {
        const rowIno = Number(pathMatchRow.ino);
        if (
          pathMatchRow.status === 'available' &&
          (pathMatchRow.ino === null || rowIno === stat.ino)
        ) {
          if (pathMatchRow.size !== stat.size || pathMatchRow.mtime !== stat.mtime) {
            this.integrityRepo.resetMetadata(pathMatchRow.id, stat.size, stat.mtime, stat.ino);

            eventBus.emit('thumbnail:delete', { path: filePath });
            eventBus.emit('thumbnail:request', { paths: [filePath], regenerate: true });

            const updated = this.mediaRepo.findById(pathMatchRow.id);
            return updated ? this.mapper.toEntity(updated) : null;
          }
          eventBus.emit('thumbnail:request', { paths: [filePath], regenerate: false });
          return this.mapper.toEntity(pathMatchRow);
        }
        if (pathMatchRow.status === 'missing') {
          logger.debug(`[Integrity] Reviving missing file at original path: ${filePath}`);
          this.integrityRepo.resetMetadata(pathMatchRow.id, stat.size, stat.mtime, stat.ino);

          eventBus.emit('thumbnail:delete', { path: filePath });
          eventBus.emit('thumbnail:request', { paths: [filePath], regenerate: true });

          const updated = this.mediaRepo.findById(pathMatchRow.id);
          return updated ? this.mapper.toEntity(updated) : null;
        }
      }

      const match = await this.rebinder.findCandidate(filePath, stat, true);

      if (match) {
        if (pathMatchRow && pathMatchRow.id !== match.id) {
          this.mediaRepo.deleteById(pathMatchRow.id);
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

        eventBus.emit('thumbnail:request', { paths: [filePath], regenerate: false });

        const row = this.mediaRepo.findById(match.id);
        return row ? this.mapper.toEntity(row) : null;
      } else if (pathMatchRow) {
        this.integrityRepo.resetMetadata(pathMatchRow.id, stat.size, stat.mtime, stat.ino);

        eventBus.emit('thumbnail:delete', { path: filePath });
        eventBus.emit('thumbnail:request', { paths: [filePath], regenerate: true });

        const row = this.mediaRepo.findById(pathMatchRow.id);
        return row ? this.mapper.toEntity(row) : null;
      } else {
        const id = crypto.randomUUID();
        const name = path.basename(filePath);

        this.mediaRepo.create({
          id,
          path: filePath,
          name,
          type: 'video',
          size: stat.size,
          mtime: stat.mtime,
          created_at: Date.now(),
          ino: stat.ino,
        });
        calculateFileHash(filePath).then((hash) => {
          if (hash) this.integrityRepo.updateHash(id, hash);
        });

        eventBus.emit('thumbnail:request', { paths: [filePath], regenerate: false });

        const row = this.mediaRepo.findById(id);
        return row ? this.mapper.toEntity(row) : null;
      }
    } catch (error) {
      logger.error(`[Integrity] Failed to process new file: ${filePath}`, error);
      return null;
    }
  }

  async verifyAndRecover(mediaPaths: string[]): Promise<boolean> {
    if (mediaPaths.length === 0) return false;

    const missingPaths: string[] = [];
    const existingPaths: string[] = [];

    await Promise.all(
      mediaPaths.map(async (p) => {
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
      const existingRows = this.mediaRepo.findManyByPaths(existingPaths);
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

            eventBus.emit('thumbnail:delete', { path: row.path });
            eventBus.emit('thumbnail:request', { paths: [row.path], regenerate: true });
          } catch {
            this.integrityRepo.restore(row.id, row.path, row.size, row.mtime, row.ino);
          }
        }
        hasChanges = true;
      }
    }

    if (missingPaths.length === 0) return hasChanges;

    logger.debug(`[Integrity] Verification detected ${missingPaths.length} missing files.`);

    const missingRows = this.mediaRepo.findManyByPaths(missingPaths);
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

            eventBus.emit('thumbnail:request', { paths: [candidatePath], regenerate: false });

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
