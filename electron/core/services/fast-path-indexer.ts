// electron/core/services/fast-path-indexer.ts

import fs from 'fs/promises';
import path from 'path';
import { NATIVE_EXTENSIONS, EXTENDED_EXTENSIONS } from '../../lib/extensions';
import { FFmpegService } from './ffmpeg-service';

export class FastPathIndexer {
  private index = new Map<string, string[]>();
  private ffmpegService = new FFmpegService();

  public async build(rootFolders: string[]): Promise<void> {
    this.index.clear();
    console.time('[FastPathIndexer] Build Index');

    // ▼▼▼ 修正: ドット記法でアクセス ▼▼▼
    const hasFFmpeg = await this.ffmpegService.validatePath(
      this.ffmpegService.ffmpegPath,
      'ffmpeg'
    );
    const targetExtensions = hasFFmpeg ? EXTENDED_EXTENSIONS : NATIVE_EXTENSIONS;

    await Promise.all(rootFolders.map((folder) => this.scanRecursively(folder, targetExtensions)));

    console.timeEnd('[FastPathIndexer] Build Index');
    console.log(`[FastPathIndexer] Indexed ${this.index.size} unique filenames.`);
  }

  public getCandidates(filename: string): string[] {
    return this.index.get(filename) || [];
  }

  private async scanRecursively(dir: string, extensions: Set<string>): Promise<void> {
    try {
      const dirents = await fs.readdir(dir, { withFileTypes: true });
      const subDirs: string[] = [];

      for (const dirent of dirents) {
        if (dirent.name.startsWith('.')) continue;

        const fullPath = path.join(dir, dirent.name);

        if (dirent.isDirectory()) {
          subDirs.push(fullPath);
        } else if (dirent.isFile()) {
          const ext = path.extname(dirent.name).toLowerCase();
          if (extensions.has(ext)) {
            this.addToIndex(dirent.name, fullPath);
          }
        }
      }

      for (const subDir of subDirs) {
        await this.scanRecursively(subDir, extensions);
      }
    } catch {
      // ignore
    }
  }

  private addToIndex(filename: string, fullPath: string) {
    if (!this.index.has(filename)) {
      this.index.set(filename, []);
    }
    this.index.get(filename)!.push(fullPath);
  }
}
