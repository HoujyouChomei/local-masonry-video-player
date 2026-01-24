// electron/core/services/video/metadata-harvester.test.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('electron', () => ({
  app: {
    isPackaged: false,
    getPath: vi.fn(() => '/tmp'),
  },
}));

import { MetadataHarvester } from './metadata-harvester';

const mediaRepoMocks = vi.hoisted(() => ({
  findById: vi.fn(),
}));

vi.mock('../../repositories/media/media-repository', () => ({
  MediaRepository: class {
    findById = mediaRepoMocks.findById;
  },
}));

const metaRepoMocks = vi.hoisted(() => ({
  updateMetadataStatus: vi.fn(),
  updateGenerationParams: vi.fn(),
  updateMetadata: vi.fn(),
  getPendingMedia: vi.fn(),
  resetIncompleteMetadataStatus: vi.fn(),
  resetStuckProcessingStatus: vi.fn(),
}));

vi.mock('../../repositories/media/media-metadata', () => ({
  MediaMetadataRepository: class {
    updateMetadataStatus = metaRepoMocks.updateMetadataStatus;
    updateGenerationParams = metaRepoMocks.updateGenerationParams;
    updateMetadata = metaRepoMocks.updateMetadata;
    getPendingMedia = metaRepoMocks.getPendingMedia;
    resetIncompleteMetadataStatus = metaRepoMocks.resetIncompleteMetadataStatus;
    resetStuckProcessingStatus = metaRepoMocks.resetStuckProcessingStatus;
  },
}));

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

const eventBusMocks = vi.hoisted(() => ({
  emit: vi.fn(),
}));

vi.mock('../../events', () => ({
  eventBus: {
    emit: eventBusMocks.emit,
  },
}));

vi.mock('../../../lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('MetadataHarvester', () => {
  let harvester: MetadataHarvester;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    metaRepoMocks.resetIncompleteMetadataStatus.mockReturnValue(0);
    metaRepoMocks.resetStuckProcessingStatus.mockReturnValue(0);
    metaRepoMocks.getPendingMedia.mockReturnValue([]);
    ffmpegMocks.ffprobePath = '/usr/bin/ffprobe';

    (MetadataHarvester as any).instance = undefined;
  });

  afterEach(() => {
    if (harvester) {
      harvester.stop();
    }
    vi.useRealTimers();
  });

  it('should start loop and process batch queue', async () => {
    const mockMedia = { id: 'v1', path: '/video.mp4', name: 'video.mp4', status: 'available' };
    metaRepoMocks.getPendingMedia.mockReturnValue([mockMedia]);

    ffmpegMocks.extractMetadata.mockResolvedValue({
      duration: 120,
      width: 1920,
      height: 1080,
      fps: 30,
      codec: 'h264',
      tags: { prompt: 'masterpiece' },
    });

    mediaRepoMocks.findById.mockReturnValue(mockMedia);

    harvester = MetadataHarvester.getInstance();

    await vi.advanceTimersByTimeAsync(100);

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

    expect(eventBusMocks.emit).toHaveBeenCalledWith('media:updated', {
      id: 'v1',
      path: '/video.mp4',
    });
  });

  it('should handle extraction failure', async () => {
    const mockMedia = { id: 'v2', path: '/fail.mp4', name: 'fail.mp4', status: 'available' };
    metaRepoMocks.getPendingMedia.mockReturnValue([mockMedia]);
    mediaRepoMocks.findById.mockReturnValue(mockMedia);

    ffmpegMocks.extractMetadata.mockResolvedValue(null);

    harvester = MetadataHarvester.getInstance();

    await vi.advanceTimersByTimeAsync(100);

    expect(metaRepoMocks.updateMetadataStatus).toHaveBeenCalledWith('v2', 'processing');
    expect(metaRepoMocks.updateMetadataStatus).toHaveBeenCalledWith('v2', 'failed');
    expect(metaRepoMocks.updateGenerationParams).not.toHaveBeenCalled();
  });

  it('should process on-demand request with higher priority', async () => {
    const batchMedia = { id: 'batch', path: '/batch.mp4', status: 'available', name: 'batch' };
    const priorityMedia = {
      id: 'priority',
      path: '/priority.mp4',
      status: 'available',
      name: 'priority',
    };

    metaRepoMocks.getPendingMedia.mockReturnValueOnce([]).mockReturnValue([batchMedia]);

    mediaRepoMocks.findById.mockImplementation((id: string) => {
      if (id === 'priority') return priorityMedia;
      if (id === 'batch') return batchMedia;
      return undefined;
    });

    ffmpegMocks.extractMetadata.mockResolvedValue({});

    harvester = MetadataHarvester.getInstance();
    await vi.advanceTimersByTimeAsync(50);

    harvester.requestHarvest('priority');

    await vi.advanceTimersByTimeAsync(100);
    expect(metaRepoMocks.updateMetadataStatus).toHaveBeenNthCalledWith(1, 'priority', 'processing');

    await vi.advanceTimersByTimeAsync(15000);
    expect(metaRepoMocks.updateMetadataStatus).toHaveBeenNthCalledWith(2, 'batch', 'processing');
  });

  it('should skip processing if media is not available or deleted', async () => {
    const mockMedia = { id: 'v3', path: '/deleted.mp4', status: 'available' };
    metaRepoMocks.getPendingMedia.mockReturnValue([mockMedia]);

    mediaRepoMocks.findById.mockReturnValue({ ...mockMedia, status: 'missing' });

    harvester = MetadataHarvester.getInstance();

    await vi.advanceTimersByTimeAsync(100);

    expect(metaRepoMocks.updateMetadataStatus).not.toHaveBeenCalledWith('v3', 'processing');
    expect(ffmpegMocks.extractMetadata).not.toHaveBeenCalled();
  });

  it('should reset incomplete metadata on startup', () => {
    harvester = MetadataHarvester.getInstance();
    expect(metaRepoMocks.resetIncompleteMetadataStatus).toHaveBeenCalled();
  });

  it('should wait if ffprobe path is not set', async () => {
    ffmpegMocks.ffprobePath = '';
    const mockMedia = { id: 'v1', path: '/video.mp4', status: 'available' };
    metaRepoMocks.getPendingMedia.mockReturnValue([mockMedia]);

    harvester = MetadataHarvester.getInstance();

    await vi.advanceTimersByTimeAsync(1000);

    expect(metaRepoMocks.updateMetadataStatus).not.toHaveBeenCalled();
    expect(ffmpegMocks.extractMetadata).not.toHaveBeenCalled();
  });

  it('should skip processing if on-demand media is already completed', async () => {
    const completedMedia = {
      id: 'completed',
      path: '/completed.mp4',
      status: 'available',
      metadata_status: 'completed',
    };
    mediaRepoMocks.findById.mockReturnValue(completedMedia);

    harvester = MetadataHarvester.getInstance();

    harvester.requestHarvest('completed');
    await vi.advanceTimersByTimeAsync(100);

    expect(metaRepoMocks.updateMetadataStatus).not.toHaveBeenCalledWith('completed', 'processing');
    expect(ffmpegMocks.extractMetadata).not.toHaveBeenCalled();
  });
});
