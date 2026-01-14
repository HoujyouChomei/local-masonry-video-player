// electron/core/services/file-move-service.ts

import fs from 'fs/promises';
import path from 'path';
import { MoveResultDetail } from '../../../src/shared/types/electron';
import { logger } from '../../lib/logger';

interface FileSystemError extends Error {
  code?: string;
}

export class FileMoveService {
  async moveVideos(videoPaths: string[], targetFolderPath: string): Promise<MoveResultDetail[]> {
    logger.debug(`[Move] Request received. Target: ${targetFolderPath}`);

    const results: MoveResultDetail[] = [];

    for (const rawOldPath of videoPaths) {
      const oldPath = path.normalize(rawOldPath);
      const fileName = path.basename(oldPath);
      let newPath = path.join(targetFolderPath, fileName);

      if (oldPath === newPath) {
        logger.debug(`[Move] Skipped (Same path): ${oldPath}`);
        results.push({ oldPath, newPath, success: false, error: 'Same path' });
        continue;
      }

      try {
        let counter = 1;
        const ext = path.extname(fileName);
        const nameWithoutExt = path.basename(fileName, ext);

        while (true) {
          try {
            await fs.access(newPath);
            newPath = path.join(targetFolderPath, `${nameWithoutExt} (${counter})${ext}`);
            counter++;
          } catch {
            break;
          }
        }

        logger.debug(`[Move] Attempting: ${oldPath} -> ${newPath}`);

        try {
          await fs.rename(oldPath, newPath);
          logger.debug(`[Move] Success (Rename): ${fileName}`);
          results.push({ oldPath, newPath, success: true });
        } catch (unknownErr) {
          const err = unknownErr as FileSystemError;
          logger.warn(`[Move] Rename failed (${err.code}). Trying Copy+Unlink...`);

          if (err.code === 'EXDEV' || err.code === 'EPERM' || err.code === 'EACCES') {
            await fs.cp(oldPath, newPath, { preserveTimestamps: true, force: true });

            try {
              await fs.unlink(oldPath);
              logger.debug(`[Move] Success (Copy+Unlink): ${fileName}`);
              results.push({ oldPath, newPath, success: true });
            } catch (unlinkErr) {
              const uErr = unlinkErr as FileSystemError;
              logger.error(`[Move] Failed to delete source after copy: ${oldPath}`, uErr);
              results.push({
                oldPath,
                newPath,
                success: true,
                warning: `Source file could not be deleted (${uErr.code || uErr.message}). Copy created.`,
              });
            }
          } else {
            throw err;
          }
        }
      } catch (unknownError) {
        const error = unknownError as FileSystemError;
        logger.error(`[Move] FAILED: ${oldPath} -> ${newPath}`);
        results.push({ oldPath, newPath, success: false, error: error.message });
      }
    }

    return results;
  }
}
