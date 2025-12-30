// electron/core/services/video-mapper.ts

import path from 'path';
import { pathToFileURL } from 'url';
import { getServerPort } from '../../lib/local-server';
import { VideoRow } from '../repositories/video-repository';
import { VideoFile } from '../../../src/shared/types/video';

export class VideoMapper {
  /**
   * DBの行データをフロントエンド用Entityに変換
   */
  toEntity(row: VideoRow): VideoFile {
    const port = getServerPort();
    const src = pathToFileURL(row.path).href;

    const thumbnailSrc = `http://127.0.0.1:${port}/thumbnail?path=${encodeURIComponent(row.path)}&ts=${row.mtime}&size=${row.size}`;

    return {
      id: row.id,
      name: row.name || path.basename(row.path), // DBにnameがない場合のフォールバック
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
      // ▼▼▼ v5 added ▼▼▼
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
