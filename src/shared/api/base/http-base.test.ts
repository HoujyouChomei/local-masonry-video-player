// src/shared/api/base/http-base.test.ts

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { HttpBase } from './http-base';
import { VideoFile } from '@/shared/types/video';

class TestHttpBase extends HttpBase {
  public testAdaptVideo(video: VideoFile): VideoFile {
    return this.adaptVideo(video);
  }
}

describe('HttpBase (Mobile/Web Client Logic)', () => {
  let client: TestHttpBase;

  beforeEach(() => {
    vi.stubGlobal('window', {
      location: {
        hostname: '192.168.1.10',
        port: '54321',
        origin: 'http://192.168.1.10:54321',
        search: '',
        pathname: '/',
      },
      history: {
        replaceState: vi.fn(),
      },
    });

    client = new TestHttpBase();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should convert file:// thumbnail to HTTP API URL', () => {
    const inputVideo = {
      id: 'v1',
      path: 'C:\\Videos\\test.mp4',
      thumbnailSrc: 'file://C:/Users/Test/AppData/Roaming/lvm/thumbnails/abc.jpg',
      src: '',
      updatedAt: 123456789,
      size: 1024,
    } as VideoFile;

    const result = client.testAdaptVideo(inputVideo);

    expect(result.thumbnailSrc).not.toContain('file://');

    expect(result.thumbnailSrc).toContain('/thumbnail');

    expect(result.thumbnailSrc).toContain('path=C%3A%5CVideos%5Ctest.mp4');
    expect(result.thumbnailSrc).toContain('t=123456789');

    expect(result.thumbnailSrc).toContain('http://192.168.1.10:54321');
  });

  it('should fix localhost IP to current hostname for http:// thumbnails', () => {
    const inputVideo = {
      id: 'v2',
      path: '/video.mp4',
      thumbnailSrc: 'http://127.0.0.1:54321/thumbnail?path=...',
      src: '',
    } as VideoFile;

    const result = client.testAdaptVideo(inputVideo);

    expect(result.thumbnailSrc).not.toContain('127.0.0.1');
    expect(result.thumbnailSrc).toContain('192.168.1.10');
  });
});
