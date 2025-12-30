// electron/handlers/dialog.ts

import { ipcMain, dialog, BrowserWindow } from 'electron';
import path from 'path'; // 追加

export const handleDialog = () => {
  ipcMain.handle('select-folder', async () => {
    const mainWindow = BrowserWindow.getFocusedWindow();
    if (!mainWindow) return null;

    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
    });

    if (canceled || filePaths.length === 0) {
      return null;
    }

    const selectedPath = filePaths[0];

    // ▼▼▼ 追加: ルートディレクトリチェック ▼▼▼
    // path.dirname(p) === p の場合、それ以上親に上がれない＝ルートディレクトリと判定できる
    // (例: Windowsなら "C:\", POSIXなら "/")
    if (path.dirname(selectedPath) === selectedPath) {
      dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: 'Folder Selection Restricted',
        message: 'Cannot select a drive root folder.',
        detail:
          'Selecting a drive root (e.g., C:\\) causes severe performance issues. Please select a subfolder containing your videos.',
        buttons: ['OK'],
      });
      return null;
    }
    // ▲▲▲ 追加ここまで ▲▲▲

    return selectedPath;
  });
};
