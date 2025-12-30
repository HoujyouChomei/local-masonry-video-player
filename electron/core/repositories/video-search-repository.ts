// electron/core/repositories/video-search-repository.ts

import { getDB } from '../../lib/db';
import { VideoRow } from './video-repository';

export interface SearchOptions {
  folderPath?: string;
  playlistId?: string;
  isFavorite?: boolean;
}

export class VideoSearchRepository {
  private get db() {
    return getDB();
  }

  /**
   * 動画検索を実行する (Hybrid Search: FTS5 + LIKE + Special Syntax)
   * @param query 検索クエリ文字列
   * @param tagIds タグIDのリスト (AND条件)
   * @param options 検索スコープオプション
   */
  public search(query: string, tagIds: string[], options: SearchOptions = {}): VideoRow[] {
    // 1. クエリのパース (特殊構文の抽出)
    let rawQuery = query;
    const params: (string | number)[] = [];
    const sqlConditions: string[] = [];

    // FPS Syntax: fps:60, fps:24 など
    // 数値周辺の誤差を考慮して ±1 の範囲で検索する
    const fpsMatch = rawQuery.match(/fps:(\d+)/i);
    if (fpsMatch) {
      const targetFps = parseInt(fpsMatch[1], 10);
      sqlConditions.push(`(v.fps >= ? AND v.fps < ?)`);
      params.push(targetFps - 1); // 例: 59
      params.push(targetFps + 1); // 例: 61

      // クエリから除去
      rawQuery = rawQuery.replace(fpsMatch[0], '');
    }

    // Codec Syntax: codec:h264, codec:hevc など
    const codecMatch = rawQuery.match(/codec:(\w+)/i);
    if (codecMatch) {
      const targetCodec = codecMatch[1];
      sqlConditions.push(`v.codec LIKE ?`);
      params.push(`%${targetCodec}%`);

      // クエリから除去
      rawQuery = rawQuery.replace(codecMatch[0], '');
    }

    // 通常キーワードのパース
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

    // 何も条件がない場合は空を返す
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

    // 2. ベースクエリ構築
    let sql = `SELECT v.* FROM videos v`;

    if (hasTags) {
      sql += ` JOIN video_tags vt ON v.id = vt.video_id`;
    }
    if (options.playlistId) {
      sql += ` JOIN playlist_items pi ON v.id = pi.video_id`;
    }

    sql += ` WHERE v.status = 'available'`;

    // 特殊構文条件の追加 (fps, codec指定)
    if (hasSpecialConditions) {
      sql += ` AND ${sqlConditions.join(' AND ')}`;
    }

    // 3. スコープ条件
    if (options.folderPath) {
      sql += ` AND v.path LIKE ?`;
      params.push(`${options.folderPath}%`);
    }
    if (options.playlistId) {
      sql += ` AND pi.playlist_id = ?`;
      params.push(options.playlistId);
    }
    if (options.isFavorite) {
      sql += ` AND v.is_favorite = 1`;
    }

    // 4. タグ条件
    if (hasTags) {
      const placeholders = tagIds.map(() => '?').join(',');
      sql += ` AND vt.tag_id IN (${placeholders})`;
      params.push(...tagIds);
    }

    // 5. キーワード検索 (Hybrid: FTS OR LIKE)
    if (includes.length > 0) {
      sql += ` AND (`;

      const subConditions: string[] = [];

      // A. FTS Search
      const ftsQueryString = includes.map((t) => `"${t.replace(/"/g, '')}"`).join(' AND ');
      subConditions.push(`v.rowid IN (SELECT rowid FROM videos_fts WHERE videos_fts MATCH ?)`);
      params.push(ftsQueryString);

      // B. LIKE Search (Fallback & Partial Match)
      // path, generation_params, codec を対象にする
      const likeConditions = includes
        .map(
          () => `
        (v.path LIKE ? OR v.generation_params LIKE ? OR v.codec LIKE ?)
      `
        )
        .join(' AND ');
      subConditions.push(`(${likeConditions})`);

      includes.forEach((term) => {
        params.push(`%${term}%`); // path
        params.push(`%${term}%`); // generation_params
        params.push(`%${term}%`); // codec (Added)
      });

      sql += subConditions.join(' OR ');
      sql += `)`;
    }

    // 6. 除外キーワード
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

    // 7. タグ絞り込みの AND条件 (HAVING)
    if (hasTags) {
      sql += ` GROUP BY v.id HAVING COUNT(DISTINCT vt.tag_id) = ?`;
      params.push(tagIds.length);
    }

    // 8. ソートと制限
    sql += ` ORDER BY v.mtime DESC LIMIT 2000`;

    try {
      return this.db.prepare(sql).all(...params) as VideoRow[];
    } catch (error) {
      console.error('[VideoSearchRepository] Search failed:', error);
      return [];
    }
  }
}
