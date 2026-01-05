// electron/core/services/ui-service.ts

import { dialog, BrowserWindow, app, nativeImage } from 'electron';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { THUMBNAIL } from '../../../src/shared/constants/assets';

export class UIService {
  // 動画プレイヤーによるフルスクリーン制御の状態管理
  private previousFullScreenState: boolean | null = null;

  /**
   * フォルダ選択ダイアログを表示し、選択されたパスを返す。
   * ルートディレクトリが選択された場合は警告を表示し、nullを返す。
   */
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

  /**
   * ウィンドウのフルスクリーン状態を制御する
   */
  setFullscreen(window: BrowserWindow, enable: boolean): void {
    const isCurrentlyFullScreen = window.isFullScreen();

    if (enable) {
      if (this.previousFullScreenState === null) {
        this.previousFullScreenState = isCurrentlyFullScreen;
      }

      if (!isCurrentlyFullScreen) {
        window.setFullScreen(true);
      }
    } else {
      if (this.previousFullScreenState !== null) {
        if (isCurrentlyFullScreen !== this.previousFullScreenState) {
          window.setFullScreen(this.previousFullScreenState);
        }
        this.previousFullScreenState = null;
      }
    }
  }

  /**
   * ネイティブのドラッグ＆ドロップを開始する
   */
  startDrag(sender: Electron.WebContents, files: string | string[]): void {
    const fileList = Array.isArray(files) ? files : [files];

    if (fileList.length === 0) return;

    // 代表ファイル（アイコン生成用および必須プロパティ用）はリストの最初を使用
    const primaryFile = fileList[0];

    const thumbDir = path.join(app.getPath('userData'), THUMBNAIL.DIR_NAME);
    const hash = crypto.createHash('md5').update(primaryFile).digest('hex');
    const thumbPath = path.join(thumbDir, `${hash}${THUMBNAIL.EXTENSION}`);

    // ElectronのstartDragはiconが必須。
    // サムネイルがない場合は空のNativeImageを渡してクラッシュを防ぐ。
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
