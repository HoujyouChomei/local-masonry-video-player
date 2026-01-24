// electron/core/services/media/rebinder.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('electron', () => ({
  app: {
    isPackaged: false,
    getPath: vi.fn(() => '/tmp'),
  },
}));

import { MediaRebinder, FileStat } from './rebinder';

const integrityRepoMocks = vi.hoisted(() => ({
  findByInode: vi.fn(),
  findMissingCandidatesBySize: vi.fn(),
  restore: vi.fn(),
  updateHash: vi.fn(),
}));

vi.mock('../../repositories/media/media-integrity', () => ({
  MediaIntegrityRepository: class {
    findByInode = integrityRepoMocks.findByInode;
    findMissingCandidatesBySize = integrityRepoMocks.findMissingCandidatesBySize;
    restore = integrityRepoMocks.restore;
    updateHash = integrityRepoMocks.updateHash;
  },
}));

const hashMocks = vi.hoisted(() => ({
  calculateFileHash: vi.fn(),
}));

vi.mock('../../../lib/file-hash', () => ({
  calculateFileHash: hashMocks.calculateFileHash,
}));

describe('MediaRebinder', () => {
  let rebinder: MediaRebinder;

  const DUMMY_PATH = '/path/to/video.mp4';
  const DUMMY_STAT: FileStat = {
    size: 1000,
    mtime: 1234567890,
    birthtime: 1234567800,
    ino: 999,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    rebinder = new MediaRebinder();
  });

  describe('findCandidate', () => {
    it('should find candidate by INODE if size matches', async () => {
      const mockRow = {
        id: 'v1',
        path: '/old/path.mp4',
        size: 1000,
        status: 'missing',
        last_seen_at: 100,
      };
      integrityRepoMocks.findByInode.mockReturnValue([mockRow]);

      const result = await rebinder.findCandidate(DUMMY_PATH, DUMMY_STAT, false);

      expect(integrityRepoMocks.findByInode).toHaveBeenCalledWith(DUMMY_STAT.ino);
      expect(result).toEqual(mockRow);
    });

    it('should ignore INODE match if size differs', async () => {
      const mockRow = { id: 'v1', path: '/old/path.mp4', size: 500, status: 'missing' };
      integrityRepoMocks.findByInode.mockReturnValue([mockRow]);

      const result = await rebinder.findCandidate(DUMMY_PATH, DUMMY_STAT, false);

      expect(result).toBeUndefined();
    });

    it('should prioritize "available" record over "missing"', async () => {
      const rowMissing = { id: 'v-missing', status: 'missing', size: 1000, last_seen_at: 100 };
      const rowAvailable = {
        id: 'v-available',
        status: 'available',
        size: 1000,
        last_seen_at: 200,
      };

      integrityRepoMocks.findByInode.mockReturnValue([rowMissing, rowAvailable]);

      const result = await rebinder.findCandidate(DUMMY_PATH, DUMMY_STAT, false);

      expect(result).toEqual(rowAvailable);
    });

    it('should prioritize newer "last_seen_at" when both are "missing"', async () => {
      const rowOld = { id: 'v-old', status: 'missing', size: 1000, last_seen_at: 100 };
      const rowNew = { id: 'v-new', status: 'missing', size: 1000, last_seen_at: 200 };

      integrityRepoMocks.findByInode.mockReturnValue([rowOld, rowNew]);

      const result = await rebinder.findCandidate(DUMMY_PATH, DUMMY_STAT, false);

      expect(result).toEqual(rowNew);
    });

    it('should fall back to HASH search if no inode match', async () => {
      integrityRepoMocks.findByInode.mockReturnValue([]);

      const candidateRow = { id: 'v-hash', file_hash: 'target-hash', size: 1000 };
      integrityRepoMocks.findMissingCandidatesBySize.mockReturnValue([candidateRow]);

      hashMocks.calculateFileHash.mockResolvedValue('target-hash');

      const result = await rebinder.findCandidate(DUMMY_PATH, DUMMY_STAT, true);

      expect(integrityRepoMocks.findMissingCandidatesBySize).toHaveBeenCalledWith(DUMMY_STAT.size);
      expect(hashMocks.calculateFileHash).toHaveBeenCalledWith(DUMMY_PATH);
      expect(result).toEqual(candidateRow);
    });

    it('should not attempt hash calculation if allowHashCalc is false', async () => {
      integrityRepoMocks.findByInode.mockReturnValue([]);
      integrityRepoMocks.findMissingCandidatesBySize.mockReturnValue([
        { id: 'v1', file_hash: 'abc', size: 1000 },
      ]);

      const result = await rebinder.findCandidate(DUMMY_PATH, DUMMY_STAT, false);

      expect(integrityRepoMocks.findMissingCandidatesBySize).not.toHaveBeenCalled();
      expect(hashMocks.calculateFileHash).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('should return undefined if calculated hash does not match any candidate', async () => {
      integrityRepoMocks.findByInode.mockReturnValue([]);
      integrityRepoMocks.findMissingCandidatesBySize.mockReturnValue([
        { id: 'v1', file_hash: 'hash-A', size: 1000 },
        { id: 'v2', file_hash: 'hash-B', size: 1000 },
      ]);
      hashMocks.calculateFileHash.mockResolvedValue('hash-C');

      const result = await rebinder.findCandidate(DUMMY_PATH, DUMMY_STAT, true);

      expect(result).toBeUndefined();
    });

    it('should return undefined if hash calculation fails (returns null)', async () => {
      integrityRepoMocks.findByInode.mockReturnValue([]);
      integrityRepoMocks.findMissingCandidatesBySize.mockReturnValue([
        { id: 'v1', file_hash: 'hash-A', size: 1000 },
      ]);
      hashMocks.calculateFileHash.mockResolvedValue(null);

      const result = await rebinder.findCandidate(DUMMY_PATH, DUMMY_STAT, true);

      expect(result).toBeUndefined();
    });
  });

  describe('execute', () => {
    it('should call restore on repository', () => {
      rebinder.execute('v1', '/new/path.mp4', 1000, 2000, 999, 'existing-hash', 'TEST');

      expect(integrityRepoMocks.restore).toHaveBeenCalledWith(
        'v1',
        '/new/path.mp4',
        1000,
        2000,
        999
      );
      expect(hashMocks.calculateFileHash).not.toHaveBeenCalled();
    });

    it('should calculate and update hash if not provided', async () => {
      hashMocks.calculateFileHash.mockResolvedValue('calculated-hash');

      rebinder.execute('v1', '/new/path.mp4', 1000, 2000, 999, null, 'TEST');

      expect(integrityRepoMocks.restore).toHaveBeenCalled();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(hashMocks.calculateFileHash).toHaveBeenCalledWith('/new/path.mp4');
      expect(integrityRepoMocks.updateHash).toHaveBeenCalledWith('v1', 'calculated-hash');
    });
  });
});
