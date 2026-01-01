// electron/handlers/window.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ipcMain, BrowserWindow } from 'electron';

// Electronモジュールのモック
vi.mock('electron', () => {
  const mockIpcMain = {
    handle: vi.fn(),
  };
  const mockBrowserWindow = {
    fromWebContents: vi.fn(),
  };
  return {
    ipcMain: mockIpcMain,
    BrowserWindow: mockBrowserWindow,
  };
});

describe('handleWindowControls', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let handleFullScreen: ((event: any, enable: boolean) => void) | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockWindow: any;

  beforeEach(async () => {
    // モジュールレベルの変数(previousFullScreenState)をリセットするためにモジュールを再読み込み
    vi.resetModules();
    const { handleWindowControls } = await import('./window');
    handleWindowControls();

    const handleMock = vi.mocked(ipcMain.handle);
    // 登録されたハンドラを取得
    const call = handleMock.mock.calls.find((c) => c[0] === 'set-fullscreen');
    if (call) {
      handleFullScreen = call[1];
    }

    mockWindow = {
      isFullScreen: vi.fn(),
      setFullScreen: vi.fn(),
    };
    vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(mockWindow);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should register "set-fullscreen" handler', () => {
    expect(ipcMain.handle).toHaveBeenCalledWith('set-fullscreen', expect.any(Function));
  });

  it('should enable fullscreen and save previous state (windowed -> fullscreen)', () => {
    // 初期状態: ウィンドウモード
    mockWindow.isFullScreen.mockReturnValue(false);

    const mockEvent = { sender: {} };
    handleFullScreen?.(mockEvent, true);

    expect(mockWindow.isFullScreen).toHaveBeenCalled();
    expect(mockWindow.setFullScreen).toHaveBeenCalledWith(true);
    // 内部で previousFullScreenState = false が保存されているはず
  });

  it('should not override saved state if called twice with true', () => {
    const mockEvent = { sender: {} };

    // 1回目: ウィンドウモード -> フルスクリーン化要請
    mockWindow.isFullScreen.mockReturnValue(false);
    handleFullScreen?.(mockEvent, true);
    // -> previousFullScreenState = false が保存され、setFullScreen(true) 実行

    // 2回目: 既にフルスクリーンになっている状態で再度要請
    mockWindow.isFullScreen.mockReturnValue(true);
    handleFullScreen?.(mockEvent, true);

    // 内部状態が上書きされていないことの確認は間接的になるが、
    // 少なくとも setFullScreen(true) は重複して呼ばれない（実装上のガード）
    expect(mockWindow.setFullScreen).toHaveBeenCalledTimes(1);
  });

  it('should restore previous state when disabling fullscreen (restores to windowed)', () => {
    const mockEvent = { sender: {} };

    // 1. Enable Fullscreen (Save state: false)
    mockWindow.isFullScreen.mockReturnValue(false);
    handleFullScreen?.(mockEvent, true); // previousFullScreenState = false

    // 2. Disable Fullscreen
    mockWindow.isFullScreen.mockReturnValue(true); // 現在はフルスクリーン
    handleFullScreen?.(mockEvent, false);

    // 元の状態(false)に戻すため setFullScreen(false) が呼ばれるはず
    expect(mockWindow.setFullScreen).toHaveBeenCalledWith(false);
  });

  it('should not restore state if current state matches previous state', () => {
    const mockEvent = { sender: {} };

    // 1. Enable Fullscreen (元々フルスクリーンだった場合)
    mockWindow.isFullScreen.mockReturnValue(true);
    handleFullScreen?.(mockEvent, true); // previousFullScreenState = true

    // 2. Disable Fullscreen
    mockWindow.isFullScreen.mockReturnValue(true);
    handleFullScreen?.(mockEvent, false);

    // 元の状態(true)と同じなので、setFullScreenは呼ばれない
    expect(mockWindow.setFullScreen).not.toHaveBeenCalledWith(false);
  });

  it('should do nothing if window is not found', () => {
    vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(null);
    const mockEvent = { sender: {} };

    // エラーにならなければOK
    expect(() => handleFullScreen?.(mockEvent, true)).not.toThrow();
  });
});