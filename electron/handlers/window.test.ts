// electron/handlers/window.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ipcMain, BrowserWindow } from 'electron';

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
    vi.resetModules();
    const { handleWindowControls } = await import('./window');
    handleWindowControls();

    const handleMock = vi.mocked(ipcMain.handle);
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
    mockWindow.isFullScreen.mockReturnValue(false);

    const mockEvent = { sender: {} };
    handleFullScreen?.(mockEvent, true);

    expect(mockWindow.isFullScreen).toHaveBeenCalled();
    expect(mockWindow.setFullScreen).toHaveBeenCalledWith(true);
  });

  it('should not override saved state if called twice with true', () => {
    const mockEvent = { sender: {} };

    mockWindow.isFullScreen.mockReturnValue(false);
    handleFullScreen?.(mockEvent, true);

    mockWindow.isFullScreen.mockReturnValue(true);
    handleFullScreen?.(mockEvent, true);

    expect(mockWindow.setFullScreen).toHaveBeenCalledTimes(1);
  });

  it('should restore previous state when disabling fullscreen (restores to windowed)', () => {
    const mockEvent = { sender: {} };

    mockWindow.isFullScreen.mockReturnValue(false);
    handleFullScreen?.(mockEvent, true);

    mockWindow.isFullScreen.mockReturnValue(true);
    handleFullScreen?.(mockEvent, false);

    expect(mockWindow.setFullScreen).toHaveBeenCalledWith(false);
  });

  it('should not restore state if current state matches previous state', () => {
    const mockEvent = { sender: {} };

    mockWindow.isFullScreen.mockReturnValue(true);
    handleFullScreen?.(mockEvent, true);

    mockWindow.isFullScreen.mockReturnValue(true);
    handleFullScreen?.(mockEvent, false);

    expect(mockWindow.setFullScreen).not.toHaveBeenCalledWith(false);
  });

  it('should do nothing if window is not found', () => {
    vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(null);
    const mockEvent = { sender: {} };

    expect(() => handleFullScreen?.(mockEvent, true)).not.toThrow();
  });
});
