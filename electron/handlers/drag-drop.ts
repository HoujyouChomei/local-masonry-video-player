// electron/handlers/drag-drop.ts

import { ipcMain, app } from 'electron';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export const handleDragDrop = () => {
  ipcMain.on('ondragstart', (event, files: string | string[]) => {
    const fileList = Array.isArray(files) ? files : [files];

    if (fileList.length === 0) return;

    // 代表ファイル（アイコン生成用および必須プロパティ用）はリストの最初を使用
    const primaryFile = fileList[0];

    const thumbDir = path.join(app.getPath('userData'), 'thumbnails');
    const hash = crypto.createHash('md5').update(primaryFile).digest('hex');
    const thumbPath = path.join(thumbDir, `${hash}.jpg`);

    // ▼▼▼ 修正: iconパスが存在する場合のみ設定する ▼▼▼
    // ElectronのstartDragはiconパスが無効（空文字含む）だと "Failed to load image from path" エラーになる
    const dragOptions: { file: string; files: string[]; icon?: string } = {
      file: primaryFile, // 必須: 常に先頭のファイルを指定
      files: fileList, // 複数ファイル用
    };

    if (fs.existsSync(thumbPath)) {
      dragOptions.icon = thumbPath;
    }
    // サムネイルがない場合は icon プロパティを省略（OSデフォルトのドラッグ表示にフォールバック）

    event.sender.startDrag(dragOptions as unknown as Electron.Item);
  });
};
