// electron/handlers/sorting.ts

import { ipcMain } from 'electron';
import { FolderRepository } from '../core/repositories/folder-repository';

export const handleSorting = () => {
  // Sortingロジックは単純なCRUDに近いのでRepository直呼びでも可だが、
  // 将来的な拡張性を考慮してService層を作るのが理想。
  // 今回は「FolderRepository」を直接呼ぶ形にする（Service層の過剰な複雑化を防ぐため）
  const repo = new FolderRepository();

  ipcMain.handle('save-folder-order', (_event, folderPath: string, videoPaths: string[]) => {
    try {
      repo.saveSortOrder(folderPath, videoPaths);
    } catch (error) {
      console.error(`Failed to save folder order: ${folderPath}`, error);
      throw error;
    }
  });

  ipcMain.handle('get-folder-order', (_event, folderPath: string) => {
    try {
      return repo.getSortOrder(folderPath);
    } catch (error) {
      console.error(`Failed to get folder order: ${folderPath}`, error);
      return [];
    }
  });
};
