// electron/core/services/media/media-mapper.ts

import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { app } from 'electron';
import { pathToFileURL } from 'url';
import { getServerPort } from '../../../lib/server-state';
import { MediaRow } from '../../repositories/media/media-repository';
import { VideoFile } from '../../../../src/shared/types/video';
import { THUMBNAIL } from '../../../../src/shared/constants/assets';
import { NATIVE_EXTENSIONS } from '../../../lib/extensions';

export class VideoMapper {
  private thumbDir: string;

  constructor() {
    this.thumbDir = path.join(app.getPath('userData'), THUMBNAIL.DIR_NAME);
  }

  toEntity(row: MediaRow): VideoFile {
    const ext = path.extname(row.path).toLowerCase();
    const isNative = NATIVE_EXTENSIONS.has(ext);

    const port = getServerPort();
    const authority = port > 0 ? `127.0.0.1:${port}` : '127.0.0.1';

    let src: string;
    if (isNative) {
      src = pathToFileURL(row.path).href;
    } else {
      src = `http://${authority}/video?path=${encodeURIComponent(row.path)}`;
    }

    let thumbnailSrc: string;
    const hash = crypto.createHash('md5').update(row.path).digest('hex');
    const thumbPath = path.join(this.thumbDir, `${hash}${THUMBNAIL.EXTENSION}`);

    if (fs.existsSync(thumbPath)) {
      thumbnailSrc = `${pathToFileURL(thumbPath).href}?t=${row.mtime}`;
    } else {
      thumbnailSrc = `http://${authority}/thumbnail?path=${encodeURIComponent(row.path)}&ts=${row.mtime}&size=${row.size}`;
    }

    return {
      id: row.id,
      name: row.name || path.basename(row.path),
      path: row.path,
      src,
      thumbnailSrc,
      size: row.size,
      createdAt: row.created_at,
      updatedAt: row.mtime,
      duration: row.duration ?? undefined,
      width: row.width ?? undefined,
      height: row.height ?? undefined,
      generationParams: row.generation_params ?? undefined,
      metadataStatus: row.metadata_status ?? 'pending',
      fps: row.fps ?? undefined,
      codec: row.codec ?? undefined,
    };
  }

  toEntities(rows: MediaRow[]): VideoFile[] {
    return rows.map((row) => this.toEntity(row));
  }
}
