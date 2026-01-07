// electron/core/services/video-mapper.ts

import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { app } from 'electron';
import { pathToFileURL } from 'url';
import { getServerPort } from '../../lib/server-state';
import { VideoRow } from '../repositories/video-repository';
import { VideoFile } from '../../../src/shared/types/video';
import { THUMBNAIL } from '../../../src/shared/constants/assets';
import { NATIVE_EXTENSIONS } from '../../lib/extensions'; // 追加

export class VideoMapper {
  private thumbDir: string;

  constructor() {
    this.thumbDir = path.join(app.getPath('userData'), THUMBNAIL.DIR_NAME);
  }

  /**
   * DBの行データをフロントエンド用Entityに変換
   */
  toEntity(row: VideoRow): VideoFile {
    const ext = path.extname(row.path).toLowerCase();
    const isNative = NATIVE_EXTENSIONS.has(ext);

    const port = getServerPort();
    const authority = port > 0 ? `127.0.0.1:${port}` : '127.0.0.1';

    // 1. src (動画本体のURL) の決定
    let src: string;
    if (isNative) {
      // ネイティブ再生可能なら file:// (直接アクセス)
      src = pathToFileURL(row.path).href;
    } else {
      // 非ネイティブなら http:// (ストリーミング/トランスコード)
      src = `http://${authority}/video?path=${encodeURIComponent(row.path)}`;
    }

    // 2. thumbnailSrc (サムネイル画像のURL) の決定
    let thumbnailSrc: string;
    const hash = crypto.createHash('md5').update(row.path).digest('hex');
    const thumbPath = path.join(this.thumbDir, `${hash}${THUMBNAIL.EXTENSION}`);

    if (fs.existsSync(thumbPath)) {
      // 存在すれば file:// + キャッシュバスター
      thumbnailSrc = `${pathToFileURL(thumbPath).href}?t=${row.mtime}`;
    } else {
      // なければ生成用URL
      thumbnailSrc = `http://${authority}/thumbnail?path=${encodeURIComponent(row.path)}&ts=${row.mtime}&size=${row.size}`;
    }

    return {
      id: row.id,
      name: row.name || path.basename(row.path),
      path: row.path,
      src, // ここに適切なURLが入るようになる
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

  /**
   * 配列を一括変換
   */
  toEntities(rows: VideoRow[]): VideoFile[] {
    return rows.map((row) => this.toEntity(row));
  }
}
