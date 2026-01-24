// electron/core/repositories/media/media-metadata.ts

import { getDB } from '../../../lib/db';
import { MediaRow } from './media-repository';

export class MediaMetadataRepository {
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
      UPDATE media 
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
      UPDATE media 
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
      UPDATE media SET metadata_status = ? WHERE id = ?
    `
      )
      .run(status, id);
  }

  getPendingMedia(limit = 10): MediaRow[] {
    return this.db
      .prepare(
        `
      SELECT * FROM media 
      WHERE status = 'available' AND metadata_status = 'pending'
      ORDER BY mtime DESC
      LIMIT ?
    `
      )
      .all(limit) as MediaRow[];
  }

  resetStuckProcessingStatus(): number {
    const result = this.db
      .prepare(
        `
      UPDATE media 
      SET metadata_status = 'pending'
      WHERE metadata_status = 'processing'
    `
      )
      .run();

    return result.changes;
  }

  resetIncompleteMetadataStatus(): number {
    const result = this.db
      .prepare(
        `
      UPDATE media 
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
