// electron/lib/db-migrator.ts

import Database from 'better-sqlite3';

export class DBMigrator {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  public migrate() {
    // 現在のスキーマバージョンを取得
    const currentVersion = this.db.pragma('user_version', { simple: true }) as number;

    // 現在のターゲットバージョン (Base: 1)
    // Note: 新規インストール時は db.ts で既に 1 に設定されているためスキップされる
    const targetVersion = 1;

    console.log(`[DBMigrator] Current version: ${currentVersion}, Target: ${targetVersion}`);

    if (currentVersion >= targetVersion) {
      return;
    }

    try {
      this.runMigrations(currentVersion, targetVersion);
    } catch (error) {
      console.error('[DBMigrator] Migration failed:', error);
      throw error;
    }
  }

  private runMigrations(from: number, to: number) {
    console.log(`[DBMigrator] Running migrations from v${from} to v${to}...`);

    // 現在はv1がベースラインのため、過去のマイグレーションロジックは削除済み。
    // db.ts の createSchema が最新(v1相当)の状態を作成します。

    // Future migrations example:
    // if (from < 2) this.migrateToV2();
  }

  /* 
  private migrateToV2() {
    console.log('[DBMigrator] Migrating to v2...');
    const runTransaction = this.db.transaction(() => {
      // ... changes ...
      this.db.pragma('user_version = 2');
    });
    runTransaction();
  }
  */
}
