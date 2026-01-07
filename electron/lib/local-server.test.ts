// electron/lib/local-server.test.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { Readable } from 'stream';
import http from 'http';

// --- Mocks Setup ---

// 1. Electron & Native Image
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp/userdata'),
  },
  nativeImage: {
    createThumbnailFromPath: vi.fn().mockResolvedValue({
      isEmpty: () => false,
      toJPEG: () => Buffer.from('mock-image-data'),
    }),
  },
}));

// 2. Electron Store (Config)
vi.mock('./store', () => ({
  store: {
    get: vi.fn((key) => {
      if (key === 'libraryFolders') return ['/allowed/lib'];
      if (key === 'folderPath') return '/allowed/current';
      if (key === 'enableMobileConnection') return true;
      if (key === 'authAccessToken') return 'test-token';
      return null;
    }),
  },
}));

// 3. File System (Partial Mock)
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();

  const mockFs = {
    ...actual,
    existsSync: vi.fn((p: string) => {
      // "exists" という文字列を含むパスは存在するとみなす
      if (typeof p === 'string' && p.includes('exists')) return true;
      return false;
    }),
    statSync: vi.fn(() => ({
      size: 100, // 100 bytes dummy
      isFile: () => true,
      mtimeMs: Date.now(),
    })),
    // createReadStream は簡易的なReadableStreamを返すようにオーバーライド
    createReadStream: vi.fn(() => {
      const s = new Readable();
      s.push('mock-video-content');
      s.push(null);
      // サーバー側のクリーンアップで destroy が呼ばれるためモック化
      (s as any).destroy = vi.fn();
      return s;
    }),
    mkdirSync: vi.fn(),
    promises: {
      writeFile: vi.fn().mockResolvedValue(undefined),
    },
  };

  return {
    ...mockFs,
    default: mockFs,
  };
});

// 4. Child Process (FFmpeg)
vi.mock('child_process', () => {
  const mockSpawn = vi.fn().mockReturnValue({
    stdout: { pipe: vi.fn() },
    stderr: { on: vi.fn() },
    kill: vi.fn(),
    killed: false,
  });

  const mockExecFile = vi.fn((...args: any[]) => {
    const callback = args[args.length - 1];
    if (typeof callback === 'function') {
      callback(null, { stdout: '', stderr: '' });
    }
    return { kill: vi.fn() };
  });

  return {
    default: {
      spawn: mockSpawn,
      execFile: mockExecFile,
    },
    spawn: mockSpawn,
    execFile: mockExecFile,
  };
});

// サーバーインスタンスを保持してテスト後に閉じるための細工
let serverInstance: http.Server | null = null;
vi.mock('http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('http')>();
  return {
    ...actual,
    createServer: (handler: any) => {
      const s = actual.createServer(handler);
      serverInstance = s;
      return s;
    },
  };
});

// Import the module under test AFTER mocks
import { startLocalServer, getServerPort } from './local-server';

describe('Local Server Integration', () => {
  let baseUrl: string;

  beforeAll(async () => {
    // サーバー起動
    await startLocalServer();
    const port = getServerPort();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(() => {
    // テスト終了後にサーバーを閉じる (ポート解放)
    if (serverInstance) {
      serverInstance.close();
    }
  });

  // テスト用ヘルパー
  const request = async (
    endpoint: string,
    params: Record<string, string> = {},
    headers: Record<string, string> = {}
  ) => {
    const url = new URL(baseUrl + endpoint);
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));

    // 認証トークンを付与 (本来は不要だが将来的なRemoteテスト互換のため)
    if (!url.searchParams.has('token') && !headers['Authorization']) {
      url.searchParams.append('token', 'test-token');
    }
    return fetch(url.toString(), { headers });
  };

  describe('Security Checks', () => {
    it('should allow access to files in library folders', async () => {
      const res = await request('/video', { path: '/allowed/lib/exists.mp4' });
      expect(res.status).toBe(200);
    });

    it('should block access to files outside allowed folders', async () => {
      const res = await request('/video', { path: '/forbidden/exists.mp4' });
      expect(res.status).toBe(403);
    });

    it('should block directory traversal attacks', async () => {
      const attackPath = '/allowed/lib/../../etc/passwd';
      const res = await request('/video', { path: attackPath });
      expect(res.status).toBe(403);
    });

    it('should allow localhost requests even without token (Local Access)', async () => {
      // トークンなしのリクエスト
      const url = new URL(baseUrl + '/video');
      url.searchParams.append('path', '/allowed/lib/exists.mp4');

      // Localhostからのアクセスは常に許可される仕様
      const res = await fetch(url.toString());
      expect(res.status).toBe(200);
    });
  });

  describe('Endpoints', () => {
    it('GET /thumbnail should return image', async () => {
      const res = await request('/thumbnail', { path: '/allowed/lib/exists.mp4' });
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toBe('image/jpeg');
    });

    it('GET /video should support Range requests', async () => {
      const res = await request(
        '/video',
        { path: '/allowed/lib/exists.mp4' },
        { Range: 'bytes=0-10' }
      );
      expect(res.status).toBe(206);
      expect(res.headers.get('content-length')).toBe('11');
      expect(res.headers.get('content-range')).toContain('bytes 0-10/');
    });

    it('GET /video should return 404 for non-existent files', async () => {
      const res = await request('/video', { path: '/allowed/lib/missing.mp4' });
      expect(res.status).toBe(404);
    });
  });
});
