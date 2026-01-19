// electron/core/repositories/media/media-repository.ts

import { getDB } from '../../../lib/db';
import { logger } from '../../../lib/logger';

export interface MediaRow {
  id: string;
  path: string;
  name: string;
  type: 'video' | 'image';

  size: number;
  mtime: number;
  created_at: number;
  created_at_original: number | null;

  status: 'available' | 'missing';
  ino: number | null;
  file_hash: string | null;
  last_seen_at: number | null;
  last_scan_attempt_at: number | null;

  is_favorite: number;
  view_count: number;
  last_viewed_at: number | null;

  duration: number | null;
  width: number | null;
  height: number | null;
  aspect_ratio: number | null;
  fps: number | null;
  codec: string | null;
  generation_params: string | null;
  metadata_status: 'pending' | 'processing' | 'completed' | 'failed';

  orientation: number | null;
  is_animated: number;
  lat: number | null;
  lng: number | null;
  camera_model: string | null;
}

export interface MediaCreateInput {
  id: string;
  path: string;
  name: string;
  type: 'video' | 'image';
  size: number;
  mtime: number;
  created_at: number;
  ino: number | null;
}

export interface MediaUpdateInput {
  id: string;
  size: number;
  mtime: number;
  ino: number | null;

  // Metadata reset
  duration: null;
  width: null;
  height: null;
  aspect_ratio: null;
  fps?: null;
  codec?: null;
}

export const LITE_COLUMNS = `
  id, path, name, type, size, mtime, 
  duration, width, height, aspect_ratio, fps, codec, 
  is_favorite, status, ino, file_hash, 
  last_seen_at, last_scan_attempt_at, metadata_status, 
  created_at, orientation, view_count, is_animated
`;

export class MediaRepository {
  private get db() {
    return getDB();
  }

  findByPath(mediaPath: string): MediaRow | undefined {
    return this.db.prepare('SELECT * FROM media WHERE path = ?').get(mediaPath) as
      | MediaRow
      | undefined;
  }

  findById(id: string): MediaRow | undefined {
    return this.db.prepare('SELECT * FROM media WHERE id = ?').get(id) as MediaRow | undefined;
  }

  findManyByPaths(paths: string[]): MediaRow[] {
    if (paths.length === 0) return [];

    const CHUNK_SIZE = 900;
    const results: MediaRow[] = [];

    for (let i = 0; i < paths.length; i += CHUNK_SIZE) {
      const chunk = paths.slice(i, i + CHUNK_SIZE);
      const placeholders = chunk.map(() => '?').join(',');

      const rows = this.db
        .prepare(`SELECT ${LITE_COLUMNS} FROM media WHERE path IN (${placeholders})`)
        .all(...chunk) as MediaRow[];

      results.push(...rows);
    }

    return results;
  }

  findManyByTagIds(tagIds: string[]): MediaRow[] {
    if (tagIds.length === 0) return [];

    const placeholders = tagIds.map(() => '?').join(',');
    const tagCount = tagIds.length;

    return this.db
      .prepare(
        `
      SELECT ${LITE_COLUMNS}
      FROM media m
      JOIN video_tags vt ON m.id = vt.video_id
      WHERE vt.tag_id IN (${placeholders}) AND m.status = 'available'
      GROUP BY m.id
      HAVING COUNT(DISTINCT vt.tag_id) = ?
      ORDER BY m.mtime DESC
    `
      )
      .all(...tagIds, tagCount) as MediaRow[];
  }

  create(media: MediaCreateInput): void {
    logger.debug(`[Repo] Creating media: ${media.path} (Type: ${media.type})`);

    this.db
      .prepare(
        `
      INSERT INTO media (
        id, path, name, type, size, mtime, created_at, 
        status, ino, last_seen_at, metadata_status
      )
      VALUES (
        @id, @path, @name, @type, @size, @mtime, @created_at, 
        'available', @ino, @created_at, 'pending'
      )
    `
      )
      .run(media);
  }

  getFavorites(): MediaRow[] {
    return this.db
      .prepare(
        `
      SELECT ${LITE_COLUMNS} FROM media 
      WHERE is_favorite = 1 AND status = 'available'
    `
      )
      .all() as MediaRow[];
  }

  getFavoriteIds(): string[] {
    const rows = this.db
      .prepare(
        `
      SELECT id FROM media 
      WHERE is_favorite = 1 AND status = 'available'
    `
      )
      .all() as { id: string }[];
    return rows.map((r) => r.id);
  }

  toggleFavoriteById(id: string): void {
    const row = this.findById(id);
    if (!row) return;

    const newVal = row.is_favorite === 1 ? 0 : 1;
    this.db.prepare('UPDATE media SET is_favorite = ? WHERE id = ?').run(newVal, id);
  }

  deleteById(id: string): void {
    this.db.prepare('DELETE FROM media WHERE id = ?').run(id);
  }

  findPathsByDirectory(folderPath: string): { id: string; path: string }[] {
    return this.db
      .prepare('SELECT id, path FROM media WHERE path LIKE ?')
      .all(`${folderPath}%`) as { id: string; path: string }[];
  }
}
