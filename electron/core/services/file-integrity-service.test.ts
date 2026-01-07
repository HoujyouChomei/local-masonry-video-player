// electron/core/services/file-integrity-service.test.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';
import { FileIntegrityService } from './file-integrity-service';

// --- Mocks ---

// VideoRepository Mock (Basic Read)
const videoRepoMocks = vi.hoisted(() => ({
  findManyByPaths: vi.fn(),
  findByPath: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(), // processNewFileで新規作成時に使用
  deleteById: vi.fn(), // processNewFileで重複IDを削除する際に使用
}));

vi.mock('../repositories/video-repository', () => ({
  VideoRepository: class {
    findManyByPaths = videoRepoMocks.findManyByPaths;
    findByPath = videoRepoMocks.findByPath;
    findById = videoRepoMocks.findById;
    create = videoRepoMocks.create;
    deleteById = videoRepoMocks.deleteById;
  },
}));

// VideoIntegrityRepository Mock (Writes/Specific Reads)
const integrityRepoMocks = vi.hoisted(() => ({
  resetMetadata: vi.fn(),
  restore: vi.fn(),
  markAsMissing: vi.fn(),
  markScanAttempted: vi.fn(),
  updateHash: vi.fn(),
  markAsMissingByPath: vi.fn(),
}));

vi.mock('../repositories/video-integrity-repository', () => ({
  VideoIntegrityRepository: class {
    resetMetadata = integrityRepoMocks.resetMetadata;
    restore = integrityRepoMocks.restore;
    markAsMissing = integrityRepoMocks.markAsMissing;
    markScanAttempted = integrityRepoMocks.markScanAttempted;
    updateHash = integrityRepoMocks.updateHash;
    markAsMissingByPath = integrityRepoMocks.markAsMissingByPath;
  },
}));

const indexerMocks = vi.hoisted(() => ({
  build: vi.fn(),
  getCandidates: vi.fn(),
}));
vi.mock('./fast-path-indexer', () => ({
  FastPathIndexer: class {
    build = indexerMocks.build;
    getCandidates = indexerMocks.getCandidates;
  },
}));

const thumbMocks = vi.hoisted(() => ({
  addToQueue: vi.fn(),
  deleteThumbnail: vi.fn(),
}));
vi.mock('./thumbnail-service', () => ({
  ThumbnailService: {
    getInstance: vi.fn().mockReturnValue({
      addToQueue: thumbMocks.addToQueue,
      deleteThumbnail: thumbMocks.deleteThumbnail,
    }),
  },
}));

const rebinderMocks = vi.hoisted(() => ({
  findCandidate: vi.fn(),
  execute: vi.fn(),
}));
vi.mock('./video-rebinder', () => ({
  VideoRebinder: class {
    findCandidate = rebinderMocks.findCandidate;
    execute = rebinderMocks.execute;
  },
}));

vi.mock('../../lib/store', () => ({
  store: {
    get: (key: string) => (key === 'libraryFolders' ? ['/lib'] : '/current'),
  },
}));

// fs/promises mock
import fs from 'fs/promises';
vi.mock('fs/promises', () => ({
  default: {
    stat: vi.fn(),
    access: vi.fn(),
  },
}));

// fs mock
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
  },
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
}));

vi.mock('electron', () => ({
  app: { getPath: vi.fn().mockReturnValue('/mock') },
}));

vi.mock('../../lib/local-server', () => ({
  getServerPort: () => 3000,
}));

const hashMocks = vi.hoisted(() => ({
  calculateFileHash: vi.fn(),
}));
vi.mock('../../lib/file-hash', () => ({
  calculateFileHash: hashMocks.calculateFileHash,
}));

