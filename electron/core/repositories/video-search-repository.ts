// electron/core/repositories/video-search-repository.ts

import path from 'path';
import { getDB } from '../../lib/db';
import { VideoRow, LITE_COLUMNS } from './video-repository';

export interface SearchOptions {
  folderPath?: string;
  playlistId?: string;
  isFavorite?: boolean;
  allowedRoots?: string[]; // ▼▼▼ 追加: 検索対象をこれらのフォルダ配下に限定する ▼▼▼
}

export class VideoSearchRepository {
  private get db() {
    return getDB();
  }

  /**
   * 動画検索を実行する (Modified: FTS5 Only for Performance)
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
    const fpsMatch = rawQuery.match(/fps:(\d+)/i);
    if (fpsMatch) {
      const targetFps = parseInt(fpsMatch[1], 10);
      sqlConditions.push(`(v.fps >= ? AND v.fps < ?)`);
      params.push(targetFps - 1);
      params.push(targetFps + 1);
      rawQuery = rawQuery.replace(fpsMatch[0], '');
    }

    // Codec Syntax: codec:h264, codec:hevc など
    const codecMatch = rawQuery.match(/codec:(\w+)/i);
    if (codecMatch) {
      const targetCodec = codecMatch[1];
      sqlConditions.push(`v.codec LIKE ?`);
      params.push(`%${targetCodec}%`);
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

    // 3. スコープ条件
    if (options.folderPath) {
      // 特定フォルダ内検索
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
      // ▼▼▼ 追加: グローバル検索時のライブラリフォルダ制限 ▼▼▼
      // playlistId や isFavorite が指定されている場合は、場所に関わらず表示する（または要件に応じてここも含める）
      // ここでは「グローバル検索」のコンテキストなので、プレイリストやお気に入り指定がない場合のみ制限を適用します。

      const rootConditions = options.allowedRoots.map(() => `v.path LIKE ?`).join(' OR ');
      sql += ` AND (${rootConditions})`;

      // 各ルートパスに対して前方一致条件を追加
      options.allowedRoots.forEach((root) => {
        // パスの区切り文字を考慮して、フォルダ配下であることを保証
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

    // 4. タグ条件
    if (hasTags) {
      const placeholders = tagIds.map(() => '?').join(',');
      sql += ` AND vt.tag_id IN (${placeholders})`;
      params.push(...tagIds);
    }

    // 5. キーワード検索 (FTS5 Prefix Search)
    if (includes.length > 0) {
      const ftsQueryString = includes.map((t) => `"${t.replace(/"/g, '')}"*`).join(' AND ');

      sql += ` AND v.rowid IN (SELECT rowid FROM videos_fts WHERE videos_fts MATCH ?)`;
      params.push(ftsQueryString);
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
