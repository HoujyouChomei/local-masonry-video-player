// electron/core/services/metadata-harvester.test.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MetadataHarvester } from './metadata-harvester';

// --- Mocks Setup ---

// 1. VideoRepository Mock
const videoRepoMocks = vi.hoisted(() => ({
  findById: vi.fn(),
}));

vi.mock('../repositories/video-repository', () => ({
  VideoRepository: class {
    findById = videoRepoMocks.findById;
  },
}));

// 2. VideoMetadataRepository Mock
const metaRepoMocks = vi.hoisted(() => ({
  updateMetadataStatus: vi.fn(),
  updateGenerationParams: vi.fn(),
  updateMetadata: vi.fn(),
  getPendingVideos: vi.fn(),
  resetIncompleteMetadataStatus: vi.fn(),
}));

vi.mock('../repositories/video-metadata-repository', () => ({
  VideoMetadataRepository: class {
    updateMetadataStatus = metaRepoMocks.updateMetadataStatus;
    updateGenerationParams = metaRepoMocks.updateGenerationParams;
    updateMetadata = metaRepoMocks.updateMetadata;
    getPendingVideos = metaRepoMocks.getPendingVideos;
    resetIncompleteMetadataStatus = metaRepoMocks.resetIncompleteMetadataStatus;
  },
}));

// 3. FFmpegService Mock
const ffmpegMocks = vi.hoisted(() => ({
  extractMetadata: vi.fn(),
  ffprobePath: '/usr/bin/ffprobe',
}));

vi.mock('./ffmpeg-service', () => ({
  FFmpegService: class {
    extractMetadata = ffmpegMocks.extractMetadata;
    get ffprobePath() {
      return ffmpegMocks.ffprobePath;
    }
  },
}));

// 4. NotificationService Mock (変更点: Electronの直接モックではなくこちらを使用)
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

describe('MetadataHarvester', () => {
  let harvester: MetadataHarvester;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    metaRepoMocks.resetIncompleteMetadataStatus.mockReturnValue(0);
    metaRepoMocks.getPendingVideos.mockReturnValue([]);

    // シングルトンインスタンスを強制リセット
    (MetadataHarvester as any).instance = undefined;
  });

  afterEach(() => {
    if (harvester) {
      harvester.stop();
    }
    vi.useRealTimers();
  });

  it('should start loop and process batch queue', async () => {
    // Setup
    const mockVideo = { id: 'v1', path: '/video.mp4', name: 'video.mp4', status: 'available' };
    metaRepoMocks.getPendingVideos.mockReturnValue([mockVideo]);

    ffmpegMocks.extractMetadata.mockResolvedValue({
      duration: 120,
      width: 1920,
      height: 1080,
      fps: 30,
      codec: 'h264',
      tags: { prompt: 'masterpiece' },
    });

    videoRepoMocks.findById.mockReturnValue(mockVideo);

    harvester = MetadataHarvester.getInstance();

    await vi.advanceTimersByTimeAsync(100);

    // 検証
    expect(metaRepoMocks.updateMetadataStatus).toHaveBeenCalledWith('v1', 'processing');
    expect(ffmpegMocks.extractMetadata).toHaveBeenCalledWith('/video.mp4');
    expect(metaRepoMocks.updateGenerationParams).toHaveBeenCalledWith(
      'v1',
      JSON.stringify({ prompt: 'masterpiece' })
    );
    expect(metaRepoMocks.updateMetadata).toHaveBeenCalledWith(
      '/video.mp4',
      120,
      1920,
      1080,
      30,
      'h264'
    );
    // NotificationService.notify が呼ばれたか確認
    expect(notifierMocks.notify).toHaveBeenCalledWith({
      type: 'update',
      path: '/video.mp4',
    });
  });

  it('should handle extraction failure', async () => {
    const mockVideo = { id: 'v2', path: '/fail.mp4', name: 'fail.mp4', status: 'available' };
    metaRepoMocks.getPendingVideos.mockReturnValue([mockVideo]);
    videoRepoMocks.findById.mockReturnValue(mockVideo);

    ffmpegMocks.extractMetadata.mockResolvedValue(null);

    harvester = MetadataHarvester.getInstance();

    await vi.advanceTimersByTimeAsync(100);

    expect(metaRepoMocks.updateMetadataStatus).toHaveBeenCalledWith('v2', 'processing');
    expect(metaRepoMocks.updateMetadataStatus).toHaveBeenCalledWith('v2', 'failed');
    expect(metaRepoMocks.updateGenerationParams).not.toHaveBeenCalled();
  });

  it('should process on-demand request with higher priority', async () => {
    const batchVideo = { id: 'batch', path: '/batch.mp4', status: 'available', name: 'batch' };
    const priorityVideo = {
      id: 'priority',
      path: '/priority.mp4',
      status: 'available',
      name: 'priority',
    };

    // 最初の呼び出しは空にしてアイドル状態へ
    metaRepoMocks.getPendingVideos.mockReturnValueOnce([]).mockReturnValue([batchVideo]);

    videoRepoMocks.findById.mockImplementation((id: string) => {
      if (id === 'priority') return priorityVideo;
      if (id === 'batch') return batchVideo;
      return undefined;
    });

    ffmpegMocks.extractMetadata.mockResolvedValue({});

    harvester = MetadataHarvester.getInstance();
    // アイドル状態になるまで進める
    await vi.advanceTimersByTimeAsync(50);

    harvester.requestHarvest('priority');

    // 優先処理
    await vi.advanceTimersByTimeAsync(100);
    expect(metaRepoMocks.updateMetadataStatus).toHaveBeenNthCalledWith(1, 'priority', 'processing');

    // バッチ処理（アイドル待機後）
    await vi.advanceTimersByTimeAsync(15000);
    expect(metaRepoMocks.updateMetadataStatus).toHaveBeenNthCalledWith(2, 'batch', 'processing');
  });

  it('should skip processing if video is not available or deleted', async () => {
    const mockVideo = { id: 'v3', path: '/deleted.mp4', status: 'available' };
    metaRepoMocks.getPendingVideos.mockReturnValue([mockVideo]);

    // DB再取得時に missing を返す
    videoRepoMocks.findById.mockReturnValue({ ...mockVideo, status: 'missing' });

    harvester = MetadataHarvester.getInstance();

    await vi.advanceTimersByTimeAsync(100);

    expect(metaRepoMocks.updateMetadataStatus).not.toHaveBeenCalledWith('v3', 'processing');
    expect(ffmpegMocks.extractMetadata).not.toHaveBeenCalled();
  });

  it('should reset incomplete metadata on startup', () => {
    harvester = MetadataHarvester.getInstance();
    expect(metaRepoMocks.resetIncompleteMetadataStatus).toHaveBeenCalled();
  });
});
