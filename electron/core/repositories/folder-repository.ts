// electron/core/repositories/folder-repository.ts

import { getDB } from '../../lib/db';

interface FolderSortRow {
  folder_path: string;
  video_path: string;
  rank: number;
}

export class FolderRepository {
  private get db() {
    return getDB();
  }

  saveSortOrder(folderPath: string, videoPaths: string[]): void {
    const tx = this.db.transaction(() => {
      this.db.prepare('DELETE FROM folder_sort_orders WHERE folder_path = ?').run(folderPath);

      const insertStmt = this.db.prepare(`
        INSERT INTO folder_sort_orders (folder_path, video_path, rank)
        VALUES (?, ?, ?)
      `);

      videoPaths.forEach((videoPath, index) => {
        insertStmt.run(folderPath, videoPath, index);
      });
    });

    tx();
  }

  getSortOrder(folderPath: string): string[] {
    const rows = this.db
      .prepare(
        `
      SELECT video_path 
      FROM folder_sort_orders 
      WHERE folder_path = ? 
      ORDER BY rank ASC
    `
      )
      .all(folderPath) as FolderSortRow[];

    return rows.map((row) => row.video_path);
  }
}
