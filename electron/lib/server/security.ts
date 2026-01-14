// electron/lib/server/security.ts

import path from 'path';
import { IncomingMessage } from 'http';
import { store } from '../store';

export const isPathAllowed = (targetPath: string): boolean => {
  if (!targetPath) return false;

  const libraryFolders = (store.get('libraryFolders') as string[]) || [];
  const currentFolder = store.get('folderPath') as string;

  const allowedRoots = [...libraryFolders];
  if (currentFolder && !allowedRoots.includes(currentFolder)) {
    allowedRoots.push(currentFolder);
  }

  const normalizedTarget = path.normalize(targetPath);

  return allowedRoots.some((root) => {
    const normalizedRoot = path.normalize(root);
    return normalizedTarget.startsWith(normalizedRoot);
  });
};

export const checkRequestAuth = (
  req: IncomingMessage,
  skipTokenCheck = false
): { allowed: boolean; status?: number; error?: string } => {
  const remoteAddress = req.socket.remoteAddress;

  if (
    remoteAddress === '127.0.0.1' ||
    remoteAddress === '::1' ||
    remoteAddress === '::ffff:127.0.0.1'
  ) {
    return { allowed: true };
  }

  const enableMobile = store.get('enableMobileConnection');
  if (!enableMobile) {
    return { allowed: false, status: 403, error: 'Mobile access is disabled in settings.' };
  }

  if (skipTokenCheck) {
    return { allowed: true };
  }

  const authHeader = req.headers['authorization'];
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    try {
      const url = new URL(req.url || '', `http://localhost`);
      token = url.searchParams.get('token') || '';
    } catch {
      // ignore
    }
  }

  const expectedToken = store.get('authAccessToken');

  if (!expectedToken || token !== expectedToken) {
    return { allowed: false, status: 401, error: 'Invalid or missing access token.' };
  }

  return { allowed: true };
};
