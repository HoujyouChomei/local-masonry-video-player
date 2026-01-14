// electron/core/repositories/video-integrity-repository.ts

import { getDB } from '../../lib/db';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { app } from 'electron';
import { THUMBNAIL } from '../../../src/shared/constants/assets';
import { VideoRow, VideoCreateInput, VideoUpdateInput } from './video-repository';
import { logger } from '../../lib/logger';

export class VideoIntegrityRepository {
  private get db() {
    return getDB();
  }

  resetMetadata(id: string, size: number, mtime: number, ino: number | null): void {
    logger.debug(`[Repo] Resetting metadata for ID: ${id}`);
    this.db
      .prepare(
        `
      UPDATE videos 
      SET 
        size = ?, 
        mtime = ?, 
        duration = NULL, 
        width = NULL, 
        height = NULL, 
        aspect_ratio = NULL, 
        fps = NULL,
        codec = NULL,
        ino = ?, 
        status = 'available', 
        last_seen_at = ?, 
        last_scan_attempt_at = NULL,
        metadata_status = 'pending'
      WHERE id = ?
    `
      )
      .run(size, mtime, ino, Date.now(), id);
  }

  updatePath(id: string, newPath: string, mtime: number): void {
    const name = path.basename(newPath);
    this.db
      .prepare(
        `
      UPDATE videos 
      SET path = ?, name = ?, mtime = ?, last_seen_at = ?
      WHERE id = ?
    `
      )
      .run(newPath, name, mtime, Date.now(), id);
  }

  upsertMany(toInsert: VideoCreateInput[], toUpdate: VideoUpdateInput[]): void {
    if (toInsert.length === 0 && toUpdate.length === 0) return;

    const tx = this.db.transaction(() => {
      const now = Date.now();
      if (toInsert.length > 0) {
        const insertStmt = this.db.prepare(`
          INSERT INTO videos (
            id, path, name, size, mtime, created_at, 
            status, ino, last_seen_at, metadata_status
          )
          VALUES (
            @id, @path, @name, @size, @mtime, @created_at, 
            'available', @ino, @created_at, 'pending'
          )
        `);
        for (const data of toInsert) {
          const dataWithName = { ...data, name: data.name || path.basename(data.path) };
          insertStmt.run(dataWithName);
        }
      }
      if (toUpdate.length > 0) {
        const updateStmt = this.db.prepare(`
          UPDATE videos 
          SET 
            size = @size, 
            mtime = @mtime, 
            duration = NULL, 
            width = NULL, 
            height = NULL, 
            aspect_ratio = NULL, 
            fps = NULL,
            codec = NULL,
            ino = @ino, 
            status = 'available', 
            last_seen_at = ?, 
            last_scan_attempt_at = NULL,
            metadata_status = 'pending'
          WHERE id = @id
        `);
        for (const data of toUpdate) updateStmt.run(data, now);
      }
    });
    tx();
  }

  markAsMissing(ids: string[]): void {
    if (ids.length === 0) return;
    const now = Date.now();
    const placeholders = ids.map(() => '?').join(',');
    logger.debug(`[Repo] Marking ${ids.length} videos as missing.`);
    this.db
      .prepare(
        `
      UPDATE videos 
      SET status = 'missing', last_seen_at = ? 
      WHERE id IN (${placeholders})
    `
      )
      .run(now, ...ids);
  }

  markAsMissingByPath(path: string): void {
    const now = Date.now();
    logger.debug(`[Repo] Marking as missing: ${path}`);
    this.db
      .prepare(
        `
      UPDATE videos 
      SET status = 'missing', last_seen_at = ? 
      WHERE path = ?
    `
      )
      .run(now, path);
  }

  markScanAttempted(ids: string[]): void {
    if (ids.length === 0) return;
    const now = Date.now();
    const placeholders = ids.map(() => '?').join(',');
    logger.debug(`[Repo] Marking ${ids.length} videos as scan attempted.`);
    this.db
      .prepare(
        `
      UPDATE videos 
      SET last_scan_attempt_at = ? 
      WHERE id IN (${placeholders})
    `
      )
      .run(now, ...ids);
  }

