// electron/lib/local-server.test.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeAll, afterAll, type Mock } from 'vitest';
import { Readable } from 'stream';
import http from 'http';
import os from 'os';

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

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();

  const mockFs = {
    ...actual,
    existsSync: vi.fn((p: string) => {
      if (typeof p === 'string' && p.includes('exists')) return true;
      return false;
    }),
    statSync: vi.fn(() => ({
      size: 100,
      isFile: () => true,
      mtimeMs: Date.now(),
    })),
    createReadStream: vi.fn(() => {
      const s = new Readable();
      s.push('mock-video-content');
      s.push(null);
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

vi.mock('os', async (importOriginal) => {
  const actual = await importOriginal<typeof import('os')>();
  const mockNetworkInterfaces = vi.fn();

  return {
    ...actual,
    default: {
      ...actual,
      networkInterfaces: mockNetworkInterfaces,
    },
    networkInterfaces: mockNetworkInterfaces,
  };
});

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

import { startLocalServer, getServerPort, getLocalIpAddress } from './local-server';

describe('Local Server Logic', () => {
  describe('IP Selection Logic (getLocalIp)', () => {
    it('should ignore virtual interfaces (Docker, WSL, VPN) and prefer 192.168.x.x', async () => {
      (os.networkInterfaces as Mock).mockReturnValue({
        'vEthernet (WSL)': [
          { address: '172.22.16.1', family: 'IPv4', internal: false } as any,
        ],
        DockerNAT: [{ address: '10.0.75.1', family: 'IPv4', internal: false } as any],
        'Wi-Fi': [{ address: '192.168.1.50', family: 'IPv4', internal: false } as any],
      });

      await startLocalServer();
      expect(getLocalIpAddress()).toBe('192.168.1.50');
    });

    it('should select non-192.168 address if it is the only valid physical interface', async () => {
      (os.networkInterfaces as Mock).mockReturnValue({
        Tailscale: [{ address: '100.100.100.100', family: 'IPv4', internal: false } as any],
        Ethernet: [{ address: '10.0.0.55', family: 'IPv4', internal: false } as any],
      });

      await startLocalServer();
      expect(getLocalIpAddress()).toBe('10.0.0.55');
    });

    it('should fallback to 127.0.0.1 if no valid interfaces found', async () => {
      (os.networkInterfaces as Mock).mockReturnValue({
        'Loopback Pseudo-Interface 1': [
          { address: '127.0.0.1', family: 'IPv4', internal: true } as any,
        ],
      });

      await startLocalServer();
      expect(getLocalIpAddress()).toBe('127.0.0.1');
    });
  });

  describe('Server Integration & Security', () => {
    let baseUrl: string;

    beforeAll(async () => {
      (os.networkInterfaces as Mock).mockReturnValue({
        'Wi-Fi': [{ address: '192.168.1.100', family: 'IPv4', internal: false } as any],
      });
      await startLocalServer();
      const port = getServerPort();
      baseUrl = `http://127.0.0.1:${port}`;
    });

    afterAll(() => {
      if (serverInstance) {
        serverInstance.close();
      }
    });

    const request = async (
      endpoint: string,
      params: Record<string, string> = {},
      headers: Record<string, string> = {}
    ) => {
      const url = new URL(baseUrl + endpoint);
      Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));

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
        const url = new URL(baseUrl + '/video');
        url.searchParams.append('path', '/allowed/lib/exists.mp4');

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
});