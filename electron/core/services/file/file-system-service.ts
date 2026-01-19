// electron/core/services/file/file-system-service.ts

import fs from 'fs/promises';
import path from 'path';
import { DirectoryEntry } from '../../../../src/shared/types/electron';
import { logger } from '../../../lib/logger';

export class FileSystemService {
  async getSubdirectories(dirPath: string): Promise<DirectoryEntry[]> {
    try {
      const dirents = await fs.readdir(dirPath, { withFileTypes: true });

      return dirents
        .filter((dirent) => dirent.isDirectory() && !dirent.name.startsWith('.'))
        .map((dirent) => ({
          name: dirent.name,
          path: path.join(dirPath, dirent.name),
        }));
    } catch (error) {
      logger.error(`[FileSystem] Failed to read directories from: ${dirPath}`, error);
      return [];
    }
  }

  async getDirectoryTree(dirPath: string): Promise<string[]> {
    const results: string[] = [];
    await this.scanRecursively(dirPath, results);
    return results;
  }

  private async scanRecursively(dir: string, list: string[]): Promise<void> {
    try {
      const dirents = await fs.readdir(dir, { withFileTypes: true });
      for (const dirent of dirents) {
        if (dirent.isDirectory()) {
          if (dirent.name.startsWith('.') || dirent.name === 'node_modules') continue;

          const fullPath = path.join(dir, dirent.name);
          list.push(fullPath);
          await this.scanRecursively(fullPath, list);
        }
      }
    } catch (error) {
      logger.debug(`[FileSystem] Skipped directory scan for: ${dir}`, error);
    }
  }
}