describe('FileIntegrityService', () => {
  let service: FileIntegrityService;
  const dummyPath = path.normalize('/videos/test.mp4');

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FileIntegrityService();
    hashMocks.calculateFileHash.mockResolvedValue('mock-hash');
  });

  describe('processNewFile', () => {
    const mockStat = { size: 5000, mtimeMs: 9999, ino: 88888 };
    beforeEach(() => {
      vi.mocked(fs.stat).mockResolvedValue(mockStat as any);
    });

    it('should update metadata if path matches (Exact Match)', async () => {
      const existingRow = {
        id: 'id-1',
        path: dummyPath,
        size: 100,
        mtime: 100,
        ino: 88888,
        status: 'available',
      };
      videoRepoMocks.findByPath.mockReturnValue(existingRow);
      videoRepoMocks.findById.mockReturnValue(existingRow); // mapper用

      await service.processNewFile(dummyPath);

      expect(integrityRepoMocks.resetMetadata).toHaveBeenCalledWith('id-1', 5000, 9999, 88888);
      expect(thumbMocks.deleteThumbnail).toHaveBeenCalled();
      expect(thumbMocks.addToQueue).toHaveBeenCalledWith(expect.arrayContaining([dummyPath]), true);
    });

    it('should rebind by using Rebinder (Move Detection)', async () => {
      videoRepoMocks.findByPath.mockReturnValue(undefined);

      const matchRow = { id: 'moved-id', file_hash: 'hash' };
      rebinderMocks.findCandidate.mockResolvedValue(matchRow);
      videoRepoMocks.findById.mockReturnValue(matchRow); // mapper用

      await service.processNewFile(dummyPath);

      expect(rebinderMocks.execute).toHaveBeenCalledWith(
        'moved-id',
        dummyPath,
        5000,
        9999,
        88888,
        'hash',
        expect.stringContaining('REBIND')
      );
      expect(thumbMocks.addToQueue).toHaveBeenCalledWith(
        expect.arrayContaining([dummyPath]),
        false
      );
    });

    it('should prioritize "available" record when multiple Inode matches exist', async () => {
      videoRepoMocks.findByPath.mockReturnValue(undefined);

      const availableRow = { id: 'id-available', status: 'available', file_hash: 'mock-hash-val' };
      rebinderMocks.findCandidate.mockResolvedValue(availableRow);
      videoRepoMocks.findById.mockReturnValue(availableRow); // mapper用

      await service.processNewFile(dummyPath);

      expect(rebinderMocks.execute).toHaveBeenCalledWith(
        'id-available',
        dummyPath,
        5000,
        9999,
        88888,
        'mock-hash-val',
        expect.anything()
      );
    });

    it('should rebind by HASH match if Inode does not match', async () => {
      videoRepoMocks.findByPath.mockReturnValue(undefined);

      const hashMatchRow = { id: 'id-hash-match', file_hash: 'target-hash' };
      rebinderMocks.findCandidate.mockResolvedValue(hashMatchRow);
      videoRepoMocks.findById.mockReturnValue(hashMatchRow); // mapper用

      await service.processNewFile(dummyPath);

      expect(rebinderMocks.execute).toHaveBeenCalledWith(
        'id-hash-match',
        dummyPath,
        5000,
        9999,
        88888,
        'target-hash',
        expect.anything()
      );
    });

    it('should create NEW record if no matches found', async () => {
      videoRepoMocks.findByPath.mockReturnValue(undefined);
      rebinderMocks.findCandidate.mockResolvedValue(undefined);
      videoRepoMocks.create.mockReturnValue({ id: 'new-id' }); // createはvoidだが、findByIdが呼ばれるので返すようにする
      videoRepoMocks.findById.mockReturnValue({
        // mapper用
        id: 'new-id',
        path: dummyPath,
        name: 'test.mp4',
        size: 5000,
        mtime: 9999,
        created_at: Date.now(),
        ino: 88888,
      });

      await service.processNewFile(dummyPath);

      expect(videoRepoMocks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          path: dummyPath,
          name: 'test.mp4',
          size: 5000,
          mtime: 9999,
          ino: 88888,
        })
      );
      expect(thumbMocks.addToQueue).toHaveBeenCalledWith(
        expect.arrayContaining([dummyPath]),
        false
      );
    });

    it('should remove duplicated row if path match exists but ID differs from rebind target', async () => {
      // ▼▼▼ 修正: Inode不一致のAvailableレコードにして、pathMatchRowの早期リターンを回避する ▼▼▼
      // これにより「パスは一致するが中身が違う」と判定され、後続のRebinderが呼ばれる
      const pathRow = {
        id: 'old-id',
        path: dummyPath,
        status: 'available',
        ino: 11111, // MockStatの 88888 と不一致
      };
      videoRepoMocks.findByPath.mockReturnValue(pathRow);

      const rebindRow = {
        id: 'rebind-id',
        status: 'missing',
        size: 5000,
        file_hash: 'rebind-hash',
      };
      rebinderMocks.findCandidate.mockResolvedValue(rebindRow);
      videoRepoMocks.findById.mockReturnValue(rebindRow);

      await service.processNewFile(dummyPath);

      expect(videoRepoMocks.deleteById).toHaveBeenCalledWith('old-id');
      expect(rebinderMocks.execute).toHaveBeenCalledWith(
        'rebind-id',
        dummyPath,
        5000,
        9999,
        88888,
        'rebind-hash',
        expect.anything()
      );
    });
  });

  describe('verifyAndRecover (On-Demand Verification)', () => {
    it('should do nothing if all files exist', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined); // exists
      videoRepoMocks.findManyByPaths.mockReturnValue([]);

      const result = await service.verifyAndRecover([dummyPath]);

      expect(result).toBe(false);
      expect(videoRepoMocks.findManyByPaths).toHaveBeenCalled();
    });

    it('should self-heal if file exists but marked as missing', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined); // exists
      vi.mocked(fs.stat).mockResolvedValue({ size: 100, mtimeMs: 100, ino: 123 } as any);

      const ghostRow = { id: '1', path: dummyPath, status: 'missing', size: 100 };
      videoRepoMocks.findManyByPaths.mockReturnValue([ghostRow]);

      const result = await service.verifyAndRecover([dummyPath]);

      expect(result).toBe(true);
      expect(integrityRepoMocks.restore).toHaveBeenCalled();
      expect(thumbMocks.deleteThumbnail).toHaveBeenCalledWith(dummyPath);
      expect(thumbMocks.addToQueue).toHaveBeenCalledWith([dummyPath], true);
    });

    it('should build index and recover if file is missing (Rebind)', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT')); // missing

      const missingRow = {
        id: '1',
        path: dummyPath,
        size: 5000,
        status: 'available',
        last_scan_attempt_at: null,
        file_hash: 'hash',
      };
      videoRepoMocks.findManyByPaths.mockReturnValue([missingRow]);

      indexerMocks.getCandidates.mockReturnValue(['/moved.mp4']);
      vi.mocked(fs.stat).mockResolvedValue({ size: 5000, mtimeMs: 100, ino: 99 } as any);

      const result = await service.verifyAndRecover([dummyPath]);

      expect(indexerMocks.build).toHaveBeenCalled();
      expect(rebinderMocks.execute).toHaveBeenCalledWith(
        '1',
        '/moved.mp4',
        5000,
        100,
        99,
        'hash',
        'RECOVERED'
      );
      expect(result).toBe(true);
    });

    it('should mark as missing and attempted if recovery fails', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));

      const missingRow = { id: '1', path: dummyPath, size: 500, last_scan_attempt_at: null };
      videoRepoMocks.findManyByPaths.mockReturnValue([missingRow]);
      indexerMocks.getCandidates.mockReturnValue([]);

      const result = await service.verifyAndRecover([dummyPath]);

      expect(integrityRepoMocks.markAsMissing).toHaveBeenCalledWith(['1']);
      expect(integrityRepoMocks.markScanAttempted).toHaveBeenCalledWith(['1']);
      expect(result).toBe(true);
    });

    it('should mark as missing if file was "available" but scan failed (without Rebind)', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));

      // 既にスキャン済み(last_scan_attempt_atあり)だが、statusがavailableのまま（例えば外部削除）
      const availableRow = {
        id: '1',
        path: dummyPath,
        status: 'available',
        last_scan_attempt_at: 12345,
      };
      videoRepoMocks.findManyByPaths.mockReturnValue([availableRow]);

      const result = await service.verifyAndRecover([dummyPath]);

      // findManyByPathsの結果をフィルタリングして markAsMissing を呼ぶロジックの確認
      expect(integrityRepoMocks.markAsMissing).toHaveBeenCalledWith(['1']);
      expect(result).toBe(true);
    });

    it('should skip scan if already attempted', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));

      const attemptedRow = {
        id: '1',
        path: dummyPath,
        last_scan_attempt_at: 12345,
        status: 'missing',
      };
      videoRepoMocks.findManyByPaths.mockReturnValue([attemptedRow]);

      await service.verifyAndRecover([dummyPath]);

      expect(indexerMocks.build).not.toHaveBeenCalled();
    });
  });

  describe('markAsMissing', () => {
    it('should call repository method', async () => {
      await service.markAsMissing(dummyPath);
      expect(integrityRepoMocks.markAsMissingByPath).toHaveBeenCalledWith(dummyPath);
    });
  });
});
