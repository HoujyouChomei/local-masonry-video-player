// electron/core/services/file-move-service.ts

import fs from 'fs/promises';
import path from 'path';

// ファイルシステムエラー用の型定義
interface FileSystemError extends Error {
  code?: string;
}

// ▼▼▼ 追加: 移動結果の型定義 ▼▼▼
export interface MoveResult {
  oldPath: string;
  newPath: string;
  success: boolean;
  error?: string;
}

export class FileMoveService {
  /**
   * 複数の動画ファイルを指定フォルダへ移動する
   * - 同名ファイルがある場合は自動リネーム
   * - パーティション跨ぎ等で rename が失敗した場合は copy + unlink にフォールバック
   *
   * @returns 移動結果のリスト
   */
  // ▼▼▼ 変更: 戻り値を MoveResult[] に変更 ▼▼▼
  async moveVideos(videoPaths: string[], targetFolderPath: string): Promise<MoveResult[]> {
    console.log(`[Move] Request received. Target: ${targetFolderPath}`);

    const results: MoveResult[] = [];

    for (const rawOldPath of videoPaths) {
      const oldPath = path.normalize(rawOldPath);
      const fileName = path.basename(oldPath);
      let newPath = path.join(targetFolderPath, fileName);

      if (oldPath === newPath) {
        console.log(`[Move] Skipped (Same path): ${oldPath}`);
        results.push({ oldPath, newPath, success: false, error: 'Same path' });
        continue;
      }

      try {
        // 同名ファイル回避
        let counter = 1;
        const ext = path.extname(fileName);
        const nameWithoutExt = path.basename(fileName, ext);

        while (true) {
          try {
            await fs.access(newPath);
            newPath = path.join(targetFolderPath, `${nameWithoutExt} (${counter})${ext}`);
            counter++;
          } catch {
            break;
          }
        }

        console.log(`[Move] Attempting: ${oldPath} -> ${newPath}`);

        // --- 移動処理 ---
        try {
          await fs.rename(oldPath, newPath);
          console.log(`[Move] Success (Rename): ${fileName}`);
        } catch (unknownErr) {
          const err = unknownErr as FileSystemError;
          console.warn(`[Move] Rename failed (${err.code}). Trying Copy+Unlink...`);

          if (err.code === 'EXDEV' || err.code === 'EPERM' || err.code === 'EACCES') {
            await fs.cp(oldPath, newPath, { preserveTimestamps: true, force: true });
            await fs.unlink(oldPath);
            console.log(`[Move] Success (Copy+Unlink): ${fileName}`);
          } else {
            throw err;
          }
        }

        results.push({ oldPath, newPath, success: true });
      } catch (unknownError) {
        const error = unknownError as FileSystemError;
        console.error(`[Move] FAILED: ${oldPath} -> ${newPath}`);
        results.push({ oldPath, newPath, success: false, error: error.message });
      }
    }

    return results;
  }
}
