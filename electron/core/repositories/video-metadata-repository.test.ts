// electron/core/repositories/video-metadata-repository.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VideoMetadataRepository } from './video-metadata-repository';

// --- DB Mock Setup ---
const mockRun = vi.fn();
const mockGet = vi.fn();
const mockAll = vi.fn();
const mockPrepare = vi.fn(() => ({
  run: mockRun,
  get: mockGet,
  all: mockAll,
}));

vi.mock('../../lib/db', () => ({
  getDB: () => ({
    prepare: mockPrepare,
  }),
}));

describe('VideoMetadataRepository', () => {
  let repo: VideoMetadataRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new VideoMetadataRepository();
  });

  it('updateMetadata should update dimension, duration, fps and codec', () => {
    repo.updateMetadata('/video.mp4', 120, 1920, 1080, 60, 'h264');

    expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE videos'));
    expect(mockRun).toHaveBeenCalledWith(
      120,
      1920,
      1080,
      1920 / 1080, // aspect_ratio
      60, // fps
      'h264', // codec
      '/video.mp4'
    );
  });

  it('updateGenerationParams should update generation_params and set status to completed', () => {
    repo.updateGenerationParams('id-1', '{"prompt": "test"}');

    expect(mockPrepare).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE videos \n      SET \n        generation_params = ?')
    );
    expect(mockRun).toHaveBeenCalledWith('{"prompt": "test"}', 'id-1');
  });

  it('getPendingVideos should return videos with pending metadata', () => {
    mockAll.mockReturnValue([{ id: '1', path: '/pending.mp4' }]);

    const result = repo.getPendingVideos(5);

    expect(mockPrepare).toHaveBeenCalledWith(
      expect.stringContaining("metadata_status = 'pending'")
    );
    expect(mockAll).toHaveBeenCalledWith(5);
    expect(result).toHaveLength(1);
  });

  it('resetIncompleteMetadataStatus should update incomplete completed videos to pending', () => {
    mockRun.mockReturnValue({ changes: 10 });

    const count = repo.resetIncompleteMetadataStatus();

    expect(mockPrepare).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE videos \n      SET metadata_status = 'pending'")
    );
    expect(mockRun).toHaveBeenCalled();
    expect(count).toBe(10);
  });
});
