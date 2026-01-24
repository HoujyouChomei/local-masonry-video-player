// electron/core/repositories/media/media-metadata.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MediaMetadataRepository } from './media-metadata';

const mockRun = vi.fn();
const mockGet = vi.fn();
const mockAll = vi.fn();
const mockPrepare = vi.fn(() => ({
  run: mockRun,
  get: mockGet,
  all: mockAll,
}));

vi.mock('../../../lib/db', () => ({
  getDB: () => ({
    prepare: mockPrepare,
  }),
}));

describe('MediaMetadataRepository', () => {
  let repo: MediaMetadataRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new MediaMetadataRepository();
  });

  it('updateMetadata should update dimension, duration, fps and codec', () => {
    repo.updateMetadata('/video.mp4', 120, 1920, 1080, 60, 'h264');

    expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE media'));
    expect(mockRun).toHaveBeenCalledWith(120, 1920, 1080, 1920 / 1080, 60, 'h264', '/video.mp4');
  });

  it('updateGenerationParams should update generation_params and set status to completed', () => {
    repo.updateGenerationParams('id-1', '{"prompt": "test"}');

    expect(mockPrepare).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE media \n      SET \n        generation_params = ?')
    );
    expect(mockRun).toHaveBeenCalledWith('{"prompt": "test"}', 'id-1');
  });

  it('getPendingMedia should return media with pending metadata', () => {
    mockAll.mockReturnValue([{ id: '1', path: '/video.mp4' }]);

    const result = repo.getPendingMedia(5);

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
      expect.stringContaining("UPDATE media \n      SET metadata_status = 'pending'")
    );
    expect(mockRun).toHaveBeenCalled();
    expect(count).toBe(10);
  });
});
