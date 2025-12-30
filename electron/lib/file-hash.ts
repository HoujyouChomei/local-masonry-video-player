// electron/lib/file-hash.ts

import fs from 'fs/promises';
import crypto from 'crypto';

// 16KB chunks
const CHUNK_SIZE = 16 * 1024;

/**
 * Calculates a partial hash of a file (Size + Start 16KB + End 16KB).
 * Faster than hashing the entire file, efficient for large video files.
 * Used for tracking file moves and renames.
 */
export async function calculateFileHash(filePath: string): Promise<string | null> {
  let fileHandle: fs.FileHandle | null = null;

  try {
    fileHandle = await fs.open(filePath, 'r');
    const stat = await fileHandle.stat();
    const fileSize = stat.size;

    // Use SHA-256 for collision resistance
    const hash = crypto.createHash('sha256');

    // 1. Incorporate File Size
    // This distinguishes files with identical start/end bytes but different lengths (e.g. appended data)
    hash.update(fileSize.toString());

    if (fileSize <= CHUNK_SIZE * 2) {
      // Case: Small file (<= 32KB) -> Read entire file
      const buffer = Buffer.alloc(fileSize);
      await fileHandle.read(buffer, 0, fileSize, 0);
      hash.update(buffer);
    } else {
      // Case: Large file -> Read Start & End

      // Read Start
      const startBuffer = Buffer.alloc(CHUNK_SIZE);
      await fileHandle.read(startBuffer, 0, CHUNK_SIZE, 0);
      hash.update(startBuffer);

      // Read End
      const endBuffer = Buffer.alloc(CHUNK_SIZE);
      await fileHandle.read(endBuffer, 0, CHUNK_SIZE, fileSize - CHUNK_SIZE);
      hash.update(endBuffer);
    }

    return hash.digest('hex');
  } catch (error) {
    console.error(`[FileHash] Failed to calculate hash for: ${filePath}`, error);
    return null;
  } finally {
    if (fileHandle) {
      await fileHandle.close();
    }
  }
}
