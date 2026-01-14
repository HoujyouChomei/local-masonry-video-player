// electron/lib/server/security.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isPathAllowed, checkRequestAuth } from './security';
import path from 'path';
import { IncomingMessage } from 'http';

const storeMocks = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock('../store', () => ({
  store: {
    get: storeMocks.get,
  },
}));

describe('Security Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isPathAllowed', () => {
    const LIBRARY_ROOT = path.normalize('/library/videos');
    const CURRENT_ROOT = path.normalize('/current/folder');

    beforeEach(() => {
      storeMocks.get.mockImplementation((key: string) => {
        if (key === 'libraryFolders') return [LIBRARY_ROOT];
        if (key === 'folderPath') return CURRENT_ROOT;
        return null;
      });
    });

    it('should return false for empty path', () => {
      expect(isPathAllowed('')).toBe(false);
    });

    it('should allow paths inside library folders', () => {
      const target = path.join(LIBRARY_ROOT, 'subfolder', 'video.mp4');
      expect(isPathAllowed(target)).toBe(true);
    });

    it('should allow paths inside current folder', () => {
      const target = path.join(CURRENT_ROOT, 'video.mp4');
      expect(isPathAllowed(target)).toBe(true);
    });

    it('should block paths outside allowed folders', () => {
      const target = path.normalize('/etc/passwd');
      expect(isPathAllowed(target)).toBe(false);
    });

    it('should block directory traversal attacks', () => {
      const attackPath = path.join(LIBRARY_ROOT, '..', '..', 'system', 'file');
      expect(isPathAllowed(attackPath)).toBe(false);
    });

    it('should allow root path itself', () => {
      expect(isPathAllowed(LIBRARY_ROOT)).toBe(true);
    });
  });

  describe('checkRequestAuth', () => {
    const VALID_TOKEN = 'secret-token';

    const createReq = (
      remoteAddress: string,
      headers: Record<string, string> = {},
      urlStr?: string
    ) => {
      return {
        socket: { remoteAddress },
        headers,
        url: urlStr,
      } as unknown as IncomingMessage;
    };

    beforeEach(() => {
      storeMocks.get.mockImplementation((key: string) => {
        if (key === 'enableMobileConnection') return true;
        if (key === 'authAccessToken') return VALID_TOKEN;
        return null;
      });
    });

    it('should allow localhost requests unconditionally', () => {
      const req = createReq('127.0.0.1');
      const result = checkRequestAuth(req);
      expect(result).toEqual({ allowed: true });
    });

    it('should allow ipv6 localhost requests unconditionally', () => {
      const req = createReq('::1');
      const result = checkRequestAuth(req);
      expect(result).toEqual({ allowed: true });
    });

    it('should deny if mobile connection is disabled in settings', () => {
      storeMocks.get.mockImplementation((key: string) => {
        if (key === 'enableMobileConnection') return false;
        return null;
      });

      const req = createReq('192.168.1.10');
      const result = checkRequestAuth(req);

      expect(result.allowed).toBe(false);
      expect(result.status).toBe(403);
    });

    it('should allow if skipTokenCheck is true (and mobile enabled)', () => {
      const req = createReq('192.168.1.10');
      const result = checkRequestAuth(req, true);
      expect(result).toEqual({ allowed: true });
    });

    it('should allow valid token in Authorization header', () => {
      const req = createReq('192.168.1.10', {
        authorization: `Bearer ${VALID_TOKEN}`,
      });
      const result = checkRequestAuth(req);
      expect(result).toEqual({ allowed: true });
    });

    it('should allow valid token in URL query params', () => {
      const req = createReq('192.168.1.10', {}, `/api/data?token=${VALID_TOKEN}`);
      const result = checkRequestAuth(req);
      expect(result).toEqual({ allowed: true });
    });

    it('should deny missing token', () => {
      const req = createReq('192.168.1.10', {});
      const result = checkRequestAuth(req);
      expect(result.allowed).toBe(false);
      expect(result.status).toBe(401);
    });

    it('should deny invalid token', () => {
      const req = createReq('192.168.1.10', {
        authorization: 'Bearer wrong-token',
      });
      const result = checkRequestAuth(req);
      expect(result.allowed).toBe(false);
      expect(result.status).toBe(401);
    });
  });
});
