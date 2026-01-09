// electron/core/services/file-move-service.test.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileMoveService } from './file-move-service';
import fs from 'fs/promises';
import path from 'path';

// fs/promises モック
vi.mock('fs/promises', () => ({
  default: {
    rename: vi.fn(),
    access: vi.fn(), // 存在確認用: 成功=存在, 失敗=不在
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

    // 移動先にはファイルがない設定 (access -> rejects)
    vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));
    vi.mocked(fs.rename).mockResolvedValue(undefined);

    const results = await service.moveVideos([source], targetDir);

    expect(fs.access).toHaveBeenCalledWith(expectedDest);
    expect(fs.rename).toHaveBeenCalledWith(source, expectedDest);
    expect(results).toEqual([{ oldPath: source, newPath: expectedDest, success: true }]);
  });

  it('should auto-rename file if destination exists', async () => {
    const source = path.normalize('/source/video.mp4');
    // dest1変数は使用されていないため削除
    const dest2 = path.join(targetDir, 'video (1).mp4');

    // dest1 (video.mp4) は存在する -> access解決
    // dest2 (video (1).mp4) は存在しない -> access拒否
    vi.mocked(fs.access)
      .mockResolvedValueOnce(undefined) // dest1 exists
      .mockRejectedValueOnce(new Error('ENOENT')); // dest2 missing

    vi.mocked(fs.rename).mockResolvedValue(undefined);

    const results = await service.moveVideos([source], targetDir);

    expect(fs.access).toHaveBeenCalledTimes(2);
    expect(fs.rename).toHaveBeenCalledWith(source, dest2);
    expect(results).toEqual([{ oldPath: source, newPath: dest2, success: true }]);
  });

  it('should fallback to copy+unlink if rename fails with EXDEV (Cross-device)', async () => {
    const source = path.normalize('/source/video.mp4');
    const expectedDest = path.join(targetDir, 'video.mp4');

    vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));

    // renameがEXDEVエラー
    const exdevError: any = new Error('Cross-device link');
    exdevError.code = 'EXDEV';
    vi.mocked(fs.rename).mockRejectedValue(exdevError);

    vi.mocked(fs.cp).mockResolvedValue(undefined);
    vi.mocked(fs.unlink).mockResolvedValue(undefined);

    const results = await service.moveVideos([source], targetDir);

    expect(fs.rename).toHaveBeenCalledWith(source, expectedDest);
    expect(fs.cp).toHaveBeenCalledWith(source, expectedDest, expect.anything());
    expect(fs.unlink).toHaveBeenCalledWith(source);
    expect(results).toEqual([{ oldPath: source, newPath: expectedDest, success: true }]);
  });

  it('should return error result if operation fails', async () => {
    const source = path.normalize('/source/video.mp4');
    const expectedDest = path.join(targetDir, 'video.mp4');

    vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));
    vi.mocked(fs.rename).mockRejectedValue(new Error('Permission denied'));

    const results = await service.moveVideos([source], targetDir);

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
    const source = path.join(targetDir, fileName); // ターゲットと同じ場所

    const results = await service.moveVideos([source], targetDir);

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
