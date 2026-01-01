// electron/core/services/ui-service.ts

import { dialog, BrowserWindow, app } from 'electron';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

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

    const thumbDir = path.join(app.getPath('userData'), 'thumbnails');
    const hash = crypto.createHash('md5').update(primaryFile).digest('hex');
    const thumbPath = path.join(thumbDir, `${hash}.jpg`);

    // ElectronのstartDragはiconパスが無効（空文字含む）だと "Failed to load image from path" エラーになる
    const dragOptions: { file: string; files: string[]; icon?: string } = {
      file: primaryFile, // 必須: 常に先頭のファイルを指定
      files: fileList, // 複数ファイル用
    };

    if (fs.existsSync(thumbPath)) {
      dragOptions.icon = thumbPath;
    }
    // サムネイルがない場合は icon プロパティを省略（OSデフォルトのドラッグ表示にフォールバック）

    sender.startDrag(dragOptions as unknown as Electron.Item);
  }
}