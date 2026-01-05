// electron/core/services/download-service.ts

import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { FileIntegrityService } from './file-integrity-service';
import { VideoFile } from '../../../src/shared/types/video';

export class DownloadService {
  private integrityService = new FileIntegrityService();

  async download(url: string, targetFolderPath: string): Promise<VideoFile | null> {
    console.log(`[Download] Starting download from: ${url}`);

    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
      }
      if (!res.body) {
        throw new Error('Response body is empty');
      }

      // ファイル名の決定
      let fileName = 'downloaded_video.mp4';
      try {
        const urlPath = new URL(url).pathname;
        const base = path.basename(urlPath);
        if (base && path.extname(base)) {
          // デコード
          let decoded = decodeURIComponent(base);

          // ファイル名サニタイズ処理
          // Windows/Linuxでファイル名に使用できない文字をアンダースコアに置換
          // eslint-disable-next-line no-control-regex
          decoded = decoded.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');

          fileName = decoded;
        }
      } catch {
        // Fallback to default
      }

      // パス重複回避
      let newPath = path.join(targetFolderPath, fileName);
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

      console.log(`[Download] Saving to: ${newPath}`);

      // ストリームパイプラインによる保存
      // @ts-expect-error: Readable.fromWeb is available in newer Node/Electron versions
      const nodeStream = Readable.fromWeb(res.body);
      const fileStream = createWriteStream(newPath);

      await pipeline(nodeStream, fileStream);

      console.log(`[Download] Download complete.`);

      // DB登録・サムネイル生成 (FileIntegrityServiceに委譲)
      return await this.integrityService.processNewFile(newPath);
    } catch (error) {
      console.error('[Download] Error:', error);
      return null;
    }
  }
}
