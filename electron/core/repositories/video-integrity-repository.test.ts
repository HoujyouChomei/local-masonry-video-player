// electron/core/repositories/video-integrity-repository.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VideoIntegrityRepository } from './video-integrity-repository';

const mockRun = vi.fn();
const mockGet = vi.fn();
const mockAll = vi.fn();
const mockPrepare = vi.fn(() => ({
  run: mockRun,
  get: mockGet,
  all: mockAll,
}));
const mockTransaction = vi.fn((fn) => () => fn());

vi.mock('../../lib/db', () => ({
  getDB: () => ({
    prepare: mockPrepare,
    transaction: mockTransaction,
  }),
}));

vi.mock('electron', () => ({
  app: {
    getPath: () => '/tmp',
  },
}));

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(false),
    unlinkSync: vi.fn(),
  },
  existsSync: vi.fn().mockReturnValue(false),
  unlinkSync: vi.fn(),
}));

describe('VideoIntegrityRepository', () => {
  let repo: VideoIntegrityRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new VideoIntegrityRepository();
  });

  it('markAsMissing should update status to missing', () => {
    repo.markAsMissing(['1', '2']);
    expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE videos'));
    expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining("SET status = 'missing'"));
    expect(mockRun).toHaveBeenCalled();
  });

  it('restore should update path and status', () => {
    repo.restore('id-1', '/restored.mp4', 500, 2000, 888);

    expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE videos'));
    expect(mockRun).toHaveBeenCalledWith(
      '/restored.mp4', // path
      'restored.mp4', // name
      500, // size
      2000, // mtime
      888, // ino
      expect.any(Number), // last_seen_at
      'id-1' // id
    );
  });

  it('updatePath should update path and mtime', () => {
    repo.updatePath('id-1', '/new/path.mp4', 9999);
    expect(mockRun).toHaveBeenCalledWith(
      '/new/path.mp4',
      'path.mp4', // name (basename)
      9999,
      expect.any(Number), // last_seen_at
      'id-1'
    );
  });

  it('upsertMany should insert new and update existing', () => {
    const toInsert = [
      {
        id: '1',
        path: '/new.mp4',
        name: 'new.mp4',
        size: 100,
        mtime: 100,
        created_at: 100,
        ino: 1,
      },
    ];
    const toUpdate = [
      {
        id: '2',
        size: 200,
        mtime: 200,
        duration: null,
        width: null,
        height: null,
        aspect_ratio: null,
        ino: 2,
      },
    ];

    repo.upsertMany(toInsert, toUpdate);

    expect(mockTransaction).toHaveBeenCalled();
    expect(mockRun).toHaveBeenCalledTimes(2);
  });

  it('deleteExpiredMissingVideos should delete old missing videos', () => {
    mockAll.mockReturnValue([{ id: 'old-1', path: '/old.mp4' }]);

    repo.deleteExpiredMissingVideos(30);

    expect(mockTransaction).toHaveBeenCalled();
    expect(mockRun).toHaveBeenCalledTimes(4);
  });
});
