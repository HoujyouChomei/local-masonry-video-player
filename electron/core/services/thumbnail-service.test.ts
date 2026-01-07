// electron/core/services/thumbnail-service.test.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThumbnailService } from './thumbnail-service';
import path from 'path';
import { THUMBNAIL } from '../../../src/shared/constants/assets';

// --- Mocks ---

// 1. fs Mocks (Hoisted for reliable reference)
const fsMocks = vi.hoisted(() => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  unlinkSync: vi.fn(),
  writeFile: vi.fn(),
}));

// fs (Partial Mock)
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    default: {
      ...actual,
      existsSync: fsMocks.existsSync,
      mkdirSync: fsMocks.mkdirSync,
      unlinkSync: fsMocks.unlinkSync,
      promises: {
        ...(actual.promises || {}),
        writeFile: fsMocks.writeFile,
      },
    },
    existsSync: fsMocks.existsSync,
    mkdirSync: fsMocks.mkdirSync,
    unlinkSync: fsMocks.unlinkSync,
    promises: {
      ...(actual.promises || {}),
      writeFile: fsMocks.writeFile,
    },
  };
});

// 2. Electron
const mockNativeImage = {
  isEmpty: vi.fn(),
  toJPEG: vi.fn(),
};

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/mock/userData'),
  },
  nativeImage: {
    createThumbnailFromPath: vi.fn(),
    createEmpty: vi.fn(),
  },
}));

import { nativeImage } from 'electron';

// 3. FFmpegService
const ffmpegMocks = vi.hoisted(() => ({
  generateThumbnail: vi.fn(),
}));

vi.mock('./ffmpeg-service', () => ({
  FFmpegService: class {
    generateThumbnail = ffmpegMocks.generateThumbnail;
  },
}));

// 4. NotificationService
const notifierMocks = vi.hoisted(() => ({
  notify: vi.fn(),
}));

vi.mock('./notification-service', () => ({
  NotificationService: {
    getInstance: () => ({
      notify: notifierMocks.notify,
    }),
  },
}));

