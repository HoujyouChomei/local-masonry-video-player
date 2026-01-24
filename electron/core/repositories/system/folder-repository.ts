// electron/core/repositories/system/folder-repository.ts

import { getDB } from '../../../lib/db';

interface FolderSortRow {
  folder_path: string;
  video_path: string;
  rank: number;
}

export class FolderRepository {
  private get db() {
    return getDB();
  }

  saveSortOrder(folderPath: string, mediaPaths: string[]): void {
    const tx = this.db.transaction(() => {
      this.db.prepare('DELETE FROM folder_sort_orders WHERE folder_path = ?').run(folderPath);

      const insertStmt = this.db.prepare(`
        INSERT INTO folder_sort_orders (folder_path, video_path, rank)
        VALUES (?, ?, ?)
      `);

      mediaPaths.forEach((mediaPath, index) => {
        insertStmt.run(folderPath, mediaPath, index);
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
