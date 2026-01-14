// electron/core/services/thumbnail-service.test.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThumbnailService } from './thumbnail-service';
import path from 'path';
import { THUMBNAIL } from '../../../src/shared/constants/assets';

const fsMocks = vi.hoisted(() => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  unlinkSync: vi.fn(),
  writeFile: vi.fn(),
}));

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

const ffmpegMocks = vi.hoisted(() => ({
  generateThumbnail: vi.fn(),
}));

vi.mock('./ffmpeg-service', () => ({
  FFmpegService: class {
    generateThumbnail = ffmpegMocks.generateThumbnail;
  },
}));

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
  const thumbDir = path.join('/mock/userData', THUMBNAIL.DIR_NAME);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    (ThumbnailService as any).instance = undefined;

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
    fsMocks.existsSync.mockImplementation((p: any) => {
      if (p === thumbDir) return true;
      return false;
    });

    service = ThumbnailService.getInstance();
    const videoPath = '/videos/test.mp4';

    service.addToQueue([videoPath]);

    await vi.advanceTimersByTimeAsync(200);

    expect(nativeImage.createThumbnailFromPath).toHaveBeenCalledWith(videoPath, expect.anything());
    expect(fsMocks.writeFile).toHaveBeenCalledWith(
      expect.stringContaining(THUMBNAIL.EXTENSION),
      expect.anything()
    );
    expect(notifierMocks.notify).toHaveBeenCalledWith({ type: 'thumbnail', path: videoPath });
    expect(ffmpegMocks.generateThumbnail).not.toHaveBeenCalled();
  });

  it('should fallback to FFmpeg if Native Image fails or is empty', async () => {
    fsMocks.existsSync.mockImplementation((p: any) => {
      if (p === thumbDir) return true;
      return false;
    });

    service = ThumbnailService.getInstance();
    const videoPath = '/videos/test.mp4';

    mockNativeImage.isEmpty.mockReturnValue(true);
    ffmpegMocks.generateThumbnail.mockResolvedValue(true);

    service.addToQueue([videoPath]);
    await vi.advanceTimersByTimeAsync(200);

    expect(nativeImage.createThumbnailFromPath).toHaveBeenCalled();
    expect(ffmpegMocks.generateThumbnail).toHaveBeenCalledWith(
      videoPath,
      expect.stringContaining(THUMBNAIL.EXTENSION)
    );
    expect(notifierMocks.notify).toHaveBeenCalled();
  });

  it('should use FFmpeg directly for non-native extensions', async () => {
    fsMocks.existsSync.mockImplementation((p: any) => {
      if (p === thumbDir) return true;
      return false;
    });

    service = ThumbnailService.getInstance();
    const videoPath = '/videos/test.mkv';

    ffmpegMocks.generateThumbnail.mockResolvedValue(true);

    service.addToQueue([videoPath]);
    await vi.advanceTimersByTimeAsync(200);

    expect(nativeImage.createThumbnailFromPath).not.toHaveBeenCalled();
    expect(ffmpegMocks.generateThumbnail).toHaveBeenCalled();
  });

  it('should skip generation if thumbnail exists and force is false', async () => {
    service = ThumbnailService.getInstance();
    const videoPath = '/videos/test.mp4';

    fsMocks.existsSync.mockImplementation((p: any) => {
      if (p === thumbDir) return true;
      if (typeof p === 'string' && p.includes(THUMBNAIL.EXTENSION)) return true;
      return false;
    });

    service.addToQueue([videoPath], false);
    await vi.advanceTimersByTimeAsync(200);

    expect(nativeImage.createThumbnailFromPath).not.toHaveBeenCalled();
    expect(ffmpegMocks.generateThumbnail).not.toHaveBeenCalled();
    expect(notifierMocks.notify).not.toHaveBeenCalled();
  });

  it('should force regenerate if force is true', async () => {
    service = ThumbnailService.getInstance();
    const videoPath = '/videos/test.mp4';

    fsMocks.existsSync.mockReturnValue(true);

    service.addToQueue([videoPath], true);
    await vi.advanceTimersByTimeAsync(200);

    expect(nativeImage.createThumbnailFromPath).toHaveBeenCalled();
  });

  it('should delete thumbnail', () => {
    service = ThumbnailService.getInstance();
    const videoPath = '/videos/test.mp4';

    fsMocks.existsSync.mockReturnValue(true);

    service.deleteThumbnail(videoPath);

    expect(fsMocks.unlinkSync).toHaveBeenCalledWith(expect.stringContaining(THUMBNAIL.EXTENSION));
  });
});
