// electron/core/repositories/video-search-repository.ts

import path from 'path';
import { getDB } from '../../lib/db';
import { VideoRow, LITE_COLUMNS } from './video-repository';
import { logger } from '../../lib/logger';

export interface SearchOptions {
  folderPath?: string;
  playlistId?: string;
  isFavorite?: boolean;
  allowedRoots?: string[];
}

export class VideoSearchRepository {
  private get db() {
    return getDB();
  }

  /**
   * @param query
   * @param tagIds
   * @param options
   */
  public search(query: string, tagIds: string[], options: SearchOptions = {}): VideoRow[] {
    let rawQuery = query;
    const params: (string | number)[] = [];
    const sqlConditions: string[] = [];

    const fpsMatch = rawQuery.match(/fps:(\d+)/i);
    if (fpsMatch) {
      const targetFps = parseInt(fpsMatch[1], 10);
      sqlConditions.push(`(v.fps >= ? AND v.fps < ?)`);
      params.push(targetFps - 1);
      params.push(targetFps + 1);
      rawQuery = rawQuery.replace(fpsMatch[0], '');
    }

    const codecMatch = rawQuery.match(/codec:(\w+)/i);
    if (codecMatch) {
      const targetCodec = codecMatch[1];
      sqlConditions.push(`v.codec LIKE ?`);
      params.push(`%${targetCodec}%`);
      rawQuery = rawQuery.replace(codecMatch[0], '');
    }

    const terms = rawQuery.toLowerCase().split(/\s+/).filter(Boolean);
    const includes: string[] = [];
    const excludes: string[] = [];

    terms.forEach((term) => {
      if (term.startsWith('-') && term.length > 1) {
        excludes.push(term.slice(1));
      } else {
        includes.push(term);
      }
    });

    const hasTags = tagIds.length > 0;
    const hasQuery = includes.length > 0 || excludes.length > 0;
    const hasSpecialConditions = sqlConditions.length > 0;

    if (
      !hasQuery &&
      !hasTags &&
      !hasSpecialConditions &&
      !options.folderPath &&
      !options.playlistId &&
      !options.isFavorite
    ) {
      return [];
    }

    let sql = `SELECT ${LITE_COLUMNS} FROM videos v`;

    if (hasTags) {
      sql += ` JOIN video_tags vt ON v.id = vt.video_id`;
    }
    if (options.playlistId) {
      sql += ` JOIN playlist_items pi ON v.id = pi.video_id`;
    }

    sql += ` WHERE v.status = 'available'`;

    if (hasSpecialConditions) {
      sql += ` AND ${sqlConditions.join(' AND ')}`;
    }

    if (options.folderPath) {
      const folderPrefix = options.folderPath.endsWith(path.sep)
        ? options.folderPath
        : options.folderPath + path.sep;

      sql += ` AND v.path LIKE ?`;
      params.push(`${folderPrefix}%`);

      const offset = folderPrefix.length + 1;
      sql += ` AND INSTR(SUBSTR(v.path, ?), ?) = 0`;
      params.push(offset);
      params.push(path.sep);
    } else if (
      !options.playlistId &&
      !options.isFavorite &&
      options.allowedRoots &&
      options.allowedRoots.length > 0
    ) {
      const rootConditions = options.allowedRoots.map(() => `v.path LIKE ?`).join(' OR ');
      sql += ` AND (${rootConditions})`;

      options.allowedRoots.forEach((root) => {
        const prefix = root.endsWith(path.sep) ? root : root + path.sep;
        params.push(`${prefix}%`);
      });
    }

    if (options.playlistId) {
      sql += ` AND pi.playlist_id = ?`;
      params.push(options.playlistId);
    }
    if (options.isFavorite) {
      sql += ` AND v.is_favorite = 1`;
    }

    if (hasTags) {
      const placeholders = tagIds.map(() => '?').join(',');
      sql += ` AND vt.tag_id IN (${placeholders})`;
      params.push(...tagIds);
    }

    if (includes.length > 0) {
      const ftsQueryString = includes.map((t) => `"${t.replace(/"/g, '""')}"*`).join(' AND ');

      sql += ` AND v.rowid IN (SELECT rowid FROM videos_fts WHERE videos_fts MATCH ?)`;
      params.push(ftsQueryString);
    }

    excludes.forEach((term) => {
      sql += ` AND (
        v.path NOT LIKE ? AND 
        (v.generation_params IS NULL OR v.generation_params NOT LIKE ?) AND
        (v.codec IS NULL OR v.codec NOT LIKE ?)
      )`;
      params.push(`%${term}%`);
      params.push(`%${term}%`);
      params.push(`%${term}%`);
    });

    if (hasTags) {
      sql += ` GROUP BY v.id HAVING COUNT(DISTINCT vt.tag_id) = ?`;
      params.push(tagIds.length);
    }

    sql += ` ORDER BY v.mtime DESC LIMIT 2000`;

    try {
      return this.db.prepare(sql).all(...params) as VideoRow[];
    } catch (error) {
      logger.error('[VideoSearchRepository] Search failed:', error);
      return [];
    }
  }
}