describe('ThumbnailService', () => {
  let service: ThumbnailService;
  // サムネイルディレクトリのパス (mock)
  const thumbDir = path.join('/mock/userData', THUMBNAIL.DIR_NAME);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // シングルトンリセット
    (ThumbnailService as any).instance = undefined;

    // fsのデフォルト挙動:
    // ディレクトリ作成チェック(thumbDir)は false (存在しない) -> mkdirSync呼ばれる
    // ファイル存在チェックは false (存在しない) -> 生成処理走る
    // ▼▼▼ 修正: 引数 p を _p に変更して未使用エラーを回避 ▼▼▼
    fsMocks.existsSync.mockImplementation((_p: any) => {
      return false;
    });

    vi.mocked(nativeImage.createThumbnailFromPath).mockResolvedValue(mockNativeImage as any);
    mockNativeImage.isEmpty.mockReturnValue(false);
    mockNativeImage.toJPEG.mockReturnValue(Buffer.from('mock-jpeg'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize and create directory if not exists', () => {
    fsMocks.existsSync.mockReturnValue(false);
    service = ThumbnailService.getInstance();
    expect(fsMocks.mkdirSync).toHaveBeenCalledWith(thumbDir, { recursive: true });
  });

  it('should generate thumbnail using Native Image (MP4)', async () => {
    // ディレクトリは存在するが、ファイルは存在しない状態をモック
    fsMocks.existsSync.mockImplementation((p: any) => {
      if (p === thumbDir) return true;
      return false; // ファイルはない
    });

    service = ThumbnailService.getInstance();
    const videoPath = '/videos/test.mp4';

    service.addToQueue([videoPath]);

    await vi.advanceTimersByTimeAsync(200);

    // Native Image生成が呼ばれる
    expect(nativeImage.createThumbnailFromPath).toHaveBeenCalledWith(videoPath, expect.anything());
    // 保存される
    expect(fsMocks.writeFile).toHaveBeenCalledWith(
      expect.stringContaining(THUMBNAIL.EXTENSION),
      expect.anything()
    );
    // 通知が飛ぶ
    expect(notifierMocks.notify).toHaveBeenCalledWith({ type: 'thumbnail', path: videoPath });
    // FFmpegは呼ばれない
    expect(ffmpegMocks.generateThumbnail).not.toHaveBeenCalled();
  });

  it('should fallback to FFmpeg if Native Image fails or is empty', async () => {
    // ディレクトリあり、ファイルなし
    fsMocks.existsSync.mockImplementation((p: any) => {
      if (p === thumbDir) return true;
      return false;
    });

    service = ThumbnailService.getInstance();
    const videoPath = '/videos/test.mp4';

    // Native生成で空が返る設定
    mockNativeImage.isEmpty.mockReturnValue(true);
    // FFmpeg成功設定
    ffmpegMocks.generateThumbnail.mockResolvedValue(true);

    service.addToQueue([videoPath]);
    await vi.advanceTimersByTimeAsync(200);

    expect(nativeImage.createThumbnailFromPath).toHaveBeenCalled();
    // FFmpegが呼ばれる
    expect(ffmpegMocks.generateThumbnail).toHaveBeenCalledWith(
      videoPath,
      expect.stringContaining(THUMBNAIL.EXTENSION)
    );
    // 通知が飛ぶ
    expect(notifierMocks.notify).toHaveBeenCalled();
  });

  it('should use FFmpeg directly for non-native extensions', async () => {
    // ディレクトリあり、ファイルなし
    fsMocks.existsSync.mockImplementation((p: any) => {
      if (p === thumbDir) return true;
      return false;
    });

    service = ThumbnailService.getInstance();
    const videoPath = '/videos/test.mkv'; // .mkv はNative非対応

    ffmpegMocks.generateThumbnail.mockResolvedValue(true);

    service.addToQueue([videoPath]);
    await vi.advanceTimersByTimeAsync(200);

    // Nativeは呼ばれないはず
    expect(nativeImage.createThumbnailFromPath).not.toHaveBeenCalled();
    // FFmpegが呼ばれる
    expect(ffmpegMocks.generateThumbnail).toHaveBeenCalled();
  });

  it('should skip generation if thumbnail exists and force is false', async () => {
    service = ThumbnailService.getInstance();
    const videoPath = '/videos/test.mp4';

    // サムネイルが存在する設定
    fsMocks.existsSync.mockImplementation((p: any) => {
      // ディレクトリチェック
      if (p === thumbDir) return true;
      // ファイルチェック
      if (typeof p === 'string' && p.includes(THUMBNAIL.EXTENSION)) return true;
      return false;
    });

    service.addToQueue([videoPath], false); // force = false
    await vi.advanceTimersByTimeAsync(200);

    expect(nativeImage.createThumbnailFromPath).not.toHaveBeenCalled();
    expect(ffmpegMocks.generateThumbnail).not.toHaveBeenCalled();
    // スキップされた場合、通知は送られない
    expect(notifierMocks.notify).not.toHaveBeenCalled();
  });

  it('should force regenerate if force is true', async () => {
    service = ThumbnailService.getInstance();
    const videoPath = '/videos/test.mp4';

    // サムネイルが存在する設定
    fsMocks.existsSync.mockReturnValue(true);

    service.addToQueue([videoPath], true); // force = true
    await vi.advanceTimersByTimeAsync(200);

    // 存在しても生成処理が走る
    expect(nativeImage.createThumbnailFromPath).toHaveBeenCalled();
  });

  it('should delete thumbnail', () => {
    service = ThumbnailService.getInstance();
    const videoPath = '/videos/test.mp4';

    // 削除対象が存在する設定
    fsMocks.existsSync.mockReturnValue(true);

    service.deleteThumbnail(videoPath);

    expect(fsMocks.unlinkSync).toHaveBeenCalledWith(expect.stringContaining(THUMBNAIL.EXTENSION));
  });
});
