// electron/core/services/video-service.test.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';
import { VideoService } from './video-service';

// --- Mocks Setup ---

// VideoRepository Mock
const repoMocks = vi.hoisted(() => ({
  findByPath: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
}));

vi.mock('../repositories/video-repository', () => {
  return {
    VideoRepository: class {
      findByPath = repoMocks.findByPath;
      findById = repoMocks.findById;
      create = repoMocks.create;
    },
  };
});

// VideoIntegrityRepository Mock
const integrityRepoMocks = vi.hoisted(() => ({
  updatePath: vi.fn(),
  deleteExpiredMissingVideos: vi.fn(),
}));

vi.mock('../repositories/video-integrity-repository', () => {
  return {
    VideoIntegrityRepository: class {
      updatePath = integrityRepoMocks.updatePath;
      deleteExpiredMissingVideos = integrityRepoMocks.deleteExpiredMissingVideos;
    },
  };
});

// VideoMetadataRepository Mock
const metaRepoMocks = vi.hoisted(() => ({
  updateMetadata: vi.fn(),
}));

vi.mock('../repositories/video-metadata-repository', () => {
  return {
    VideoMetadataRepository: class {
      updateMetadata = metaRepoMocks.updateMetadata;
    },
  };
});

const scannerMocks = vi.hoisted(() => ({
  scan: vi.fn(),
}));

vi.mock('./library-scanner', () => {
  return {
    LibraryScanner: class {
      scan = scannerMocks.scan;
    },
  };
});

const integrityMocks = vi.hoisted(() => ({
  processNewFile: vi.fn(),
  markAsMissing: vi.fn(),
  markAsMissingById: vi.fn(),
  verifyAndRecover: vi.fn(),
}));

vi.mock('./file-integrity-service', () => {
  return {
    FileIntegrityService: class {
      processNewFile = integrityMocks.processNewFile;
      markAsMissing = integrityMocks.markAsMissing;
      markAsMissingById = integrityMocks.markAsMissingById;
      verifyAndRecover = integrityMocks.verifyAndRecover;
    },
  };
});

vi.mock('fs/promises', () => ({
  default: {
    stat: vi.fn(),
    rename: vi.fn(),
  },
}));
import fs from 'fs/promises';

// Shell Mock (hoisted)
const shellMocks = vi.hoisted(() => ({
  trashItem: vi.fn(),
  showItemInFolder: vi.fn(),
}));

vi.mock('electron', () => ({
  shell: {
    trashItem: shellMocks.trashItem,
    showItemInFolder: shellMocks.showItemInFolder,
  },
}));
import { shell } from 'electron';

vi.mock('../../lib/local-server', () => ({
  getServerPort: () => 3000,
}));

describe('VideoService', () => {
  let service: VideoService;
  const dummyFolder = path.normalize('/videos');

  beforeEach(() => {
    vi.clearAllMocks();
    service = new VideoService();
  });

  describe('scanFolder', () => {
    it('should delegate to LibraryScanner', async () => {
      await service.scanFolder(dummyFolder);
      expect(scannerMocks.scan).toHaveBeenCalledWith(dummyFolder);
    });
  });

  describe('getVideo', () => {
    it('should delegate to FileIntegrityService.processNewFile', async () => {
      const filePath = path.join(dummyFolder, 'new.mp4');
      await service.getVideo(filePath);
      expect(integrityMocks.processNewFile).toHaveBeenCalledWith(filePath);
    });
  });

  describe('renameVideo', () => {
    it('should rename file and update DB via IntegrityRepo (ID-based)', async () => {
      const id = '1';
      const oldPath = path.join(dummyFolder, 'old.mp4');
      const newName = 'new';
      const newPath = path.join(dummyFolder, 'new.mp4');

      // ID検索でパスを解決
      repoMocks.findById.mockReturnValue({ id, path: oldPath });
      vi.mocked(fs.stat).mockResolvedValue({ mtimeMs: 12345 } as any);

      await service.renameVideo(id, newName);

      expect(fs.rename).toHaveBeenCalledWith(oldPath, newPath);
      expect(integrityRepoMocks.updatePath).toHaveBeenCalledWith(id, newPath, 12345);
    });
  });

  describe('deleteVideo', () => {
    it('should trash file and mark as missing via IntegrityService (ID-based)', async () => {
      const id = '1';
      const filePath = path.join(dummyFolder, 'del.mp4');

      // ID検索でパスを解決
      repoMocks.findById.mockReturnValue({ id, path: filePath });

      await service.deleteVideo(id);

      expect(shell.trashItem).toHaveBeenCalledWith(filePath);
      expect(integrityMocks.markAsMissingById).toHaveBeenCalledWith(id);
    });
  });

  describe('handleFileMissing', () => {
    it('should delegate to verifyAndRecover', async () => {
      const filePath = '/path/to/missing.mp4';
      integrityMocks.verifyAndRecover.mockResolvedValue(true); // recovered

      const result = await service.handleFileMissing(filePath);

      expect(integrityMocks.markAsMissing).toHaveBeenCalledWith(filePath);
      expect(integrityMocks.verifyAndRecover).toHaveBeenCalledWith([filePath]);
      expect(result).toBe('recovered');
    });
  });

  describe('updateMetadata', () => {
    it('should call VideoMetadataRepository.updateMetadata with resolved path', async () => {
      const id = 'meta-1';
      const path = '/v.mp4';
      repoMocks.findById.mockReturnValue({ id, path });

      await service.updateMetadata(id, 100, 1920, 1080);

      expect(repoMocks.findById).toHaveBeenCalledWith(id);
      expect(metaRepoMocks.updateMetadata).toHaveBeenCalledWith(path, 100, 1920, 1080);
    });
  });

  describe('revealInExplorer', () => {
    it('should resolve path from ID and call shell.showItemInFolder', async () => {
      const id = 'reveal-1';
      const path = '/path/to/reveal.mp4';
      repoMocks.findById.mockReturnValue({ id, path });

      await service.revealInExplorer(id);

      expect(repoMocks.findById).toHaveBeenCalledWith(id);
      expect(shell.showItemInFolder).toHaveBeenCalledWith(path);
    });
  });

  describe('runGarbageCollection', () => {
    it('should call VideoIntegrityRepository.deleteExpiredMissingVideos', () => {
      integrityRepoMocks.deleteExpiredMissingVideos.mockReturnValue(5);
      service.runGarbageCollection();
      expect(integrityRepoMocks.deleteExpiredMissingVideos).toHaveBeenCalledWith(30);
    });
  });
});