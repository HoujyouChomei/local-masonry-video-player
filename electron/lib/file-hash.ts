// electron/lib/file-hash.ts

import fs from 'fs/promises';
import crypto from 'crypto';

const CHUNK_SIZE = 16 * 1024;

export async function calculateFileHash(filePath: string): Promise<string | null> {
  let fileHandle: fs.FileHandle | null = null;

  try {
    fileHandle = await fs.open(filePath, 'r');
    const stat = await fileHandle.stat();
    const fileSize = stat.size;

    const hash = crypto.createHash('sha256');

    hash.update(fileSize.toString());

    if (fileSize <= CHUNK_SIZE * 2) {
      const buffer = Buffer.alloc(fileSize);
      await fileHandle.read(buffer, 0, fileSize, 0);
      hash.update(buffer);
    } else {
      const startBuffer = Buffer.alloc(CHUNK_SIZE);
      await fileHandle.read(startBuffer, 0, CHUNK_SIZE, 0);
      hash.update(startBuffer);

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
