// electron/core/services/ui-service.ts

import { dialog, BrowserWindow, app, nativeImage } from 'electron';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { THUMBNAIL } from '../../../src/shared/constants/assets';

export class UIService {
  // 複数のインスタンスで状態を共有するために static に変更
  private static fullScreenLocks = new Map<number, number>();
  private static initialWindowStates = new Map<number, boolean>();

  async selectFolder(parentWindow: BrowserWindow): Promise<string | null> {
    const { canceled, filePaths } = await dialog.showOpenDialog(parentWindow, {
      properties: ['openDirectory'],
    });

    if (canceled || filePaths.length === 0) {
      return null;
    }

    const selectedPath = filePaths[0];

    if (path.dirname(selectedPath) === selectedPath) {
      dialog.showMessageBox(parentWindow, {
        type: 'warning',
        title: 'Folder Selection Restricted',
        message: 'Cannot select a drive root folder.',
        detail:
          'Selecting a drive root (e.g., C:\\) causes severe performance issues. Please select a subfolder containing your videos.',
        buttons: ['OK'],
      });
      return null;
    }

    return selectedPath;
  }

  setFullscreen(window: BrowserWindow, enable: boolean): void {
    const windowId = window.id;
    let count = UIService.fullScreenLocks.get(windowId) || 0;

    if (enable) {
      // ロック開始時 (0 -> 1) に現在の状態を保存
      if (count === 0) {
        UIService.initialWindowStates.set(windowId, window.isFullScreen());
      }
      count++;
    } else {
      count = Math.max(0, count - 1);
    }

    UIService.fullScreenLocks.set(windowId, count);

    if (count > 0) {
      // ロック中は常にフルスクリーンを強制
      if (!window.isFullScreen()) {
        window.setFullScreen(true);
      }
    } else {
      // ロック解除時 (1 -> 0)、保存しておいた初期状態に戻す
      const wasFullScreen = UIService.initialWindowStates.get(windowId) ?? false;

      // 現在の状態と復元すべき状態が異なる場合のみ変更
      if (window.isFullScreen() !== wasFullScreen) {
        window.setFullScreen(wasFullScreen);
      }

      // 状態をクリア
      UIService.initialWindowStates.delete(windowId);
    }
  }

  startDrag(sender: Electron.WebContents, files: string | string[]): void {
    const fileList = Array.isArray(files) ? files : [files];

    if (fileList.length === 0) return;

    const primaryFile = fileList[0];

    const thumbDir = path.join(app.getPath('userData'), THUMBNAIL.DIR_NAME);
    const hash = crypto.createHash('md5').update(primaryFile).digest('hex');
    const thumbPath = path.join(thumbDir, `${hash}${THUMBNAIL.EXTENSION}`);

    let icon: string | Electron.NativeImage;

    if (fs.existsSync(thumbPath)) {
      icon = thumbPath;
    } else {
      icon = nativeImage.createEmpty();
    }

    sender.startDrag({
      file: primaryFile,
      files: fileList,
      icon: icon,
    });
  }
}
