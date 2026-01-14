// electron/handlers/directories.ts

import { ipcMain } from 'electron';
import fs from 'fs/promises';
import path from 'path';

export interface DirectoryEntry {
  name: string;
  path: string;
}

// ヘルパー: 再帰的にディレクトリパスを収集
const scanDirectoriesRecursively = async (dir: string, list: string[]) => {
  try {
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    for (const dirent of dirents) {
      if (dirent.isDirectory()) {
        // 隠しフォルダとnode_modulesは除外
        if (dirent.name.startsWith('.') || dirent.name === 'node_modules') continue;

        const fullPath = path.join(dir, dirent.name);
        list.push(fullPath);
        await scanDirectoriesRecursively(fullPath, list);
      }
    }
  } catch {
    // アクセス権限エラーなどは無視して続行
  }
};

export const handleDirectories = () => {
  ipcMain.handle('get-subdirectories', async (_event, dirPath: string) => {
    try {
      const dirents = await fs.readdir(dirPath, { withFileTypes: true });

      const directories: DirectoryEntry[] = dirents
        .filter((dirent) => {
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

  ipcMain.handle('get-directory-tree', async (_event, dirPath: string) => {
    const results: string[] = [];
    await scanDirectoriesRecursively(dirPath, results);
    return results;
  });
};
