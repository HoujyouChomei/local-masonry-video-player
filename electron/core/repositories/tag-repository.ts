// electron/core/repositories/tag-repository.ts

import path from 'path'; // 追加
import { getDB } from '../../lib/db';
import crypto from 'crypto';

export interface TagRow {
  id: string;
  name: string;
  created_at: number;
  count?: number;
}

export class TagRepository {
  private get db() {
    return getDB();
  }

  createOrGet(name: string): TagRow {
    const trimmedName = name.trim();
    const now = Date.now();

    const existing = this.db.prepare('SELECT * FROM tags WHERE name = ?').get(trimmedName) as
      | TagRow
      | undefined;
    if (existing) {
      return existing;
    }

    const id = crypto.randomUUID();
    this.db
      .prepare(
        `
      INSERT INTO tags (id, name, created_at)
      VALUES (?, ?, ?)
    `
      )
      .run(id, trimmedName, now);

    return { id, name: trimmedName, created_at: now };
  }

  getTagsByVideoId(videoId: string): TagRow[] {
    return this.db
      .prepare(
        `
      SELECT t.* 
      FROM tags t
      JOIN video_tags vt ON t.id = vt.tag_id
      WHERE vt.video_id = ?
      ORDER BY t.name ASC
    `
      )
      .all(videoId) as TagRow[];
  }

  getAll(): TagRow[] {
    return this.db
      .prepare(
        `
      SELECT t.*
      FROM tags t
      JOIN video_tags vt ON t.id = vt.tag_id
      JOIN videos v ON vt.video_id = v.id
      WHERE v.status = 'available'
      GROUP BY t.id
      ORDER BY MAX(vt.assigned_at) DESC, t.name ASC
    `
      )
      .all() as TagRow[];
  }

  getAllActive(): TagRow[] {
    return this.db
      .prepare(
        `
      SELECT t.*, COUNT(vt.video_id) as count
      FROM tags t
      JOIN video_tags vt ON t.id = vt.tag_id
      JOIN videos v ON vt.video_id = v.id
      WHERE v.status = 'available'
      GROUP BY t.id
      ORDER BY t.name ASC
    `
      )
      .all() as TagRow[];
  }

  getTagsByFolderPath(folderPath: string): TagRow[] {
    // ▼▼▼ 修正: 再帰検索を防止し、直下のファイルのみを集計対象にする ▼▼▼

    // 1. パスの末尾にセパレータを保証
    const folderPrefix = folderPath.endsWith(path.sep)
      ? folderPath
      : folderPath + path.sep;

    // 2. SQLiteのSUBSTR用オフセット (1-based)
    const offset = folderPrefix.length + 1;

    return this.db
      .prepare(
        `
      SELECT t.*, COUNT(vt.video_id) as count
      FROM tags t
      JOIN video_tags vt ON t.id = vt.tag_id
      JOIN videos v ON vt.video_id = v.id
      WHERE v.status = 'available' 
        AND v.path LIKE ?
        AND INSTR(SUBSTR(v.path, ?), ?) = 0 -- 直下判定
      GROUP BY t.id
      ORDER BY t.name ASC
    `
      )
      .all(`${folderPrefix}%`, offset, path.sep) as TagRow[];
  }

  assignTag(videoId: string, tagId: string): void {
    const now = Date.now();
    this.db
      .prepare(
        `
      INSERT INTO video_tags (video_id, tag_id, assigned_at)
      VALUES (?, ?, ?)
      ON CONFLICT(video_id, tag_id) DO UPDATE SET assigned_at = excluded.assigned_at
    `
      )
      .run(videoId, tagId, now);
  }

  unassignTag(videoId: string, tagId: string): void {
    this.db
      .prepare(
        `
      DELETE FROM video_tags
      WHERE video_id = ? AND tag_id = ?
    `
      )
      .run(videoId, tagId);
  }

  // ▼▼▼ 一括処理用メソッド ▼▼▼
  assignTagToVideos(videoIds: string[], tagId: string): void {
    const now = Date.now();
    const insertStmt = this.db.prepare(`
      INSERT INTO video_tags (video_id, tag_id, assigned_at)
      VALUES (?, ?, ?)
      ON CONFLICT(video_id, tag_id) DO UPDATE SET assigned_at = excluded.assigned_at
    `);

    const tx = this.db.transaction(() => {
      for (const videoId of videoIds) {
        insertStmt.run(videoId, tagId, now);
      }
    });
    tx();
  }

  unassignTagFromVideos(videoIds: string[], tagId: string): void {
    const deleteStmt = this.db.prepare(`
      DELETE FROM video_tags
      WHERE video_id = ? AND tag_id = ?
    `);

    const tx = this.db.transaction(() => {
      for (const videoId of videoIds) {
        deleteStmt.run(videoId, tagId);
      }
    });
    tx();
  }
}