  restore(id: string, newPath: string, size: number, mtime: number, ino: number | null): void {
    logger.debug(`[Repo] RESTORE executed for ID: ${id} -> ${newPath}`);
    const now = Date.now();
    const name = path.basename(newPath);
    this.db
      .prepare(
        `
      UPDATE videos
      SET 
        path = ?, name = ?, 
        size = ?, mtime = ?, ino = ?, 
        status = 'available', last_seen_at = ?, last_scan_attempt_at = NULL
      WHERE id = ?
    `
      )
      .run(newPath, name, size, mtime, ino, now, id);
  }

  findByInode(ino: number): VideoRow[] {
    const rows = this.db
      .prepare(
        `
      SELECT * FROM videos WHERE ino = ?
    `
      )
      .all(ino) as VideoRow[];
    return rows;
  }

  findMissingCandidatesBySize(size: number): VideoRow[] {
    const rows = this.db
      .prepare(
        `
      SELECT * FROM videos
      WHERE status = 'missing' AND size = ?
      ORDER BY last_seen_at DESC
    `
      )
      .all(size) as VideoRow[];
    return rows;
  }

  updateHash(id: string, hash: string): void {
    logger.debug(`[Repo] Updating hash for ID: ${id}`);
    this.db.prepare('UPDATE videos SET file_hash = ? WHERE id = ?').run(hash, id);
  }

  getImportantPaths(): string[] {
    const rows = this.db
      .prepare(
        `
      SELECT DISTINCT v.path
      FROM videos v
      LEFT JOIN playlist_items pi ON v.id = pi.video_id
      WHERE (v.is_favorite = 1 OR pi.playlist_id IS NOT NULL)
    `
      )
      .all() as { path: string }[];

    return rows.map((r) => r.path);
  }

  deleteExpiredMissingVideos(retentionPeriodDays: number): number {
    const thresholdMs = Date.now() - retentionPeriodDays * 24 * 60 * 60 * 1000;

    const rows = this.db
      .prepare(
        `
      SELECT id, path FROM videos 
      WHERE status = 'missing' AND last_seen_at < ?
    `
      )
      .all(thresholdMs) as { id: string; path: string }[];

    if (rows.length === 0) return 0;

    const ids = rows.map((r) => r.id);
    const paths = rows.map((r) => r.path);
    const idPlaceholders = ids.map(() => '?').join(',');
    const pathPlaceholders = paths.map(() => '?').join(',');

    const thumbDir = path.join(app.getPath('userData'), THUMBNAIL.DIR_NAME);
    let deletedThumbnails = 0;

    for (const row of rows) {
      try {
        const hash = crypto.createHash('md5').update(row.path).digest('hex');
        const thumbPath = path.join(thumbDir, `${hash}${THUMBNAIL.EXTENSION}`);
        if (fs.existsSync(thumbPath)) {
          fs.unlinkSync(thumbPath);
          deletedThumbnails++;
        }
      } catch (error) {
        logger.warn(`[Repo-GC] Failed to delete thumbnail for: ${row.path}`, error);
      }
    }

    if (deletedThumbnails > 0) {
      logger.debug(`[Repo-GC] Deleted ${deletedThumbnails} orphaned thumbnails.`);
    }

    const tx = this.db.transaction(() => {
      this.db
        .prepare(`DELETE FROM playlist_items WHERE video_id IN (${idPlaceholders})`)
        .run(...ids);
      this.db
        .prepare(`DELETE FROM folder_sort_orders WHERE video_path IN (${pathPlaceholders})`)
        .run(...paths);
      this.db.prepare(`DELETE FROM video_tags WHERE video_id IN (${idPlaceholders})`).run(...ids);
      this.db.prepare(`DELETE FROM videos WHERE id IN (${idPlaceholders})`).run(...ids);
    });

    try {
      tx();
      logger.debug(`[Repo] GC deleted ${rows.length} expired videos.`);
      return rows.length;
    } catch (error) {
      logger.error('[Repo] GC failed:', error);
      return 0;
    }
  }
}
