// electron/lib/server/security.ts

import path from 'path';
import { IncomingMessage } from 'http';
import { store } from '../store';

/**
 * 指定されたパスが、アプリで許可されたフォルダ（ライブラリまたは現在開いているフォルダ）
 * の内部にあるかを検証する。パストラバーサル攻撃を防ぐ。
 */
export const isPathAllowed = (targetPath: string): boolean => {
  if (!targetPath) return false;

  // 1. アプリで許可されているフォルダ一覧を取得
  const libraryFolders = (store.get('libraryFolders') as string[]) || [];
  const currentFolder = store.get('folderPath') as string;

  // 重複を除去してリスト化
  const allowedRoots = [...libraryFolders];
  if (currentFolder && !allowedRoots.includes(currentFolder)) {
    allowedRoots.push(currentFolder);
  }

  // 2. パスの正規化
  const normalizedTarget = path.normalize(targetPath);

  // 3. ターゲットが許可フォルダの「中身」かどうかチェック
  return allowedRoots.some((root) => {
    const normalizedRoot = path.normalize(root);
    return normalizedTarget.startsWith(normalizedRoot);
  });
};

/**
 * API/SSE/Mediaアクセスの認証チェック
 * @param req リクエストオブジェクト
 * @param skipTokenCheck トークン検証をスキップするか（静的ファイル用）
 */
export const checkRequestAuth = (
  req: IncomingMessage,
  skipTokenCheck = false
): { allowed: boolean; status?: number; error?: string } => {
  const remoteAddress = req.socket.remoteAddress;

  // 1. Localhost は無条件許可
  if (
    remoteAddress === '127.0.0.1' ||
    remoteAddress === '::1' ||
    remoteAddress === '::ffff:127.0.0.1'
  ) {
    return { allowed: true };
  }

  // 2. 設定でモバイル接続が許可されているか確認 (これは常にチェック)
  const enableMobile = store.get('enableMobileConnection');
  if (!enableMobile) {
    return { allowed: false, status: 403, error: 'Mobile access is disabled in settings.' };
  }

  // 3. トークン認証
  // skipTokenCheck=true (静的ファイル) の場合は、モバイル接続が許可されていればOKとする
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
