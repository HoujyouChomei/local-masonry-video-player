// electron/core/services/file/file-move-service.test.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('electron', () => ({
  app: {
    isPackaged: false,
    getPath: vi.fn(() => '/tmp'),
  },
}));

import { FileMoveService } from './file-move-service';
import fs from 'fs/promises';
import path from 'path';

vi.mock('fs/promises', () => ({
  default: {
    rename: vi.fn(),
    access: vi.fn(),
    cp: vi.fn(),
    unlink: vi.fn(),
  },
}));

describe('FileMoveService', () => {
  let service: FileMoveService;
  const targetDir = path.normalize('/target/dir');

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FileMoveService();
  });

  it('should move file successfully using rename', async () => {
    const source = path.normalize('/source/video.mp4');
    const expectedDest = path.join(targetDir, 'video.mp4');

    vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));
    vi.mocked(fs.rename).mockResolvedValue(undefined);

    const results = await service.moveMedia([source], targetDir);

    expect(fs.access).toHaveBeenCalledWith(expectedDest);
    expect(fs.rename).toHaveBeenCalledWith(source, expectedDest);
    expect(results).toEqual([{ oldPath: source, newPath: expectedDest, success: true }]);
  });

  it('should auto-rename file if destination exists', async () => {
    const source = path.normalize('/source/video.mp4');
    const dest2 = path.join(targetDir, 'video (1).mp4');

    vi.mocked(fs.access)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('ENOENT'));

    vi.mocked(fs.rename).mockResolvedValue(undefined);

    const results = await service.moveMedia([source], targetDir);

    expect(fs.access).toHaveBeenCalledTimes(2);
    expect(fs.rename).toHaveBeenCalledWith(source, dest2);
    expect(results).toEqual([{ oldPath: source, newPath: dest2, success: true }]);
  });

  it('should fallback to copy+unlink if rename fails with EXDEV (Cross-device)', async () => {
    const source = path.normalize('/source/video.mp4');
    const expectedDest = path.join(targetDir, 'video.mp4');

    vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));

    const exdevError: any = new Error('Cross-device link');
    exdevError.code = 'EXDEV';
    vi.mocked(fs.rename).mockRejectedValue(exdevError);

    vi.mocked(fs.cp).mockResolvedValue(undefined);
    vi.mocked(fs.unlink).mockResolvedValue(undefined);

    const results = await service.moveMedia([source], targetDir);

    expect(fs.rename).toHaveBeenCalledWith(source, expectedDest);
    expect(fs.cp).toHaveBeenCalledWith(source, expectedDest, expect.anything());
    expect(fs.unlink).toHaveBeenCalledWith(source);
    expect(results).toEqual([{ oldPath: source, newPath: expectedDest, success: true }]);
  });

  it('should return warning if copy succeeds but unlink fails', async () => {
    const source = path.normalize('/source/video.mp4');
    const expectedDest = path.join(targetDir, 'video.mp4');

    vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));

    const exdevError: any = new Error('Cross-device link');
    exdevError.code = 'EXDEV';
    vi.mocked(fs.rename).mockRejectedValue(exdevError);

    vi.mocked(fs.cp).mockResolvedValue(undefined);
    const unlinkError: any = new Error('Operation not permitted');
    unlinkError.code = 'EPERM';
    vi.mocked(fs.unlink).mockRejectedValue(unlinkError);

    const results = await service.moveMedia([source], targetDir);

    expect(fs.cp).toHaveBeenCalledWith(source, expectedDest, expect.anything());
    expect(fs.unlink).toHaveBeenCalledWith(source);
    expect(results).toEqual([
      {
        oldPath: source,
        newPath: expectedDest,
        success: true,
        warning: 'Source file could not be deleted (EPERM). Copy created.',
      },
    ]);
  });

  it('should return error result if operation fails', async () => {
    const source = path.normalize('/source/video.mp4');
    const expectedDest = path.join(targetDir, 'video.mp4');

    vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));
    vi.mocked(fs.rename).mockRejectedValue(new Error('Permission denied'));

    const results = await service.moveMedia([source], targetDir);

    expect(results).toEqual([
      {
        oldPath: source,
        newPath: expectedDest,
        success: false,
        error: 'Permission denied',
      },
    ]);
  });

  it('should skip if source and destination are same', async () => {
    const fileName = 'video.mp4';
    const source = path.join(targetDir, fileName);

    const results = await service.moveMedia([source], targetDir);

    expect(fs.rename).not.toHaveBeenCalled();
    expect(results).toEqual([
      {
        oldPath: source,
        newPath: source,
        success: false,
        error: 'Same path',
      },
    ]);
  });
});
