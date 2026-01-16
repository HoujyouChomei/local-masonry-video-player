// electron/handlers/directories.ts

import { ipcMain } from 'electron';
import { FileSystemService } from '../core/services/file-system-service';

export const handleDirectories = () => {
  const fileService = new FileSystemService();

  ipcMain.handle('get-subdirectories', async (_event, dirPath: string) => {
    return fileService.getSubdirectories(dirPath);
  });

  ipcMain.handle('get-directory-tree', async (_event, dirPath: string) => {
    return fileService.getDirectoryTree(dirPath);
  });
};
