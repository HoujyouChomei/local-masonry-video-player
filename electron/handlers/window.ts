// electron/handlers/window.ts

import { ipcMain, BrowserWindow } from 'electron';

// 動画プレイヤーによるフルスクリーン制御の状態管理
// null: 動画による制御なし（初期状態）
// true: 動画フルスクリーン開始時に、元々フルスクリーンだった
// false: 動画フルスクリーン開始時に、元々ウィンドウモードだった
let previousFullScreenState: boolean | null = null;

export const handleWindowControls = () => {
  ipcMain.handle('set-fullscreen', (event, enable: boolean) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;

    // 現在の状態を取得
    const isCurrentlyFullScreen = win.isFullScreen();

    if (enable) {
      // --- フルスクリーン化 (ON) ---

      // 1. 元の状態を保存 (まだ保存していない場合のみ = 上書き防止)
      // ReactのStrict Mode等で短時間に2回呼ばれた場合、2回目は既にフルスクリーンになっているため
      // ここでガードしないと「元々フルスクリーンだった」と誤認してしまう。
      if (previousFullScreenState === null) {
        previousFullScreenState = isCurrentlyFullScreen;
      }

      // 2. 実際にフルスクリーンにする (まだなっていなければ)
      if (!isCurrentlyFullScreen) {
        win.setFullScreen(true);
      }
    } else {
      // --- フルスクリーン解除 (OFF) ---

      // 保存された状態がある場合のみ復元を試みる
      if (previousFullScreenState !== null) {
        // 元の状態に戻す
        // 例: 元がWindow(false)で、今Full(true)なら -> setFullScreen(false)
        // 例: 元がFull(true)で、今Full(true)なら -> 何もしない (F11維持)
        if (isCurrentlyFullScreen !== previousFullScreenState) {
          win.setFullScreen(previousFullScreenState);
        }

        // 状態をリセット (これで次の操作に備える)
        previousFullScreenState = null;
      }
    }
  });
};
