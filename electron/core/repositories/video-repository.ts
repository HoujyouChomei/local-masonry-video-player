// electron/core/repositories/video-repository.ts

import { getDB } from '../../lib/db';
import path from 'path';

export interface VideoRow {
  id: string;
  path: string;
  name: string;
  size: number;
  mtime: number;
  duration: number | null;
  width: number | null;
  height: number | null;
  is_favorite: number;
  created_at: number;
  status: 'available' | 'missing';
  ino: number | null;
  file_hash: string | null;
  last_seen_at: number | null;
  last_scan_attempt_at: number | null;
  generation_params: string | null;
  metadata_status: 'pending' | 'processing' | 'completed' | 'failed';
  fps: number | null;
  codec: string | null;
}

export interface VideoCreateInput {
  id: string;
  path: string;
  name: string;
  size: number;
  mtime: number;
  created_at: number;
  ino: number | null;
}

export interface VideoUpdateInput {
  id: string;
  size: number;
  mtime: number;
  duration: null;
  width: null;
  height: null;
  aspect_ratio: null;
  ino: number | null;
  fps?: null;
  codec?: null;
}

// ▼▼▼ 追加: AIプロンプト(generation_params)を除外した軽量カラムリスト ▼▼▼
// 一覧表示時に巨大なテキストデータを転送しないための最適化
export const LITE_COLUMNS = `
  id, path, name, size, mtime, duration, width, height, 
  aspect_ratio, fps, codec, is_favorite, status, ino, 
  file_hash, last_seen_at, last_scan_attempt_at, 
  metadata_status, created_at
`;

export class VideoRepository {
  private get db() {
    return getDB();
  }

  findByPath(videoPath: string): VideoRow | undefined {
    // 詳細取得用なので SELECT * (generation_params含む) のまま
    return this.db.prepare('SELECT * FROM videos WHERE path = ?').get(videoPath) as
      | VideoRow
      | undefined;
  }

  findById(id: string): VideoRow | undefined {
    // 詳細取得用なので SELECT * (generation_params含む) のまま
    return this.db.prepare('SELECT * FROM videos WHERE id = ?').get(id) as VideoRow | undefined;
  }

  findManyByPaths(paths: string[]): VideoRow[] {
    if (paths.length === 0) return [];
    const placeholders = paths.map(() => '?').join(',');
    // ▼▼▼ 修正: Liteカラムを使用 ▼▼▼
    return this.db
      .prepare(`SELECT ${LITE_COLUMNS} FROM videos WHERE path IN (${placeholders})`)
      .all(...paths) as VideoRow[];
  }

  findManyByTagIds(tagIds: string[]): VideoRow[] {
    if (tagIds.length === 0) return [];

    const placeholders = tagIds.map(() => '?').join(',');
    const tagCount = tagIds.length;

    // ▼▼▼ 修正: Liteカラムを使用 ▼▼▼
    return this.db
      .prepare(
        `
      SELECT ${LITE_COLUMNS}
      FROM videos v
      JOIN video_tags vt ON v.id = vt.video_id
      WHERE vt.tag_id IN (${placeholders}) AND v.status = 'available'
      GROUP BY v.id
      HAVING COUNT(DISTINCT vt.tag_id) = ?
      ORDER BY v.mtime DESC
    `
      )
      .all(...tagIds, tagCount) as VideoRow[];
  }

  create(video: VideoCreateInput): void {
    console.log(`[Repo] Creating video: ${video.path} (ID: ${video.id})`);
    const name = video.name || path.basename(video.path);

    this.db
      .prepare(
        `
      INSERT INTO videos (
        id, path, name, size, mtime, created_at, 
        status, ino, last_seen_at, metadata_status
      )
      VALUES (
        @id, @path, @name, @size, @mtime, @created_at, 
        'available', @ino, @created_at, 'pending'
      )
    `
      )
      .run({ ...video, name });
  }

  getFavorites(): VideoRow[] {
    // ▼▼▼ 修正: Liteカラムを使用 ▼▼▼
    return this.db
      .prepare(
        `
      SELECT ${LITE_COLUMNS} FROM videos 
      WHERE is_favorite = 1 AND status = 'available'
    `
      )
      .all() as VideoRow[];
  }

  getFavoriteIds(): string[] {
    const rows = this.db
      .prepare(
        `
      SELECT id FROM videos 
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
    this.db.prepare('UPDATE videos SET is_favorite = ? WHERE id = ?').run(newVal, id);
  }

  deleteByPath(path: string): void {
    this.db.prepare('DELETE FROM videos WHERE path = ?').run(path);
  }

  deleteById(id: string): void {
    this.db.prepare('DELETE FROM videos WHERE id = ?').run(id);
  }

  findPathsByDirectory(folderPath: string): { id: string; path: string }[] {
    return this.db
      .prepare('SELECT id, path FROM videos WHERE path LIKE ?')
      .all(`${folderPath}%`) as { id: string; path: string }[];
  }

  deleteManyByIds(ids: string[]): void {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    this.db.prepare(`DELETE FROM videos WHERE id IN (${placeholders})`).run(...ids);
  }
}
