// electron/core/services/video-rebinder.ts

import { VideoRow } from '../repositories/video-repository'; // Type definition only
import { VideoIntegrityRepository } from '../repositories/video-integrity-repository';
import { calculateFileHash } from '../../lib/file-hash';

export interface FileStat {
  size: number;
  mtime: number;
  birthtime: number;
  ino: number;
}

export class VideoRebinder {
  private integrityRepo = new VideoIntegrityRepository();

  /**
   * Rebind（再結合）の候補を探す
   */
  async findCandidate(
    filePath: string,
    stat: FileStat,
    allowHashCalc: boolean
  ): Promise<VideoRow | undefined> {
    // 1. Inodeによる検索
    const inodeMatches = this.integrityRepo.findByInode(stat.ino);

    if (inodeMatches.length > 0) {
      // 複数候補がある場合の優先順位付け
      inodeMatches.sort((a, b) => {
        if (a.status === 'available' && b.status !== 'available') return -1;
        if (a.status !== 'available' && b.status === 'available') return 1;
        return (b.last_seen_at || 0) - (a.last_seen_at || 0);
      });

      const candidate = inodeMatches[0];

      // サイズチェック (Inode再利用対策)
      if (candidate.size === stat.size) {
        console.log(
          `[Rebinder] Match found by INODE: ${candidate.path} (ID: ${candidate.id}, Status: ${candidate.status})`
        );
        return candidate;
      }
    }

    // 2. Hashによる検索
    if (allowHashCalc) {
      const candidates = this.integrityRepo.findMissingCandidatesBySize(stat.size);

      if (candidates.length > 0) {
        console.log(`[Rebinder] No Inode match. Calculating hash...`);
        const newHash = await calculateFileHash(filePath);

        if (newHash) {
          const hashMatch = candidates.find((c) => c.file_hash === newHash);
          if (hashMatch) {
            console.log(`[Rebinder] Match found by HASH: ${hashMatch.path} (ID: ${hashMatch.id})`);
            return hashMatch;
          }
        }
      }
    }

    return undefined;
  }

  /**
   * Rebind実行
   */
  execute(
    id: string,
    newPath: string,
    size: number,
    mtime: number,
    ino: number,
    existingHash: string | null | undefined,
    logContext: string
  ): void {
    console.log(`[Rebinder] ${logContext}: ID=${id} -> ${newPath}`);
    this.integrityRepo.restore(id, newPath, size, mtime, ino);

    if (!existingHash) {
      calculateFileHash(newPath).then((hash) => {
        if (hash) this.integrityRepo.updateHash(id, hash);
      });
    }
  }
}
