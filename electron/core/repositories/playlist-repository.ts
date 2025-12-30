// electron/core/repositories/playlist-repository.ts

import { getDB } from '../../lib/db';
import { Playlist } from '../../../src/shared/types/playlist';
import { VideoRepository } from './video-repository';

interface PlaylistRow {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
}

// 削除: interface PlaylistItemRow { ... }

export class PlaylistRepository {
  private get db() {
    return getDB();
  }

  private videoRepo = new VideoRepository();

  /**
   * IDからプレイリストを取得（動画パス配列付き）
   */
  getById(id: string): Playlist | null {
    const playlist = this.db.prepare('SELECT * FROM playlists WHERE id = ?').get(id) as
      | PlaylistRow
      | undefined;
    if (!playlist) return null;

    const videoPaths = this.getVideoPaths(id);

    return {
      id: playlist.id,
      name: playlist.name,
      videoPaths,
      createdAt: playlist.created_at,
      updatedAt: playlist.updated_at,
    };
  }

  /**
   * 全プレイリストを取得
   */
  getAll(): Playlist[] {
    const playlists = this.db
      .prepare('SELECT * FROM playlists ORDER BY created_at ASC')
      .all() as PlaylistRow[];

    return playlists.map((p) => ({
      id: p.id,
      name: p.name,
      videoPaths: this.getVideoPaths(p.id),
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));
  }

  /**
   * プレイリストに含まれる動画パスをランク順に取得
   */
  private getVideoPaths(playlistId: string): string[] {
    // status = 'available' の条件を追加
    const rows = this.db
      .prepare(
        `
      SELECT v.path 
      FROM playlist_items pi
      JOIN videos v ON pi.video_id = v.id
      WHERE pi.playlist_id = ? AND v.status = 'available'
      ORDER BY pi.rank ASC
    `
      )
      .all(playlistId) as { path: string }[];
    return rows.map((r) => r.path);
  }

  /**
   * 名前重複チェック用
   */
  existsByName(name: string): boolean {
    const row = this.db.prepare('SELECT 1 FROM playlists WHERE name = ?').get(name);
    return !!row;
  }

  create(playlist: Playlist): void {
    this.db
      .prepare(
        `
      INSERT INTO playlists (id, name, created_at, updated_at)
      VALUES (@id, @name, @createdAt, @updatedAt)
    `
      )
      .run(playlist);
  }

  delete(id: string): void {
    // ON DELETE CASCADE により items も消える
    this.db.prepare('DELETE FROM playlists WHERE id = ?').run(id);
  }

  updateName(id: string, name: string): void {
    const now = Date.now();
    this.db
      .prepare(
        `
      UPDATE playlists 
      SET name = ?, updated_at = ? 
      WHERE id = ?
    `
      )
      .run(name, now, id);
  }

  touch(id: string): void {
    const now = Date.now();
    this.db.prepare('UPDATE playlists SET updated_at = ? WHERE id = ?').run(now, id);
  }

  /**
   * 動画をプレイリストに追加
   * ※ videoId は VideoRepository 等で解決済みであることを前提とする
   */
  addVideo(playlistId: string, videoId: string): void {
    const now = Date.now();

    // 重複チェック
    const exists = this.db
      .prepare(
        `
      SELECT 1 FROM playlist_items WHERE playlist_id = ? AND video_id = ?
    `
      )
      .get(playlistId, videoId);

    if (exists) return;

    // 現在の最大ランクを取得
    const maxRankRow = this.db
      .prepare(
        `
      SELECT MAX(rank) as maxRank FROM playlist_items WHERE playlist_id = ?
    `
      )
      .get(playlistId) as { maxRank: number | null };

    const nextRank = (maxRankRow.maxRank ?? -1) + 1;

    this.db
      .prepare(
        `
      INSERT INTO playlist_items (playlist_id, video_id, rank, added_at)
      VALUES (?, ?, ?, ?)
    `
      )
      .run(playlistId, videoId, nextRank, now);

    this.touch(playlistId);
  }

  removeVideo(playlistId: string, videoId: string): void {
    this.db
      .prepare(
        `
      DELETE FROM playlist_items 
      WHERE playlist_id = ? AND video_id = ?
    `
      )
      .run(playlistId, videoId);

    this.touch(playlistId);
  }

  /**
   * 動画の並び替え
   */
  reorderVideos(playlistId: string, videoIdsInOrder: string[]): void {
    const tx = this.db.transaction(() => {
      const updateStmt = this.db.prepare(`
        UPDATE playlist_items 
        SET rank = ? 
        WHERE playlist_id = ? AND video_id = ?
      `);

      videoIdsInOrder.forEach((vid, index) => {
        updateStmt.run(index, playlistId, vid);
      });

      this.touch(playlistId);
    });
    tx();
  }
}
