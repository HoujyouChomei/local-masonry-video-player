// electron/core/services/media/media-service.test.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';
import { MediaService } from './media-service';

const repoMocks = vi.hoisted(() => ({
  findByPath: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
}));

vi.mock('../../repositories/media/media-repository', () => {
  return {
    MediaRepository: class {
      findByPath = repoMocks.findByPath;
      findById = repoMocks.findById;
      create = repoMocks.create;
    },
  };
});

const integrityRepoMocks = vi.hoisted(() => ({
  updatePath: vi.fn(),
  deleteExpiredMissingMedia: vi.fn(),
}));

vi.mock('../../repositories/media/media-integrity', () => {
  return {
    MediaIntegrityRepository: class {
      updatePath = integrityRepoMocks.updatePath;
      deleteExpiredMissingMedia = integrityRepoMocks.deleteExpiredMissingMedia;
    },
  };
});

const metaRepoMocks = vi.hoisted(() => ({
  updateMetadata: vi.fn(),
}));

vi.mock('../../repositories/media/media-metadata', () => {
  return {
    MediaMetadataRepository: class {
      updateMetadata = metaRepoMocks.updateMetadata;
    },
  };
});

const scannerMocks = vi.hoisted(() => ({
  scan: vi.fn(),
}));

vi.mock('../file/library-scanner', () => {
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

vi.mock('../file/file-integrity-service', () => {
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

const shellMocks = vi.hoisted(() => ({
  trashItem: vi.fn(),
  showItemInFolder: vi.fn(),
}));

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/tmp/userData'),
  },
  shell: {
    trashItem: shellMocks.trashItem,
    showItemInFolder: shellMocks.showItemInFolder,
  },
}));
import { shell } from 'electron';

vi.mock('../../../lib/local-server', () => ({
  getServerPort: () => 3000,
}));

const eventBusMocks = vi.hoisted(() => ({
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
}));

vi.mock('../../events', () => ({
  eventBus: eventBusMocks,
}));

vi.mock('../../../lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('MediaService', () => {
  let service: MediaService;
  const dummyFolder = path.normalize('/videos');

  beforeEach(() => {
    vi.clearAllMocks();
    service = new MediaService();
  });

  describe('scanFolder', () => {
    it('should delegate to LibraryScanner', async () => {
      await service.scanFolder(dummyFolder);
      expect(scannerMocks.scan).toHaveBeenCalledWith(dummyFolder);
    });
  });

  describe('getMedia', () => {
    it('should delegate to FileIntegrityService.processNewFile', async () => {
      const filePath = path.join(dummyFolder, 'new.mp4');
      await service.getMedia(filePath);
      expect(integrityMocks.processNewFile).toHaveBeenCalledWith(filePath);
    });
  });

  describe('renameMedia', () => {
    it('should rename file and update DB via IntegrityRepo (ID-based)', async () => {
      const id = '1';
      const oldPath = path.join(dummyFolder, 'old.mp4');
      const newName = 'new';
      const newPath = path.join(dummyFolder, 'new.mp4');

      repoMocks.findById.mockReturnValue({ id, path: oldPath });
      vi.mocked(fs.stat).mockResolvedValue({ mtimeMs: 12345 } as any);

      await service.renameMedia(id, newName);

      expect(fs.rename).toHaveBeenCalledWith(oldPath, newPath);
      expect(integrityRepoMocks.updatePath).toHaveBeenCalledWith(id, newPath, 12345);
    });
  });

  describe('deleteMedia', () => {
    it('should trash file and mark as missing via IntegrityService (ID-based)', async () => {
      const id = '1';
      const filePath = path.join(dummyFolder, 'del.mp4');

      repoMocks.findById.mockReturnValue({ id, path: filePath });

      await service.deleteMedia(id);

      expect(shell.trashItem).toHaveBeenCalledWith(filePath);
      expect(integrityMocks.markAsMissingById).toHaveBeenCalledWith(id);
      expect(eventBusMocks.emit).toHaveBeenCalledWith('media:deleted', { id, path: filePath });
    });
  });

  describe('handleFileMissing', () => {
    it('should delegate to verifyAndRecover', async () => {
      const filePath = '/path/to/missing.mp4';
      integrityMocks.verifyAndRecover.mockResolvedValue(true);

      const result = await service.handleFileMissing(filePath);

      expect(integrityMocks.markAsMissing).toHaveBeenCalledWith(filePath);
      expect(integrityMocks.verifyAndRecover).toHaveBeenCalledWith([filePath]);
      expect(result).toBe('recovered');
    });
  });

  describe('updateMetadata', () => {
    it('should call MediaMetadataRepository.updateMetadata with resolved path', async () => {
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
    it('should call MediaIntegrityRepository.deleteExpiredMissingMedia', () => {
      integrityRepoMocks.deleteExpiredMissingMedia.mockReturnValue(5);
      service.runGarbageCollection();
      expect(integrityRepoMocks.deleteExpiredMissingMedia).toHaveBeenCalledWith(30);
    });
  });
});
