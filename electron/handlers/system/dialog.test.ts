// electron/handlers/system/dialog.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ipcMain, dialog, BrowserWindow } from 'electron';
import { handleDialog } from './dialog';
import path from 'path';

vi.mock('electron', () => {
  const mockIpcMain = {
    handle: vi.fn(),
    removeHandler: vi.fn(),
  };
  const mockDialog = {
    showOpenDialog: vi.fn(),
    showMessageBox: vi.fn(),
  };
  const mockBrowserWindow = {
    getFocusedWindow: vi.fn(),
  };
  return {
    ipcMain: mockIpcMain,
    dialog: mockDialog,
    BrowserWindow: mockBrowserWindow,
  };
});

describe('handleDialog', () => {
  let selectFolderHandler: (() => Promise<string | null>) | undefined;

  beforeEach(() => {
    handleDialog();

    const handleMock = vi.mocked(ipcMain.handle);
    if (handleMock.mock.calls.length > 0 && handleMock.mock.calls[0][0] === 'select-folder') {
      selectFolderHandler = handleMock.mock.calls[0][1] as () => Promise<string | null>;
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should register "select-folder" IPC handler', () => {
    expect(ipcMain.handle).toHaveBeenCalledWith('select-folder', expect.any(Function));
  });

  it('should return the selected folder path if a folder is chosen', async () => {
    const mockWindow = {} as BrowserWindow;
    vi.mocked(BrowserWindow.getFocusedWindow).mockReturnValue(mockWindow);
    vi.mocked(dialog.showOpenDialog).mockResolvedValue({
      canceled: false,
      filePaths: ['/path/to/videos'],
    });

    const result = await selectFolderHandler?.();
    expect(result).toBe('/path/to/videos');
    expect(dialog.showOpenDialog).toHaveBeenCalledWith(mockWindow, {
      properties: ['openDirectory'],
    });
    expect(dialog.showMessageBox).not.toHaveBeenCalled();
  });

  it('should return null if the dialog is canceled', async () => {
    const mockWindow = {} as BrowserWindow;
    vi.mocked(BrowserWindow.getFocusedWindow).mockReturnValue(mockWindow);
    vi.mocked(dialog.showOpenDialog).mockResolvedValue({
      canceled: true,
      filePaths: [],
    });

    const result = await selectFolderHandler?.();
    expect(result).toBe(null);
  });

  it('should return null if no folder is selected', async () => {
    const mockWindow = {} as BrowserWindow;
    vi.mocked(BrowserWindow.getFocusedWindow).mockReturnValue(mockWindow);
    vi.mocked(dialog.showOpenDialog).mockResolvedValue({
      canceled: false,
      filePaths: [],
    });

    const result = await selectFolderHandler?.();
    expect(result).toBe(null);
  });

  it('should return null and show a warning if a Windows root drive is selected', async () => {
    const mockWindow = {} as BrowserWindow;
    vi.mocked(BrowserWindow.getFocusedWindow).mockReturnValue(mockWindow);
    vi.mocked(dialog.showOpenDialog).mockResolvedValue({
      canceled: false,
      filePaths: ['C:\\'],
    });

    expect(path.dirname('C:\\')).toBe('C:\\');

    const result = await selectFolderHandler?.();
    expect(result).toBe(null);
    expect(dialog.showMessageBox).toHaveBeenCalledWith(
      mockWindow,
      expect.objectContaining({
        type: 'warning',
        title: 'Folder Selection Restricted',
        message: 'Cannot select a drive root folder.',
      })
    );
  });

  it('should return null and show a warning if a POSIX root directory is selected', async () => {
    const mockWindow = {} as BrowserWindow;
    vi.mocked(BrowserWindow.getFocusedWindow).mockReturnValue(mockWindow);
    vi.mocked(dialog.showOpenDialog).mockResolvedValue({
      canceled: false,
      filePaths: ['/'],
    });

    expect(path.dirname('/')).toBe('/');

    const result = await selectFolderHandler?.();
    expect(result).toBe(null);
    expect(dialog.showMessageBox).toHaveBeenCalledTimes(1);
  });

  it('should return null if no window is focused', async () => {
    vi.mocked(BrowserWindow.getFocusedWindow).mockReturnValue(null);

    const result = await selectFolderHandler?.();
    expect(result).toBe(null);
    expect(dialog.showOpenDialog).not.toHaveBeenCalled();
  });
});
