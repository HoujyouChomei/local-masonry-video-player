// electron/core/services/media/rebinder.ts

import { MediaRow } from '../../repositories/media/media-repository';
import { VideoIntegrityRepository } from '../../repositories/media/media-integrity';
import { calculateFileHash } from '../../../lib/file-hash';
import { logger } from '../../../lib/logger';

export interface FileStat {
  size: number;
  mtime: number;
  birthtime: number;
  ino: number;
}

export class VideoRebinder {
  private integrityRepo = new VideoIntegrityRepository();

  async findCandidate(
    filePath: string,
    stat: FileStat,
    allowHashCalc: boolean
  ): Promise<MediaRow | undefined> {
    const inodeMatches = this.integrityRepo.findByInode(stat.ino);

    if (inodeMatches.length > 0) {
      inodeMatches.sort((a, b) => {
        if (a.status === 'available' && b.status !== 'available') return -1;
        if (a.status !== 'available' && b.status === 'available') return 1;
        return (b.last_seen_at || 0) - (a.last_seen_at || 0);
      });

      const candidate = inodeMatches[0];

      if (candidate.size === stat.size) {
        logger.debug(
          `[Rebinder] Match found by INODE: ${candidate.path} (ID: ${candidate.id}, Status: ${candidate.status})`
        );
        return candidate;
      }
    }

    if (allowHashCalc) {
      const candidates = this.integrityRepo.findMissingCandidatesBySize(stat.size);

      if (candidates.length > 0) {
        logger.debug(`[Rebinder] No Inode match. Calculating hash...`);
        const newHash = await calculateFileHash(filePath);

        if (newHash) {
          const hashMatch = candidates.find((c) => c.file_hash === newHash);
          if (hashMatch) {
            logger.debug(`[Rebinder] Match found by HASH: ${hashMatch.path} (ID: ${hashMatch.id})`);
            return hashMatch;
          }
        }
      }
    }

    return undefined;
  }

  execute(
    id: string,
    newPath: string,
    size: number,
    mtime: number,
    ino: number,
    existingHash: string | null | undefined,
    logContext: string
  ): void {
    logger.debug(`[Rebinder] ${logContext}: ID=${id} -> ${newPath}`);
    this.integrityRepo.restore(id, newPath, size, mtime, ino);

    if (!existingHash) {
      calculateFileHash(newPath).then((hash) => {
        if (hash) this.integrityRepo.updateHash(id, hash);
      });
    }
  }
}
