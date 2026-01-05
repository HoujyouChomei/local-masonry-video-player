// electron/handlers/drag-drop.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import { handleDragDrop } from './drag-drop';

// モックの定義
vi.mock('electron', () => ({
  ipcMain: {
    on: vi.fn(),
  },
  app: {
    getPath: vi.fn().mockReturnValue('/mock/userData'),
  },
  // ▼▼▼ 追加: nativeImage のモック ▼▼▼
  nativeImage: {
    createEmpty: vi.fn().mockReturnValue({ isEmpty: () => true }),
  },
}));

// fsモジュールのモック修正
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  // デフォルトエクスポートと名前付きエクスポートの両方に対応
  return {
    ...actual,
    default: {
      ...actual,
      existsSync: vi.fn(),
    },
    existsSync: vi.fn(),
  };
});

describe('handleDragDrop', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let onDragStartHandler: ((event: any, files: string | string[]) => void) | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockEvent: any;

  beforeEach(() => {
    handleDragDrop();

    const onMock = vi.mocked(ipcMain.on);
    const call = onMock.mock.calls.find((c) => c[0] === 'ondragstart');
    if (call) {
      onDragStartHandler = call[1];
    }

    mockEvent = {
      sender: {
        startDrag: vi.fn(),
      },
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should register "ondragstart" handler', () => {
    expect(ipcMain.on).toHaveBeenCalledWith('ondragstart', expect.any(Function));
  });

  it('should start drag with icon if thumbnail exists', () => {
    const videoPath = '/path/to/video.mp4';
    // サムネイルが存在すると仮定
    vi.mocked(fs.existsSync).mockReturnValue(true);

    onDragStartHandler?.(mockEvent, videoPath);

    expect(mockEvent.sender.startDrag).toHaveBeenCalledWith(
      expect.objectContaining({
        file: videoPath,
        files: [videoPath],
        icon: expect.stringContaining(path.join('/mock/userData', 'thumbnails')),
      })
    );
  });

  it('should start drag without icon if thumbnail does not exist', () => {
    const videoPath = '/path/to/video.mp4';
    // サムネイルが存在しないと仮定
    vi.mocked(fs.existsSync).mockReturnValue(false);

    onDragStartHandler?.(mockEvent, videoPath);

    expect(mockEvent.sender.startDrag).toHaveBeenCalledWith(
      expect.not.objectContaining({
        icon: expect.any(String),
      })
    );
    expect(mockEvent.sender.startDrag).toHaveBeenCalledWith(
      expect.objectContaining({
        file: videoPath,
        files: [videoPath],
      })
    );
  });

  it('should handle multiple files', () => {
    const files = ['/path/to/video1.mp4', '/path/to/video2.mp4'];
    vi.mocked(fs.existsSync).mockReturnValue(false);

    onDragStartHandler?.(mockEvent, files);

    expect(mockEvent.sender.startDrag).toHaveBeenCalledWith(
      expect.objectContaining({
        file: files[0], // 代表ファイルは先頭
        files: files,
      })
    );
  });

  it('should do nothing if file list is empty', () => {
    onDragStartHandler?.(mockEvent, []);
    expect(mockEvent.sender.startDrag).not.toHaveBeenCalled();
  });
});
