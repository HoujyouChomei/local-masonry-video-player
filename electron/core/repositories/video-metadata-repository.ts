// electron/core/repositories/video-metadata-repository.ts

import { getDB } from '../../lib/db';
import { VideoRow } from './video-repository';

export class VideoMetadataRepository {
  private get db() {
    return getDB();
  }

  updateMetadata(
    path: string,
    duration: number,
    width: number,
    height: number,
    fps?: number,
    codec?: string
  ): void {
    const aspectRatio = height > 0 ? width / height : null;

    this.db
      .prepare(
        `
      UPDATE videos 
      SET 
        duration = ?, 
        width = ?, 
        height = ?, 
        aspect_ratio = ?,
        fps = COALESCE(?, fps),
        codec = COALESCE(?, codec)
      WHERE path = ?
    `
      )
      .run(duration, width, height, aspectRatio, fps || null, codec || null, path);
  }

  updateGenerationParams(id: string, params: string): void {
    this.db
      .prepare(
        `
      UPDATE videos 
      SET 
        generation_params = ?, 
        metadata_status = 'completed'
      WHERE id = ?
    `
      )
      .run(params, id);
  }

  updateMetadataStatus(
    id: string,
    status: 'pending' | 'processing' | 'completed' | 'failed'
  ): void {
    this.db
      .prepare(
        `
      UPDATE videos SET metadata_status = ? WHERE id = ?
    `
      )
      .run(status, id);
  }

  getPendingVideos(limit = 10): VideoRow[] {
    return this.db
      .prepare(
        `
      SELECT * FROM videos 
      WHERE status = 'available' AND metadata_status = 'pending'
      ORDER BY mtime DESC
      LIMIT ?
    `
      )
      .all(limit) as VideoRow[];
  }

  resetIncompleteMetadataStatus(): number {
    // 状態は完了(completed)しているが、FPS または Codec が未設定のレコードを抽出
    // これらを 'pending' に戻すことで、MetadataHarvester に再処理させる
    const result = this.db
      .prepare(
        `
      UPDATE videos 
      SET metadata_status = 'pending'
      WHERE 
        status = 'available' 
        AND metadata_status = 'completed' 
        AND (fps IS NULL OR codec IS NULL)
    `
      )
      .run();

    return result.changes;
  }
}
