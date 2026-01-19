// electron/core/services/file/fast-path-indexer.test.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('electron', () => ({
  app: {
    isPackaged: false,
    getPath: vi.fn(() => '/tmp'),
  },
}));

import path from 'path';
import { FastPathIndexer } from './fast-path-indexer';

vi.mock('fs/promises', () => ({
  default: {
    readdir: vi.fn(),
  },
}));
import fs from 'fs/promises';

describe('FastPathIndexer', () => {
  let indexer: FastPathIndexer;

  beforeEach(() => {
    vi.clearAllMocks();
    indexer = new FastPathIndexer();
  });

  it('should index video files recursively', async () => {
    const mockDirentsRoot = [
      { name: 'video1.mp4', isFile: () => true, isDirectory: () => false },
      { name: 'sub', isFile: () => false, isDirectory: () => true },
      { name: '.hidden', isFile: () => false, isDirectory: () => true },
    ];
    const mockDirentsSub = [
      { name: 'video2.webm', isFile: () => true, isDirectory: () => false },
      { name: 'image.jpg', isFile: () => true, isDirectory: () => false },
    ];

    vi.mocked(fs.readdir)
      .mockResolvedValueOnce(mockDirentsRoot as any)
      .mockResolvedValueOnce(mockDirentsSub as any);

    await indexer.build(['/root']);

    const candidates1 = indexer.getCandidates('video1.mp4');
    expect(candidates1).toHaveLength(1);
    expect(candidates1[0]).toContain('video1.mp4');

    const candidates2 = indexer.getCandidates('video2.webm');
    expect(candidates2).toHaveLength(1);
    expect(candidates2[0]).toContain('video2.webm');

    const candidates3 = indexer.getCandidates('image.jpg');
    expect(candidates3).toHaveLength(0);
  });

  it('should handle multiple files with same name', async () => {
    const mockDirents = [{ name: 'video.mp4', isFile: () => true, isDirectory: () => false }];

    vi.mocked(fs.readdir).mockResolvedValue(mockDirents as any);

    await indexer.build(['/dir1', '/dir2']);

    const candidates = indexer.getCandidates('video.mp4');
    expect(candidates).toHaveLength(2);
    expect(candidates).toEqual(
      expect.arrayContaining([path.join('/dir1', 'video.mp4'), path.join('/dir2', 'video.mp4')])
    );
  });
});
