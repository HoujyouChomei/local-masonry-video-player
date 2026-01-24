// src/shared/api/base/http-base.test.ts

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { HttpBase } from './http-base';
import { Media } from '@/shared/schemas/media';

class TestHttpBase extends HttpBase {
  public testAdaptMedia(media: Media): Media {
    return this.adaptMedia(media);
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
    const inputMedia = {
      id: 'v1',
      path: 'C:\\Videos\\test.mp4',
      thumbnailSrc: 'file://C:/Users/Test/AppData/Roaming/lvm/thumbnails/abc.jpg',
      src: '',
      updatedAt: 123456789,
      size: 1024,
    } as Media;

    const result = client.testAdaptMedia(inputMedia);

    expect(result.thumbnailSrc).not.toContain('file://');

    expect(result.thumbnailSrc).toContain('/thumbnail');

    expect(result.thumbnailSrc).toContain('path=C%3A%5CVideos%5Ctest.mp4');
    expect(result.thumbnailSrc).toContain('t=123456789');

    expect(result.thumbnailSrc).toContain('http://192.168.1.10:54321');
  });

  it('should fix localhost IP to current hostname for http:// thumbnails', () => {
    const inputMedia = {
      id: 'v2',
      path: '/video.mp4',
      thumbnailSrc: 'http://127.0.0.1:54321/thumbnail?path=...',
      src: '',
    } as Media;

    const result = client.testAdaptMedia(inputMedia);

    expect(result.thumbnailSrc).not.toContain('127.0.0.1');
    expect(result.thumbnailSrc).toContain('192.168.1.10');
  });
});
