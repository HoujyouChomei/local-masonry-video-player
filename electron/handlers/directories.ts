// electron/handlers/directories.ts

import { ipcMain } from 'electron';
import fs from 'fs/promises';
import path from 'path';

export interface DirectoryEntry {
  name: string;
  path: string;
}

export const handleDirectories = () => {
  // 指定パスの直下にあるサブディレクトリ一覧を返す
  ipcMain.handle('get-subdirectories', async (_event, dirPath: string) => {
    try {
      const dirents = await fs.readdir(dirPath, { withFileTypes: true });

      const directories: DirectoryEntry[] = dirents
        .filter((dirent) => {
          // ディレクトリのみ && 隠しフォルダ(.gitなど)は除外
          return dirent.isDirectory() && !dirent.name.startsWith('.');
        })
        .map((dirent) => ({
          name: dirent.name,
          path: path.join(dirPath, dirent.name),
        }));

      return directories;
    } catch (error) {
      console.error(`Failed to read directories from: ${dirPath}`, error);
      return [];
    }
  });
};
