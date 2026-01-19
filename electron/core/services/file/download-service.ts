// electron/core/services/file/download-service.ts

import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { FileIntegrityService } from './file-integrity-service';
import { VideoFile } from '../../../../src/shared/types/video';
import { logger } from '../../../lib/logger';

export class DownloadService {
  private integrityService = new FileIntegrityService();

  async download(url: string, targetFolderPath: string): Promise<VideoFile | null> {
    logger.debug(`[Download] Starting download from: ${url}`);

    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
      }
      if (!res.body) {
        throw new Error('Response body is empty');
      }

      let fileName = 'downloaded_video.mp4';
      try {
        const urlPath = new URL(url).pathname;
        const base = path.basename(urlPath);
        if (base && path.extname(base)) {
          let decoded = decodeURIComponent(base);

          // eslint-disable-next-line no-control-regex
          decoded = decoded.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');

          fileName = decoded;
        }
      } catch {
        // Fallback to default
      }

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

      logger.debug(`[Download] Saving to: ${newPath}`);

      // @ts-expect-error: Readable.fromWeb is available in newer Node/Electron versions
      const nodeStream = Readable.fromWeb(res.body);
      const fileStream = createWriteStream(newPath);

      await pipeline(nodeStream, fileStream);

      logger.debug(`[Download] Download complete.`);

      return await this.integrityService.processNewFile(newPath);
    } catch (error) {
      logger.error('[Download] Error:', error);
      return null;
    }
  }
}
